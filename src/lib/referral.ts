/** Default agent commission on membership plan price */
export const DEFAULT_COMMISSION_PCT = 50;

export const MIN_CASHOUT = 100;

export function commissionAmount(planPrice: number, pct = DEFAULT_COMMISSION_PCT): number {
  return Math.round((planPrice * pct) / 100);
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
