/** Soft launch support contacts */
export const SUPPORT = {
  whatsapp: "918112276561", // country code, no +
  whatsappDisplay: "+91 81122 76561",
  email: "saathiprosupport@gmail.com",
  region: "Delhi NCR (soft launch)",
};

export function whatsappUrl(text?: string) {
  const msg = encodeURIComponent(text || "Hi SaathiPro support");
  return `https://wa.me/${SUPPORT.whatsapp}?text=${msg}`;
}
