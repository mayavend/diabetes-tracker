import type { Metadata } from "next";
import { AppNav } from "@/components/app-nav";
import { EntriesProvider } from "@/components/entries-provider";
import { SupportEpisodesProvider } from "@/components/support-episodes-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "diaBEATes",
  description: "Track your glucose. Understand your patterns. Build healthier habits.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full text-slate-900">
        <EntriesProvider>
          <SupportEpisodesProvider>
            <div className="app-shell mx-auto min-h-full w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <AppNav />
              <main>{children}</main>
            </div>
          </SupportEpisodesProvider>
        </EntriesProvider>
      </body>
    </html>
  );
}
