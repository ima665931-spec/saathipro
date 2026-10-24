import { prisma } from "@/lib/prisma";

/**
 * One-time ₹499 registration fee for every member
 * (clients who book + Saathis who list).
 */
export async function requirePaidAccess(email: string): Promise<
  | {
      ok: true;
      user: { id: string; email: string; role: string; paymentStatus: string };
    }
  | {
      ok: false;
      status: number;
      error: string;
      code:
        | "UNAUTHORIZED"
        | "NOT_FOUND"
        | "PAYMENT_REQUIRED"
        | "PENDING"
        | "BANNED";
    }
> {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (!user) {
    return { ok: false, status: 404, error: "User not found", code: "NOT_FOUND" };
  }

  if (user.isBanned) {
    return {
      ok: false,
      status: 403,
      error: "Account suspended",
      code: "BANNED",
    };
  }

  if (user.role === "ADMIN") {
    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        paymentStatus: user.paymentStatus,
      },
    };
  }

  if (user.paymentStatus === "VERIFIED") {
    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        paymentStatus: user.paymentStatus,
      },
    };
  }

  if (user.paymentStatus === "PENDING") {
    return {
      ok: false,
      status: 402,
      error: "Payment under review. Access unlocks after admin approval.",
      code: "PENDING",
    };
  }

  return {
    ok: false,
    status: 402,
    error: "Pay ₹499 registration fee to unlock booking & listing.",
    code: "PAYMENT_REQUIRED",
  };
}
