# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Oreia Cuts** — A barbershop booking system with a client-facing scheduling interface and a barber dashboard. Built with Next.js App Router, MongoDB/Mongoose, and JWT authentication.

The main application lives in `projeto-extensao-1/`.

## Commands

All commands must be run from `projeto-extensao-1/`:

```bash
# Start MongoDB (required before dev)
docker compose up -d

# Development server
npm run dev          # http://localhost:3000

# Build & production
npm run build
npm run start

# Lint
npm run lint
```

To seed initial data after starting the DB:
```
POST /api/seed?secret=minhasenha123
```

## Architecture

### Tech Stack
- **Next.js 16** (App Router) — both frontend and API routes
- **MongoDB 7** via Docker (port 27018) + **Mongoose 9** ODM
- **JWT** (jsonwebtoken) + **bcryptjs** for barber auth
- **Tailwind CSS 4** for styling

### Route Structure
```
app/
  page.tsx                    # Landing page
  agendar/                    # Client booking flow (no auth required)
  barber/
    login/                    # Barber login
    (protected)/              # Route group — all require JWT cookie
      dashboard/
      appointments/
      profile/
      services/
  api/
    auth/login/               # POST — barber login, returns JWT
    appointments/             # POST — client creates appointment
    availability/             # GET — free time slots
    barbers/, services/       # GET — public listings
    barber/                   # Protected CRUD — barber manages own data
    seed/                     # POST — seed test data
```

### Authentication
Two-layer protection:
1. **Middleware** (`middleware.ts`) — checks `barber-token` cookie, redirects unauthenticated requests for `/barber/*` (except `/barber/login`) to `/barber/login`
2. **API routes** — `requireAuth(request)` in `lib/auth.ts` validates `Authorization: Bearer <token>` header; throws 401 if missing/invalid

Client auth state is managed by `lib/contexts/BarberAuthContext.tsx` — persists token in both `localStorage` and a cookie (7-day expiry).

**Clients** (non-barbers) book appointments without any authentication.

### Database Models (`lib/models/`)
- **Barber** — has `password` field with `select: false` (must explicitly select it for login)
- **Appointment** — compound unique index on `(barberId, date, timeSlot)` prevents double-booking; `date` is `YYYY-MM-DD` string, `timeSlot`/`endTime` are `HH:MM` strings
- **Service** — `isActive: false` soft-deletes (deactivates) services

MongoDB connection with global cache in `lib/db.ts` prevents connection leaks in Next.js dev hot-reload.

### Environment Variables
```env
MONGODB_URI=mongodb://admin:admin@localhost:27018/barbearia?authSource=admin
JWT_SECRET=<secret>
SEED_SECRET=<secret>
```

### Tailwind Theme
Custom brand colors defined in `tailwind.config.ts`: primary blue `#0047ab`, secondary red `#cc0000`, light background `#f5f5f5`, text `#333333`.

## Key Files
- `lib/auth.ts` — JWT sign/verify/requireAuth helpers
- `lib/db.ts` — Mongoose connection with global cache
- `lib/availability.ts` — Time slot availability calculation logic
- `lib/contexts/BarberAuthContext.tsx` — Client-side barber auth state
- `API_DOCUMENTATION.md` — Full API reference with request/response examples
- `barbearia-api.postman_collection.json` — Postman collection for testing
