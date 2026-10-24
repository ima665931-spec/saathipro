import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

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
