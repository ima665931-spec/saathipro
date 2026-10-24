import { prisma } from "@/lib/prisma";
import { hasActivePlan } from "@/lib/plans";

/**
 * Membership access: VERIFIED + plan not expired.
 */
export async function requirePaidAccess(email: string): Promise<
  | {
      ok: true;
      user: {
        id: string;
        email: string;
        role: string;
        paymentStatus: string;
        plan: string | null;
        planExpiresAt: Date | null;
      };
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
        | "EXPIRED"
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
        plan: user.plan,
        planExpiresAt: user.planExpiresAt,
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

  if (hasActivePlan(user)) {
    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        paymentStatus: user.paymentStatus,
        plan: user.plan,
        planExpiresAt: user.planExpiresAt,
      },
    };
  }

  if (user.paymentStatus === "VERIFIED" && user.planExpiresAt) {
    return {
      ok: false,
      status: 402,
      error: "Your plan expired. Renew to continue.",
      code: "EXPIRED",
    };
  }

  return {
    ok: false,
    status: 402,
    error: "Choose a membership plan to unlock booking & listing.",
    code: "PAYMENT_REQUIRED",
  };
}
