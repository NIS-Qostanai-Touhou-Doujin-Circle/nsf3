import Link from 'next/link'
import { ThemeSwitcher } from './ThemeSwitcher'

export default function Header() {
  return (
    <header className="w-full border-b border-gray-200 bg-slate-50 dark:bg-slate-700">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center space-x-8">

          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Your Logo</span>
          </Link>

          <nav className="hidden md:flex space-x-4">
            <Link href="/about" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              About
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  )
}
