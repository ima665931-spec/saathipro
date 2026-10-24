/** Agent commissions & invite types */

export const DEFAULT_COMMISSION_PCT = 50;

/** When invited friend becomes agent (KYC approved) */
export const AGENT_KYC_BONUS = 49;

/** Parent agent gets this % of sub-agent commission earnings */
export const SUB_AGENT_SHARE_PCT = 10;

/** Milestone: N successful plan buyers → bonus ₹ */
export const MILESTONE_REFS = 3;
export const MILESTONE_BONUS = 69;

export const MIN_CASHOUT = 100;

export type InviteType = "agent" | "seeker" | "provider";

export function isInviteType(v: unknown): v is InviteType {
  return v === "agent" || v === "seeker" || v === "provider";
}

export function commissionAmount(planPrice: number, pct = DEFAULT_COMMISSION_PCT): number {
  return Math.round((planPrice * pct) / 100);
}

export function subAgentShare(commissionEarned: number): number {
  return Math.round((commissionEarned * SUB_AGENT_SHARE_PCT) / 100);
}

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

export function buildInviteLinks(origin: string, code: string) {
  const base = origin.replace(/\/$/, "");
  return {
    seeker: `${base}/register?ref=${code}&type=seeker`,
    provider: `${base}/register?ref=${code}&type=provider`,
    agent: `${base}/agent?ref=${code}&type=agent`,
    registerAgent: `${base}/register?ref=${code}&type=agent`,
  };
}

export function isValidUpi(upi: string): boolean {
  return /^[\w.\-]+@[\w.\-]+$/.test(upi.trim());
}

export function isValidAadhaar(aadhaar: string): boolean {
  const d = aadhaar.replace(/\s/g, "");
  return /^\d{12}$/.test(d);
}

export function isValidPhone(phone: string): boolean {
  const d = phone.replace(/\D/g, "");
  return d.length === 10 || (d.length === 12 && d.startsWith("91"));
}
