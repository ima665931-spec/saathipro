type BookingEmailParams = {
  to: string;
  clientName?: string | null;
  saathiName: string;
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
}): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[email] RESEND_API_KEY not set — skip", opts.to);
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }

  const from =
    process.env.EMAIL_FROM || "SaathiPro <onboarding@resend.dev>";

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
      const text = await res.text();
      console.error("[email] Resend error:", text);
      return { sent: false, error: text };
    }
    return { sent: true };
  } catch (err) {
    console.error("[email] send failed:", err);
    return { sent: false, error: String(err) };
  }
}

export async function sendBookingConfirmationEmail(
  params: BookingEmailParams
): Promise<{ sent: boolean; error?: string }> {
  const name = params.clientName || "there";
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
      <div style="background: #1a1512; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #f5f0e8; margin: 0; font-size: 22px;">SaathiPro</h1>
        <p style="color: #c4b8a8; margin: 8px 0 0;">Booking Confirmed</p>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
        <p>Hi ${name},</p>
        <p>Your session is confirmed. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #6b7280;">Saathi</td><td style="padding: 8px 0; font-weight: 600;">${params.saathiName}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Service</td><td style="padding: 8px 0; font-weight: 600;">${params.service}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Date</td><td style="padding: 8px 0; font-weight: 600;">${params.date}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Time</td><td style="padding: 8px 0; font-weight: 600;">${params.time}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Duration</td><td style="padding: 8px 0; font-weight: 600;">${params.durationHours} hr${params.durationHours > 1 ? "s" : ""}</td></tr>
          ${params.city ? `<tr><td style="padding: 8px 0; color: #6b7280;">City</td><td style="padding: 8px 0; font-weight: 600;">${params.city}</td></tr>` : ""}
          <tr><td style="padding: 8px 0; color: #6b7280;">Amount</td><td style="padding: 8px 0; font-weight: 600;">₹${params.amount}</td></tr>
        </table>
        <p style="color: #6b7280; font-size: 14px;">View bookings: <a href="https://saathipro.vercel.app/bookings">saathipro.vercel.app/bookings</a></p>
        <p style="margin-top: 24px; color: #9ca3af; font-size: 12px;">— Team SaathiPro</p>
      </div>
    </div>
  `;

  return sendResend({
    to: params.to,
    subject: `Booking confirmed with ${params.saathiName} — SaathiPro`,
    html,
  });
}

export async function sendPaymentVerifiedEmail(params: {
  to: string;
  name?: string | null;
}): Promise<{ sent: boolean; error?: string }> {
  const name = params.name || "there";
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
      <div style="background: #1a1512; padding: 28px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: #f5f0e8; margin: 0; font-size: 24px;">You're in</h1>
        <p style="color: #c4b8a8; margin: 10px 0 0;">Registration payment verified</p>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
        <p>Hi ${name},</p>
        <p>Your ₹499 registration fee is verified. Booking is unlocked on SaathiPro.</p>
        <p style="margin: 24px 0;">
          <a href="https://saathipro.vercel.app/find" style="display:inline-block;background:#1a1512;color:#f5f0e8;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600;">Find a Saathi</a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">Or open <a href="https://saathipro.vercel.app/dashboard">your dashboard</a>.</p>
        <p style="margin-top: 24px; color: #9ca3af; font-size: 12px;">— Team SaathiPro</p>
      </div>
    </div>
  `;

  return sendResend({
    to: params.to,
    subject: "You're in — SaathiPro registration verified",
    html,
  });
}
