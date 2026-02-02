import Link from "next/link";

const TERMS = [
  {
    title: "Service basics",
    body: "ShipLog is provided as-is and free of charge.",
  },
  {
    title: "Your responsibility",
    body: "You are responsible for the content you post.",
  },
  {
    title: "Public visibility",
    body: "Public entries may be visible to other users.",
  },
  {
    title: "Content moderation",
    body: "We reserve the right to remove content that violates our guidelines.",
  },
  {
    title: "Changes",
    body: "We may update these terms at any time.",
  },
  {
    title: "Availability",
    body: "No warranty or guarantee of uptime.",
  },
  {
    title: "Contact",
    body: "Contact: jayesh@jayeshbetala.com",
  },
];

export default function TermsPage() {
  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-6 pb-16 pt-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-foreground"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground text-background">
            SL
          </span>
          <span>ShipLog</span>
        </Link>

        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Terms of Service</h1>
          <p className="text-sm text-foreground-secondary">
            These terms describe how ShipLog works and what we expect from anyone
            using the service.
          </p>
        </div>

        <div className="space-y-8">
          {TERMS.map((item) => (
            <section key={item.title} className="space-y-2">
              <h2 className="text-lg font-bold text-foreground">{item.title}</h2>
              <p className="text-sm text-foreground-secondary">{item.body}</p>
            </section>
          ))}
        </div>

        <p className="text-xs text-foreground-secondary">
          Copyright {year} ShipLog. All rights reserved.
        </p>
      </div>
    </main>
  );
}
