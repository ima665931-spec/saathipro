"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import BrandLogo from "@/components/BrandLogo";

const TITLES: { test: (p: string) => boolean; title: string; back?: string }[] = [
  { test: (p) => p === "/dashboard" || p === "/app", title: "Home" },
  { test: (p) => p.startsWith("/find"), title: "Find Saathi" },
  { test: (p) => p.startsWith("/saathi/"), title: "Saathi", back: "/find" },
  { test: (p) => p.startsWith("/bookings"), title: "Bookings" },
  { test: (p) => p.startsWith("/book"), title: "Book", back: "/find" },
  { test: (p) => p.startsWith("/chat"), title: "Chat", back: "/bookings" },
  { test: (p) => p.startsWith("/become-saathi"), title: "Earn" },
  { test: (p) => p.startsWith("/pricing"), title: "Your plan" },
  { test: (p) => p.startsWith("/pay"), title: "Payment", back: "/pricing" },
  { test: (p) => p.startsWith("/onboarding"), title: "Setup" },
];

function titleFor(pathname: string) {
  return TITLES.find((t) => t.test(pathname));
}

export default function AppTopBar() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { data: session } = useSession();
  const meta = titleFor(pathname);
  const title = meta?.title || "SaathiPro";
  const back = meta?.back;
  const name = session?.user?.name?.split(" ")[0] || "You";
  const initial = (name[0] || "S").toUpperCase();

  return (
    <header
      className="sticky top-0 z-40 md:hidden border-b border-black/5 bg-white/90 backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="h-14 px-3 flex items-center gap-2 max-w-lg mx-auto">
        {back ? (
          <button
            type="button"
            onClick={() => router.push(back)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-violet-700 active:bg-violet-50"
            aria-label="Back"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        ) : (
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <BrandLogo size="sm" />
          </Link>
        )}

        <div className="flex-1 min-w-0 text-center">
          <h1 className="text-[17px] font-bold text-ink truncate tracking-tight">{title}</h1>
        </div>

        <div className="relative group">
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-brand-gradient text-white text-sm font-bold flex items-center justify-center shadow-sm"
            aria-label="Account"
            id="app-account-btn"
            onClick={() => {
              const el = document.getElementById("app-account-menu");
              if (el) el.classList.toggle("hidden");
            }}
          >
            {initial}
          </button>
          <div
            id="app-account-menu"
            className="hidden absolute right-0 mt-2 w-44 rounded-2xl bg-white shadow-lg ring-1 ring-black/5 py-2 z-50"
          >
            <p className="px-3 py-1 text-xs text-ink-muted truncate">{session?.user?.email}</p>
            <Link
              href="/dashboard"
              className="block px-3 py-2 text-sm font-medium text-ink hover:bg-violet-50"
              onClick={() => document.getElementById("app-account-menu")?.classList.add("hidden")}
            >
              Home
            </Link>
            <Link
              href="/pricing"
              className="block px-3 py-2 text-sm font-medium text-ink hover:bg-violet-50"
              onClick={() => document.getElementById("app-account-menu")?.classList.add("hidden")}
            >
              Plan
            </Link>
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
