import { sendBookingConfirmationEmail } from "@/lib/email";
import { SUPPORT, whatsappUrl } from "@/lib/support";

const APP_URL = (
  process.env.AUTH_URL ||
  process.env.NEXTAUTH_URL ||
  "https://saathipro.site"
).replace(/\/$/, "");

type BookingNotify = {
  bookingId: string;
  clientEmail: string;
  clientName?: string | null;
  clientPhone?: string | null;
  saathiEmail?: string | null;
  saathiName: string;
  saathiPhone?: string | null;
  service: string;
  date: string;
  time: string;
  durationHours: number;
  amount: number;
  city?: string | null;
};

async function sendResend(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[notify] RESEND_API_KEY missing — skip email to", opts.to);
    return false;
  }
  const from = process.env.EMAIL_FROM || "SaathiPro <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      console.error("[notify] Resend", await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[notify] email fail", e);
    return false;
  }
}

/** Optional ops alert via Telegram Bot API */
async function telegramOps(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_OPS_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });
  } catch (e) {
    console.error("[notify] telegram ops", e);
  }
}

function saathiHtml(p: BookingNotify) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#111">
      <div style="background:#7c3aed;padding:20px;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:20px">New booking — SaathiPro</h1>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;padding:20px;border-radius:0 0 12px 12px">
        <p>Hi ${p.saathiName},</p>
        <p>You have a new confirmed session.</p>
        <table style="width:100%;margin:12px 0">
          <tr><td style="color:#6b7280;padding:6px 0">Client</td><td style="font-weight:600">${p.clientName || "Member"}</td></tr>
          <tr><td style="color:#6b7280;padding:6px 0">Service</td><td style="font-weight:600">${p.service}</td></tr>
          <tr><td style="color:#6b7280;padding:6px 0">When</td><td style="font-weight:600">${p.date} · ${p.time}</td></tr>
          <tr><td style="color:#6b7280;padding:6px 0">Duration</td><td style="font-weight:600">${p.durationHours} hr</td></tr>
          <tr><td style="color:#6b7280;padding:6px 0">Amount</td><td style="font-weight:600">₹${p.amount}</td></tr>
        </table>
        <p><a href="${APP_URL}/bookings">Open bookings</a> · <a href="${APP_URL}/chat/${p.bookingId}">Open chat</a></p>
        <p style="font-size:12px;color:#9ca3af">Support: ${SUPPORT.email} · WhatsApp ${SUPPORT.whatsappDisplay}</p>
      </div>
    </div>`;
}

/**
 * Fire-and-forget safe notifications after booking create.
 * Never throws to caller.
 */
export async function notifyBookingCreated(p: BookingNotify): Promise<void> {
  try {
    // Client confirmation (existing template)
    await sendBookingConfirmationEmail({
      to: p.clientEmail,
      clientName: p.clientName,
      saathiName: p.saathiName,
      service: p.service,
      date: p.date,
      time: p.time,
      durationHours: p.durationHours,
      amount: p.amount,
      city: p.city,
    });

    // Saathi alert
    if (p.saathiEmail) {
      await sendResend({
        to: p.saathiEmail,
        subject: `New booking · ${p.date} ${p.time} — SaathiPro`,
        html: saathiHtml(p),
      });
    }

    // Ops telegram (optional)
    const lines = [
      "SaathiPro · New booking",
      `ID: ${p.bookingId}`,
      `${p.saathiName} ← ${p.clientName || p.clientEmail}`,
      `${p.service} · ${p.date} ${p.time} · ₹${p.amount}`,
      `${APP_URL}/bookings`,
    ];
    await telegramOps(lines.join("\n"));

    // Log WA deep links (no paid WA API required — ops can forward)
    if (p.saathiPhone) {
      const wa = whatsappUrl(
        `SaathiPro booking\n${p.date} ${p.time}\n${p.service}\nClient: ${p.clientName || "Member"}\nChat: ${APP_URL}/chat/${p.bookingId}`
      );
      console.log("[notify] Saathi WhatsApp deep link", wa);
    }
  } catch (e) {
    console.error("[notify] booking notify failed", e);
  }
}

/** Public helper for client UI if needed later */
export function bookingWhatsAppShare(p: {
  saathiName: string;
  date: string;
  time: string;
  service: string;
}) {
  return whatsappUrl(
    `My SaathiPro booking with ${p.saathiName}\n${p.service}\n${p.date} · ${p.time}\n${APP_URL}/bookings`
  );
}
