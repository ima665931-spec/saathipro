import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";
import SiteFooter from "@/components/SiteFooter";
import { SUPPORT, whatsappUrl } from "@/lib/support";

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-brand-soft flex flex-col">
      <BrandHeader />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12">
        <p className="text-xs font-bold tracking-widest uppercase text-pink mb-2">Trust</p>
        <h1 className="font-display text-3xl font-bold text-ink">Safety guidelines</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Consent-first · professional only · soft launch {SUPPORT.region}
        </p>

        <div className="mt-8 space-y-6 text-sm text-ink-muted leading-relaxed bg-white border border-border rounded-2xl p-6 shadow-card">
          <section>
            <h2 className="font-display font-bold text-ink text-lg mb-2">Core rules</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>SaathiPro is <strong className="text-ink">not dating / not escort</strong></li>
              <li>No sexual services, harassment, or illegal activity</li>
              <li>Both sides must respect boundaries at all times</li>
              <li>Either party may cancel if they feel unsafe</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-ink text-lg mb-2">Before you meet</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Prefer public places for first meetings</li>
              <li>Share your plan with a friend or family member</li>
              <li>Confirm service, time, and location in chat</li>
              <li>Do not share unnecessary personal documents</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-ink text-lg mb-2">During the session</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Stay professional; leave if boundaries are crossed</li>
              <li>Do not demand private or unsafe locations</li>
              <li>No intoxication-driven pressure on the other person</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-ink text-lg mb-2">Report problems</h2>
            <p>
              If someone breaks rules, message support with booking ID and details. We may suspend
              accounts after review.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={whatsappUrl("Safety report: ")}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-brand px-5 py-2.5 rounded-full text-sm"
              >
                WhatsApp support
              </a>
              <a
                href={`mailto:${SUPPORT.email}?subject=Safety%20report`}
                className="px-5 py-2.5 rounded-full text-sm border border-border font-semibold text-ink"
              >
                Email {SUPPORT.email}
              </a>
            </div>
          </section>

          <section>
            <h2 className="font-display font-bold text-ink text-lg mb-2">Emergency</h2>
            <p>
              If you are in immediate danger, contact local emergency services (India: 112) first,
              then inform us when safe.
            </p>
          </section>

          <p className="text-xs">
            Also read <Link href="/terms" className="text-accent font-medium">Terms</Link> and{" "}
            <Link href="/privacy" className="text-accent font-medium">Privacy</Link>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
