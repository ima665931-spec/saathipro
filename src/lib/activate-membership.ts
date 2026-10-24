import { prisma } from "@/lib/prisma";
import { computeExpiry, isValidPlanId, type PlanId } from "@/lib/plans";
import { grantMembershipCommissions, applyPaymentCredit } from "@/lib/rewards";

/**
 * Idempotent membership activation after payment is confirmed
 * (Razorpay verify / webhook / admin approve).
 */
export async function activateMembershipPayment(paymentId: string): Promise<{
  ok: boolean;
  already?: boolean;
  plan?: PlanId;
  planExpiresAt?: Date;
  error?: string;
}> {
  const pay = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!pay) return { ok: false, error: "Payment not found" };
  if (pay.type === "AGENT_ENTRY") return { ok: false, error: "Not a membership payment" };

  if (pay.status === "APPROVED") {
    const user = await prisma.user.findUnique({ where: { id: pay.userId } });
    return {
      ok: true,
      already: true,
      plan: isValidPlanId(pay.plan) ? pay.plan : "MONTHLY",
      planExpiresAt: user?.planExpiresAt || undefined,
    };
  }

  const planId: PlanId = isValidPlanId(pay.plan) ? pay.plan : "MONTHLY";
  const user = await prisma.user.findUnique({ where: { id: pay.userId } });
  if (!user) return { ok: false, error: "User not found" };

  const expires = computeExpiry(planId, user.planExpiresAt);
  const planPriceForCommission = pay.amount + (pay.creditUsed || 0);

  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "APPROVED" },
  });

  await prisma.user.update({
    where: { id: pay.userId },
    data: {
      paymentStatus: "VERIFIED",
      plan: planId,
      planExpiresAt: expires,
    },
  });

  await prisma.saathiProfile.updateMany({
    where: { userId: pay.userId },
    data: { isActive: true },
  });

  try {
    await applyPaymentCredit(pay.id);
  } catch (e) {
    console.error("[activate] credit", e);
  }

  try {
    await grantMembershipCommissions({
      userId: pay.userId,
      paymentId: pay.id,
      amount: planPriceForCommission || pay.amount,
      planId,
    });
  } catch (e) {
    console.error("[activate] commissions", e);
  }

  return { ok: true, plan: planId, planExpiresAt: expires };
}
