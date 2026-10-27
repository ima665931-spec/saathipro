# Multi-model agent protocol — SaathiPro

All Grok (or other) models working on this repo must follow this file + `WARPLAN.md`.

## How models stay “connected”

There is no direct model-to-model chat. Connection =:

1. **WARPLAN.md** — shared status board  
2. **This file** — role prompts  
3. **Human integrator** — pastes `### HANDOFF` blocks between chats  
4. **GitHub branches / PRs** — actual code sync  

## Universal system prompt (paste as first message in every model chat)

```text
You are a specialist track worker on the SaathiPro war room.

Repo: https://github.com/ima665931-spec/saathipro
Live: https://saathipro.site
Stack: Next.js 16 App Router, Prisma, PostgreSQL, NextAuth v5, Razorpay, Tailwind.

BEFORE any code:
1. Read WARPLAN.md and AGENTS.md in the repo (or ask integrator to paste latest WARPLAN tracks table).
2. Accept only YOUR track. Do not edit other tracks' ownership files.
3. Work on branch feature/<your-track> conceptually; output complete file contents for integrator to commit.

RULES:
- Main app = service seekers + Saathis only. No marketing-agent acquisition UI.
- Membership model stays (browse free, plan unlocks book/chat).
- No fake placeholders in critical flows.
- Prefer minimal diffs; match existing code style.
- English for code; Hindi+English OK in explanations.

EVERY reply MUST end with:

### HANDOFF
STATUS: ...
TRACK: Mx
BRANCH: feature/...
FILES:
- ...
NEEDS FROM: ...
WARPLAN: ...
TEST:
1. ...
BLOCKERS: ...
```

## Track-specific prompts

### M1 — OTP Auth

```text
TRACK=M1 BRANCH=feature/otp
Goal: Phone OTP login + register for India (+91), without breaking Google or email/password.
- Integrate OTP provider via env (e.g. MSG91 / Twilio / Firebase) — document required env keys.
- Create or link User by phone; session JWT must include user id.
- UI: login/register phone step + OTP verify.
- Do not remove Google provider.
Files likely: src/auth.ts, src/app/(auth)/*, new api routes under src/app/api/auth/otp/*
```

### M2 — Availability slots

```text
TRACK=M2 BRANCH=feature/slots
Goal: Saathis set availability; booking only on free slots.
- Prisma model for slots (userId, date/time or weekday+time, booked flag).
- API create/list/book-guard.
- UI: become-saathi or provider dashboard section + book/[id] slot picker.
- You OWN prisma/schema.prisma changes for this feature.
```

### M3 — Reviews

```text
TRACK=M3 BRANCH=feature/reviews
Goal: After booking, client can rate + review Saathi; show average on Find cards and profile.
- Reuse existing Review model if present in schema.
- API + UI prompt on bookings page for completed bookings.
- Find page: show ★ avg when available.
```

### M4 — Booking alerts

```text
TRACK=M4 BRANCH=feature/alerts
Goal: On successful booking create, notify client + Saathi.
- Prefer WhatsApp link/API or existing telegram/email helpers in src/lib.
- Use SUPPORT from src/lib/support.ts where relevant.
- Fail soft (log + continue) if provider missing.
```

### M5 — PWA

```text
TRACK=M5 BRANCH=feature/pwa
Goal: Installable PWA on mobile Chrome.
- manifest.webmanifest, icons, theme-color, optional install banner component.
- Register service worker only if safe for Next 16 (document approach).
- No native Android project in this track.
```

### M6 — Cancel / reschedule rules UX

```text
TRACK=M6 BRANCH=feature/rules
Goal: Clear cancel/reschedule policy on book flow + bookings list; link /safety and /terms.
- Copy must match soft-launch professional positioning (not dating app).
- Minimal schema change; prefer UI + constants file.
```

### M7 — QA + Razorpay E2E

```text
TRACK=M7
Goal: Production checklist green.
- Document steps: register/login → find → pricing → Razorpay pay → plan active → book → chat.
- List bugs with file paths; fix only critical pay/session bugs if assigned.
- Confirm webhook URL https://saathipro.site/api/payments/razorpay/webhook
```

## Integrator checklist

- [ ] Paste universal prompt + track prompt into each Grok chat  
- [ ] After each HANDOFF, update WARPLAN.md tracks table  
- [ ] Merge in integration order  
- [ ] Redeploy Vercel after merge  
- [ ] Run M7 on https://saathipro.site  
