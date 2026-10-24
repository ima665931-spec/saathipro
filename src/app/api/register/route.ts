import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeRefCode, isInviteType } from "@/lib/referral";
import { generateRegistrationId } from "@/lib/ids";

async function uniquePublicId(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const id = generateRegistrationId();
    const clash = await prisma.user.findUnique({ where: { publicId: id } });
    if (!clash) return id;
  }
  return generateRegistrationId() + Date.now().toString(36).slice(-2).toUpperCase();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, ref, type } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    let referredById: string | null = null;

    if (ref && typeof ref === "string") {
      const code = normalizeRefCode(ref);
      if (code) {
        // Agent code OR any user's Registration ID (user referral)
        const referrer = await prisma.user.findFirst({
          where: {
            isBanned: false,
            OR: [
              { referralCode: { equals: code, mode: "insensitive" } },
              { publicId: { equals: code, mode: "insensitive" } },
            ],
          },
          select: { id: true },
        });
        if (referrer) referredById = referrer.id;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const publicId = await uniquePublicId();

    const user = await prisma.user.create({
      data: {
        name,
        email: String(email).trim().toLowerCase(),
        password: hashedPassword,
        role: "USER",
        publicId,
        referredById,
        referredAs: referredById ? (isInviteType(type) ? type : "seeker") : null,
      },
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          publicId: user.publicId,
          name: user.name,
          email: user.email,
          referred: !!referredById,
          referredAs: user.referredAs,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
