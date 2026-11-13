"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

type NavKey = "home" | "find" | "bookings" | "earn" | "plan";

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
    href: "/become-saathi",
    label: "Earn",
    key: "earn",
    match: (p) => p.startsWith("/become-saathi"),
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
  const fill = active ? "#7c3aed" : "none";
  const common = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
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
    case "earn":
      return (
        <svg {...common}>
          <path
            d="M12 3v18M16.5 7.5c0-1.5-1.8-2.5-4.5-2.5S7.5 6 7.5 7.8c0 1.7 1.4 2.4 4.5 3.2s4.5 1.7 4.5 3.5c0 2-1.9 3-4.5 3s-4.5-1-4.5-2.8"
            fill={active ? "rgba(124,58,237,0.08)" : "none"}
          />
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

/**
 * Flutter-style Material 3 NavigationBar:
 * floating surface, pill indicator behind selected icon, label under icon.
 */
export default function AppBottomNav() {
  const pathname = usePathname() || "/";
  const { status } = useSession();

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
      className="fixed bottom-0 inset-x-0 z-50 pointer-events-none md:hidden"
      style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
      aria-label="Main"
    >
      <div className="pointer-events-auto mx-auto max-w-md px-3 pb-1">
        <div
          className="flex items-center justify-between rounded-[28px] bg-white px-1.5 py-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.12)] ring-1 ring-black/5"
          style={{
            /* Flutter Material elevation-ish */
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(124,58,237,0.12), 0 2px 6px rgba(0,0,0,0.06)",
          }}
        >
          {items.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 transition-transform active:scale-95"
              >
                {/* Material 3 indicator pill */}
                <span
                  className={`flex h-8 w-[56px] items-center justify-center rounded-full transition-all duration-200 ${
                    active
                      ? "bg-violet-100 scale-100"
                      : "bg-transparent scale-95"
                  }`}
                >
                  <NavIcon name={item.key} active={active} />
                </span>
                <span
                  className={`text-[11px] leading-none tracking-wide transition-colors ${
                    active
                      ? "font-bold text-violet-700"
                      : "font-medium text-gray-400"
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
