import Link from "next/link";

const sections = [
  {
    title: "Overview",
    body: "ShipLog is a free build journal tool.",
  },
  {
    title: "Authentication",
    body:
      "We use Google OAuth for authentication. We store your email and display name.",
  },
  {
    title: "Data Storage",
    body: "We store your log entries in our database using Supabase.",
  },
  {
    title: "Visibility",
    body:
      "Public entries are visible on your public profile. Private entries are only visible to you.",
  },
  {
    title: "Tracking",
    body: "We use no analytics or tracking cookies.",
  },
  {
    title: "Data Use",
    body: "We do not sell your data.",
  },
  {
    title: "Contact",
    body: "Contact: jayesh@jayeshbetala.com",
  },
];

export default function PrivacyPage() {
  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-2xl px-6 pt-24">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="text-lg font-bold">ShipLog</span>
          <span className="text-sm text-foreground-secondary">Privacy Policy</span>
        </Link>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-lg font-bold">{section.title}</h2>
              <p className="text-sm text-foreground-secondary">{section.body}</p>
            </section>
          ))}
        </div>

        <p className="mt-12 text-xs text-foreground-secondary">
          © {year} ShipLog. All rights reserved.
        </p>
      </div>
    </main>
  );
}
