"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

/**
 * Installed PWA / APK only:
 * - Block pure marketing home
 * - Block admin ops panel
 * Do NOT touch product tabs (dashboard, find, bookings, pricing, become-saathi).
 */
export default function StandaloneRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isStandalone()) return;
    if (!pathname) return;

    // Marketing-only pages — NOT product routes used by bottom nav
    if (pathname === "/") {
      router.replace("/app");
      return;
    }

    // Legal pages can stay; optional soft bounce only for home was needed
    // Admin is ops-only
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      router.replace("/dashboard");
    }
  }, [pathname, router]);

  return null;
}
