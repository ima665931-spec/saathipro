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

export async function sendBookingConfirmationEmail(
  params: BookingEmailParams
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      "[email] RESEND_API_KEY not set — skipping booking email to", 
      params.to
    );
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }

  const from =
    process.env.EMAIL_FROM || "SaathiPro <onboarding@resend.dev>";

  const name = params.clientName || "there";
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
      <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">SaathiPro</h1>
        <p style="color: #e9d5ff; margin: 8px 0 0;">Booking Confirmed</p>
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
          <tr><td style="padding: 8px 0; color: #6b7280;">Amount</td><td style="padding: 8px 0; font-weight: 600; color: #7c3aed;">₹${params.amount}</td></tr>
        </table>
        <p style="color: #6b7280; font-size: 14px;">View all bookings at <a href="https://saathipro.vercel.app/bookings" style="color: #7c3aed;">saathipro.vercel.app/bookings</a></p>
        <p style="margin-top: 24px; color: #9ca3af; font-size: 12px;">— Team SaathiPro</p>
      </div>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: `Booking confirmed with ${params.saathiName} — SaathiPro`,
        html,
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
