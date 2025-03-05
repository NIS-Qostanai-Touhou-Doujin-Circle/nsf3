'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardBody, CardFooter, CardHeader, Image, Skeleton, Spinner, Button, Link } from '@heroui/react';

interface ArticleCard {
    id: string;
    title: string;
    image_url: string;
    description: string;
    tags: string[];
    url: string;
}

// Create a separate component that uses useSearchParams
function SearchResults() {
    const searchParams = useSearchParams();
    const [articles, setArticles] = useState<ArticleCard[]>([]);
    const [loading, setLoading] = useState(true);
    const contentRef = useRef<HTMLDivElement>(null);

    async function getArticleCard(article: ArticleCard) {
        try {
            console.log(article);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/article_data/${article.id}`);
            const data = await res.json();
            return {
                id: data.id,
                title: data.title,
                image_url: data.image_url,
                description: data.description,
                tags: data.tags,
                url: data.url
            } as ArticleCard;
        } catch (error) {
            console.error("Error fetching article data:", error);
            return null;
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/articles_list`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    query: searchParams.get('q') || '',
                  }),
                });
                const data = await res.json();
                console.log(data);
                const IDs = data?.articles || [];
                const articleData: (ArticleCard | null)[] = await Promise.all(
                    IDs.map((id: ArticleCard) => getArticleCard(id))
                );
                setArticles(articleData.filter(article => article !== null));
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [searchParams]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 pb-20 gap-6 sm:p-20 font-[family-name:var(--font-geist-sans)]" ref={contentRef}>
            {loading ? (
                <Spinner color="secondary" variant="dots" size="lg"/>
            ) : (
                <>
                    {articles.map((article, index) => (
                        <Card as={Link} key={index} className="w-full max-w-lg space-y-4 p-4 sm:p-6 mb-4" radius="lg" href={`/article?id=${article.id}`}>
                            <CardHeader>
                                <Skeleton className="w-full rounded-lg" isLoaded={!loading}>
                                    <Image loading="eager" src={article.image_url} radius="lg" alt="Article Image" className="w-full h-auto"/>
                                </Skeleton>
                                <h1 className="text-xl sm:text-2xl font-bold mt-3 ml-2">{article.title}</h1>
                            </CardHeader>
                            <CardBody>
                                <p className='text-gray-500 text-base sm:text-lg'>{article.description}</p>
                            </CardBody>
                            <CardFooter className="flex flex-row overflow-hidden">
                                {article.tags && article.tags.length > 0 ? (
                                    article.tags.length > 5 ? (
                                        <div className="relative w-full">
                                        <div
                                            className="flex animate-scroll"
                                            style={{ animationDuration: "20s" }}
                                        >
                                            {article.tags.map((tag, index) => (
                                            <Button
                                                key={`tag-${index}`}
                                                color="default"
                                                variant="solid"
                                                radius="lg"
                                                className="mr-2"
                                            >
                                                #{tag}
                                            </Button>
                                            ))}
                                            {article.tags.map((tag, index) => (
                                            <Button
                                                key={`tag-dup-${index}`}
                                                color="default"
                                                variant="solid"
                                                radius="lg"
                                                className="mr-2"
                                            >
                                                #{tag}
                                            </Button>
                                            ))}
                                        </div>
                                        </div>
                                    ) : (
                                        article.tags.map((tag, tagIndex) => (
                                        <Button
                                            key={tagIndex}
                                            color="default"
                                            variant="solid"
                                            radius="lg"
                                            className="mr-2"
                                        >
                                            #{tag}
                                        </Button>
                                        ))
                                    )
                                ) : (
                                    <div className="text-gray-400">Нет тегов</div>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </>
            )}
        </div>
    );
}

// Main component with Suspense boundary
export default function Search() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Spinner color="secondary" variant="dots" size="lg" />
            </div>
        }>
            <SearchResults />
        </Suspense>
    );
}