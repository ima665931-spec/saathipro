/** Default agent commission on membership plan price */
export const DEFAULT_COMMISSION_PCT = 20;

export function commissionAmount(planPrice: number, pct = DEFAULT_COMMISSION_PCT): number {
  return Math.round((planPrice * pct) / 100);
}

/** Generate short unique-ish referral code e.g. RAHUL7X */
export function generateReferralCode(name?: string | null): string {
  const base = (name || "AGT")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 5)
    .toUpperCase() || "AGT";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${suffix}`;
}

export function normalizeRefCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
}
