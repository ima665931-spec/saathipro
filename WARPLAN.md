# SaathiPro War Plan — live coordination board

> **Single source of truth for all AI models + human integrator.**  
> Read this before coding. Update your row when status changes.

## Mission

Soft-launch product parity vs **KoPartner core UX** (not marketing).

| Item | Value |
|------|--------|
| Live domain | https://saathipro.site |
| Repo | ima665931-spec/saathipro |
| Stack | Next.js 16 · Prisma · PostgreSQL · NextAuth · Razorpay · Tailwind |
| Region | Soft launch · Delhi NCR |
| Out of scope (main app) | Agent / marketing-partner UI (separate app later: Saathi of SaathiPro) |
| Business model | Membership unlocks book + chat; browse free |

## Tracks

| ID | Track | Status | Notes |
|----|--------|--------|--------|
| M1 | Phone OTP | TODO | SMS provider keys |
| M2 | Availability slots | **MERGED** | AvailabilitySlot + book guard |
| M3 | Post-booking reviews | **MERGED** | API existed; Find real avg; bookings CTA |
| M4 | Booking alerts | TODO | WA/email on book |
| M5 | PWA | **MERGED** | manifest + InstallPrompt |
| M6 | Cancel/rules UX | TODO | policy copy |
| M7 | QA + Razorpay E2E | TODO | |
| OPS | Real Saathis NCR | TODO | human |

## Integration order

1. M5 MERGED → 2. M2 MERGED → 3. **M3 MERGED** → 4. M4 → 5. M6 → 6. M1 → 7. M7

## Shared context

- Reviews: POST `/api/reviews`, GET by saathiId; bookings page Leave review; Find shows ★ + count or “New”.
- Slots + PWA already on main.
- Domain `saathipro.site`
