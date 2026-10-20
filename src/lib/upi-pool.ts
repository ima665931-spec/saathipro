import { prisma } from "@/lib/prisma";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Reset usedToday if calendar day changed */
async function resetIfNeeded(
  pool: {
    id: string;
    usedToday: number;
    lastResetAt: Date;
  }
) {
  const today = startOfToday();
  if (pool.lastResetAt < today) {
    return prisma.upiPool.update({
      where: { id: pool.id },
      data: { usedToday: 0, lastResetAt: new Date() },
    });
  }
  return pool;
}

/**
 * Pick next available UPI: active, under daily limit, highest priority, least used.
 * Falls back to env NEXT_PUBLIC_UPI_ID if pool empty.
 */
export async function pickUpi() {
  const all = await prisma.upiPool.findMany({
    where: { isActive: true },
    orderBy: [{ priority: "desc" }, { usedToday: "asc" }],
  });

  for (const raw of all) {
    const p = await resetIfNeeded(raw);
    const limit = (raw as typeof raw & { dailyLimit: number }).dailyLimit;
    const used =
      "usedToday" in p ? (p as { usedToday: number }).usedToday : raw.usedToday;

    // re-fetch after possible reset
    const current = await prisma.upiPool.findUnique({ where: { id: raw.id } });
    if (!current || !current.isActive) continue;
    if (current.dailyLimit > 0 && current.usedToday >= current.dailyLimit) {
      continue;
    }

    return {
      id: current.id,
      upiId: current.upiId,
      displayName: current.displayName,
    };
  }

  // Env fallback
  const envId =
    process.env.NEXT_PUBLIC_UPI_ID || process.env.UPI_ID || "";
  const envName =
    process.env.NEXT_PUBLIC_UPI_NAME || process.env.UPI_NAME || "SaathiPro";

  if (envId) {
    return { id: null as string | null, upiId: envId, displayName: envName };
  }

  return null;
}

/** Increment usage after user is shown this UPI / submits payment */
export async function bumpUpiUsage(upiPoolId: string | null | undefined) {
  if (!upiPoolId) return;
  try {
    const current = await prisma.upiPool.findUnique({ where: { id: upiPoolId } });
    if (!current) return;
    await resetIfNeeded(current);
    await prisma.upiPool.update({
      where: { id: upiPoolId },
      data: { usedToday: { increment: 1 } },
    });
  } catch (e) {
    console.error("bumpUpiUsage", e);
  }
}
