# SaathiPro War Plan — live

| ID | Track | Status |
|----|--------|--------|
| M1 | Phone OTP | TODO (needs SMS keys) |
| M2 | Availability slots | **MERGED** |
| M3 | Reviews | **MERGED** |
| M4 | Booking alerts | **MERGED** |
| M5 | PWA | **MERGED** (SVG icons fix 27 Oct) |
| M6 | Cancel/rules UX | **MERGED** |
| M7 | QA + Razorpay E2E | **IN_PROGRESS** — code green; real pay + supply human |
| OPS | Real Saathis NCR | **BLOCKER** — only 1 live profile |

## M7 summary (2026-10-27)
- Home, terms, safety, manifest, saathis API: **OK**
- PWA PNG 404 fixed → SVG-only manifest
- **You must:** 1 real Razorpay payment → plan unlock
- **You must:** onboard 10–15 verified NCR Saathis
- Optional: `RESEND_API_KEY` for booking emails

## Soft launch definition
Usable when: pay works + ≥10 live NCR Saathis + book/chat without crash.
