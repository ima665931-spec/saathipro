import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";
import SiteFooter from "@/components/SiteFooter";
import { SUPPORT } from "@/lib/support";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-brand-soft flex flex-col">
      <BrandHeader />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12">
        <p className="text-xs font-bold tracking-widest uppercase text-pink mb-2">Legal</p>
        <h1 className="font-display text-3xl font-bold text-ink">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink-muted">Last updated: 25 Oct 2026 · Soft launch</p>

        <div className="mt-8 space-y-6 text-sm text-ink-muted leading-relaxed bg-white border border-border rounded-2xl p-6 shadow-card">
          <section>
            <h2 className="font-display font-bold text-ink text-lg mb-2">1. Data we collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account: name, email, password (hashed), optional phone</li>
              <li>Profile: photo, bio, city, services, rates (providers)</li>
              <li>Bookings and in-app messages related to bookings</li>
              <li>Payment status and plan details (processed via Razorpay)</li>
              <li>Basic device / log data for security and debugging</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-ink text-lg mb-2">2. How we use data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide accounts, browse, book, chat, and membership</li>
              <li>Show provider profiles to seekers</li>
              <li>Prevent fraud, abuse, and policy violations</li>
              <li>Customer support and service improvement</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-ink text-lg mb-2">3. Sharing</h2>
            <p>
              We do not sell personal data. We share limited data with:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Payment provider (Razorpay) to process membership</li>
              <li>Hosting / infrastructure vendors necessary to run the app</li>
              <li>Law enforcement when legally required</li>
            </ul>
            <p className="mt-2">
              Other users only see what you publish on your Saathi profile and what is needed for a
              booking (e.g. name, service, time).
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-ink text-lg mb-2">4. Retention</h2>
            <p>
              We keep account and booking records while your account is active and as needed for
              legal, tax, or dispute purposes. You may request account deletion by emailing{" "}
              <a href={`mailto:${SUPPORT.email}`} className="text-accent font-medium">
                {SUPPORT.email}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-ink text-lg mb-2">5. Security</h2>
            <p>
              We use industry-standard practices (hashed passwords, HTTPS, access controls). No
              method is 100% secure; protect your login credentials.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-ink text-lg mb-2">6. Contact</h2>
            <p>
              Privacy questions:{" "}
              <a href={`mailto:${SUPPORT.email}`} className="text-accent font-medium">
                {SUPPORT.email}
              </a>
              . Also see <Link href="/terms" className="text-accent font-medium">Terms</Link> and{" "}
              <Link href="/safety" className="text-accent font-medium">Safety</Link>.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
