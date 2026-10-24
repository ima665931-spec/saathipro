export type PlanId = "WEEKLY" | "MONTHLY" | "HALF_YEAR" | "YEARLY";

export type Plan = {
  id: PlanId;
  name: string;
  days: number;
  price: number;
  tagline: string;
  badge?: string;
  /** vs monthly effective rate, for marketing */
  saveLabel?: string;
};

export const PLANS: Plan[] = [
  {
    id: "WEEKLY",
    name: "Weekly",
    days: 7,
    price: 299,
    tagline: "Try the platform",
  },
  {
    id: "MONTHLY",
    name: "Monthly",
    days: 30,
    price: 499,
    tagline: "Most popular",
    badge: "Popular",
  },
  {
    id: "HALF_YEAR",
    name: "Half-year",
    days: 180,
    price: 999,
    tagline: "~₹167/mo",
    saveLabel: "Save ~67% vs monthly",
  },
  {
    id: "YEARLY",
    name: "Yearly",
    days: 365,
    price: 1499,
    tagline: "~₹125/mo · best value",
    badge: "Best value",
    saveLabel: "Save ~75% vs monthly",
  },
];

export function getPlan(id: string | null | undefined): Plan {
  const found = PLANS.find((p) => p.id === id);
  return found || PLANS.find((p) => p.id === "MONTHLY")!;
}

export function isValidPlanId(id: unknown): id is PlanId {
  return typeof id === "string" && PLANS.some((p) => p.id === id);
}

/** Extend from now or from current expiry (whichever later). */
export function computeExpiry(
  planId: PlanId,
  currentExpiry: Date | null | undefined
): Date {
  const plan = getPlan(planId);
  const base =
    currentExpiry && currentExpiry.getTime() > Date.now()
      ? currentExpiry
      : new Date();
  const end = new Date(base);
  end.setDate(end.getDate() + plan.days);
  return end;
}

export function hasActivePlan(user: {
  paymentStatus?: string | null;
  planExpiresAt?: Date | string | null;
}): boolean {
  if (user.paymentStatus !== "VERIFIED") return false;
  if (!user.planExpiresAt) return false;
  const exp =
    typeof user.planExpiresAt === "string"
      ? new Date(user.planExpiresAt)
      : user.planExpiresAt;
  return exp.getTime() > Date.now();
}
