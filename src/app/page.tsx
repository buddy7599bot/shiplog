"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

interface LogEntry {
  id: string;
  text: string;
  category: "build" | "launch" | "metric" | "learn" | "win";
  date: string;
  timestamp: number;
}

const CATEGORIES = {
  build: { emoji: "🔨", label: "Build" },
  launch: { emoji: "🚀", label: "Launch" },
  metric: { emoji: "📊", label: "Metric" },
  learn: { emoji: "💡", label: "Learn" },
  win: { emoji: "🏆", label: "Win" },
};

function getStreak(entries: LogEntry[]): number {
  if (entries.length === 0) return 0;
  const dates = [...new Set(entries.map((e) => e.date))].sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const curr = new Date(dates[i - 1]);
    const prev = new Date(dates[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

function getWeekData(entries: LogEntry[]): { day: string; count: number }[] {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().split("T")[0];
    result.push({
      day: days[d.getDay()],
      count: entries.filter((e) => e.date === dateStr).length,
    });
  }
  return result;
}

function ThemeToggle() {
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
        <span className="text-base">
          {theme === "dark" ? "☀️" : "🌙"}
        </span>
      </div>
    </button>
  );
}

export default function Home() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<LogEntry["category"]>("build");
  const [filter, setFilter] = useState<string>("all");
  const [projectName, setProjectName] = useState("My Project");
  const [editingName, setEditingName] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("shiplog-entries");
    if (saved) setEntries(JSON.parse(saved));
    const name = localStorage.getItem("shiplog-project");
    if (name) setProjectName(name);
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem("shiplog-entries", JSON.stringify(entries));
  }, [entries, mounted]);

  const addEntry = () => {
    if (!text.trim()) return;
    const now = new Date();
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      text: text.trim(),
      category,
      date: now.toISOString().split("T")[0],
      timestamp: now.getTime(),
    };
    setEntries([entry, ...entries]);
    setText("");
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const saveProjectName = (name: string) => {
    setProjectName(name);
    localStorage.setItem("shiplog-project", name);
    setEditingName(false);
  };

  const filtered = filter === "all" ? entries : entries.filter((e) => e.category === filter);
  const streak = getStreak(entries);
  const weekData = getWeekData(entries);
  const maxWeek = Math.max(...weekData.map((d) => d.count), 1);

  const shareText = `🚀 ShipLog Update -- ${projectName}\n\n${entries
    .slice(0, 5)
    .map((e) => `${CATEGORIES[e.category].emoji} ${e.text}`)
    .join("\n")}\n\n🔥 ${streak}-day streak\n\nTrack your build journey -> shiplog-app.vercel.app`;

  if (!mounted) return null;

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="glass-navbar">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="mr-2">📦</span>
            <span className="metallic-text-gradient">ShipLog</span>
          </h1>
          <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header with streak */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm text-foreground-secondary">
            Track your build journey. Ship in public.
          </p>
          <div className="glass-stat-card px-4 py-2 text-center">
            <div className="text-2xl font-bold metallic-text-gradient">🔥 {streak}</div>
            <div className="text-xs text-foreground-secondary">day streak</div>
          </div>
        </div>

        {/* Project Name */}
        <div className="mb-6">
          {editingName ? (
            <input
              className="glass-input text-lg font-semibold"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => saveProjectName(projectName)}
              onKeyDown={(e) => e.key === "Enter" && saveProjectName(projectName)}
              autoFocus
            />
          ) : (
            <h2
              className="text-lg font-semibold cursor-pointer hover:text-accent transition-colors"
              onClick={() => setEditingName(true)}
            >
              {projectName} <span className="text-xs text-foreground-secondary">✏️</span>
            </h2>
          )}
        </div>

        {/* Weekly Activity */}
        <div className="liquid-glass-card p-5 mb-6">
          <div className="text-xs text-foreground-secondary mb-3 font-medium uppercase tracking-wider">This Week</div>
          <div className="flex items-end gap-2 h-16">
            {weekData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={d.count > 0 ? "bar-lime w-full transition-all" : "bar-empty w-full transition-all"}
                  style={{ height: `${Math.max((d.count / maxWeek) * 48, 4)}px` }}
                />
                <span className="text-[10px] text-foreground-secondary">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="glass-stat-card p-4 text-center">
            <div className="text-xl font-bold">{entries.length}</div>
            <div className="text-xs text-foreground-secondary">Total Logs</div>
          </div>
          <div className="glass-stat-card p-4 text-center">
            <div className="text-xl font-bold">{new Set(entries.map((e) => e.date)).size}</div>
            <div className="text-xs text-foreground-secondary">Active Days</div>
          </div>
          <div className="glass-stat-card p-4 text-center">
            <div className="text-xl font-bold">{entries.filter((e) => e.category === "win").length}</div>
            <div className="text-xs text-foreground-secondary">Wins</div>
          </div>
        </div>

        {/* Input */}
        <div className="liquid-glass-card p-5 mb-6">
          <textarea
            className="glass-input mb-3"
            placeholder="What did you ship today?"
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addEntry();
            }}
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5 flex-wrap">
              {(Object.keys(CATEGORIES) as LogEntry["category"][]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`chrome-pill-button text-xs !px-3 !py-1.5 ${category === cat ? "active" : ""}`}
                >
                  {CATEGORIES[cat].emoji} {CATEGORIES[cat].label}
                </button>
              ))}
            </div>
            <button
              onClick={addEntry}
              disabled={!text.trim()}
              className="btn-lime"
            >
              Log it
            </button>
          </div>
        </div>

        {/* Share Button */}
        {entries.length > 0 && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(shareText);
              alert("Copied to clipboard! Paste it on X 🚀");
            }}
            className="chrome-pill-button w-full mb-6 text-center !py-3"
          >
            📋 Copy update for X / socials
          </button>
        )}

        {/* Filter */}
        <div className="flex gap-1.5 mb-4 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`chrome-pill-button text-xs !px-3 !py-1.5 ${filter === "all" ? "active" : ""}`}
          >
            All
          </button>
          {(Object.keys(CATEGORIES) as LogEntry["category"][]).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`chrome-pill-button text-xs !px-3 !py-1.5 ${filter === cat ? "active" : ""}`}
            >
              {CATEGORIES[cat].emoji} {CATEGORIES[cat].label}
            </button>
          ))}
        </div>

        {/* Entries */}
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-foreground-secondary">
              <div className="text-4xl mb-2">📦</div>
              <p>No logs yet. Start shipping!</p>
            </div>
          )}
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="group glass-entry p-3 flex items-start gap-3"
            >
              <span className="text-lg mt-0.5">{CATEGORIES[entry.category].emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{entry.text}</p>
                <p className="text-xs text-foreground-secondary mt-1">{entry.date}</p>
              </div>
              <button
                onClick={() => deleteEntry(entry.id)}
                className="opacity-0 group-hover:opacity-100 text-foreground-secondary hover:text-red-400 text-xs transition-all"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border text-center">
          <p className="text-xs text-foreground-secondary">
            Built by{" "}
            <a href="https://x.com/jbetala7" className="hover:text-accent transition-colors">
              @jbetala7
            </a>{" "}
            -- Ship in public, track your journey.
          </p>
          <p className="text-xs text-foreground-secondary mt-1 opacity-60">
            Data stored locally in your browser. Your logs, your privacy.
          </p>
        </div>
      </div>
    </div>
  );
}
