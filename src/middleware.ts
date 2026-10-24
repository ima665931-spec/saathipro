import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/bookings",
  "/pay",
  "/become-saathi",
  "/agent",
  "/book",
];

export default auth((req) => {
  const path = req.nextUrl.pathname;

  // Admin: protect everything except /admin/login
  if (path === "/admin" || path.startsWith("/admin/")) {
    if (path === "/admin/login" || path.startsWith("/admin/login/")) {
      return NextResponse.next();
    }
    if (!req.auth) {
      return NextResponse.redirect(new URL("/admin/login", req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );

  if (needsAuth && !req.auth) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", path + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/bookings",
    "/bookings/:path*",
    "/pay",
    "/pay/:path*",
    "/become-saathi",
    "/become-saathi/:path*",
    "/agent",
    "/agent/:path*",
    "/book",
    "/book/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
