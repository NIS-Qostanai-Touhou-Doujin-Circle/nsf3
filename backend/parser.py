import os
import json
import logging
import asyncio
import aiohttp
import signal
from telegram import Update
from telegram.ext import (
    ApplicationBuilder, CommandHandler, MessageHandler, 
    CallbackContext, filters
)
from handler import DBHandler
import re

# Add this helper function for Cyrillic detection
def contains_cyrillic(text):
    return bool(re.search('[\u0400-\u04FF]', text))

# Tokens and paths
TELEGRAM_TOKEN = "7564817197:AAFP1u3G0gdXaDcHRGHoU7mHpj7v9hIYSS4"
XAI_API_KEY = "xai-8EvfWccYgG0zmVXm1dKvCt9Bez9mv5X54gIlguxyJP3Nz3h9zKfbdEPEZbpDvgnejzwqTsvzHv7yMTEC"
XAI_API_URL = "https://api.x.ai/v1/chat/completions"
IMAGE_STORAGE_PATH = "./public/images"

if not os.path.exists(IMAGE_STORAGE_PATH):
    os.makedirs(IMAGE_STORAGE_PATH)

# Initialize DB handler
db = DBHandler()

# Concurrency control
api_semaphore = asyncio.Semaphore(5)  # Limit concurrent API calls
session = None
# Add a lock for database operations
db_lock = asyncio.Lock()

async def get_session():
    global session
    if session is None:
        session = aiohttp.ClientSession()
    return session

async def close_session():
    global session
    if session and not session.closed:
        await session.close()
        session = None

# Generic Grok API caller
async def call_grok_api(system_prompt, user_prompt, temperature=0.3):
    async with api_semaphore:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {XAI_API_KEY}"
        }
        payload = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "model": "grok-2-latest",
            "stream": False,
            "temperature": temperature
        }
        
        try:
            client_session = await get_session()
            async with client_session.post(XAI_API_URL, json=payload, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    if 'choices' in result and len(result['choices']) > 0:
                        return result['choices'][0]['message']['content'].strip()
                logging.error("API Error: %s", await response.text())
        except Exception as e:
            logging.error("Exception during API call: %s", str(e))
        
        return None

# Specialized API functions
async def generate_summary(article_text):
    system_prompt = "You are an assistant that creates concise summaries of articles in Russian. Create a summary in 1-2 sentences that captures the main point of the article."
    result = await call_grok_api(system_prompt, f"Create a concise summary for this article: {article_text}")
    return result or "Краткое содержание недоступно"

async def generate_detailed_summary(article_text):
    system_prompt = "You are an assistant that creates concise but informative summaries of articles in Russian. Write a clear summary (2-3 sentences) that captures the main points and key arguments of the article while being brief."
    result = await call_grok_api(system_prompt, f"Create a concise but informative summary for this article: {article_text}")
    return result or "Краткое содержание недоступно"

async def generate_tags(article_text):
    system_prompt = "You are an assistant that generates relevant tags for articles. Create 5-10 tags that best describe the content of the article. Return only a JSON array of tags, nothing else."
    content = await call_grok_api(system_prompt, f"Generate tags for this article: {article_text}", 0.2)
    
    if not content:
        return ["статья"]
    
    try:
        if '[' in content and ']' in content:
            json_str = content[content.find('['):content.rfind(']')+1]
            tags = json.loads(json_str)
            if isinstance(tags, list):
                return tags[:10]
    except:
        pass
    
    return [tag.strip() for tag in content.replace('[', '').replace(']', '')
            .replace('"', '').replace("'", '').split(',')][:10]

async def analyze_article(article_text):
    system_prompt = "You are an expert assistant that analyzes article structure. Break down the article into well-organized sections with clear hierarchical structure. Return a JSON array with objects of the following types: 1) 'heading' with 'text' and 'level' (1-3); 2) 'paragraph' with 'text'; 3) 'photo' with placeholder for 'url'; 4) 'link' with 'text' and 'url'."
    content = await call_grok_api(system_prompt, article_text, 0)
    
    if not content:
        return {"content": []}
    
    try:
        start = content.find('[')
        end = content.rfind(']') + 1
        if start >= 0 and end > start:
            json_str = content[start:end]
            content_list = json.loads(json_str)
            if isinstance(content_list, list):
                return {"content": content_list}
    except Exception as e:
        logging.error("JSON parse error: %s", str(e))
    
    return {"content": []}

async def detect_language(text):
    # First check for Cyrillic characters as a quick way to identify Russian
    if contains_cyrillic(text):
        # If significant Cyrillic content, likely Russian
        cyrillic_ratio = len(re.findall('[\u0400-\u04FF]', text)) / len(text.replace(" ", ""))
        if cyrillic_ratio > 0.5:  # If more than 50% Cyrillic
            return "ru"
    
    # Fall back to API for non-obvious cases
    system_prompt = "You are an assistant that detects the language of text. Respond with only the ISO language code (e.g., 'ru' for Russian, 'en' for English, etc.)."
    result = await call_grok_api(system_prompt, f"Detect the language of this text: {text[:1000]}", temperature=0.1)
    return result.strip().lower() if result else "unknown"

async def translate_to_russian(text):
    system_prompt = "You are a professional translator. Translate the given text to Russian, maintaining the original meaning, tone, and format as closely as possible."
    # Add instruction to avoid meta-responses
    result = await call_grok_api(system_prompt, f"Translate this text to Russian. Return ONLY the translation, do not include phrases like 'Here's the translation' or 'Понял перевожу' or something like this: {text}", temperature=0.2)
    
    # Verify we got actual content and not a meta-response
    if result and ("предоставьте" in result.lower() or "вот перевод" in result.lower() or "here's the translation" in result.lower() or "got it, translating" in result.lower() or "понял, перевожу" in result.lower() or "перевод:" in result.lower() or "translation:" in result.lower()):
        # Try again with more explicit instruction
        result = await call_grok_api(system_prompt, f"ONLY TRANSLATE, DO NOT INCLUDE ANY COMMENTS: {text}", temperature=0.2)
    
    return result or text  # Return original text if translation fails

def is_mostly_links(text, threshold=0.7):
    # Simple check for http/https links
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    link_lines = 0
    
    for line in lines:
        if 'http://' in line or 'https://' in line:
            link_lines += 1
    
    # If more than threshold of lines contain links, consider it mostly links
    return len(lines) > 0 and link_lines / len(lines) >= threshold

# Modified database operations that respect SQLite's thread limitations
async def save_to_db(article_id, filtered_content, tags):
    """Save content and tags to database in a thread-safe way"""
    async with db_lock:
        # Use a single transaction for all operations
        try:
            # Save content
            for idx, item in enumerate(filtered_content):
                header_level = item.get("level") if item.get("type") == "heading" else None
                content_text = item.get("text", item.get("content", ""))
                
                if item.get("type") == "photo" and not content_text:
                    continue
                
                db.insert_content(article_id, idx, item["type"], content_text, header_level)
            
            # Save tags
            for tag in tags:
                if tag and len(tag) > 0:
                    db.insert_tag(article_id, tag)
            
            return True
        except Exception as e:
            logging.error(f"Database error: {e}")
            return False

# Message handler
async def handle_forwarded(update: Update, context: CallbackContext):
    message = update.effective_message
    
    # Don't return early if there's a photo but no text
    if message.text is None and message.caption is None and not message.photo:
        return
    
    # Show typing indicator while processing
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")

    article_text = message.caption if message.caption else (message.text or "")
    
    # Check if the article is mostly links
    if is_mostly_links(article_text):
        await update.message.reply_text("Извините, статья состоит преимущественно из ссылок и не может быть обработана.")
        return
    
    # Process images if present
    db_image_path = ""
    image_paths = []
    
    if message.media_group_id:
        # This is a media group message
        media_group_id = message.media_group_id
        
        if not hasattr(context.bot_data, 'media_groups'):
            context.bot_data['media_groups'] = {}
        
        # Store this photo if we have one
        if message.photo:
            photo = message.photo[-1]
            file = await context.bot.get_file(photo.file_id)
            filename = f"{photo.file_id}.jpg"
            local_path = os.path.join(IMAGE_STORAGE_PATH, filename)
            await file.download_to_drive(custom_path=local_path)
            img_path = f"/images/{filename}"
            
            # Add to our tracking for this media group
            if media_group_id not in context.bot_data['media_groups']:
                context.bot_data['media_groups'][media_group_id] = {
                    'images': [img_path],
                    'text': article_text,
                    'processed': False
                }
            else:
                context.bot_data['media_groups'][media_group_id]['images'].append(img_path)
                # If this message has text and previous didn't, save it
                if article_text and not context.bot_data['media_groups'][media_group_id]['text']:
                    context.bot_data['media_groups'][media_group_id]['text'] = article_text
            
            # If this media group was already processed, just return
            if context.bot_data['media_groups'][media_group_id]['processed']:
                return
                
            # Mark as processed to avoid duplicate processing
            context.bot_data['media_groups'][media_group_id]['processed'] = True
            
            # Use all collected images
            image_paths = context.bot_data['media_groups'][media_group_id]['images']
            # Use the collected text if available
            if context.bot_data['media_groups'][media_group_id]['text']:
                article_text = context.bot_data['media_groups'][media_group_id]['text']
        else:
            # No photo in this message but part of a media group
            # We'll wait for a message with a photo
            return
            
    elif message.photo:
        # Single photo message
        photo = message.photo[-1]
        file = await context.bot.get_file(photo.file_id)
        filename = f"{photo.file_id}.jpg"
        local_path = os.path.join(IMAGE_STORAGE_PATH, filename)
        await file.download_to_drive(custom_path=local_path)
        image_paths = [f"/images/{filename}"]
    
    # COMPLETE THE PROCESSING:
    
    # If article text is too short, reject
    if len(article_text.strip()) < 10:
        return
    
    # Detect language and translate if not Russian
    language = await detect_language(article_text)
    original_language = language
    
    if language != "ru" and language != "unknown":
        await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
        translated_text = await translate_to_russian(article_text)
        # Make sure we actually got a proper translation
        if translated_text and not any(phrase in translated_text.lower() for phrase in 
                                      ["предоставьте текст", "вот перевод", "please provide"]):
            article_text = translated_text
    
    # Generate title from first line
    title = article_text.split("\n")[0][:100] if article_text else "Без заголовка"
    short_description = article_text[:200] if article_text else ""
    
    # Show typing indicator again
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    
    # Generate detailed summary right away
    summary = await generate_detailed_summary(article_text)
    
    # Run other tasks concurrently
    tasks = [
        analyze_article(article_text),
        generate_tags(article_text)
    ]
    
    # Show typing indicator during long processing
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    
    analysis_result, tags = await asyncio.gather(*tasks)
    content_list = analysis_result.get("content", [])
    
    # Use the first image as the main article image
    if image_paths:
        db_image_path = image_paths[0]
        
        # Add all images to the content
        for img_path in image_paths:
            content_list.insert(0, {
                "type": "photo",
                "text": img_path,
            })
    
    # If no structured content, split by paragraphs
    if not content_list:
        content_list = []
        for paragraph in article_text.split("\n\n"):
            if paragraph.strip():
                content_list.append({
                    "type": "paragraph",
                    "text": paragraph.strip(),
                })
    
    # Filter invalid photo entries
    filtered_content = []
    for item in content_list:
        if item.get("type") == "photo":
            content_text = item.get("text", item.get("url", "")).strip()
            if not content_text:
                continue
            item["text"] = content_text
        filtered_content.append(item)
    
    # Save article to database - use the lock to ensure thread safety
    async with db_lock:
        article_id = db.insert_article(title, short_description, db_image_path, summary)
    
    # Save content and tags in a single operation
    await save_to_db(article_id, filtered_content, tags)
    
    translation_info = f" (переведено с {original_language})" if original_language != "ru" and original_language != "unknown" else ""
    
    await update.message.reply_text(
        f"Статья успешно обработана и сохранена!{translation_info}\nТеги: {', '.join(tags[:5])}...\nSummary: {summary[:100]}..."
    )

async def start(update: Update, context: CallbackContext):
    await update.message.reply_text("Привет! Перешли мне сообщение со статьей и я сохраню её в БД.")

async def shutdown():
    """Close resources properly on shutdown"""
    await close_session()
    logging.info("Resources cleaned up properly")

# Signal handler for graceful shutdown
def signal_handler(sig, frame):
    logging.info(f"Received signal {sig}, shutting down...")
    asyncio.run(shutdown())
    exit(0)

# Error handler
async def error_handler(update, context):
    """Log the error and send a message to the user."""
    logging.error(f"Exception while handling an update: {context.error}")
    
    if update and update.effective_chat:
        await context.bot.send_message(
            chat_id=update.effective_chat.id, 
            text="Произошла ошибка при обработке запроса. Пожалуйста, попробуйте еще раз позже."
        )

def main():
    logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
    
    # Register signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()
    
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.FORWARDED, handle_forwarded))
    
    # Add error handler
    app.add_error_handler(error_handler)
    
    try:
        app.run_polling()
    finally:
        # Ensure resources are cleaned up when the app stops
        loop = asyncio.get_event_loop()
        if not loop.is_closed():
            loop.run_until_complete(shutdown())

if __name__ == '__main__':
    main()