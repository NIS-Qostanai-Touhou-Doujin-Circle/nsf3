from flask import Flask, jsonify, make_response, request
from flask_cors import CORS
from handler import DBHandler
import json
import requests

app = Flask(__name__)
CORS(app) 

# Инициализация обработчика БД
db = DBHandler()

@app.route('/api/hello', methods=['GET'])
def hello():
    return jsonify({"message": "Hi!"})

# Функция для получения релевантных тегов из Grok API на основе запроса
def get_relevant_tags_from_grok(query, all_tags):
    """Запрашивает у Grok API подходящие теги на основе запроса пользователя"""
    if not query:
        return []
    
    api_url = "https://api.x.ai/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer xai-8EvfWccYgG0zmVXm1dKvCt9Bez9mv5X54gIlguxyJP3Nz3h9zKfbdEPEZbpDvgnejzwqTsvzHv7yMTEC"
    }
    
    # Создаем строку со всеми доступными тегами
    all_tags_text = ", ".join(all_tags)
    
    payload = {
        "messages": [
            {
                "role": "system",
                "content": "You are an assistant that selects relevant tags based on user query. Consider both direct matches and semantically related concepts. Return only a JSON array of selected tags, nothing else."
            },
            {
                "role": "user",
                "content": f"Select relevant tags for this search query: '{query}'. Available tags: {all_tags_text}. Return only a JSON array of selected tags."
            }
        ],
        "model": "grok-2-latest",
        "stream": False,
        "temperature": 0.3
    }
    
    try:
        response = requests.post(api_url, json=payload, headers=headers)
        if response.status_code == 200:
            result = response.json()
            if 'choices' in result and len(result['choices']) > 0:
                content = result['choices'][0]['message']['content']
                
                # Попытка извлечь JSON-массив из ответа
                try:
                    # Ищем что-то похожее на JSON-массив в тексте
                    if '[' in content and ']' in content:
                        json_str = content[content.find('['):content.rfind(']')+1]
                        selected_tags = json.loads(json_str)
                        if isinstance(selected_tags, list):
                            # Проверяем, что выбранные теги действительно есть в списке всех тегов
                            valid_tags = [tag for tag in selected_tags if tag in all_tags]
                            return valid_tags
                except Exception as e:
                    print(f"Ошибка при разборе JSON тегов: {str(e)}")
                    
                # Если не удалось извлечь JSON, пробуем другие методы
                words = content.replace('[', '').replace(']', '').replace('"', '').replace("'", '').split(',')
                valid_tags = [word.strip() for word in words if word.strip() in all_tags]
                return valid_tags
                
    except Exception as e:
        print(f"Ошибка при запросе к Grok API: {str(e)}")
    
    return []
    
@app.route('/articles_list', methods=['POST'])
def articles_list():
    try:
        data: dict = request.json
        query = data.get('query', '')
        
        # Сначала получаем все уникальные теги из базы
        all_tags = db.get_all_unique_tags()
        
        if query and query.strip():
            # Получаем релевантные теги из Grok API
            selected_tags = get_relevant_tags_from_grok(query, all_tags)
            
            if selected_tags:
                # Если Grok выбрал теги, используем их для поиска статей
                articles = db.get_articles_by_tags(selected_tags)
            else:
                # Если теги не были выбраны, используем обычный поиск по тексту
                articles = db.get_articles_list(query)
        else:
            # Если запрос пустой, просто возвращаем все статьи
            articles = db.get_articles_list()
        
        return make_response(jsonify({
            "articles": articles
        }), 200)
    except Exception as e:
        print(f"Error: {str(e)}")
        return make_response(jsonify({"message": f"Error in request: {str(e)}"}), 400)

@app.route('/article_data/<article_id>', methods=['GET'])
def article_data(article_id):
    article = db.get_article_data(article_id)
    if article:
        return make_response(jsonify(article), 200)
    else:
        return make_response(jsonify({"message": "Article not found"}), 404)

@app.route('/api/articles/<article_id>', methods=['GET'])
def get_article(article_id):
    article = db.get_full_article(article_id)
    if article:
        # Обрабатываем каждый элемент контента
        for item in article.get('content', []):
            # Если это параграф, проверяем наличие URL в тексте
            if item['type'] == 'paragraph':
                text = item.get('text', '')
                # Здесь мы не меняем текст, так как обработка URL будет происходить на фронтенде
            
            # Если это элемент типа "link", убедимся, что он содержит все необходимые поля
            elif item['type'] == 'link':
                if 'url' not in item:
                    item['url'] = ''
                if 'text' not in item:
                    item['text'] = item.get('url', '')
                
        return make_response(jsonify(article), 200)
    else:
        return make_response(jsonify({"message": "Article not found"}), 404)

if __name__ == '__main__':
    app.run(debug=True, port=5000, host="0.0.0.0")