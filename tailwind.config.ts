import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",    
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [heroui({
    themes: {
      light: {
        colors: {
          background: "#ECEDEE",
          
          primary: {
            foreground: "#DBEAFE",
            DEFAULT: "#ECEDEE",
          }
        }
      },
      dark: {
        colors: {
          background: "#0A2530",
          
          primary: {
            foreground: "#0f4257",
            DEFAULT: "#ECEDEE",
          }
        }
      }
    }
  })],

} satisfies Config;
