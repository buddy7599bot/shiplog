"use client";

import { useState, useEffect } from "react";

interface LogEntry {
  id: string;
  text: string;
  category: "build" | "launch" | "metric" | "learn" | "win";
  date: string;
  timestamp: number;
}

const CATEGORIES = {
  build: { emoji: "🔨", label: "Build", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  launch: { emoji: "🚀", label: "Launch", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  metric: { emoji: "📊", label: "Metric", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  learn: { emoji: "💡", label: "Learn", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  win: { emoji: "🏆", label: "Win", color: "bg-green-500/20 text-green-400 border-green-500/30" },
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

export default function Home() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<LogEntry["category"]>("build");
  const [filter, setFilter] = useState<string>("all");
  const [projectName, setProjectName] = useState("My Project");
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("shiplog-entries");
    if (saved) setEntries(JSON.parse(saved));
    const name = localStorage.getItem("shiplog-project");
    if (name) setProjectName(name);
  }, []);

  useEffect(() => {
    localStorage.setItem("shiplog-entries", JSON.stringify(entries));
  }, [entries]);

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

  const shareText = `🚀 ShipLog Update — ${projectName}\n\n${entries
    .slice(0, 5)
    .map((e) => `${CATEGORIES[e.category].emoji} ${e.text}`)
    .join("\n")}\n\n🔥 ${streak}-day streak\n\nTrack your build journey → shiplog-app.vercel.app`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            📦 ShipLog
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Track your build journey. Ship in public.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">🔥 {streak}</div>
            <div className="text-xs text-neutral-500">day streak</div>
          </div>
        </div>
      </div>

      {/* Project Name */}
      <div className="mb-6">
        {editingName ? (
          <input
            className="bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-lg font-semibold w-full focus:outline-none focus:border-green-500"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onBlur={() => saveProjectName(projectName)}
            onKeyDown={(e) => e.key === "Enter" && saveProjectName(projectName)}
            autoFocus
          />
        ) : (
          <h2
            className="text-lg font-semibold cursor-pointer hover:text-green-400 transition-colors"
            onClick={() => setEditingName(true)}
          >
            {projectName} <span className="text-xs text-neutral-600">✏️</span>
          </h2>
        )}
      </div>

      {/* Weekly Activity */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 mb-6">
        <div className="text-xs text-neutral-500 mb-3">This Week</div>
        <div className="flex items-end gap-2 h-16">
          {weekData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-sm transition-all"
                style={{
                  height: `${Math.max((d.count / maxWeek) * 48, 4)}px`,
                  backgroundColor: d.count > 0 ? "#22c55e" : "#262626",
                }}
              />
              <span className="text-[10px] text-neutral-600">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold">{entries.length}</div>
          <div className="text-xs text-neutral-500">Total Logs</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold">{new Set(entries.map((e) => e.date)).size}</div>
          <div className="text-xs text-neutral-500">Active Days</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold">{entries.filter((e) => e.category === "win").length}</div>
          <div className="text-xs text-neutral-500">Wins</div>
        </div>
      </div>

      {/* Input */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 mb-6">
        <textarea
          className="w-full bg-transparent resize-none focus:outline-none placeholder:text-neutral-600 mb-3"
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
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  category === cat
                    ? CATEGORIES[cat].color
                    : "border-neutral-700 text-neutral-500 hover:border-neutral-600"
                }`}
              >
                {CATEGORIES[cat].emoji} {CATEGORIES[cat].label}
              </button>
            ))}
          </div>
          <button
            onClick={addEntry}
            disabled={!text.trim()}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-30 disabled:hover:bg-green-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
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
          className="w-full mb-6 bg-neutral-900 border border-neutral-800 hover:border-green-500/50 rounded-lg p-3 text-sm text-neutral-400 hover:text-green-400 transition-all"
        >
          📋 Copy update for X / socials
        </button>
      )}

      {/* Filter */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
            filter === "all" ? "border-white/30 text-white" : "border-neutral-700 text-neutral-500"
          }`}
        >
          All
        </button>
        {(Object.keys(CATEGORIES) as LogEntry["category"][]).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
              filter === cat ? CATEGORIES[cat].color : "border-neutral-700 text-neutral-500"
            }`}
          >
            {CATEGORIES[cat].emoji} {CATEGORIES[cat].label}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-neutral-600">
            <div className="text-4xl mb-2">📦</div>
            <p>No logs yet. Start shipping!</p>
          </div>
        )}
        {filtered.map((entry) => (
          <div
            key={entry.id}
            className="group bg-neutral-900 border border-neutral-800 rounded-lg p-3 flex items-start gap-3 hover:border-neutral-700 transition-colors"
          >
            <span className="text-lg mt-0.5">{CATEGORIES[entry.category].emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{entry.text}</p>
              <p className="text-xs text-neutral-600 mt-1">{entry.date}</p>
            </div>
            <button
              onClick={() => deleteEntry(entry.id)}
              className="opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-red-400 text-xs transition-all"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-neutral-800 text-center">
        <p className="text-xs text-neutral-600">
          Built by{" "}
          <a href="https://x.com/jbetala7" className="text-neutral-400 hover:text-green-400">
            @jbetala7
          </a>{" "}
          — Ship in public, track your journey.
        </p>
        <p className="text-xs text-neutral-700 mt-1">
          Data stored locally in your browser. Your logs, your privacy.
        </p>
      </div>
    </div>
  );
}
