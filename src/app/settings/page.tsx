"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

interface ProfileForm {
  username: string;
  display_name: string;
  bio: string;
  is_public: boolean;
}

function buildUsername(email?: string | null) {
  const base = email?.split("@")[0] || "shipper";
  const safe = base.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 12) || "shipper";
  return `${safe}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function SettingsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileForm | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) return;

    const loadProfile = async () => {
      const { data } = await supabase
        .from("shiplog_profiles")
        .select("username, display_name, bio, is_public")
        .eq("id", session.user.id)
        .maybeSingle();

      if (data) {
        setProfile({
          username: data.username || "",
          display_name: data.display_name || "",
          bio: data.bio || "",
          is_public: data.is_public ?? true,
        });
        return;
      }

      const username = buildUsername(session.user.email);
      const { data: createdProfile } = await supabase
        .from("shiplog_profiles")
        .insert({
          id: session.user.id,
          username,
          display_name: username,
          bio: "",
          is_public: true,
        })
        .select("username, display_name, bio, is_public")
        .single();

      if (createdProfile) {
        setProfile({
          username: createdProfile.username || "",
          display_name: createdProfile.display_name || "",
          bio: createdProfile.bio || "",
          is_public: createdProfile.is_public ?? true,
        });
      }
    };

    loadProfile();
  }, [session?.user]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session?.user || !profile) return;
    setSaving(true);
    setStatus(null);

    const { error } = await supabase
      .from("shiplog_profiles")
      .update({
        username: profile.username.trim(),
        display_name: profile.display_name.trim(),
        bio: profile.bio.trim(),
        is_public: profile.is_public,
      })
      .eq("id", session.user.id);

    setSaving(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Profile updated.");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar showAuthButtons />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center text-foreground-secondary">
          Loading settings...
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen">
        <Navbar showAuthButtons />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="liquid-glass-card p-8">
            <h1 className="text-xl font-semibold mb-2">Log in to manage your profile</h1>
            <p className="text-sm text-foreground-secondary mb-6">
              You need an account to update ShipLog settings.
            </p>
            <Link href="/login" className="btn-lime">
              Log in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar
        userEmail={session.user.email}
        profile={profile ? { username: profile.username, display_name: profile.display_name } : null}
        onLogout={handleLogout}
      />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="liquid-glass-card p-6">
          <h1 className="text-2xl font-semibold mb-4">Profile settings</h1>
          {profile ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs text-foreground-secondary">Username</label>
                <input
                  className="glass-input mt-1"
                  value={profile.username}
                  onChange={(event) =>
                    setProfile((prev) =>
                      prev ? { ...prev, username: event.target.value } : prev
                    )
                  }
                  required
                />
              </div>
              <div>
                <label className="text-xs text-foreground-secondary">Display name</label>
                <input
                  className="glass-input mt-1"
                  value={profile.display_name}
                  onChange={(event) =>
                    setProfile((prev) =>
                      prev ? { ...prev, display_name: event.target.value } : prev
                    )
                  }
                />
              </div>
              <div>
                <label className="text-xs text-foreground-secondary">Bio</label>
                <textarea
                  className="glass-input mt-1"
                  rows={3}
                  value={profile.bio}
                  onChange={(event) =>
                    setProfile((prev) => (prev ? { ...prev, bio: event.target.value } : prev))
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-foreground-secondary">
                <input
                  type="checkbox"
                  checked={profile.is_public}
                  onChange={(event) =>
                    setProfile((prev) => (prev ? { ...prev, is_public: event.target.checked } : prev))
                  }
                />
                Make my profile public
              </label>
              {status && <p className="text-xs text-foreground-secondary">{status}</p>}
              <div className="flex flex-wrap gap-3">
                <button type="submit" className="btn-lime" disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
                {profile.username && (
                  <Link href={`/u/${profile.username}`} className="chrome-pill-button">
                    View public profile
                  </Link>
                )}
              </div>
            </form>
          ) : (
            <p className="text-sm text-foreground-secondary">Loading profile...</p>
          )}
        </div>
      </div>
    </div>
  );
}
