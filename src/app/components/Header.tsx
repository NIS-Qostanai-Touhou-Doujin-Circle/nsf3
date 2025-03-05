"use client";

import { Image, Link } from "@heroui/react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useTheme } from "next-themes";
import {Avatar, AvatarIcon} from "@heroui/avatar";
import { useState, useEffect, useMemo, useCallback } from "react";

const navLinks = [
  { href: "/pricing", label: "Цена" },
  { href: "/follow", label: "Что нового?" },
  { href: "/about", label: "О нас" },
];

const linkClasses =
  "text-lg lg:text-2xl text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white";

export default function Header() {
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Toggle mobile menu state
  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  // Update body class when mobile menu state changes
  useEffect(() => {
    document.body.classList.toggle("mobile-menu-open", mobileMenuOpen);
  }, [mobileMenuOpen]);

  const logoSrc = useMemo(
    () => (theme === "dark" ? "logo-light.png" : "logo-dark.png"),
    [theme]
  );

  return (
    <header className="w-full border-b bg-primary-foreground border-transparent sticky top-0 z-40 mb-[10vh]">
      <div className="ml-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Image alt="Not so Far" height={45} src={logoSrc} />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          <nav className="flex space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                isBlock
                underline="focus"
                color="foreground"
                className={`${linkClasses} ${link.href === "/pricing" ? "mr-5" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <ThemeSwitcher />
        </div>

        {/* Mobile Navigation Controls */}
        <div className="flex items-center space-x-3 md:hidden">
          <ThemeSwitcher />
          <button
            onClick={toggleMobileMenu}
            className="p-2 focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-600 dark:text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className="md:hidden relative bg-primary-foreground border-b border-gray-200 dark:border-gray-800 shadow-lg z-30 transition-all duration-300 ease-in-out overflow-hidden"
        style={{
          maxHeight: mobileMenuOpen ? "200px" : "0px",
          opacity: mobileMenuOpen ? 1 : 0,
        }}
      >
        <nav className="flex flex-col space-y-3 py-3 px-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              isBlock
              underline="focus"
              color="foreground"
              className={`text-xl ${linkClasses}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}