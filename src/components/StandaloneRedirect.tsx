"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * When the site is opened as installed PWA / "Add to Home Screen",
 * force the product flow (never marketing landing).
 */
export default function StandaloneRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      ("standalone" in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone === true);

    if (!standalone) return;

    // Only bounce off marketing/public pages
    const marketing =
      pathname === "/" ||
      pathname === "/pricing" ||
      pathname === "/safety" ||
      pathname === "/terms" ||
      pathname === "/privacy";

    if (marketing) {
      router.replace("/app");
    }
  }, [pathname, router]);

  return null;
}
