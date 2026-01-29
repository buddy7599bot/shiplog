import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShipLog — Build in Public Dashboard",
  description: "Track your indie build journey. Log updates, see your streak, share your progress. Free.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
