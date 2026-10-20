"use client";

import { useState } from "react";
import Link from "next/link";

const services = [
  { title: "Movie Partner", desc: "Watch together, share the moment", price: "From ₹1,500" },
  { title: "Elder Care", desc: "Senior assistance & daily support", price: "From ₹1,000" },
  { title: "Hanging Out", desc: "Casual social time, conversation", price: "From ₹1,500" },
  { title: "Clubbing", desc: "Nightlife companion, professional", price: "From ₹2,000" },
  { title: "Shopping Buddy", desc: "Errands, markets, retail", price: "From ₹1,400" },
  { title: "Medical Support", desc: "Hospital & appointment help", price: "From ₹1,500" },
  { title: "Travel Partner", desc: "Explore cities together", price: "From ₹1,800" },
  { title: "Coffee Partner", desc: "Conversation over coffee", price: "From ₹1,200" },
];

const faqs = [
  {
    q: "What is SaathiPro?",
    a: "A professional social support platform. Book verified companions for movies, elder care, hangouts, travel and more — consent-first, strictly professional. Not a dating service.",
  },
  {
    q: "How do I book?",
    a: "Browse Find a Saathi, open a profile, choose date and duration, confirm. You will see bookings in your dashboard.",
  },
  {
    q: "Is it safe?",
    a: "Profiles are reviewed, interactions are professional only, and clear boundaries are required. Report any issue from your account.",
  },
  {
    q: "How do Saathis earn?",
    a: "Set your own hourly rates, choose services, keep the majority of earnings. Flexible hours across India.",
  },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-cream font-display font-semibold text-sm">
                S
              </div>
              <span className="font-display text-lg font-semibold text-ink tracking-tight">
                SaathiPro
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-muted">
              <a href="#services" className="hover:text-ink transition">
                Services
              </a>
              <a href="#earn" className="hover:text-ink transition">
                Earn
              </a>
              <a href="#faq" className="hover:text-ink transition">
                FAQ
              </a>
              <Link href="/find" className="hover:text-ink transition">
                Find Saathi
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:inline text-sm font-medium text-ink-muted hover:text-ink"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 bg-ink hover:bg-accent text-cream text-sm font-semibold rounded-full transition"
              >
                Join
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent-light mb-6">
              Professional companionship · India
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-ink leading-[1.15] tracking-tight text-balance">
              Verified Saathis for life's moments
            </h1>
            <p className="mt-6 text-lg text-ink-muted max-w-xl mx-auto leading-relaxed">
              Movies, elder care, hangouts, travel — book trusted professionals
              with clear boundaries. Safe. Consent-first.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/find"
                className="w-full sm:w-auto px-8 py-3.5 bg-ink hover:bg-accent text-cream font-semibold rounded-full transition text-center"
              >
                Find a Saathi
              </Link>
              <Link
                href="/become-saathi"
                className="w-full sm:w-auto px-8 py-3.5 bg-white border border-border text-ink font-semibold rounded-full hover:bg-cream-dark transition text-center"
              >
                Become a Saathi
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto border-t border-border pt-10">
              {[
                { value: "Verified", label: "Profiles" },
                { value: "Pan-India", label: "Coverage" },
                { value: "24/7", label: "Support" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-display text-xl font-semibold text-ink">
                    {stat.value}
                  </div>
                  <div className="text-xs text-ink-muted mt-1 uppercase tracking-wide">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="py-20 border-t border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-accent-light mb-3">
              Services
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink">
              Support for every need
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((s) => (
              <Link
                key={s.title}
                href="/find"
                className="group p-6 rounded-2xl border border-border bg-cream/50 hover:bg-cream hover:shadow-card transition"
              >
                <h3 className="font-display font-semibold text-ink group-hover:text-accent transition">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-ink-muted leading-relaxed">{s.desc}</p>
                <p className="mt-4 text-sm font-medium text-ink">{s.price}</p>
              </Link>
            ))}
          </div>
          <div className="mt-10">
            <Link
              href="/find"
              className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-accent transition"
            >
              Browse all Saathis →
            </Link>
          </div>
        </div>
      </section>

      <section id="earn" className="py-20 bg-ink text-cream">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-gold mb-4">
            For professionals
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold">
            Earn on your terms
          </h2>
          <p className="mt-4 text-cream/70 text-lg">
            Set rates, choose services, flexible hours — across India.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 max-w-md mx-auto">
            <div>
              <div className="font-display text-2xl font-semibold">₹2K</div>
              <div className="text-xs text-cream/50 mt-1 uppercase tracking-wide">
                / hour up to
              </div>
            </div>
            <div>
              <div className="font-display text-2xl font-semibold">80%</div>
              <div className="text-xs text-cream/50 mt-1 uppercase tracking-wide">
                You keep
              </div>
            </div>
            <div>
              <div className="font-display text-2xl font-semibold">You</div>
              <div className="text-xs text-cream/50 mt-1 uppercase tracking-wide">
                Set hours
              </div>
            </div>
          </div>
          <Link
            href="/become-saathi"
            className="inline-block mt-10 px-10 py-3.5 bg-cream text-ink font-semibold rounded-full hover:bg-white transition"
          >
            Apply as Saathi
          </Link>
        </div>
      </section>

      <section id="faq" className="py-20 bg-cream">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-display text-3xl font-semibold text-ink text-center mb-10">
            FAQ
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-border rounded-xl overflow-hidden bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left font-medium text-ink"
                >
                  {faq.q}
                  <span className="text-ink-muted text-lg ml-4">
                    {openFaq === i ? "−" : "+"}
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-ink-muted text-sm leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-border bg-white text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="font-display text-2xl font-semibold text-ink">
            Ready when you are
          </h2>
          <p className="mt-2 text-ink-muted">
            Browse profiles or create your account in minutes.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/find"
              className="px-8 py-3.5 bg-ink text-cream font-semibold rounded-full hover:bg-accent transition"
            >
              Find a Saathi
            </Link>
            <Link
              href="/register"
              className="px-8 py-3.5 border border-border text-ink font-semibold rounded-full hover:bg-cream transition"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-ink-muted">
          <p className="font-display font-semibold text-ink mb-2">SaathiPro</p>
          <p>Professional social support across India. Not a dating service.</p>
          <div className="mt-4 flex justify-center gap-6">
            <Link href="/find" className="hover:text-ink">
              Find
            </Link>
            <Link href="/become-saathi" className="hover:text-ink">
              Become Saathi
            </Link>
            <Link href="/login" className="hover:text-ink">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
