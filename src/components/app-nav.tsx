"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/log-entry", label: "Log Entry" },
  { href: "/trends", label: "Trends" },
  { href: "/report", label: "Report" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 mb-8">
      <div className="rounded-[28px] border border-white/70 bg-white/80 px-4 py-3 shadow-[0_18px_40px_rgba(148,163,184,0.16)] backdrop-blur-xl sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-cyan-300 to-blue-500 text-white shadow-[0_14px_28px_rgba(56,189,248,0.28)] transition-transform duration-200 group-hover:scale-105">
              <div className="relative h-4 w-6">
                <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-white/60" />
                <span className="absolute left-0 top-1/2 h-0.5 w-6 -translate-y-1/2 bg-white [clip-path:polygon(0_50%,18%_50%,28%_10%,42%_86%,56%_34%,68%_50%,100%_50%,100%_66%,64%_66%,54%_98%,38%_22%,24%_66%,0_66%)]" />
              </div>
            </div>
            <div>
              <p className="brand-wordmark text-xl font-semibold text-slate-900">
                dia<span className="brand-beat font-bold">BEAT</span>es
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700/80">
                Personal Glucose Companion
              </p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === item.href
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-sky-500 text-white shadow-[0_12px_24px_rgba(14,165,233,0.28)]"
                      : "text-slate-600 hover:bg-sky-50 hover:text-sky-700"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
