/** Soft-launch booking policy — keep in sync with /terms and /safety */

export const BOOKING_RULES = {
  title: "Booking rules (soft launch)",
  bullets: [
    "Confirm only if you can attend — public places preferred.",
    "Cancel at least 6 hours before the session when possible.",
    "Reschedule: cancel this booking, then book a new slot with the same Saathi.",
    "No-shows may affect future booking privileges.",
    "Professional boundaries only — see Safety guidelines.",
  ],
  cancelNote:
    "You can cancel confirmed bookings from My bookings. The Saathi is notified via the platform; please also message them in chat if the session is soon.",
  rescheduleNote:
    "There is no one-click reschedule yet. Cancel the old booking (frees the time slot when applicable), then book again.",
  safetyPath: "/safety",
  termsPath: "/terms",
} as const;
