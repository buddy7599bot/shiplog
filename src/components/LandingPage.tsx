"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
/* ─── Particle Canvas ─── */
function ParticleHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; color: string }[] = [];

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    resize();
    window.addEventListener("resize", resize);

    const colors = ["#A3E635", "#84CC16", "#65A30D", "#BEF264"];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    function animate() {
      if (!canvas || !ctx) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const p of particles) {
        // Mouse repulsion
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && dist > 0) {
          const force = (120 - dist) / 120 * 0.5;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        // Damping
        p.vx *= 0.98;
        p.vy *= 0.98;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      }

      // Draw connections
      ctx.globalAlpha = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(163, 230, 53, ${0.1 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(animate);
    }

    animate();

    function handleMouse(e: MouseEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    canvas.addEventListener("mousemove", handleMouse);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ opacity: 0.6 }}
    />
  );
}

/* ─── Scroll Reveal ─── */
function ScrollReveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${visible ? "revealed" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─── Tilt Card ─── */
function TiltCard({ children, className = "", ...rest }: { children: React.ReactNode; className?: string; [key: string]: unknown }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouse = useCallback((e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`;
  }, []);

  const handleLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "perspective(600px) rotateY(0deg) rotateX(0deg) scale(1)";
  }, []);

  return (
    <div
      ref={cardRef}
      className={`tilt-card ${className}`}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ─── Demo Categories ─── */
const CATEGORIES: Record<string, { label: string; color: string }> = {
  build: { label: "Build", color: "#84CC16" },
  launch: { label: "Launch", color: "#F43F5E" },
  metric: { label: "Metric", color: "#3B82F6" },
  win: { label: "Win", color: "#F59E0B" },
  learn: { label: "Learn", color: "#8B5CF6" },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  build: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  launch: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  metric: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  learn: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>,
  win: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
};


/* ─── Interactive Playground ─── */
function DemoPlayground() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayIndex = (new Date().getDay() + 6) % 7;
  const threeDaysAgo = days[(todayIndex - 3 + 7) % 7];
  const twoDaysAgo = days[(todayIndex - 2 + 7) % 7];
  const yesterday = days[(todayIndex - 1 + 7) % 7];
  const today = days[todayIndex];
  const [entries, setEntries] = useState<{ id: number; text: string; category: string; time: string; day: string }[]>([
    { id: 0, text: "Refactored auth flow, 40% faster login", category: "build", time: "3d ago", day: threeDaysAgo },
    { id: 1, text: "Pushed v2.1 to production", category: "launch", time: "3d ago", day: threeDaysAgo },
    { id: 2, text: "Hit 1,000 users milestone", category: "win", time: "2d ago", day: twoDaysAgo },
    { id: 3, text: "Learned about edge caching strategies", category: "learn", time: "yesterday", day: yesterday },
    { id: 4, text: "MRR grew 15% week over week", category: "metric", time: "just now", day: today },
  ]);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("build");
  const [nextId, setNextId] = useState(5);
  const dayCounts = days.reduce<Record<string, number>>((acc, day) => {
    acc[day] = 0;
    return acc;
  }, {});
  entries.forEach((entry) => {
    if (dayCounts[entry.day] !== undefined) {
      dayCounts[entry.day] += 1;
    }
  });
  const maxCount = Math.max(0, ...Object.values(dayCounts));
  const bars = days.map((day) => (maxCount === 0 ? 0 : (dayCounts[day] / maxCount) * 100));

  const PLACEHOLDERS: Record<string, string> = {
    build: "What did you build today?",
    launch: "What did you launch today?",
    metric: "What metric moved today?",
    learn: "What did you learn today?",
    win: "What's your win today?",
  };

  const addEntry = () => {
    if (!text.trim()) return;
    const todayIndex = (new Date().getDay() + 6) % 7;
    const todayDay = days[todayIndex];
    setEntries((prev) => [
      { id: nextId, text: text.trim(), category, time: "just now", day: todayDay },
      ...prev.map((e) => ({ ...e, time: e.time === "just now" ? "a moment ago" : e.time })),
    ]);
    setNextId((n) => n + 1);
    setText("");
  };

  return (
    <div className="sl-playground">
      {/* Weekly Chart */}
      <div className="mt-6 mb-4">
        <div className="mock-bar-chart" style={{ height: "48px" }}>
          {bars.map((height, index) => (
            <div key={days[index]} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div
                className="mock-bar w-full"
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-foreground-secondary mt-2 px-1">
          {days.map((day) => <span key={day}>{day}</span>)}
        </div>
      </div>

      <div className="sl-playground-input">
        <div className="flex gap-2 mb-3 flex-wrap">
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`sl-cat-btn ${category === key ? "active" : ""}`}
              data-category={key}
            >
              {CATEGORY_ICONS[key]} {cat.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEntry()}
            placeholder={PLACEHOLDERS[category]}
            className="sl-demo-input"
          />
          <button onClick={addEntry} className="sl-demo-submit">
            Log it
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="sl-demo-timeline mt-4">
        {entries.slice(0, 5).map((entry) => (
          <div
            key={entry.id}
            className="rounded-lg p-3 flex items-start gap-3"
            style={{ background: "rgba(255,255,255,0.02)", borderLeft: `3px solid ${CATEGORIES[entry.category].color}` }}
          >
            <div className="text-lg text-foreground-secondary">{CATEGORY_ICONS[entry.category]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{entry.text}</p>
              <p className="text-xs text-foreground-secondary mt-1">{entry.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Mock Dashboard (hero right side) ─── */
function MockDashboard() {
  const bars = [65, 40, 80, 55, 90, 45, 70];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="macos-window glow-lime float-animation">
      <div className="macos-titlebar">
        <div className="macos-dot macos-dot-red" />
        <div className="macos-dot macos-dot-yellow" />
        <div className="macos-dot macos-dot-green" />
        <span className="macos-titlebar-text">ShipLog</span>
      </div>
      <div className="macos-body space-y-4">
        <div className="flex items-center gap-2 text-lg font-bold">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#F97316" stroke="none" className="flex-shrink-0"><path d="M12 23c-3.866 0-7-2.239-7-5 0-2.485 1.63-4.378 3.304-5.902.88-.8 1.762-1.52 2.45-2.248C11.86 8.684 12.5 7.5 12.5 6c0 0 1 2.5 1 4.5 0 .834-.247 1.505-.59 2.063-.345.558-.799 1.04-1.206 1.49-.768.854-1.373 1.63-1.373 2.947 0 1.657 1.343 3 3 3s3-1.343 3-3c0-1.78-.912-3.244-1.842-4.486-.478-.638-.975-1.232-1.389-1.855C12.69 10.04 12.5 9.314 12.5 8.5c0 0 3.5 2.5 5.5 5.5.667 1 1 2.167 1 3 0 2.761-3.134 5-7 5z"/></svg>
          <span className="gradient-fade-text">12 day streak</span>
        </div>
        <div className="mock-bar-chart">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div className="mock-bar w-full" style={{ height: `${h}%` }}>
                <span className="sr-only">{days[i]}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-foreground-secondary px-1">
          {days.map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="space-y-2">
          <div
            className="rounded-lg p-3 flex items-start gap-3"
            style={{ background: "rgba(255,255,255,0.02)", borderLeft: `3px solid ${CATEGORIES.build.color}` }}
          >
            <div className="text-lg text-foreground-secondary">{CATEGORY_ICONS.build}</div>
            <div>
              <p className="text-sm">Refactored auth flow, 40% faster</p>
              <p className="text-xs text-foreground-secondary mt-1">2h ago</p>
            </div>
          </div>
          <div
            className="rounded-lg p-3 flex items-start gap-3"
            style={{ background: "rgba(255,255,255,0.02)", borderLeft: `3px solid ${CATEGORIES.launch.color}` }}
          >
            <div className="text-lg text-foreground-secondary">{CATEGORY_ICONS.launch}</div>
            <div>
              <p className="text-sm">Pushed v2.1 to production</p>
              <p className="text-xs text-foreground-secondary mt-1">yesterday</p>
            </div>
          </div>
          <div
            className="rounded-lg p-3 flex items-start gap-3"
            style={{ background: "rgba(255,255,255,0.02)", borderLeft: `3px solid ${CATEGORIES.win.color}` }}
          >
            <div className="text-lg text-foreground-secondary">{CATEGORY_ICONS.win}</div>
            <div>
              <p className="text-sm">Hit 1,000 users milestone</p>
              <p className="text-xs text-foreground-secondary mt-1">2d ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Landing ─── */
export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* ─── Floating Navbar ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none pt-4 px-4">
        <nav className="sl-nav-floating pointer-events-auto">
          <div className="flex items-center justify-between w-full">
            <Link href="/" className="flex items-center gap-2 font-bold text-sm">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-lime-500 flex-shrink-0">
                <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15"/>
                <path d="M12 22V12" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 7l9 5 9-5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7.5 4.5L16.5 9.5" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span className="sl-logo-text">ShipLog</span>
            </Link>
            <div className="flex items-center gap-1">
              <button onClick={() => { import("@/lib/supabase").then(({ supabase }) => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/auth/callback" } })); }} className="sl-nav-btn-primary"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> Sign in</button>
            </div>
          </div>
        </nav>
      </header>

      {/* ─── Hero with Particles (Split Layout) ─── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <ParticleHero />
        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="hero-entrance">
              <div className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-8 bg-lime-500/10 text-lime-400 border border-lime-500/20">
                100% Free. Ship in public.
              </div>
            </div>
            <h1 className="hero-entrance text-5xl md:text-6xl font-extrabold leading-tight mb-5" style={{ animationDelay: "0.1s" }}>
              Your <span className="gradient-fade-text">build journal</span>
              <br />
              One entry at a time.
            </h1>
            <p className="hero-entrance text-xl text-foreground-secondary max-w-xl mb-8" style={{ animationDelay: "0.2s" }}>
              Log what you shipped. Keep your streak alive. Share the journey.
            </p>
            <div className="hero-entrance flex flex-wrap gap-3" style={{ animationDelay: "0.3s" }}>
              <button onClick={() => { import("@/lib/supabase").then(({ supabase }) => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/auth/callback" } })); }} className="sl-cta-primary">
                Start shipping
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          </div>
          <div className="hero-entrance hidden md:block" style={{ animationDelay: "0.4s" }}>
            <MockDashboard />
          </div>
        </div>
      </section>

      {/* ─── Interactive Playground ─── */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-2 text-center">Try it out</h2>
          <p className="text-center text-foreground-secondary mb-8">Log an entry. Watch your streak grow. No signup needed.</p>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <div className="macos-window glow-lime-subtle">
            <div className="macos-titlebar">
              <div className="macos-dot macos-dot-red" />
              <div className="macos-dot macos-dot-yellow" />
              <div className="macos-dot macos-dot-green" />
              <span className="macos-titlebar-text">Try it out</span>
            </div>
            <div className="macos-body">
              <DemoPlayground />
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ─── DashPane Cross-Promo ─── */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <ScrollReveal>
          <a href="https://dashpane.pro" target="_blank" rel="noopener noreferrer" className="block liquid-glass-card p-6 md:p-8 transition hover:scale-[1.01] hover:shadow-lg group">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <img src="/dashpane-logo.png" alt="DashPane" className="flex-shrink-0 w-14 h-14" />
              <div className="flex-1 text-center md:text-left">
                <p className="text-xs text-foreground-secondary mb-1">From the makers of ShipLog</p>
                <h3 className="text-lg font-bold text-foreground group-hover:text-lime-500 dark:group-hover:text-lime-400 transition">DashPane: Save ~71 hours/year switching apps on macOS</h3>
                <p className="text-sm text-foreground-secondary mt-1">Beautiful command palette for developers and power users.</p>
              </div>
              <div className="flex-shrink-0">
                <span className="inline-flex items-center gap-1 rounded-full border border-lime-500/30 bg-lime-500/10 px-4 py-2 text-sm font-medium text-lime-600 dark:text-lime-400 group-hover:bg-lime-500/20 transition">
                  Check it out &rarr;
                </span>
              </div>
            </div>
          </a>
        </ScrollReveal>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-foreground-secondary">
          <span>&copy; {new Date().getFullYear()} ShipLog</span>
          <span className="hidden sm:inline">&middot;</span>
          <a href="https://jayeshbetala.com" target="_blank" rel="noopener noreferrer" className="hover:text-lime-500 transition">Built by Jayesh Betala</a>
          <span className="hidden sm:inline">&middot;</span>
          <a href="https://dashpane.pro" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition">Try DashPane</a>
          <span className="hidden sm:inline">&middot;</span>
          <Link href="/privacy" className="hover:text-foreground transition">Privacy</Link>
          <span className="hidden sm:inline">&middot;</span>
          <Link href="/terms" className="hover:text-foreground transition">Terms</Link>
        </div>
      </footer>
    </div>
  );
}
