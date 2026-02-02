"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Category = "build" | "launch" | "metric" | "learn" | "win";

interface LogEntry {
  id: string;
  text: string;
  category: Category;
  is_public: boolean;
  created_at: string;
}

const CATEGORIES: Record<Category, { label: string; color: string }> = {
  build: { label: "Build", color: "#84CC16" },
  launch: { label: "Launch", color: "#F43F5E" },
  metric: { label: "Metric", color: "#3B82F6" },
  learn: { label: "Learn", color: "#8B5CF6" },
  win: { label: "Win", color: "#F59E0B" },
};

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  build: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  launch: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  metric: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  learn: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>,
  win: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
};

const PLACEHOLDERS: Record<Category, string> = {
  build: "What did you build today?",
  launch: "What did you launch today?",
  metric: "What metric moved today?",
  learn: "What did you learn today?",
  win: "What's your win today?",
};


function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getStreak(entries: LogEntry[]): number {
  if (entries.length === 0) return 0;
  const dates = [...new Set(entries.map((e) => new Date(e.created_at).toISOString().split("T")[0]))].sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dates[0] !== today && dates[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
    if (Math.abs(diffDays - 1) < 0.1) streak++;
    else break;
  }
  return streak;
}

function getWeekData(entries: LogEntry[]): { day: string; count: number }[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const result: { day: string; count: number }[] = [];
  const now = new Date();
  const dayIndex = now.getDay();
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const todayStr = now.toISOString().split("T")[0];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const count = dateStr > todayStr ? 0 : entries.filter((e) => e.created_at.startsWith(dateStr)).length;
    result.push({ day: days[i], count });
  }
  return result;
}

export default function Dashboard({ session }: { session: Session }) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<Category>("build");
  const isPublic = true;
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    const { data } = await supabase
      .from("shiplog_entries")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    if (data) setEntries(data);
    setLoading(false);
  }, [session.user.id]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const addEntry = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    const { error } = await supabase.from("shiplog_entries").insert({
      user_id: session.user.id,
      text: text.trim(),
      category,
      is_public: isPublic,
    });
    if (!error) {
      setText("");
      await fetchEntries();
    }
    setSubmitting(false);
  };

  const deleteEntry = async (id: string) => {
    await supabase.from("shiplog_entries").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const streak = getStreak(entries);
  const weekData = getWeekData(entries);
  const maxWeek = Math.max(...weekData.map((d) => d.count), 1);
  const filtered = filter === "all" ? entries : entries.filter((e) => e.category === filter);
  const activeDays = new Set(entries.map((e) => e.created_at.split("T")[0])).size;
  const wins = entries.filter((e) => e.category === "win").length;
  const avatarUrl = useMemo(() => {
    const metadata = session.user.user_metadata ?? {};
    return metadata.avatar_url || metadata.picture || null;
  }, [session.user.user_metadata]);

  const userLabel = useMemo(() => {
    const metadata = session.user.user_metadata ?? {};
    return metadata.full_name || metadata.name || session.user.email?.split("@")[0] || "Builder";
  }, [session.user.user_metadata, session.user.email]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (menuRef.current && event.target instanceof Node && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const shareJourney = useCallback(async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const response = await fetch("/api/share-journey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: session.user.id,
          user_name: userLabel,
          streak,
          total_logs: entries.length,
          active_days: activeDays,
          wins,
          week_data: weekData,
          entries: entries.slice(0, 5).map((entry) => ({
            text: entry.text,
            category: entry.category,
            created_at: entry.created_at,
          })),
        }),
      });
      const data = await response.json();
      const shareUrl = data.shareUrl;
      setShareUrl(shareUrl);
      setSharing(false);
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setSharing(false);
      console.error(error);
    }
  }, [sharing, session.user.id, userLabel, streak, entries, activeDays, wins, weekData]);

  return (
    <div className="min-h-screen">
      {/* Floating Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none pt-4 px-4">
        <nav className="sl-nav-floating pointer-events-auto">
          <div className="flex items-center justify-between w-full">
            <Link href="/" className="flex items-center gap-2 font-bold text-sm">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-lime-500 flex-shrink-0"
              >
                <path
                  d="M12 2L3 7v10l9 5 9-5V7l-9-5z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="currentColor"
                  fillOpacity="0.15"
                />
                <path d="M12 22V12" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 7l9 5 9-5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7.5 4.5L16.5 9.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <span className="sl-logo-text">ShipLog</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((open) => !open)}
                  className="w-7 h-7 rounded-full border border-[var(--glass-border)] bg-[var(--glass)] text-[10px] font-bold text-foreground-secondary flex items-center justify-center overflow-hidden hover:border-white/20 transition"
                  aria-label="User menu"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span>{userLabel.charAt(0).toUpperCase()}</span>
                  )}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-xl border border-[var(--glass-border)] bg-[var(--glass)] shadow-lg backdrop-blur p-1 text-xs text-foreground-secondary">
                    <div className="px-3 py-2 border-b border-[var(--glass-border)] text-[11px]">{userLabel}</div>
                    <button
                      onClick={async () => {
                        setMenuOpen(false);
                        await handleSignOut();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition text-red-400"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-12">
        {/* Streak + Stats */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#F97316" stroke="none" className="flex-shrink-0">
              <path d="M12 23c-3.866 0-7-2.239-7-5 0-2.485 1.63-4.378 3.304-5.902.88-.8 1.762-1.52 2.45-2.248C11.86 8.684 12.5 7.5 12.5 6c0 0 1 2.5 1 4.5 0 .834-.247 1.505-.59 2.063-.345.558-.799 1.04-1.206 1.49-.768.854-1.373 1.63-1.373 2.947 0 1.657 1.343 3 3 3s3-1.343 3-3c0-1.78-.912-3.244-1.842-4.486-.478-.638-.975-1.232-1.389-1.855C12.69 10.04 12.5 9.314 12.5 8.5c0 0 3.5 2.5 5.5 5.5.667 1 1 2.167 1 3 0 2.761-3.134 5-7 5z" />
            </svg>
            <div>
              <div className="text-3xl font-extrabold gradient-fade-text">{streak}</div>
              <div className="text-xs text-foreground-secondary">day streak</div>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <div className="text-center px-4 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-lg font-bold">{entries.length}</div>
              <div className="text-[10px] text-foreground-secondary">Logs</div>
            </div>
            <div className="text-center px-4 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-lg font-bold">{activeDays}</div>
              <div className="text-[10px] text-foreground-secondary">Days</div>
            </div>
            <div className="text-center px-4 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-lg font-bold">{wins}</div>
              <div className="text-[10px] text-foreground-secondary">Wins</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={shareJourney}
                disabled={sharing}
                className="sl-demo-submit"
              >
                {sharing ? "Sharing..." : "Share Journey"}
              </button>
              {shareUrl && (
                <button
                  onClick={() => navigator.clipboard?.writeText(shareUrl)}
                  className="text-[10px] px-2 py-1 rounded-lg border border-lime-500/40 text-lime-200 hover:text-black hover:bg-lime-400 transition"
                >
                  Copy link
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="macos-window glow-lime-subtle mb-8">
          <div className="macos-titlebar">
            <div className="macos-dot macos-dot-red" />
            <div className="macos-dot macos-dot-yellow" />
            <div className="macos-dot macos-dot-green" />
            <span className="macos-titlebar-text">This Week</span>
          </div>
          <div className="macos-body">
            <div className="mock-bar-chart" style={{ height: "64px" }}>
              {weekData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className="mock-bar w-full"
                    style={{ height: `${Math.max((d.count / maxWeek) * 100, 8)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-foreground-secondary mt-2 px-1">
              {weekData.map((d, i) => <span key={i}>{d.day}</span>)}
            </div>
          </div>
        </div>

        {/* Log Input */}
        <div className="macos-window glow-lime-subtle mb-8">
          <div className="macos-titlebar">
            <div className="macos-dot macos-dot-red" />
            <div className="macos-dot macos-dot-yellow" />
            <div className="macos-dot macos-dot-green" />
            <span className="macos-titlebar-text">New Entry</span>
          </div>
          <div className="macos-body">
            <textarea
              className="sl-demo-input w-full mb-3"
              placeholder={PLACEHOLDERS[category]}
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addEntry();
              }}
              style={{ resize: "none" }}
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5 flex-wrap">
                {(Object.keys(CATEGORIES) as Category[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`sl-cat-btn ${category === cat ? "active" : ""}`}
                    data-category={cat}
                  >
                    {CATEGORY_ICONS[cat]} {CATEGORIES[cat].label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={addEntry}
                  disabled={!text.trim() || submitting}
                  className="sl-demo-submit"
                >
                  {submitting ? "..." : "Log it"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-1.5 mb-4 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`sl-cat-btn ${filter === "all" ? "active" : ""}`}
            data-category={filter === "all" ? "build" : undefined}
            style={filter === "all" ? { background: "#84CC16", borderColor: "#84CC16", color: "#000" } : {}}
          >
            All
          </button>
          {(Object.keys(CATEGORIES) as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`sl-cat-btn ${filter === cat ? "active" : ""}`}
              data-category={cat}
            >
              {CATEGORY_ICONS[cat]} {CATEGORIES[cat].label}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          {loading && (
            <div className="text-center py-12 text-foreground-secondary">Loading...</div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-foreground-secondary">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-foreground-secondary mx-auto"
              >
                <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" />
                <path d="M12 22V12" />
                <path d="M3 7l9 5 9-5" />
              </svg>
              <p>No logs yet. Start shipping!</p>
            </div>
          )}
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="group flex items-start gap-3 p-3 rounded-lg transition"
              style={{
                background: "rgba(255,255,255,0.02)",
                borderLeft: `3px solid ${CATEGORIES[entry.category]?.color || "#84CC16"}`,
              }}
            >
              <span className="text-lg mt-0.5">{CATEGORY_ICONS[entry.category]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{entry.text}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-foreground-secondary">{timeAgo(entry.created_at)}</span>
                  {!entry.is_public && <span className="text-xs text-foreground-secondary">🔒</span>}
                </div>
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
        <footer className="mt-12 pt-6 border-t border-border">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-foreground-secondary">
            <span>&copy; {new Date().getFullYear()} ShipLog</span>
            <span className="hidden sm:inline">&middot;</span>
            <a href="https://jayeshbetala.com" target="_blank" rel="noopener noreferrer" className="hover:text-lime-500 transition">Built by Jayesh Betala</a>
            <span className="hidden sm:inline">&middot;</span>
            <a href="https://dashpane.pro" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition">Try DashPane</a>
            <span className="hidden sm:inline">&middot;</span>
            <Link href="/privacy" className="hover:text-foreground transition">
              Privacy
            </Link>
            <span className="hidden sm:inline">&middot;</span>
            <Link href="/terms" className="hover:text-foreground transition">
              Terms
            </Link>
          </div>
        </footer>

      </div>
    </div>
  );
}
