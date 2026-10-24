/** Unique public IDs + strict digit validation (Phase 1) */

/** Registration ID for normal users — e.g. SP7K2M9A */
export function generateRegistrationId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "SP";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/** Agent ID — e.g. AG4X9P2Q (also used as referral code base) */
export function generateAgentId(name?: string | null): string {
  const base = (name || "AG")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 2)
    .toUpperCase() || "AG";
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = base.length >= 2 ? base : "AG";
  while (s.length < 8) s += chars[Math.floor(Math.random() * chars.length)];
  return s.slice(0, 8);
}

/** Exactly 10 digits (Indian mobile) */
export function isValidPhone10(phone: string): boolean {
  const d = phone.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) return true;
  return d.length === 10;
}

export function normalizePhone10(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

/** Exactly 12 digits — UTR / UPI ref */
export function isValidUtr12(utr: string): boolean {
  const d = utr.replace(/\s/g, "");
  return /^\d{12}$/.test(d);
}

export function normalizeUtr12(utr: string): string {
  return utr.replace(/\D/g, "").slice(0, 12);
}

/** Exactly 12 digits — Aadhaar */
export function isValidAadhaar12(aadhaar: string): boolean {
  return /^\d{12}$/.test(aadhaar.replace(/\s/g, ""));
}

export function normalizeAadhaar12(aadhaar: string): string {
  return aadhaar.replace(/\D/g, "").slice(0, 12);
}
