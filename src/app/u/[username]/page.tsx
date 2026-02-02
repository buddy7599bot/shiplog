"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

type Category = "build" | "launch" | "metric" | "learn" | "win";

interface PublicProfile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
}

interface PublicProject {
  id: string;
  name: string;
}

interface PublicEntry {
  id: string;
  text: string;
  category: Category;
  created_at: string;
  project_id: string | null;
  date: string;
}

const CATEGORIES: Record<Category, { emoji: string; label: string }> = {
  build: { emoji: "🔨", label: "Build" },
  launch: { emoji: "🚀", label: "Launch" },
  metric: { emoji: "📊", label: "Metric" },
  learn: { emoji: "💡", label: "Learn" },
  win: { emoji: "🏆", label: "Win" },
};

function normalizePublicEntry(entry: Omit<PublicEntry, "date">): PublicEntry {
  const date = new Date(entry.created_at).toISOString().split("T")[0];
  return { ...entry, date };
}

function getStreak(entries: PublicEntry[]): number {
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

export default function PublicProfilePage() {
  const params = useParams();
  const username = typeof params.username === "string" ? params.username : "";
  const [session, setSession] = useState<Session | null>(null);
  const [viewerProfile, setViewerProfile] = useState<{ username: string | null; display_name: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [entries, setEntries] = useState<PublicEntry[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setViewerProfile(null);
      return;
    }

    const loadViewerProfile = async () => {
      const { data } = await supabase
        .from("shiplog_profiles")
        .select("username, display_name")
        .eq("id", session.user.id)
        .maybeSingle();
      if (data) {
        setViewerProfile({
          username: data.username,
          display_name: data.display_name,
        });
      }
    };

    loadViewerProfile();
  }, [session?.user]);

  useEffect(() => {
    if (!username) return;

    const loadPublicProfile = async () => {
      setLoading(true);
      setNotFound(false);

      const { data: profileData } = await supabase
        .from("shiplog_profiles")
        .select("id, username, display_name, bio")
        .eq("username", username)
        .eq("is_public", true)
        .maybeSingle();

      if (!profileData) {
        setProfile(null);
        setProjects([]);
        setEntries([]);
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileData as PublicProfile);

      const { data: projectData } = await supabase
        .from("shiplog_projects")
        .select("id, name")
        .eq("user_id", profileData.id)
        .eq("is_public", true)
        .order("created_at", { ascending: true });

      const publicProjects = (projectData || []) as PublicProject[];
      setProjects(publicProjects);

      if (publicProjects.length === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }

      const { data: entryData } = await supabase
        .from("shiplog_entries")
        .select("id, text, category, created_at, project_id")
        .eq("user_id", profileData.id)
        .eq("is_public", true)
        .in(
          "project_id",
          publicProjects.map((project) => project.id)
        )
        .order("created_at", { ascending: false });

      const normalized = (entryData || []).map((entry) =>
        normalizePublicEntry(entry as Omit<PublicEntry, "date">)
      );
      setEntries(normalized);
      setLoading(false);
    };

    loadPublicProfile();
  }, [username]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const navProps = {
    userEmail: session?.user?.email,
    profile: viewerProfile,
    onLogout: session ? handleLogout : undefined,
    showAuthButtons: !session,
  };

  const projectMap = useMemo(() => {
    return new Map(projects.map((project) => [project.id, project.name]));
  }, [projects]);

  const streak = getStreak(entries);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar {...navProps} />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center text-foreground-secondary">
          Loading profile...
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen">
        <Navbar {...navProps} />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="liquid-glass-card p-8">
            <h1 className="text-xl font-semibold mb-2">Profile not found</h1>
            <p className="text-sm text-foreground-secondary">
              This builder has not shared a public ShipLog yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar {...navProps} />

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="liquid-glass-card p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">
                {profile.display_name || profile.username}
              </h1>
              <p className="text-xs text-foreground-secondary">@{profile.username}</p>
              {profile.bio && (
                <p className="text-sm text-foreground-secondary mt-2 max-w-xl">{profile.bio}</p>
              )}
            </div>
            <div className="glass-stat-card px-4 py-2 text-center">
              <div className="text-2xl font-bold metallic-text-gradient">🔥 {streak}</div>
              <div className="text-xs text-foreground-secondary">day streak</div>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="glass-stat-card p-4 text-center">
            <div className="text-xl font-bold">{entries.length}</div>
            <div className="text-xs text-foreground-secondary">Public Logs</div>
          </div>
          <div className="glass-stat-card p-4 text-center">
            <div className="text-xl font-bold">{projects.length}</div>
            <div className="text-xs text-foreground-secondary">Public Projects</div>
          </div>
          <div className="glass-stat-card p-4 text-center">
            <div className="text-xl font-bold">{new Set(entries.map((entry) => entry.date)).size}</div>
            <div className="text-xs text-foreground-secondary">Active Days</div>
          </div>
        </div>

        <div className="liquid-glass-card p-5 mb-6">
          <h2 className="text-sm font-semibold mb-3">Public Projects</h2>
          {projects.length === 0 ? (
            <p className="text-xs text-foreground-secondary">No public projects yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {projects.map((project) => (
                <span key={project.id} className="chrome-pill-button text-xs !px-3 !py-1.5">
                  {project.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          {entries.length === 0 ? (
            <div className="text-center py-12 text-foreground-secondary">
              <div className="text-4xl mb-2">📦</div>
              <p>No public logs yet.</p>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="glass-entry p-3 flex items-start gap-3">
                <span className="text-lg mt-0.5">{CATEGORIES[entry.category].emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{entry.text}</p>
                  <p className="text-xs text-foreground-secondary mt-1">
                    {new Date(entry.created_at).toLocaleDateString()} · {projectMap.get(entry.project_id || "") || "Project"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
