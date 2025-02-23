"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";
import { Button } from "@heroui/react";

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div>
      <Button onPress={toggleTheme} isIconOnly radius="full">
        {theme === 'light' ? (
          <MoonIcon className="h-6 w-6 text-gray-800" />
        ) : (
          <SunIcon className="h-6 w-6 text-yellow-500" />
        )}
      </Button>
    </div>
  );
}