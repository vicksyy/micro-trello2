"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "micro-kanban-theme";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")
      .matches;
    const enabled = stored ? stored === "dark" : Boolean(prefersDark);
    setDarkMode(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    window.localStorage.setItem(STORAGE_KEY, darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      onClick={() => setDarkMode((prev) => !prev)}
      className="border border-slate-200 bg-white/60 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
      aria-label={darkMode ? "Activar modo claro" : "Activar modo oscuro"}
      title={darkMode ? "Activar modo claro" : "Activar modo oscuro"}
    >
      {darkMode ? <Sun /> : <Moon />}
    </Button>
  );
}
