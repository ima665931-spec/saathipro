"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

type NavKey = "home" | "find" | "bookings" | "invite" | "plan";

const items: {
  href: string;
  label: string;
  key: NavKey;
  match: (p: string) => boolean;
}[] = [
  {
    href: "/dashboard",
    label: "Home",
    key: "home",
    match: (p) => p === "/dashboard" || p === "/app",
  },
  {
    href: "/find",
    label: "Find",
    key: "find",
    match: (p) => p.startsWith("/find") || p.startsWith("/saathi"),
  },
  {
    href: "/bookings",
    label: "Bookings",
    key: "bookings",
    match: (p) =>
      p.startsWith("/bookings") || p.startsWith("/chat") || p.startsWith("/book"),
  },
  {
    href: "/invite",
    label: "Invite",
    key: "invite",
    match: (p) => p.startsWith("/invite"),
  },
  {
    href: "/pricing",
    label: "Plan",
    key: "plan",
    match: (p) => p.startsWith("/pricing") || p.startsWith("/pay"),
  },
];

function NavIcon({ name, active }: { name: NavKey; active: boolean }) {
  const stroke = active ? "#7c3aed" : "#9ca3af";
  const common = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke,
    strokeWidth: active ? 2.25 : 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path
            d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"
            fill={active ? "rgba(124,58,237,0.12)" : "none"}
          />
        </svg>
      );
    case "find":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" fill={active ? "rgba(124,58,237,0.12)" : "none"} />
          <path d="M16.5 16.5 20 20" />
        </svg>
      );
    case "bookings":
      return (
        <svg {...common}>
          <rect
            x="4"
            y="5"
            width="16"
            height="15"
            rx="2"
            fill={active ? "rgba(124,58,237,0.12)" : "none"}
          />
          <path d="M8 3v4M16 3v4M4 10h16" />
        </svg>
      );
    case "invite":
      return (
        <svg {...common}>
          <path
            d="M16 11a3 3 0 1 0-3-3M8 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
            fill={active ? "rgba(124,58,237,0.12)" : "none"}
          />
          <path d="M4 20v-1a4 4 0 0 1 4-4h2M15 14h2a4 4 0 0 1 3.5 2" />
        </svg>
      );
    case "plan":
      return (
        <svg {...common}>
          <rect
            x="3"
            y="6"
            width="18"
            height="12"
            rx="2.5"
            fill={active ? "rgba(124,58,237,0.12)" : "none"}
          />
          <path d="M3 10h18" />
          <circle cx="8" cy="14" r="1" fill={stroke} stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AppBottomNav() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  useEffect(() => {
    items.forEach((item) => {
      try {
        router.prefetch(item.href);
      } catch {
        /* ignore */
      }
    });
  }, [router]);

  const go = useCallback(
    (href: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      if (href === pathname || (pendingHref === href && isPending)) return;
      setPendingHref(href);
      startTransition(() => {
        router.push(href);
      });
    },
    [pathname, pendingHref, isPending, router]
  );

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 pointer-events-none md:hidden"
      style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
      aria-label="Main"
    >
      <div className="pointer-events-auto mx-auto max-w-md px-3 pb-1">
        <div
          className="flex items-center justify-between rounded-[28px] bg-white px-1.5 py-1.5 ring-1 ring-black/5"
          style={{
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(124,58,237,0.12), 0 2px 6px rgba(0,0,0,0.06)",
          }}
        >
          {items.map((item) => {
            const active =
              pendingHref != null ? pendingHref === item.href : item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onClick={go(item.href)}
                className="relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 select-none touch-manipulation"
              >
                <span
                  className={`flex h-8 w-[56px] items-center justify-center rounded-full transition-colors duration-150 ${
                    active ? "bg-violet-100" : "bg-transparent"
                  }`}
                >
                  <NavIcon name={item.key} active={!!active} />
                </span>
                <span
                  className={`text-[11px] leading-none tracking-wide ${
                    active ? "font-bold text-violet-700" : "font-medium text-gray-400"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
