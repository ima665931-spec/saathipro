/** Agent onboarding fee (not membership) */
export const AGENT_ENTRY_FEE = 199;
export const AGENT_ENTRY_TYPE = "AGENT_ENTRY";

/** Telegram username or number for Fast KYC (set in Vercel env TELEGRAM_SUPPORT) */
export function telegramKycUrl(params: {
  agentId: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
}): string {
  const handle = (process.env.NEXT_PUBLIC_TELEGRAM_SUPPORT || process.env.TELEGRAM_SUPPORT || "saathipro_support").replace(
    /^@/,
    ""
  );
  const text = [
    "SaathiPro Agent KYC",
    `Agent ID: ${params.agentId}`,
    params.name ? `Name: ${params.name}` : null,
    params.phone ? `Mobile: ${params.phone}` : null,
    params.email ? `Email: ${params.email}` : null,
    "Please verify my KYC. Thank you.",
  ]
    .filter(Boolean)
    .join("\n");
  return `https://t.me/${handle}?text=${encodeURIComponent(text)}`;
}
