'use client';

import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {  
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hello`)
      .then(res => res.json())
      .then(data => setMessage(data.message));
  }, []);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <div>
          <span className="inline">
            Flask says: 
          </span>
          <span className="text-green-500 inline">
            {message}
          </span>
        </div>
      </main>
    </div>
  );
}
