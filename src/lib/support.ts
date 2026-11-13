/** Soft launch support contacts */
export const SUPPORT = {
  /** Telegram username without @ */
  telegram: "SaathiProSupport",
  telegramDisplay: "@SaathiProSupport",
  email: "saathiprosupport@gmail.com",
  region: "Delhi NCR (soft launch)",
};

/** Open Telegram chat with optional prefilled text */
export function telegramUrl(text?: string) {
  const base = `https://t.me/${SUPPORT.telegram}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

/** @deprecated use telegramUrl — kept so old imports don't break */
export function whatsappUrl(text?: string) {
  return telegramUrl(text || "Hi SaathiPro support");
}
