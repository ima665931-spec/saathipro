"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const SERVICES = [
  "All",
  "Movie Partner",
  "Hanging Out",
  "Elder Care",
  "Clubbing",
  "Shopping Buddy",
  "Coffee Partner",
  "Travel Partner",
  "Event Partner",
  "Medical Support",
];

const CITIES = [
  "All Cities",
  "Delhi",
  "Mumbai",
  "Bangalore",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
];

const DUMMY_SAATHIS = [
  {
    id: "1",
    name: "Priya Sharma",
    city: "Delhi",
    services: ["Movie Partner", "Coffee Partner", "Hanging Out"],
    rate: 1500,
    rating: 4.9,
    reviews: 128,
    bio: "Friendly and professional. Love movies and deep conversations.",
    image: null,
    verified: true,
  },
  {
    id: "2",
    name: "Anjali Mehta",
    city: "Mumbai",
    services: ["Clubbing", "Event Partner", "Hanging Out"],
    rate: 2000,
    rating: 4.8,
    reviews: 94,
    bio: "Nightlife expert. Safe and fun companion for parties and events.",
    image: null,
    verified: true,
  },
  {
    id: "3",
    name: "Sneha Reddy",
    city: "Bangalore",
    services: ["Elder Care", "Medical Support", "Shopping Buddy"],
    rate: 1200,
    rating: 5.0,
    reviews: 67,
    bio: "Patient and caring. Experienced in elder care and hospital visits.",
    image: null,
    verified: true,
  },
  {
    id: "4",
    name: "Kavita Patel",
    city: "Pune",
    services: ["Travel Partner", "City Tour Partner", "Coffee Partner"],
    rate: 1800,
    rating: 4.7,
    reviews: 52,
    bio: "Love exploring cities. Great for local tours and travel companionship.",
    image: null,
    verified: true,
  },
  {
    id: "5",
    name: "Riya Kapoor",
    city: "Delhi",
    services: ["Shopping Buddy", "Cafe & Food Partner", "Hanging Out"],
    rate: 1400,
    rating: 4.8,
    reviews: 89,
    bio: "Fashion and food enthusiast. Perfect shopping and cafe buddy.",
    image: null,
    verified: true,
  },
  {
    id: "6",
    name: "Neha Singh",
    city: "Mumbai",
    services: ["Movie Partner", "Concert Partner", "Event Partner"],
    rate: 1600,
    rating: 4.9,
    reviews: 113,
    bio: "Movie buff and music lover. Always up for a good film or concert.",
    image: null,
    verified: true,
  },
  {
    id: "7",
    name: "Pooja Iyer",
    city: "Bangalore",
    services: ["Professional Networking Partner", "Coffee Partner", "Hanging Out"],
    rate: 1500,
    rating: 4.6,
    reviews: 41,
    bio: "Startup enthusiast. Great for brainstorming and professional chats.",
    image: null,
    verified: true,
  },
  {
    id: "8",
    name: "Meera Joshi",
    city: "Hyderabad",
    services: ["Elder Care", "Domestic Help", "Shopping Buddy"],
    rate: 1100,
    rating: 4.9,
    reviews: 76,
    bio: "Warm and reliable. Specialized in senior care and daily support.",
    image: null,
    verified: true,
  },
];

export default function FindPage() {
  const [selectedService, setSelectedService] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return DUMMY_SAATHIS.filter((s) => {
      const matchService =
        selectedService === "All" || s.services.includes(selectedService);
      const matchCity =
        selectedCity === "All Cities" || s.city === selectedCity;
      const matchSearch =
        search === "" ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.bio.toLowerCase().includes(search.toLowerCase()) ||
        s.services.some((svc) =>
          svc.toLowerCase().includes(search.toLowerCase())
        );
      return matchService && matchCity && matchSearch;
    });
  }, [selectedService, selectedCity, search]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                S
              </div>
              <span className="text-xl font-bold text-gray-900">SaathiPro</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <Link href="/" className="hover:text-violet-600 transition">Home</Link>
              <Link href="/find" className="text-violet-600 font-semibold">Find Saathi</Link>
              <Link href="/dashboard" className="hover:text-violet-600 transition">Dashboard</Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-violet-700 hover:text-violet-900">Login</Link>
              <Link href="/register" className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-full transition">Join Now</Link>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-violet-50 to-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Find a Saathi</h1>
          <p className="mt-2 text-gray-600 text-lg">Browse verified professional companions near you</p>

          <div className="mt-8 flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-gray-900"
              />
            </div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-5 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white text-gray-900 min-w-[160px]"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {SERVICES.map((svc) => (
              <button
                key={svc}
                onClick={() => setSelectedService(svc)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedService === svc
                    ? "bg-violet-600 text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-violet-300 hover:text-violet-700"
                }`}
              >
                {svc}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            <span className="font-semibold text-gray-900">{filtered.length}</span> Saathis found
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900">No Saathis found</h3>
            <p className="text-gray-500 mt-2">Try changing filters or search terms</p>
            <button
              onClick={() => {
                setSelectedService("All");
                setSelectedCity("All Cities");
                setSearch("");
              }}
              className="mt-6 px-6 py-2.5 bg-violet-600 text-white rounded-full font-medium hover:bg-violet-700 transition"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((saathi) => (
              <div
                key={saathi.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-violet-100 transition-all duration-300"
              >
                <div className="h-36 bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {saathi.name.charAt(0)}
                  </div>
                  {saathi.verified && (
                    <span className="absolute top-3 right-3 bg-white text-violet-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                      ✓ Verified
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{saathi.name}</h3>
                      <p className="text-sm text-gray-500">{saathi.city}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-amber-500 text-sm font-medium">★ {saathi.rating}</div>
                      <p className="text-xs text-gray-400">{saathi.reviews} reviews</p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">{saathi.bio}</p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {saathi.services.slice(0, 3).map((svc) => (
                      <span key={svc} className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">{svc}</span>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-violet-600">₹{saathi.rate}</span>
                      <span className="text-sm text-gray-400">/hr</span>
                    </div>
                    <Link
                      href="/login"
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-full transition"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-violet-600 text-white py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold">Want to become a Saathi?</h2>
          <p className="mt-2 text-violet-100">Earn up to ₹2,000/hour helping others. Flexible hours.</p>
          <Link
            href="/register"
            className="inline-block mt-6 px-8 py-3 bg-white text-violet-700 font-bold rounded-full hover:bg-violet-50 transition"
          >
            Become a Saathi →
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          © 2026 SaathiPro. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
