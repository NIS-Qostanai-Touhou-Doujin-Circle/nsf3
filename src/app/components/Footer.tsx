"use client";

import { Image, Link } from "@heroui/react";
import { ThemeSwitcher } from './ThemeSwitcher'
import { useTheme } from 'next-themes';

export default function Footer() {
  const { theme } = useTheme();

  return (
    <footer className="w-full border-t bg-primary-foreground border-gray-200 dark:border-gray-800 mt-[10vh]">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-start">
            <Link href="/" className="mb-4">
              <Image 
                alt="Not so Far"
                height={40}
                src={theme == 'dark' ? "logo-light.png" : "logo-dark.png"}
              />
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Читайте новости и статьи и оставайтесь в курсе событий в мире
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">Навигация</h3>
            <ul className="space-y-2">
              <li><Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Цена</Link></li>
              <li><Link href="/follow" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Что нового?</Link></li>
              <li><Link href="/about" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">О нас</Link></li>
              <li><Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Вход в аккаунт</Link></li>
              <li><Link href="/reg" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Регистрация</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">Правовая информация</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Политика конфиденциальности</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">Связаться с нами</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">c0st1nus@proton.me</p>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Тема:</span>
              <ThemeSwitcher />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          © {new Date().getFullYear()} Depa team. Все права защищены.
        </div>
      </div>
    </footer>
  );
}