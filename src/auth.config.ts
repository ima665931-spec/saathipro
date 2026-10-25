import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config (no Prisma / bcrypt).
 * Used by middleware. Full providers + adapter live in auth.ts.
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;

      if (path === "/admin/login" || path.startsWith("/admin/login/")) {
        return true;
      }

      if (path === "/admin" || path.startsWith("/admin/")) {
        return !!auth;
      }

      const protectedPrefixes = [
        "/dashboard",
        "/bookings",
        "/pay",
        "/become-saathi",
        "/agent",
        "/book",
        "/chat",
        "/onboarding",
      ];

      const needsAuth = protectedPrefixes.some(
        (p) => path === p || path.startsWith(`${p}/`)
      );

      if (needsAuth) return !!auth;
      return true;
    },
  },
} satisfies NextAuthConfig;
