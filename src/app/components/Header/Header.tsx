import Link from 'next/link'
import { ThemeSwitcher } from './ThemeSwitcher'

export default function Header() {
  return (
    <header className="w-full border-b border-gray-200 bg-white dark:bg-gray-900">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center space-x-8">
          {/* Logo - server rendered */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Your Logo</span>
          </Link>

          {/* Navigation links - server rendered */}
          <nav className="hidden md:flex space-x-4">
            <Link href="/about" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              About
            </Link>
            <Link href="/products" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              Products
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              Contact
            </Link>
          </nav>
        </div>

        {/* Client-side interactive components */}
        <div className="flex items-center space-x-4">
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  )
}
