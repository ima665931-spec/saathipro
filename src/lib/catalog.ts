/** Shared service & city catalog (Find + Become Saathi) */

export const SERVICE_CATALOG = [
  { id: "movie", label: "Movie Partner", emoji: "🎬" },
  { id: "hangout", label: "Hanging Out", emoji: "🤝" },
  { id: "elder", label: "Elder Care", emoji: "👴" },
  { id: "clubbing", label: "Clubbing", emoji: "🎉" },
  { id: "shopping", label: "Shopping Buddy", emoji: "🛍️" },
  { id: "coffee", label: "Coffee Partner", emoji: "☕" },
  { id: "travel", label: "Travel Partner", emoji: "✈️" },
  { id: "event", label: "Event Partner", emoji: "🎫" },
  { id: "medical", label: "Medical Support", emoji: "🩺" },
  { id: "tour", label: "City Tour Partner", emoji: "🗺️" },
  { id: "concert", label: "Concert Partner", emoji: "🎵" },
  { id: "food", label: "Cafe & Food Partner", emoji: "🍽️" },
  { id: "network", label: "Professional Networking Partner", emoji: "💼" },
  { id: "domestic", label: "Domestic Help", emoji: "🏠" },
] as const;

export const SERVICE_LABELS = SERVICE_CATALOG.map((s) => s.label);

export const CITY_LIST = [
  "Delhi",
  "Noida",
  "Gurgaon",
  "Mumbai",
  "Bangalore",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Chandigarh",
  "Lucknow",
  "Indore",
  "Surat",
  "Nagpur",
  "Bhopal",
  "Coimbatore",
] as const;

export type SortId = "newest" | "rate_asc" | "rate_desc" | "rating";

export const SORT_OPTIONS: { id: SortId; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "rating", label: "Top rated" },
  { id: "rate_asc", label: "Price: low → high" },
  { id: "rate_desc", label: "Price: high → low" },
];
