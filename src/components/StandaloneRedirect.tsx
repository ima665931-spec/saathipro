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
 * Installed PWA / APK:
 * - never marketing site
 * - never admin ops panel (that is browser-only)
 */
export default function StandaloneRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isStandalone()) return;

    const marketing =
      pathname === "/" ||
      pathname === "/pricing" ||
      pathname === "/safety" ||
      pathname === "/terms" ||
      pathname === "/privacy";

    if (marketing) {
      router.replace("/app");
      return;
    }

    // Admin is ops-only — APK users must stay in member product
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      router.replace("/dashboard");
    }
  }, [pathname, router]);

  return null;
}
