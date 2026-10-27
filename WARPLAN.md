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

## Non-negotiable rules

1. **One track = one branch** `feature/<track>` — no direct force-push to `main` without integrator.
2. **Read WARPLAN** at start of every session; **update your row** before ending.
3. **Prisma schema** — only **M2** changes unless integrator assigns otherwise.
4. **Auth / session** — only **M1** touches `src/auth.ts`, `src/auth.config.ts`, login/register OTP.
5. **No placeholders** in production paths (no TODO UI that breaks flow).
6. **No agent acquisition UI** in main header/home/dashboard.
7. End every response with **HANDOFF** block (format below).
8. Hindi + English OK; code + comments in English.

## Tracks

| ID | Track | Branch | Owner | Status | Blockers | Notes |
|----|--------|--------|-------|--------|----------|--------|
| M1 | Phone OTP login/register | `feature/otp` | — | TODO | Needs SMS provider keys | Keep Google/email working |
| M2 | Provider availability slots | `main` | Integrator | **MERGED** | — | AvailabilitySlot + API + UI |
| M3 | Post-booking reviews | `feature/reviews` | — | TODO | — | Stars on Find + profile |
| M4 | Booking alerts (WA/email) | `feature/alerts` | — | TODO | WhatsApp API or email | Client + Saathi on book |
| M5 | PWA install | `main` | Integrator | **MERGED** | — | manifest, icons, InstallPrompt |
| M6 | Cancel / reschedule rules UX | `feature/rules` | — | TODO | — | Book + dashboard + link /safety |
| M7 | QA + Razorpay E2E | — | Integrator + any | TODO | Live keys + webhook | Pay → plan active → book → chat |
| OPS | Real Saathis NCR | — | Human | TODO | Not code | 15+ verified live profiles |

### Status values
`TODO` · `IN_PROGRESS` · `BLOCKED` · `PR_READY` · `MERGED` · `DONE`

## Integration order (merge sequence)

1. **M5** PWA — **MERGED**  
2. **M2** slots — **MERGED**  
3. **M3** reviews  
4. **M4** alerts  
5. **M6** rules UX  
6. **M1** OTP (auth last)  
7. **M7** full QA on production  

## HANDOFF format (mandatory at end of every model reply)

```text
### HANDOFF
STATUS: TODO | IN_PROGRESS | BLOCKED | PR_READY | DONE
TRACK: M2
BRANCH: feature/slots
FILES:
- path/one
NEEDS FROM: NONE
WARPLAN: set M2 → PR_READY
TEST:
1. …
BLOCKERS: none
```

## Shared context (do not re-litigate)

- Domain: `saathipro.site`
- PWA shipped (M5)
- **Slots (M2):** `AvailabilitySlot` model; `/api/slots`; book enforces free slot if provider has any schedule; become-saathi has AvailabilityManager. Empty schedule = any standard time still bookable.
- Razorpay webhook: `https://saathipro.site/api/payments/razorpay/webhook`

## Exit criteria (soft launch “compete core”)

- [ ] Real Razorpay payment → plan active  
- [x] Find → book with slots (when provider set them)  
- [ ] Review path usable  
- [x] PWA installable  
- [ ] OTP **or** stable Google/email  
- [ ] Cancel/reschedule rules visible  
- [ ] 15+ live verified Saathis (OPS)  
