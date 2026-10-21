/** Block spam / adult / junk profiles from public Find */

const BAD_NAMES = new Set([
  "name",
  "test",
  "user",
  "saathi",
  "admin",
  "null",
  "undefined",
  "imaa",
]);

const BLOCKED = [
  /porn/i,
  /\bfuck\b/i,
  /\bsex\b/i,
  /\bxxx\b/i,
  /nude/i,
  /onlyfans/i,
  /escort/i,
  /call\s*girl/i,
  /\bslut\b/i,
  /\bwhore\b/i,
  /dick/i,
  /pussy/i,
  /boobs?/i,
  /nsfw/i,
  /hook\s*up/i,
  /dating\s*app/i,
];

export function isBlockedText(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return BLOCKED.some((re) => re.test(t));
}

export function isQualityProfile(opts: {
  name: string;
  bio: string;
  services: string[];
  rate: number;
}): boolean {
  const name = opts.name.trim();
  const bio = opts.bio.trim();

  if (name.length < 2) return false;
  if (BAD_NAMES.has(name.toLowerCase())) return false;
  if (isBlockedText(name) || isBlockedText(bio)) return false;
  if (bio.length < 20) return false;
  if (bio.toLowerCase().includes("admin-created")) return false;
  if (/^[A-Z0-9\s]{15,}$/.test(bio) && bio === bio.toUpperCase()) return false;
  if ((bio.match(/[aeiouаеёиоуыэюя]/gi) || []).length < 3) return false;
  if (!opts.services.length) return false;
  if (opts.rate < 500 || opts.rate > 10000) return false;

  return true;
}

export function assertCleanBio(bio: string): string | null {
  if (!bio || bio.trim().length < 20) {
    return "Bio must be at least 20 characters";
  }
  if (isBlockedText(bio)) {
    return "Bio contains content that is not allowed on SaathiPro";
  }
  return null;
}
