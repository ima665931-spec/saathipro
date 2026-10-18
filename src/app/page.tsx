"use client";

import { useState } from "react";
import Link from "next/link";

const services = [
  { emoji: "🎬", title: "Movie Partner", desc: "Watch together, share laughs", price: "₹4,500" },
  { emoji: "👴", title: "Elder Care", desc: "Senior assistance & daily support", price: "₹1,000" },
  { emoji: "🤝", title: "Hanging Out", desc: "Casual social time together", price: "₹1,500" },
  { emoji: "🎉", title: "Clubbing", desc: "Nightlife & party assistance", price: "₹4,500" },
  { emoji: "🛍️", title: "Shopping Buddy", desc: "Groceries, errands, or shopping", price: "₹2,000" },
  { emoji: "🩺", title: "Medical Support", desc: "Hospital & appointment assistance", price: "₹2,000" },
  { emoji: "✈️", title: "Travel Partner", desc: "Explore and travel together", price: "₹2,000" },
  { emoji: "☕", title: "Coffee Partner", desc: "Enjoy coffee & conversation", price: "₹1,500" },
];

const faqs = [
  {
    q: "What is SaathiPro?",
    a: "SaathiPro is India's professional social & lifestyle support platform. Connect with verified Saathis for elder care, hangouts, movies, shopping and more — safe, consent-first, strictly professional.",
  },
  {
    q: "How do I find a Saathi?",
    a: "Click Find a Saathi, browse by city and service, pick a verified partner, choose date & time, and book your session.",
  },
  {
    q: "Is it safe?",
    a: "Yes. Profiles are verified, interactions are professional only, and support is available 24/7. SaathiPro is NOT a dating service.",
  },
  {
    q: "How much can I earn as a Saathi?",
    a: "Set your own rates — many Saathis earn ₹1,000 to ₹2,000+ per hour. You keep most of your earnings.",
  },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                S
              </div>
              <span className="text-xl font-bold text-gray-900">SaathiPro</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <a href="#services" className="hover:text-violet-600 transition">Services</a>
              <a href="#earn" className="hover:text-violet-600 transition">Earn</a>
              <a href="#faq" className="hover:text-violet-600 transition">FAQ</a>
              <Link href="/find" className="hover:text-violet-600 transition">Find Saathi</Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-violet-700 hover:text-violet-900 transition">
                Login
              </Link>
              <Link href="/register" className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-full transition shadow-sm">
                Join Now
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white text-center py-2.5 text-sm font-medium">
        🎉 5 Million+ Family! Up to 60% OFF —{" "}
        <Link href="/register" className="underline font-semibold">Join Now →</Link>
      </div>

      <section className="relative overflow-hidden bg-gradient-to-b from-violet-50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-6">
              🏆 India's #1 Social & Lifestyle Support Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
              SaathiPro in India
              <span className="block text-violet-600 mt-2">Professional Social Support Services</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Safe, verified, professional Saathis across all Indian cities.
              Movie partners, elder care, hangouts & more.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/find"
                className="w-full sm:w-auto px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-full text-lg shadow-lg shadow-violet-200 transition text-center"
              >
                Find a Saathi →
              </Link>
              <Link
                href="/become-saathi"
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-violet-700 font-semibold rounded-full text-lg border-2 border-violet-200 transition text-center"
              >
                Become a Saathi →
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {[
                { value: "5M+", label: "Members" },
                { value: "500+", label: "Cities" },
                { value: "#1", label: "India" },
                { value: "24/7", label: "Support" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="text-3xl font-bold text-violet-600">{stat.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Our Services</h2>
            <p className="mt-4 text-lg text-gray-600">Professional support for every need</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((s) => (
              <Link
                key={s.title}
                href="/find"
                className="group bg-white rounded-2xl border border-gray-100 p-6 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-50 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{s.emoji}</div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-violet-700 transition">
                  {s.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{s.desc}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-violet-600">{s.price}</span>
                  <span className="text-sm font-medium text-violet-600 group-hover:underline">
                    Book →
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/find"
              className="inline-block px-8 py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-full transition"
            >
              Browse All Saathis →
            </Link>
          </div>
        </div>
      </section>

      <section id="earn" className="py-20 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">Earn Upto ₹2,000 Per Hour</h2>
          <p className="mt-4 text-lg text-violet-100">
            Set your rates, choose services, help people — flexible hours.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            <div>
              <div className="text-3xl font-bold">₹2K/hr</div>
              <div className="text-sm text-violet-200 mt-1">Max Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold">80%</div>
              <div className="text-sm text-violet-200 mt-1">You Keep</div>
            </div>
            <div>
              <div className="text-3xl font-bold">24/7</div>
              <div className="text-sm text-violet-200 mt-1">Flexible</div>
            </div>
          </div>
          <Link
            href="/become-saathi"
            className="inline-block mt-10 px-10 py-4 bg-white text-violet-700 font-bold rounded-full text-lg hover:bg-violet-50 transition shadow-lg"
          >
            Start Earning Today →
          </Link>
        </div>
      </section>

      <section id="faq" className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">FAQ</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left font-medium text-gray-900 hover:bg-gray-50"
                >
                  {faq.q}
                  <span className="text-violet-600 text-xl">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="mt-3 text-violet-100 text-lg">
            Join millions who trust SaathiPro for professional social support.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/find"
              className="px-8 py-4 bg-white text-violet-700 font-bold rounded-full hover:bg-violet-50 transition"
            >
              Find a Saathi
            </Link>
            <Link
              href="/become-saathi"
              className="px-8 py-4 bg-violet-500/30 border border-white/40 text-white font-bold rounded-full hover:bg-violet-500/50 transition"
            >
              Become a Saathi
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p className="font-semibold text-white mb-2">SaathiPro</p>
          <p>© 2026 SaathiPro. Professional social support across India.</p>
          <div className="mt-4 flex justify-center gap-6">
            <Link href="/find" className="hover:text-white">Find</Link>
            <Link href="/become-saathi" className="hover:text-white">Become Saathi</Link>
            <Link href="/login" className="hover:text-white">Login</Link>
            <Link href="/register" className="hover:text-white">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
