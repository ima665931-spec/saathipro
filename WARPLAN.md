# SaathiPro War Plan — live coordination board

| ID | Track | Status |
|----|--------|--------|
| M1 | Phone OTP | TODO |
| M2 | Availability slots | **MERGED** |
| M3 | Reviews | **MERGED** |
| M4 | Booking alerts | **MERGED** |
| M5 | PWA | **MERGED** |
| M6 | Cancel/rules UX | TODO |
| M7 | QA + Razorpay E2E | TODO |
| OPS | Real Saathis NCR | TODO |

## M4 notes
- `src/lib/notify.ts` → client confirm email + Saathi new-booking email
- Optional: `TELEGRAM_BOT_TOKEN` + `TELEGRAM_OPS_CHAT_ID` for ops alert
- Needs `RESEND_API_KEY` (+ `EMAIL_FROM`) on Vercel for real email
- Wired in `POST /api/bookings` via `notifyBookingCreated`

## Next
M6 rules UX → M1 OTP → M7 QA
