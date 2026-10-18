"use client";

import { useState } from "react";

const services = [
  { emoji: "🎬", title: "Movie Partner", desc: "Watch together, share laughs", price: "₹4,500", duration: "3.5 hours" },
  { emoji: "👤", title: "In-Person Meeting", desc: "Face-to-face meeting and conversation", price: "₹2,000", duration: "1 hour" },
  { emoji: "👴", title: "Elder Care", desc: "Senior assistance & daily support", price: "₹1,000", duration: "1 hour" },
  { emoji: "🤝", title: "Hanging Out", desc: "Casual social time together", price: "₹1,500", duration: "1 hour" },
  { emoji: "🎉", title: "Clubbing", desc: "Nightlife & party assistance", price: "₹4,500", duration: "3 hours" },
  { emoji: "🛍️", title: "Shopping Buddy", desc: "Groceries, errands, or shopping", price: "₹2,000", duration: "1 hour" },
  { emoji: "🩺", title: "Medical Support", desc: "Hospital & appointment assistance", price: "₹2,000", duration: "1 hour" },
  { emoji: "🏠", title: "Domestic Help", desc: "Light support & organizing", price: "₹2,000", duration: "1 hour" },
  { emoji: "✈️", title: "Travel Partner", desc: "Explore and travel together", price: "₹2,000", duration: "1 hour" },
  { emoji: "🎭", title: "Event Partner", desc: "Event & Party Assistance", price: "₹2,000", duration: "1 hour" },
  { emoji: "🚴", title: "City Tour Partner", desc: "Explore the city", price: "₹2,000", duration: "1 hour" },
  { emoji: "🎳", title: "Gaming Partner", desc: "Play & Fun (Physical)", price: "₹1,800", duration: "1 hour" },
  { emoji: "🎸", title: "Concert Partner", desc: "Enjoy & Laugh", price: "₹2,000", duration: "1 hour" },
  { emoji: "☕", title: "Coffee Partner", desc: "Enjoy Coffee", price: "₹1,500", duration: "1 hour" },
  { emoji: "🎪", title: "Cafe & Food Partner", desc: "Outing with Yummy Food", price: "₹2,000", duration: "1 hour" },
  { emoji: "💼", title: "Networking Partner", desc: "Business Discussion, Startup Brainstorming", price: "₹1,500", duration: "1 hour" },
];

const stories = [
  {
    name: "Priya Sharma",
    city: "Delhi",
    months: "6 months",
    earning: "₹85,000/month",
    quote: "SaathiPro changed my life! I earn ₹85,000+ monthly working part-time while helping others feel less lonely. The platform is safe and professional.",
  },
  {
    name: "Anjali Mehta",
    city: "Mumbai",
    months: "8 months",
    earning: "₹1,20,000/month",
    quote: "Best decision I ever made! Started as a side income, now I earn upto ₹2,000 per hour. The clients are respectful and the support team is amazing.",
  },
  {
    name: "Sneha Reddy",
    city: "Bangalore",
    months: "5 months",
    earning: "₹95,000/month",
    quote: "Flexible hours, good earnings, and meaningful work. I love connecting with people and helping them through tough times. Highly recommend!",
  },
  {
    name: "Kavita Patel",
    city: "Pune",
    months: "4 months",
    earning: "₹70,000/month",
    quote: "As a working professional, I do this part-time on weekends. Extra ₹70,000/month has helped me become financially independent!",
  },
];

const faqs = [
  {
    q: "What is SaathiPro?",
    a: "SaathiPro is India's #1 Social & Lifestyle Support Services Platform. It's a professional social support service that connects people with verified Saathis for safe, consent-first, professional support services including elder care, hanging out, clubbing, movie partners, shopping buddies, medical support, and more.",
  },
  {
    q: "How do I find a Saathi near me?",
    a: "1) Visit SaathiPro and click \"Find a Saathi\"\n2) Sign up with your phone number\n3) Enter your pin code — we cover all Indian pin codes\n4) Browse verified Saathis by service, rating, and availability\n5) Book a session — voice call, video call, or in-person",
  },
  {
    q: "Is SaathiPro safe and trustworthy?",
    a: "Yes. All Saathis are background verified, trained professionals committed to strict boundaries. Consent-first, strictly professional services only. Clear code of conduct, secure payments, and 24/7 support. SaathiPro is NOT a dating service.",
  },
  {
    q: "How much can I earn as a Saathi?",
    a: "Saathis can earn up to ₹4,500 per hour based on services. You keep 80% of your earnings. Membership starts at just ₹199 (6 months) — pay once, unlimited earnings!",
  },
  {
    q: "How do I become a Saathi?",
    a: "1) Click \"Become a Saathi\"\n2) Sign up with phone number\n3) Complete profile with photo, bio, services & rates\n4) Pay membership fee (₹199/6mo, ₹499/yr, or ₹999/lifetime)\n5) Get verified and start earning!",
  },
  {
    q: "Where is SaathiPro available?",
    a: "Across ALL of India — 28 States + 8 UTs, 700+ Districts, complete pin code coverage. Millions of registered Saathis from metro cities to small towns.",
  },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                S
              </div>
              <span className="text-xl font-bold text-gray-900">SaathiPro</span>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <a href="#services" className="hover:text-violet-600 transition">Services</a>
              <a href="#why" className="hover:text-violet-600 transition">Why Choose Us</a>
              <a href="#earn" className="hover:text-violet-600 transition">Earn</a>
              <a href="#faq" className="hover:text-violet-600 transition">FAQ</a>
            </nav>
            <div className="flex items-center gap-3">
              <button className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-violet-700 hover:text-violet-900 transition">
                Install App
              </button>
              <button className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-full transition shadow-sm">
                Join Now
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Promo Banner */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white text-center py-2.5 text-sm font-medium">
        🎉 5 Million+ Family! Up to 60% OFF — Limited Time Celebration!{" "}
        <span className="underline cursor-pointer ml-1">Join Now →</span>
      </div>

      {/* Hero */}
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
              Safe, verified, professional Saathis across all Indian cities and pin codes.
              Millions of registered Saathis. India's most trusted social and lifestyle support platform.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-full text-lg shadow-lg shadow-violet-200 transition">
                Find a Saathi →
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-violet-700 font-semibold rounded-full text-lg border-2 border-violet-200 transition">
                Become a Saathi →
              </button>
            </div>

            {/* Stats */}
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

      {/* Trust Bar */}
      <section className="border-y border-gray-100 bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { title: "Millions", sub: "of Saathis" },
              { title: "All India", sub: "Coverage" },
              { title: "AI-Verified", sub: "Profiles" },
              { title: "24/7", sub: "Support" },
            ].map((item) => (
              <div key={item.title}>
                <div className="text-xl font-bold text-gray-900">{item.title}</div>
                <div className="text-sm text-gray-500">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Our Services</h2>
            <p className="mt-4 text-lg text-gray-600">
              Choose from our wide range of professional support services
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((s) => (
              <div
                key={s.title}
                className="group bg-white rounded-2xl border border-gray-100 p-6 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-50 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{s.emoji}</div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-violet-700 transition">
                  {s.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{s.desc}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-violet-600">{s.price}</span>
                    <span className="text-sm text-gray-400 ml-1">· {s.duration}</span>
                  </div>
                  <button className="text-sm font-medium text-violet-600 hover:text-violet-800">
                    Book →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="why" className="py-20 bg-gradient-to-b from-violet-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Why Choose Us</h2>
            <p className="mt-4 text-lg text-gray-600">
              India's #1 Trusted Social & Lifestyle Support Platform
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: "🧩", title: "Multiple Services", desc: "From elder care to clubbing — all your needs covered." },
              { icon: "🛡️", title: "Safe & Professional", desc: "Strictly professional, consent-first interactions." },
              { icon: "✅", title: "Verified Partners", desc: "All Saathis with verified profiles & reviews." },
              { icon: "📍", title: "Nearby", desc: "Choose Saathis by city, service, hobby." },
            ].map((item) => (
              <div key={item.title} className="text-center bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">SaathiPro Success Stories</h2>
            <p className="mt-4 text-lg text-gray-600">Real earnings from real Saathis</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stories.map((story) => (
              <div
                key={story.name}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                    {story.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{story.name}</div>
                    <div className="text-xs text-gray-500">
                      {story.city} • Saathi for {story.months}
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-violet-600 mb-3">{story.earning}</div>
                <p className="text-sm text-gray-600 leading-relaxed">&ldquo;{story.quote}&rdquo;</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button className="px-8 py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-full transition">
              Start Your Earning Journey →
            </button>
          </div>
        </div>
      </section>

      {/* Earn Section */}
      <section id="earn" className="py-20 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-sm font-medium mb-6">
              💰 Earning Opportunity
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">Earn Upto ₹2,000 Per Hour</h2>
            <p className="mt-4 text-lg text-violet-100">
              Join India's #1 social support platform. Set your own rates, choose your services, and earn while helping others.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-6 max-w-lg mx-auto">
              <div>
                <div className="text-3xl font-bold">₹2K/hr</div>
                <div className="text-sm text-violet-200 mt-1">Earn Per Hour</div>
              </div>
              <div>
                <div className="text-3xl font-bold">80%</div>
                <div className="text-sm text-violet-200 mt-1">You Keep</div>
              </div>
              <div>
                <div className="text-3xl font-bold">₹199</div>
                <div className="text-sm text-violet-200 mt-1">Membership From</div>
              </div>
            </div>
            <div className="mt-12 bg-white/10 backdrop-blur rounded-2xl p-8 max-w-xl mx-auto text-left">
              <h3 className="font-semibold text-lg mb-4">How Saathis Earn:</h3>
              <ul className="space-y-3 text-violet-50">
                <li className="flex justify-between">
                  <span>✓ Elder Care: ₹1,000/hour</span>
                  <span className="text-violet-200">10 hrs = ₹10,000</span>
                </li>
                <li className="flex justify-between">
                  <span>✓ Hanging Out: ₹1,500/hour</span>
                  <span className="text-violet-200">10 hrs = ₹15,000</span>
                </li>
                <li className="flex justify-between">
                  <span>✓ Clubbing & Events: ₹2,000+/hour</span>
                  <span className="text-violet-200">10 hrs = ₹20,000+</span>
                </li>
                <li className="flex justify-between">
                  <span>✓ Set Your Own Rates</span>
                  <span className="text-violet-200">Full flexibility</span>
                </li>
              </ul>
            </div>
            <button className="mt-10 px-10 py-4 bg-white text-violet-700 font-bold rounded-full text-lg hover:bg-violet-50 transition shadow-lg">
              Start Earning Today →
            </button>
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              SaathiPro — Available Across All India
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "All Pin Codes", desc: "Our services cover every pin code in India. Enter your pin code to find Saathis available in your area." },
              { title: "Millions of Saathis", desc: "Millions of registered and verified Saathis ready to provide professional social support services." },
              { title: "AI-Verified Profiles", desc: "Every Saathi undergoes AI-powered verification to ensure authenticity and safety." },
            ].map((item) => (
              <div key={item.title} className="bg-gray-50 rounded-2xl p-8 text-center">
                <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-3 text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Download */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="p-10 lg:p-14 flex flex-col justify-center">
                <h2 className="text-3xl font-bold text-gray-900">Download the App Now</h2>
                <p className="mt-4 text-gray-600 text-lg">
                  Browse, book, manage bookings, and get instant notifications on your phone.
                </p>
                <div className="mt-8 grid grid-cols-3 gap-4">
                  {[
                    { icon: "🎬", label: "Discover" },
                    { icon: "📅", label: "Book" },
                    { icon: "💬", label: "Chat" },
                    { icon: "✅", label: "Trusted" },
                    { icon: "💳", label: "Pay" },
                    { icon: "⭐", label: "Rated" },
                  ].map((f) => (
                    <div key={f.label} className="text-center">
                      <div className="text-2xl">{f.icon}</div>
                      <div className="text-xs text-gray-500 mt-1">{f.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-10 flex flex-wrap gap-4">
                  <button className="px-6 py-3 bg-black text-white rounded-xl font-medium flex items-center gap-2 hover:bg-gray-800 transition">
                    <span>▶</span> Google Play
                  </button>
                  <button className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium flex items-center gap-2 cursor-not-allowed">
                    App Store — Coming Soon
                  </button>
                </div>
              </div>
              <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-10 lg:p-14 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-48 h-48 mx-auto bg-white/20 rounded-3xl flex items-center justify-center mb-6">
                    <div className="w-40 h-40 bg-white rounded-2xl flex items-center justify-center">
                      <div className="text-6xl">📱</div>
                    </div>
                  </div>
                  <p className="text-lg font-medium">Scan to download</p>
                  <p className="text-violet-200 text-sm mt-1">Available on Google Play</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Frequently Asked Questions</h2>
            <p className="mt-4 text-lg text-gray-600">Everything you need to know about SaathiPro</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left font-medium text-gray-900 hover:bg-gray-50 transition"
                >
                  <span>{faq.q}</span>
                  <span className="text-violet-600 text-xl ml-4">
                    {openFaq === i ? "−" : "+"}
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-gray-600 leading-relaxed whitespace-pre-line">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="mt-3 text-violet-100 text-lg">
            Join millions who trust SaathiPro for professional social support.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-violet-700 font-bold rounded-full hover:bg-violet-50 transition">
              Find a Saathi
            </button>
            <button className="px-8 py-4 bg-violet-500/30 border border-white/40 text-white font-bold rounded-full hover:bg-violet-500/50 transition">
              Become a Saathi
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                S
              </div>
              <span className="text-white font-semibold text-lg">SaathiPro</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a href="#services" className="hover:text-white transition">Services</a>
              <a href="#why" className="hover:text-white transition">Why Us</a>
              <a href="#earn" className="hover:text-white transition">Earn</a>
              <a href="#faq" className="hover:text-white transition">FAQ</a>
            </div>
            <p className="text-sm">© 2026 SaathiPro. All rights reserved.</p>
          </div>
          <p className="mt-8 text-center text-xs text-gray-500 max-w-2xl mx-auto">
            SaathiPro is a professional social support platform. All interactions are consent-first and strictly professional.
            Prices may vary by individual Saathi based on their rates and services.
          </p>
        </div>
      </footer>
    </div>
  );
}
