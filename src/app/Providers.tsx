"use client";

import {HeroUIProvider} from '@heroui/react'
import {ThemeProvider as NextThemesProvider} from "next-themes";
import { useEffect, useState } from 'react';

export function Providers({children}: { children: React.ReactNode }) {

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);
  
    if (!mounted) {
      return <>{children}</>; // Render children without ThemeProvider during SSR
    }

    return (
        <HeroUIProvider>
        <NextThemesProvider attribute={"class"} defaultTheme="dark">
            {children}
        </NextThemesProvider>
        </HeroUIProvider>
    )
}