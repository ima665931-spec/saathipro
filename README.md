# SaathiPro

India's #1 Professional Social & Lifestyle Support Platform

## Current Status (MVP in progress)

### Done
- Landing page
- Google Login + Email/Password Register & Login
- Basic Dashboard
- Database schema (User + SaathiProfile)

### Coming next
- Find Saathi page
- Become Saathi flow
- Booking system
- Payments (Razorpay)

---

## Tech Stack

- Next.js 16 (App Router)
- NextAuth.js v5 (Google + Credentials)
- Prisma + SQLite
- Tailwind CSS

---

## Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and fill:

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="any-random-long-string-at-least-32-characters"
AUTH_URL="http://localhost:3000"

# Google OAuth (optional for now)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Generate AUTH_SECRET:
```bash
openssl rand -base64 32
```

### 3. Setup Database

```bash
npx prisma generate
npx prisma db push
```

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000

---

## Google Login Setup (optional)

1. Go to https://console.cloud.google.com/
2. Create project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Put Client ID & Secret in `.env`

---

## Pages

| Route            | Description              |
|------------------|--------------------------|
| `/`              | Landing page             |
| `/login`         | Login (Google + Email)   |
| `/register`      | Register                 |
| `/dashboard`     | User dashboard           |

---

Built with love
