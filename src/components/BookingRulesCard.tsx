import Link from "next/link";
import { BOOKING_RULES } from "@/lib/booking-rules";

export default function BookingRulesCard({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-border bg-white shadow-card ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <h2 className="font-display font-bold text-ink text-sm">{BOOKING_RULES.title}</h2>
      <ul className="mt-2 space-y-1.5 text-xs text-ink-muted list-disc pl-4 leading-relaxed">
        {BOOKING_RULES.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      {!compact && (
        <>
          <p className="mt-3 text-xs text-ink-muted">{BOOKING_RULES.cancelNote}</p>
          <p className="mt-1 text-xs text-ink-muted">{BOOKING_RULES.rescheduleNote}</p>
        </>
      )}
      <p className="mt-3 text-xs">
        <Link href={BOOKING_RULES.safetyPath} className="text-accent font-semibold">
          Safety
        </Link>
        {" · "}
        <Link href={BOOKING_RULES.termsPath} className="text-accent font-semibold">
          Terms
        </Link>
      </p>
    </div>
  );
}
