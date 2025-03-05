import sqlite3
import os

DB_PATH = "articles.db"

class DBHandler:
    def __init__(self, db_path=DB_PATH):
        self.connection = sqlite3.connect(db_path, check_same_thread=False)
        self.create_tables()
    
    def create_tables(self):
        cursor = self.connection.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                short_description TEXT,
                image_url TEXT,
                summary TEXT
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS content (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                article_id INTEGER,
                order_index INTEGER,
                type TEXT, -- header, paragraph, image
                content TEXT,
                header_level INTEGER,
                FOREIGN KEY(article_id) REFERENCES articles(id)
            );
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                article_id INTEGER,
                tag TEXT,
                FOREIGN KEY(article_id) REFERENCES articles(id)
            );
        """)
        self.connection.commit()
    
    def insert_article(self, title, short_description, image_url, summary):
        cursor = self.connection.cursor()
        cursor.execute("""
            INSERT INTO articles (title, short_description, image_url, summary)
            VALUES (?, ?, ?, ?)
        """, (title, short_description, image_url, summary))
        self.connection.commit()
        return cursor.lastrowid

    def insert_content(self, article_id, order_index, content_type, content, header_level=None):
        cursor = self.connection.cursor()
        cursor.execute("""
            INSERT INTO content (article_id, order_index, type, content, header_level)
            VALUES (?, ?, ?, ?, ?)
        """, (article_id, order_index, content_type, content, header_level))
        self.connection.commit()

    def insert_tag(self, article_id, tag):
        cursor = self.connection.cursor()
        cursor.execute("""
            INSERT INTO tags (article_id, tag)
            VALUES (?, ?)
        """, (article_id, tag))
        self.connection.commit()
    
    # Новые методы для получения данных
    def get_articles_list(self, query=None):
        """Получение списка статей с возможной фильтрацией по запросу"""
        cursor = self.connection.cursor()
        
        if query and query.strip():
            # Если задан поисковый запрос, ищем по заголовку и описанию
            cursor.execute("""
                SELECT a.id, a.title, a.short_description, a.image_url 
                FROM articles a
                WHERE a.title LIKE ? OR a.short_description LIKE ?
            """, (f'%{query}%', f'%{query}%'))
        else:
            # Иначе возвращаем все статьи
            cursor.execute("SELECT id, title, short_description, image_url FROM articles")
        
        articles = []
        for row in cursor.fetchall():
            article_id, title, short_description, image_url = row
            # Получаем теги для каждой статьи
            tags = self.get_article_tags(article_id)
            articles.append({
                "id": str(article_id),
                "title": title,
                "description": short_description,
                "image_url": image_url,
                "tags": tags if tags else [],  # Убедимся, что tags всегда массив
                "url": f"/article/{article_id}"
            })
        
        return articles

    def get_all_unique_tags(self):
        """Получение всех уникальных тегов из базы"""
        cursor = self.connection.cursor()
        cursor.execute("SELECT DISTINCT tag FROM tags")
        return [row[0] for row in cursor.fetchall()]
    
    def get_articles_by_tags(self, tags):
        """Получение статей по списку тегов"""
        if not tags:
            return self.get_articles_list()
        
        placeholders = ','.join(['?'] * len(tags))
        cursor = self.connection.cursor()
        
        # Выбираем статьи, у которых хотя бы один тег совпадает с запрашиваемыми
        cursor.execute(f"""
            SELECT DISTINCT a.id, a.title, a.short_description, a.image_url 
            FROM articles a
            JOIN tags t ON a.id = t.article_id
            WHERE t.tag IN ({placeholders})
        """, tags)
        
        articles = []
        for row in cursor.fetchall():
            article_id, title, short_description, image_url = row
            # Получаем все теги для каждой статьи
            article_tags = self.get_article_tags(article_id)
            articles.append({
                "id": str(article_id),
                "title": title,
                "description": short_description,
                "image_url": image_url,
                "tags": article_tags,
                "url": f"/article/{article_id}"
            })
        
        return articles

    def get_article_tags(self, article_id):
        """Получение тегов для статьи"""
        cursor = self.connection.cursor()
        cursor.execute("SELECT tag FROM tags WHERE article_id = ?", (article_id,))
        return [row[0] for row in cursor.fetchall()]

    def get_article_data(self, article_id):
        """Получение информации о статье для предпросмотра"""
        cursor = self.connection.cursor()
        cursor.execute("""
            SELECT id, title, short_description, image_url
            FROM articles
            WHERE id = ?
        """, (article_id,))
        
        article_data = cursor.fetchone()
        if not article_data:
            return None
        
        id_val, title, short_description, image_url = article_data
        tags = self.get_article_tags(article_id)
        
        return {
            "id": str(id_val),
            "title": title,
            "description": short_description,
            "image_url": image_url,
            "tags": tags,
            "url": f"/article/{id_val}"
        }

    def get_full_article(self, article_id):
        """Получение полного содержимого статьи"""
        cursor = self.connection.cursor()
        cursor.execute("""
            SELECT title, summary
            FROM articles
            WHERE id = ?
        """, (article_id,))
        
        article_data = cursor.fetchone()
        if not article_data:
            return None
        
        title, summary = article_data
        
        # Получаем содержимое статьи
        cursor.execute("""
            SELECT type, content, header_level, order_index
            FROM content
            WHERE article_id = ?
            ORDER BY order_index
        """, (article_id,))
        
        content_items = []
        for row in cursor.fetchall():
            content_type, content_text, header_level, _ = row
            
            if content_type == "heading":
                content_items.append({
                    "type": content_type,
                    "text": content_text,
                    "level": header_level or 1
                })
            elif content_type == "paragraph":
                content_items.append({
                    "type": content_type,
                    "text": content_text
                })
            elif content_type == "photo":
                content_items.append({
                    "type": "photo",
                    "url": content_text,
                    "alt": "Изображение",
                    "caption": ""
                })
        
        return {
            "title": title,
            "summary": summary,
            "content": content_items
        }