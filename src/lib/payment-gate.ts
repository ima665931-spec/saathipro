import { prisma } from "@/lib/prisma";

/**
 * ₹499 is a Saathi listing / onboarding fee — NOT required to book as a client.
 * Use this before activating a Saathi profile publicly.
 */
export async function requireSaathiPayment(email: string): Promise<
  | {
      ok: true;
      user: { id: string; email: string; role: string; paymentStatus: string };
    }
  | {
      ok: false;
      status: number;
      error: string;
      code: "UNAUTHORIZED" | "NOT_FOUND" | "PAYMENT_REQUIRED" | "PENDING" | "BANNED";
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
      error: "Saathi fee under review. Listing goes live after admin approval.",
      code: "PENDING",
    };
  }

  return {
    ok: false,
    status: 402,
    error: "Pay ₹499 Saathi listing fee to go live on Find.",
    code: "PAYMENT_REQUIRED",
  };
}
