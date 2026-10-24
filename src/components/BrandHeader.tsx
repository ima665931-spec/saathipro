"use client";

import Link from "next/link";

type Props = {
  active?: "home" | "find" | "bookings" | "dashboard" | "become" | "admin";
  right?: React.ReactNode;
  dark?: boolean;
};

export default function BrandHeader({ active, right, dark }: Props) {
  const link = (href: string, key: string, label: string) => (
    <Link
      href={href}
      className={`text-sm font-medium transition ${
        active === key
          ? "text-accent font-semibold"
          : dark
          ? "text-white/80 hover:text-white"
          : "text-ink-muted hover:text-accent"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header
      className={`sticky top-0 z-50 border-b shadow-sm ${
        dark
          ? "bg-brand-gradient border-transparent text-white"
          : "bg-white/90 backdrop-blur border-border"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-display font-bold text-sm ${
                dark
                  ? "bg-white/20 text-white"
                  : "bg-brand-gradient text-white shadow-glow"
              }`}
            >
              S
            </div>
            <span
              className={`font-display text-lg font-bold tracking-tight ${
                dark ? "text-white" : "text-ink"
              }`}
            >
              Saathi
              <span className={dark ? "text-white/90" : "text-pink"}>Pro</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {link("/find", "find", "Find Saathi")}
            {link("/bookings", "bookings", "Bookings")}
            {link("/dashboard", "dashboard", "Dashboard")}
            {link("/become-saathi", "become", "Become Saathi")}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {right ?? (
              <>
                <Link
                  href="/login"
                  className={`text-sm font-semibold px-2 ${
                    dark ? "text-white/90" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className={
                    dark
                      ? "px-4 py-2 bg-white text-accent text-sm font-bold rounded-full"
                      : "btn-brand px-4 py-2 text-sm rounded-full"
                  }
                >
                  Join
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
