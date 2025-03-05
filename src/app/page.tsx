'use client';

import { Textarea, Button } from "@heroui/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {  
  const [message, setMessage] = useState('');
  const [textContent, setTextContent] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hello`)
      .then(res => res.json())
      .then(data => setMessage(data.message));
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { 
      if (e.shiftKey) {
        return;
      } else {
        e.preventDefault();
        submitSearch();
      }
    }
  };

  const submitSearch = () => {
    if (textContent.trim()) {
      router.push(`/search?q=${encodeURIComponent(textContent)}`);
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="bg-transparent w-11/12 h-1/2 flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="w-full relative">
          <Textarea
            isClearable
            onClear={() => setTextContent('')}
            className="w-full h-full"
            placeholder="О чем вам интересно почитать сегодня? 🤔"
            variant="faded"
            color="default"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            onKeyDown={handleKeyDown}
            classNames={{
              input: "text-xl"
            }}
          />
          <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
            <span className="hidden sm:block">Shift+Enter для новой строки</span>
            <Button 
              type="submit"
              variant="faded"
              color="default" 
              onPress={submitSearch}
              className="ml-auto light:text-gray-800"
              isDisabled={!textContent.trim()}
            >
              Искать
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}