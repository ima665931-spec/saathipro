# SaathiPro — E2E test checklist (M7)

Base URL: **https://saathipro.site**

## Auth
- [ ] Google login works (redirect URI includes saathipro.site)
- [ ] Email/password register + login (if enabled)
- [ ] OTP login (when M1 merged)
- [ ] Logout clears session

## Browse
- [ ] `/find` loads without login
- [ ] Filters city / service work
- [ ] Saathi profile `/saathi/[id]` opens

## Membership + Razorpay
- [ ] `/pricing` → select plan → `/pay`
- [ ] Razorpay checkout opens
- [ ] Successful pay → “You're in” / plan active on dashboard
- [ ] Webhook configured: `/api/payments/razorpay/webhook`

## Provider
- [ ] `/become-saathi` save profile (no “User not found”)
- [ ] Without plan: profile saved, not live / needsPayment
- [ ] With plan: live on Find (and slots if M2 live)

## Book + chat
- [ ] Book requires active plan
- [ ] Slot required if M2 merged
- [ ] Booking appears on `/bookings`
- [ ] `/chat/[bookingId]` send + receive (poll)

## Reviews / rules / PWA (when merged)
- [ ] Review prompt on completed booking
- [ ] Cancel/reschedule copy visible
- [ ] Add to Home Screen works on Android Chrome

## Legal / support
- [ ] `/terms` `/privacy` `/safety`
- [ ] Footer WhatsApp opens correct number

## Bugs found
| Date | Area | Severity | Notes | Fixed? |
|------|------|----------|-------|--------|
| | | | | |
