import { prisma } from "@/lib/prisma";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function resetIfNeeded(pool: {
  id: string;
  usedToday: number;
  lastResetAt: Date;
  dailyLimit: number;
  isActive: boolean;
  upiId: string;
  displayName: string;
}) {
  const today = startOfToday();
  if (pool.lastResetAt < today) {
    return prisma.upiPool.update({
      where: { id: pool.id },
      data: { usedToday: 0, lastResetAt: new Date() },
    });
  }
  return pool;
}

export type PickedUpi = {
  id: string | null;
  upiId: string;
  displayName: string;
};

/**
 * Random UPI from active pool that is under daily limit.
 * Limit 0 = unlimited. Supports thousands of UPIs in pool.
 */
export async function pickUpi(): Promise<PickedUpi | null> {
  const all = await prisma.upiPool.findMany({
    where: { isActive: true },
  });

  const available: PickedUpi[] = [];

  for (const raw of all) {
    const current = await resetIfNeeded(raw);
    if (!current.isActive) continue;
    if (current.dailyLimit > 0 && current.usedToday >= current.dailyLimit) {
      continue;
    }
    available.push({
      id: current.id,
      upiId: current.upiId,
      displayName: current.displayName,
    });
  }

  if (available.length > 0) {
    const idx = Math.floor(Math.random() * available.length);
    return available[idx];
  }

  const envId = process.env.NEXT_PUBLIC_UPI_ID || process.env.UPI_ID || "";
  const envName =
    process.env.NEXT_PUBLIC_UPI_NAME || process.env.UPI_NAME || "SaathiPro";

  if (envId) {
    return { id: null, upiId: envId, displayName: envName };
  }

  return null;
}

export async function bumpUpiUsage(upiPoolId: string | null | undefined) {
  if (!upiPoolId) return;
  try {
    const current = await prisma.upiPool.findUnique({
      where: { id: upiPoolId },
    });
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
