import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeRefCode, isInviteType } from "@/lib/referral";
import { generateRegistrationId } from "@/lib/ids";
import { isAgentRole, agentBlockedMessage } from "@/lib/account-type";

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

    // Main app: no agent signup here
    if (type === "agent") {
      return NextResponse.json(
        {
          error:
            "Agent partners use a separate app. This app is only for seekers and providers.",
        },
        { status: 400 }
      );
    }

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

    const emailNorm = String(email).trim().toLowerCase();

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: emailNorm, mode: "insensitive" } },
    });

    if (existingUser) {
      if (isAgentRole(existingUser.role)) {
        return NextResponse.json({ error: agentBlockedMessage() }, { status: 400 });
      }
      return NextResponse.json(
        { error: "Email already registered. Sign in instead." },
        { status: 400 }
      );
    }

    let referredById: string | null = null;

    // Referral codes still work (agent or member publicId) — backend only, no agent UI
    if (ref && typeof ref === "string") {
      const code = normalizeRefCode(ref);
      if (code) {
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

    // Main app accounts are always USER (seeker). SAATHI role comes from become-saathi.
    const inviteAs =
      type === "provider" ? "provider" : type === "seeker" ? "seeker" : isInviteType(type) ? type : "seeker";

    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: emailNorm,
        password: hashedPassword,
        role: "USER",
        publicId,
        referredById,
        referredAs: referredById ? inviteAs : null,
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
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
