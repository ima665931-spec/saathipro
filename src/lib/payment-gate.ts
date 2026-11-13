import { prisma } from "@/lib/prisma";
import { hasActivePlan } from "@/lib/plans";

export type PaidUser = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  paymentStatus: string;
  plan: string | null;
  planExpiresAt: Date | null;
};

function toPaidUser(user: {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  paymentStatus: string;
  plan: string | null;
  planExpiresAt: Date | null;
}): PaidUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    paymentStatus: user.paymentStatus,
    plan: user.plan,
    planExpiresAt: user.planExpiresAt,
  };
}

/**
 * Membership access: VERIFIED + plan not expired.
 */
export async function requirePaidAccess(email: string): Promise<
  | { ok: true; user: PaidUser }
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
    return { ok: true, user: toPaidUser(user) };
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
    return { ok: true, user: toPaidUser(user) };
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
