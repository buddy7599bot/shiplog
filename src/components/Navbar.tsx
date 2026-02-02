"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

interface NavbarProfile {
  username: string | null;
  display_name: string | null;
}

interface NavbarProps {
  userEmail?: string | null;
  profile?: NavbarProfile | null;
  onLogout?: () => void;
  showAuthButtons?: boolean;
}

export default function Navbar({ userEmail, profile, onLogout, showAuthButtons }: NavbarProps) {
  const label = profile?.display_name || profile?.username || userEmail;

  return (
    <nav className="glass-navbar">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="text-xl font-bold tracking-tight flex items-center">
          <span className="mr-2">📦</span>
          <span className="metallic-text-gradient">ShipLog</span>
        </Link>
        <div className="flex items-center gap-2">
          {showAuthButtons ? (
            <>
              <Link href="/login" className="chrome-pill-button text-xs !px-3 !py-2">Login</Link>
              <Link href="/signup" className="btn-lime text-xs !px-3 !py-2">Start Free</Link>
            </>
          ) : (
            <>
              {label && <span className="text-xs text-foreground-secondary hidden sm:inline">{label}</span>}
              {profile?.username && (
                <Link
                  href={`/u/${profile.username}`}
                  className="chrome-pill-button text-xs !px-3 !py-2"
                >
                  Public profile
                </Link>
              )}
              <Link href="/settings" className="chrome-pill-button text-xs !px-3 !py-2">Settings</Link>
              <button
                onClick={onLogout}
                className="chrome-pill-button text-xs !px-3 !py-2"
              >
                Logout
              </button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
