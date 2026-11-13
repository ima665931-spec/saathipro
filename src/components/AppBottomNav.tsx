"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const items = [
  { href: "/dashboard", label: "Home", match: (p: string) => p === "/dashboard" || p === "/app" },
  { href: "/find", label: "Find", match: (p: string) => p.startsWith("/find") || p.startsWith("/saathi") },
  { href: "/bookings", label: "Bookings", match: (p: string) => p.startsWith("/bookings") || p.startsWith("/chat") || p.startsWith("/book") },
  { href: "/become-saathi", label: "Earn", match: (p: string) => p.startsWith("/become-saathi") },
  { href: "/pricing", label: "Plan", match: (p: string) => p.startsWith("/pricing") || p.startsWith("/pay") },
];

export default function AppBottomNav() {
  const pathname = usePathname() || "/";
  const { status } = useSession();

  // Only for signed-in product screens — not auth, admin, agent, marketing
  const hide =
    status !== "authenticated" ||
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/agent") ||
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/safety";

  if (hide) return null;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-white/95 backdrop-blur safe-bottom md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="max-w-lg mx-auto flex items-stretch justify-between px-1 pt-1.5">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl text-[10px] font-semibold transition ${
                active ? "text-accent" : "text-ink-muted"
              }`}
            >
              <span
                className={`w-8 h-1 rounded-full mb-0.5 ${
                  active ? "bg-brand-gradient" : "bg-transparent"
                }`}
              />
              <span className={active ? "text-brand-gradient font-bold" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
