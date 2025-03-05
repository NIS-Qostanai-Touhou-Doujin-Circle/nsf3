'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { Image, Spinner, Accordion, AccordionItem, Link } from "@heroui/react";
import { useSearchParams } from 'next/navigation';

// All interfaces remain the same
interface BaseContent {
  type: string;
}

interface HeadingContent extends BaseContent {
  type: 'heading';
  text: string;
  level?: 1 | 2 | 3;
}

interface ParagraphContent extends BaseContent {
  type: 'paragraph';
  text: string;
}

interface ListContent extends BaseContent {
  type: 'list';
  items: string[];
  ordered?: boolean;
}

interface PhotoContent extends BaseContent {
  type: 'photo';
  url: string;
  alt?: string;
  caption?: string;
}

interface LinkContent extends BaseContent {
  type: 'link';
  text: string;
  url: string;
}

type ArticleContent = HeadingContent | ParagraphContent | ListContent | PhotoContent | LinkContent;

// Inner component that uses useSearchParams
function ArticleContent() {
  const searchParams = useSearchParams();
  const [content, setContent] = useState<ArticleContent[]>([]);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
    
  useEffect(() => {
    const articleId = searchParams.get('id');
    
    if (!articleId) {
      setError('Article ID is missing');
      setLoading(false);
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/articles/${articleId}`)
      .then(res => res.json())
      .then(data => {
        setTitle(data.title);
        setSummary(data.summary);
        setContent(data.content);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load article');
        setLoading(false);
      });
  }, [searchParams]);

  // All existing functions remain the same
  const processParagraphWithLinks = (text: string) => {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlPattern);
    const urls = text.match(urlPattern) || [];
    
    if (urls.length === 0) {
      return <p className="my-4 text-lg">{text}</p>;
    }
    
    return (
      <p className="my-4 text-lg">
        {parts.map((part, i) => {
          if (i % 2 === 1) {
            return (
              <Link 
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                color="primary"
                isExternal
              >
                {part}
              </Link>
            );
          }
          return part;
        })}
      </p>
    );
  };

  const renderContent = (item: ArticleContent, index: number) => {
    // Same render content function as before
    switch (item.type) {
      case 'heading':
        const headingItem = item as HeadingContent;
        const level = headingItem.level || 1;
        
        if (level === 1) return <h1 className="text-3xl font-bold mt-8 mb-4" key={index}>{headingItem.text}</h1>;
        if (level === 2) return <h2 className="text-2xl font-bold mt-6 mb-3" key={index}>{headingItem.text}</h2>;
        return <h3 className="text-xl font-bold mt-5 mb-3" key={index}>{headingItem.text}</h3>;
        
      case 'paragraph':
        return <div key={index}>{processParagraphWithLinks((item as ParagraphContent).text)}</div>;
        
      case 'list':
        const listItem = item as ListContent;
        if (listItem.ordered) {
          return (
            <ol className="list-decimal ml-6 my-4" key={index}>
              {listItem.items.map((item, idx) => (
                <li className="mb-1" key={idx}>{item}</li>
              ))}
            </ol>
          );
        } else {
          return (
            <ul className="list-disc ml-6 my-4" key={index}>
              {listItem.items.map((item, idx) => (
                <li className="mb-1" key={idx}>{item}</li>
              ))}
            </ul>
          );
         }
        
      case 'photo':
        const photoItem = item as PhotoContent;
        if (!photoItem.url || photoItem.url === '') {
          return (
            <figure className="my-6" key={index}>
              <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">Изображение недоступно</span>
              </div>
              {photoItem.caption && <figcaption className="text-center text-sm mt-2 text-gray-500">{photoItem.caption}</figcaption>}
            </figure>
          );
        }
        
        return (
          <figure className="my-6" key={index}>
            <Image
              alt={photoItem.alt || "Article image"}
              className="w-full rounded-lg"
              src={photoItem.url}
            />
            {photoItem.caption && <figcaption className="text-center text-sm mt-2 text-gray-500">{photoItem.caption}</figcaption>}
          </figure>
        );
        
      case 'link':
        const linkItem = item as LinkContent;
        return (
          <div className="my-4" key={index}>
            <Link 
              href={linkItem.url}
              target="_blank"
              rel="noopener noreferrer" 
              color="primary"
              isExternal
            >
              {linkItem.text || linkItem.url}
            </Link>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8">
        <div className="row-start-2 flex justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8">
        <div className="row-start-2 text-center">
          <h2 className="text-2xl font-bold mb-4">Ошибка</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-4xl font-bold mb-8 text-center">{title}</h1>
      <main className="bg-transparent w-11/12 max-w-4xl mx-auto row-start-2">
        <Accordion variant='bordered' className='span:text-[5vh]' hideIndicator isCompact>
          <AccordionItem title="Нет времени читать?" subtitle="Сводка" isCompact>
            <p className="text-lg">{summary}</p>
          </AccordionItem>
        </Accordion>
        <article>
          {content.map((item, index) => renderContent(item, index))}
        </article>
      </main>
    </>
  );
}

// Main component with Suspense boundary
export default function Article() {
  return (
    <Suspense fallback={
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8">
        <div className="row-start-2 flex justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    }>
      <ArticleContent />
    </Suspense>
  );
}