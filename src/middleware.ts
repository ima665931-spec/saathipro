import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PROTECTED = [
  "/dashboard",
  "/bookings",
  "/pay",
  "/become-saathi",
  "/agent",
  "/book",
];

export default auth((req) => {
  const path = req.nextUrl.pathname;

  // Admin login is separate; only gate /admin root (not /admin/login)
  if (path === "/admin" || path.startsWith("/admin/")) {
    if (path.startsWith("/admin/login")) {
      return NextResponse.next();
    }
    if (!req.auth) {
      const url = new URL("/admin/login", req.nextUrl.origin);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const needsAuth = PROTECTED.some(
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
    "/dashboard/:path*",
    "/bookings/:path*",
    "/pay/:path*",
    "/become-saathi/:path*",
    "/agent/:path*",
    "/book/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
