/** Telegram deep-links for Fast support approval */

export function telegramHandle(): string {
  return (
    process.env.NEXT_PUBLIC_TELEGRAM_SUPPORT ||
    process.env.TELEGRAM_SUPPORT ||
    "saathipro_support"
  ).replace(/^@/, "");
}

function tgUrl(text: string): string {
  return `https://t.me/${telegramHandle()}?text=${encodeURIComponent(text)}`;
}

/** Fast payment approval — user sends Reg ID + UTR to admin on TG */
export function telegramPaymentUrl(params: {
  publicId?: string | null;
  plan?: string | null;
  amount?: number | null;
  utr?: string | null;
  name?: string | null;
  email?: string | null;
  kind?: "MEMBERSHIP" | "AGENT_FEE";
}): string {
  const kind = params.kind === "AGENT_FEE" ? "Agent entry fee ₹199" : "Membership payment";
  const lines = [
    `SaathiPro · ${kind}`,
    params.publicId ? `Reg ID: ${params.publicId}` : null,
    params.plan ? `Plan: ${params.plan}` : null,
    params.amount != null ? `Amount: ₹${params.amount}` : null,
    params.utr ? `UTR: ${params.utr}` : null,
    params.name ? `Name: ${params.name}` : null,
    params.email ? `Email: ${params.email}` : null,
    "Please verify my payment. Thank you.",
  ].filter(Boolean);
  return tgUrl(lines.join("\n"));
}

/** Fast KYC — agent identity */
export function telegramKycUrl(params: {
  agentId: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
}): string {
  const lines = [
    "SaathiPro Agent KYC",
    `Agent ID: ${params.agentId}`,
    params.name ? `Name: ${params.name}` : null,
    params.phone ? `Mobile: ${params.phone}` : null,
    params.email ? `Email: ${params.email}` : null,
    "Please verify my KYC. Thank you.",
  ].filter(Boolean);
  return tgUrl(lines.join("\n"));
}
