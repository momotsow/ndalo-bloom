import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { loadPublicConfig } from "@/config/public";
import "./globals.css";

// metadataBase makes canonical + Open Graph URLs resolve to ABSOLUTE URLs. It is driven
// by NEXT_PUBLIC_APP_URL (validated in config; defaults to http://localhost:3000). Never
// a hardcoded production URL — the deployment supplies the real value via env.
export const metadata: Metadata = {
  metadataBase: new URL(loadPublicConfig().NEXT_PUBLIC_APP_URL),
  title: {
    default: "Ndalo Bloom",
    template: "%s · Ndalo Bloom",
  },
  description: "Make time for you. Luxury self-care rituals.",
};

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
