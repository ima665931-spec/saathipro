# SaathiPro — E2E test checklist (M7)

Base URL: **https://saathipro.site**  
QA pass date: **2026-10-27** (automated + live fetch)

## Public / SEO
- [x] Home loads · Soft launch Delhi NCR banner
- [x] `/terms` loads
- [x] `/privacy` (fetch flake once — recheck manually)
- [x] `/safety` loads · core rules present
- [x] Footer support (WhatsApp / email) — code verified earlier

## PWA
- [x] `/manifest.webmanifest` 200
- [x] `/icons/icon.svg` 200
- [x] Manifest icons → SVG only (PNG dynamic route was 404 — fixed)
- [ ] Android Chrome “Install / Add to Home Screen” — **manual on phone**

## Browse / supply
- [x] `/api/saathis` 200
- [x] Live Saathis count: **1** (Jaipur · rating 5 · 1 review)
- [ ] Target **15+ verified NCR** — **OPS gap**
- [x] `/find` client page loads (JS)

## Auth (manual)
- [ ] Google login end-to-end
- [ ] Email/password if used
- [ ] Logout
- [ ] Become Saathi save (no User not found)

## Membership + Razorpay (**critical manual**)
- [ ] `/pricing` → plan → `/pay`
- [ ] Checkout opens
- [ ] **Real ₹ payment completes**
- [ ] Plan active on dashboard (“You're in”)
- [ ] Webhook: `https://saathipro.site/api/payments/razorpay/webhook` configured in Razorpay dashboard
- [ ] `RESEND_API_KEY` optional for booking emails

## Book + chat + review
- [ ] Plan required gate on book
- [ ] Rules checkbox on book form
- [ ] Slot-only times when provider set availability
- [ ] Booking → `/bookings`
- [ ] Chat `/chat/[id]`
- [ ] Leave review → stars on Find

## Alerts
- [ ] Client email on book (needs Resend)
- [ ] Saathi email on book (needs Resend)

## Bugs found (this QA)
| Date | Area | Severity | Notes | Fixed? |
|------|------|----------|-------|--------|
| 2026-10-27 | PWA icons | Medium | `/icons/icon/192` 404; manifest pointed at missing PNG | Yes — SVG-only manifest |
| 2026-10-27 | Supply | Critical for launch | Only 1 live Saathi; not NCR density | OPS |
| 2026-10-27 | Safety page scrape | Low | Cancel section may need hard refresh after deploy | Deploy lag |

## Soft-launch gate
| Gate | Status |
|------|--------|
| Core pages up | PASS |
| PWA manifest | PASS (after fix) |
| Real pay → plan | **PENDING human** |
| 15+ NCR Saathis | **FAIL / OPS** |
| Reviews path | Code PASS · needs more bookings |
