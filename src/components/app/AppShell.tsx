"use client";

import { usePathname } from "next/navigation";
import AppTopBar from "@/components/app/AppTopBar";
import AppBottomNav from "@/components/AppBottomNav";

function isProductPath(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname === "/app" ||
    pathname.startsWith("/find") ||
    pathname.startsWith("/bookings") ||
    pathname.startsWith("/become-saathi") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/pay") ||
    pathname.startsWith("/saathi") ||
    pathname.startsWith("/book") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/onboarding")
  );
}

/**
 * Mobile app chrome for member product routes.
 * Marketing / auth / admin / agent render children only.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const product = isProductPath(pathname);

  if (!product) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-full flex flex-col bg-[#faf7f2]">
      <AppTopBar />
      <main
        className="flex-1 w-full max-w-lg mx-auto px-4 pt-3"
        style={{
          paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom))",
        }}
      >
        {children}
      </main>
      <AppBottomNav />
    </div>
  );
}
