import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";
import SiteFooter from "@/components/SiteFooter";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-brand-soft flex flex-col">
      <BrandHeader />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12">
        <p className="text-xs font-bold tracking-widest uppercase text-pink mb-2">Legal</p>
        <h1 className="font-display text-3xl font-bold text-ink">Terms of Service</h1>
        <p className="mt-2 text-sm text-ink-muted">Last updated: 25 Oct 2026 · Soft launch</p>

        <div className="mt-8 space-y-6 text-sm text-ink-muted leading-relaxed bg-white border border-border rounded-2xl p-6 shadow-card">
          <section>
            <h2 className="font-display font-bold text-ink text-lg mb-2">1. What SaathiPro is</h2>
            <p>
              SaathiPro is a professional companionship and social-support booking platform for
              seekers and providers ("Saathis"). It is <strong className="text-ink">not a dating,
              escort, or intimate-services platform</strong>. All interactions must remain
              professional and consent-first.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-ink text-lg mb-2">2. Accounts</h2>
            <p>
              You must provide accurate information. One account may be used both to book Saathis
              and to offer services as a provider. You are responsible for activity under your
              login. We may suspend accounts that break these terms or safety rules.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-ink text-lg mb-2">3. Membership</h2>
            <p>
              Browsing profiles is free. Booking, messaging, and going live as a Saathi require an
              active membership plan paid via Razorpay. Plans are time-bound (weekly / monthly /
              half-year / yearly). Fees are generally non-refundable once access is unlocked,
              except where required by law or at our discretion for failed delivery.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-ink text-lg mb-2">4. Bookings</h2>
            <p>
              A booking is an agreement between seeker and Saathi for the listed service, time, and
              rate. Platform membership does not guarantee that a specific Saathi will accept every
              request. Session fees (hourly rates) are arranged between parties as shown on the
              profile unless stated otherwise.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-ink text-lg mb-2">5. Soft launch</h2>
            <p>
              SaathiPro is in soft launch (currently focused on Delhi NCR). Features, pricing, and
              coverage may change. Availability of partners is not guaranteed in every area.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-ink text-lg mb-2">6. Prohibited use</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Any sexual, illegal, or harassing activity</li>
              <li>Fake profiles, fraud, or payment abuse</li>
              <li>Sharing another user's private data without consent</li>
              <li>Using the platform as a dating or escort service</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-ink text-lg mb-2">7. Liability</h2>
            <p>
              SaathiPro is a technology platform connecting users. We do not employ Saathis as
              staff for sessions. Meet in public places when possible, follow safety guidelines, and
              report issues. To the maximum extent permitted by law, we are not liable for disputes,
              injuries, or losses arising from offline meetings.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-ink text-lg mb-2">8. Contact</h2>
            <p>
              Support: see <Link href="/safety" className="text-accent font-medium">Safety</Link>{" "}
              page or footer WhatsApp / email.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
