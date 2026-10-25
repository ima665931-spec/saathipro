/** Update these before public soft launch */
export const SUPPORT = {
  whatsapp: "919810000000", // TODO: replace with real number (country code, no +)
  whatsappDisplay: "+91 98100 00000",
  email: "support@saathipro.com",
  region: "Delhi NCR (soft launch)",
};

export function whatsappUrl(text?: string) {
  const msg = encodeURIComponent(text || "Hi SaathiPro support");
  return `https://wa.me/${SUPPORT.whatsapp}?text=${msg}`;
}
