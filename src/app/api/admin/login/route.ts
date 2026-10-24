import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Validates ADMIN_USERNAME + ADMIN_PASSWORD (Vercel env).
 * Ensures a DB user with role ADMIN + password exists so NextAuth credentials works.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body.username || body.email || "").trim();
    const password = String(body.password || "");

    const adminUser =
      process.env.ADMIN_USERNAME?.trim() ||
      process.env.ADMIN_USER?.trim() ||
      "";
    const adminPass =
      process.env.ADMIN_PASSWORD?.trim() ||
      process.env.ADMIN_PASS?.trim() ||
      "";

    if (!adminUser || !adminPass) {
      return NextResponse.json(
        {
          error:
            "ADMIN_USERNAME and ADMIN_PASSWORD not set in Vercel. Add them and redeploy.",
        },
        { status: 503 }
      );
    }

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }

    const userMatch =
      username.toLowerCase() === adminUser.toLowerCase() ||
      username.toLowerCase() === adminUser.toLowerCase().replace(/\s/g, "");

    if (!userMatch || password !== adminPass) {
      return NextResponse.json(
        { error: "Invalid admin username or password" },
        { status: 401 }
      );
    }

    // Login identity for NextAuth credentials (must be an email-shaped id)
    const adminEmail =
      process.env.ADMIN_EMAILS?.split(/[,;]/)[0]?.trim().toLowerCase() ||
      process.env.ADMIN_EMAIL?.trim().toLowerCase() ||
      (adminUser.includes("@") ? adminUser.toLowerCase() : `admin@saathipro.local`);

    const hashed = await bcrypt.hash(adminPass, 12);

    let user = await prisma.user.findFirst({
      where: { email: { equals: adminEmail, mode: "insensitive" } },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: adminEmail,
          name: "Admin",
          password: hashed,
          role: "ADMIN",
          paymentStatus: "VERIFIED",
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashed,
          role: "ADMIN",
        },
      });
    }

    // Client will call signIn("credentials") with this email + ADMIN_PASSWORD
    return NextResponse.json({
      success: true,
      email: user.email,
      // password is the same ADMIN_PASSWORD they just typed — client signs in with it
    });
  } catch (err) {
    console.error("admin login:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
