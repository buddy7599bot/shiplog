"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-[44px] h-[44px]" />;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="chrome-ring-button"
      aria-label="Toggle theme"
    >
      <div className="chrome-ring-inner">
        <span className="text-base">{theme === "dark" ? "☀️" : "🌙"}</span>
      </div>
    </button>
  );
}
