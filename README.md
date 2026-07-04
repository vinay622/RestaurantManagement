# Maison Lumière — Restaurant Reservation Management System

A full-stack reservation system for a single restaurant. Guests reserve tables for a
date and time; the house (admin) oversees the whole floor and manages every booking.
The system's job is to make **double bookings impossible** while keeping the flow
pleasant on both sides of the host stand.

- **Frontend:** React + TypeScript + Vite + Tailwind (React Router, Axios)
- **Backend:** Node.js + Express + MongoDB (Mongoose) + JWT
- **Design language:** _"The Reservation Book"_ — an aubergine menu cover, warm linen
  pages, brass ink, and a signature **table-availability timeline** that reads the floor
  at a glance.

> **Live demo:** _frontend_ → `<VERCEL_URL>` · _API_ → `<RENDER_URL>/api/v1`
> _(fill these in after deploying — see [Deployment](#deployment))_

---

## Table of contents

- [Demo accounts](#demo-accounts)
- [Repository layout](#repository-layout)
- [Local setup](#local-setup)
- [Reservation & availability logic](#reservation--availability-logic)
- [Role-based access (User vs Admin)](#role-based-access-user-vs-admin)
- [Data modeling](#data-modeling)
- [API reference](#api-reference)
- [Deployment](#deployment)
- [Assumptions](#assumptions)
- [Known limitations](#known-limitations)
- [With more time](#with-more-time)

---

## Demo accounts

The frontend runs **standalone with an in-memory mock backend** when no API URL is
configured — great for a quick look. In that mode:

| Role  | Email               | Password   |
| ----- | ------------------- | ---------- |
| Guest | `guest@maison.test` | `password` |
| Admin | `admin@maison.test` | `password` |

The login screen has one-tap buttons to fill these. To register a new **admin** against
the real backend, use the "Have a staff access code?" field on the register screen with
the `ADMIN_SIGNUP_CODE` add this code '123098'.

---

## Repository layout

```
resMan/
├── frontend/            # React + Vite SPA
│   ├── src/
│   │   ├── components/  # UI primitives + AvailabilityTimeline + ReservationTicket
│   │   ├── context/     # AuthContext (JWT session)
│   │   ├── lib/         # api client, mock adapter, time grid, case conversion
│   │   ├── pages/       # landing, auth, customer/*, admin/*
│   │   └── App.tsx      # routes + role guards
│   └── vercel.json
└── backend/             # Express + Mongoose API
    ├── src/
    │   ├── config/      # env + db
    │   ├── lib/         # time grid, errors, jwt, zod schemas
    │   ├── middleware/  # auth/RBAC, validate, camelize, error handler
    │   ├── models/      # User, Table, Reservation
    │   ├── services/    # reservationService (the availability rule)
    │   ├── controllers/ # thin request handlers
    │   ├── routes/      # /api/v1 wiring
    │   ├── seed.js      # admin + tables
    │   └── server.js
    ├── scripts/smoke.js # boot smoke: 21 checks (conflict/capacity/RBAC)
    └── render.yaml
```

---

## Local setup

**Prerequisites:** Node 20+, and MongoDB — either local (`mongodb://127.0.0.1:27017`)
or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

### 1. Backend

```bash
cd backend
cp .env.example .env          # then edit values (MONGODB_URI, JWT_SECRET, ADMIN_SIGNUP_CODE)
npm install
npm run seed                  # creates the admin account + 6 tables
npm run dev                   # API on http://localhost:4000
```

Sanity checks, without any external DB:

```bash
node scripts/smoke.js         # spins up an in-memory Mongo, runs 21 end-to-end checks
```

### 2. Frontend

```bash
cd frontend
npm install
# To use the real backend, create .env with:
#   VITE_API_URL=http://localhost:4000/api/v1
# Omit it to run against the built-in mock instead.
npm run dev                   # app on http://localhost:5173
```

---

## Reservation & availability logic

This is the heart of the system, and the rule lives in **one place** on the server
(`backend/src/services/reservationService.js`) so that creating, admin-editing, and
checking availability can never disagree. The frontend mirrors the same math
(`frontend/src/lib/time.ts`) purely to preview conflicts before a request is sent — but
**the server is always the authority.**

### The seating grid

- Dinner service runs **5:00 PM → 10:00 PM**, on a **30-minute grid** (`17:00`, `17:30`, …, `22:00`).
- A party **holds its table for 90 minutes**. So a booking at `19:00` occupies the
  window `[19:00, 20:30)`.
- Dates are stored as `YYYY-MM-DD` strings and times as `HH:mm` strings — the
  restaurant's local wall-clock. Keeping them as strings (rather than `Date` objects)
  avoids timezone drift for a single-location venue.

### A booking is accepted only if all four hold

1. **Table exists and is active.**
2. **Capacity fits the party** — `guests ≤ table.capacity`, else `422`.
3. **The seating is a valid, non-past slot** — on the grid and in the future, else `400`/`422`.
4. **No overlap** — no other _confirmed_ reservation on the **same table + date** whose
   90-minute window overlaps the requested one, else `409`.

The overlap test is a standard interval check:

```
overlap(A, B)  ⇔  A.start < B.end  AND  B.start < A.start + 90m
```

Because the hold is 90 minutes on a 30-minute grid, a `19:00` booking blocks `18:00`,
`18:30`, `19:00`, `19:30`, and `20:00` as start times on that table — the timeline shades
these so guests see exactly why a slot is unavailable.

### Availability endpoint

`GET /availability?date&guests[&time]` returns, for every active table: its
`booked_slots` for that date and whether it `available_for_request` (fits the party, and
— if a `time` is given — is free at that slot). The customer booking board and the admin
floor overview both render from this.

### Concurrency

The create/update path does a read-then-write conflict check. As a database-level
backstop against two identical simultaneous bookings, `Reservation` has a **partial
unique index** on `{ tableId, date, time }` for `status: 'confirmed'`; a duplicate-key
race surfaces as a clean `409`. (See [Known limitations](#known-limitations) for the edge
this doesn't cover.)

---

## Role-based access (User vs Admin)

Two roles, enforced on the server via JWT + middleware
(`backend/src/middleware/auth.js`):

- **`requireAuth`** — resolves the `Bearer` token to a user and attaches `req.user`.
  Missing/expired token → `401`.
- **`requireAdmin`** — runs after `requireAuth`; non-admins → `403`.

| Capability                              | Guest (customer) | Admin |
| --------------------------------------- | :--------------: | :---: |
| Register / log in                       |        ✓         |   ✓   |
| Browse availability, book a table       |        ✓         |   ✓   |
| View **own** reservations               |        ✓         |   ✓   |
| Cancel **own** reservation              |        ✓         |   ✓   |
| View **all** reservations (any date)    |                  |   ✓   |
| Edit / move / cancel **any** reservation |                  |   ✓   |
| Create / edit / remove tables           |                  |   ✓   |

The frontend enforces the same boundaries for UX (route guards + role-aware navigation),
but every admin route is independently protected on the API — the UI is never the
security boundary.

### How someone becomes an admin

There is **no public admin signup**. Registration always creates a `customer` **unless**
the request includes an `accessCode` equal to the server's secret `ADMIN_SIGNUP_CODE`
(an env var, never committed). A wrong or absent code is not an error — it just yields a
normal guest. The register screen exposes this behind a subtle "Have a staff access
code?" toggle so guests never see friction. This keeps the brief's *single restaurant*
assumption while giving the owners a safe, self-serve way to onboard staff.

---

## Data modeling

Three collections. Relationships are held by id and resolved in the application layer
(no cross-document foreign-key constraints, which MongoDB doesn't enforce anyway).

**User**
| field | type | notes |
| --- | --- | --- |
| `name` | String | |
| `email` | String | unique, lowercased, indexed |
| `passwordHash` | String | bcrypt; never serialized |
| `role` | `'customer' \| 'admin'` | indexed |

**Table**
| field | type | notes |
| --- | --- | --- |
| `label` | String | e.g. `T4` |
| `capacity` | Number | 1–20 |
| `location` | String | "Window banquette", "Chef's table" |
| `active` | Boolean | off-floor tables don't take bookings |

**Reservation**
| field | type | notes |
| --- | --- | --- |
| `tableId` | ObjectId → Table | indexed |
| `userId` | ObjectId → User | indexed |
| `date` | String `YYYY-MM-DD` | indexed |
| `time` | String `HH:mm` | grid slot |
| `durationMinutes` | Number | 90 |
| `guests` | Number | ≥ 1 |
| `status` | `'confirmed' \| 'cancelled'` | indexed; cancels are soft (kept for history) |
| `notes` | String | optional |
| partial unique index | `{tableId, date, time}` where `confirmed` | double-booking backstop |

**Key decisions**

- **Times as strings, not `Date`.** A single venue reasons in its own wall-clock; strings
  keep the grid exact and dodge UTC conversion bugs.
- **Soft cancellation.** Cancelled reservations are kept (status flip), so guests and
  admins retain history and freed slots re-open immediately.
- **camelCase in code, snake_case on the wire.** Requests are converted to camelCase by
  middleware; models serialize back to snake_case via `toPublic()`. The frontend does the
  mirror-image conversion, so both codebases stay idiomatic.

---

## API reference

Base URL: `/api/v1`. All bodies and responses are JSON (`snake_case`). Mutations use
`POST` with an RPC-style path; ids travel as query params.

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `POST /auth/register` | — | Create account (`access_code` → admin) |
| `POST /auth/login` | — | Get a JWT |
| `GET /auth/me` | user | Current user |
| `GET /tables` | user | List tables |
| `POST /tables` | admin | Create table |
| `POST /tables/update?id=` | admin | Update table |
| `POST /tables/delete?id=` | admin | Delete table (blocked if upcoming bookings) |
| `GET /availability?date&guests[&time]` | user | Floor availability |
| `POST /reservations` | user | Create a reservation |
| `GET /reservations/mine` | user | Own reservations |
| `POST /reservations/cancel?id=` | user | Cancel own (admin: any) |
| `GET /admin/reservations?[date][&status]` | admin | All reservations |
| `POST /admin/reservations/update?id=` | admin | Move / edit / cancel any |

Errors share one envelope: `{ "error": { "code, message, status, details? } }`.
Status codes are used deliberately — `400` validation, `401` unauthenticated,
`403` forbidden, `404` not found, `409` conflict (double booking), `422` unprocessable
(capacity / past time).

---

## Deployment

Recommended: **MongoDB Atlas** (database) + **Render** (API) + **Vercel** (frontend).
All have free tiers.

### 1. Database — MongoDB Atlas

1. Create a free cluster; add a database user.
2. Network access → allow `0.0.0.0/0` (or Render's IPs).
3. Copy the connection string (the `MONGODB_URI`).

### 2. API — Render

1. Push this repo to GitHub.
2. Render → **New → Blueprint**, select the repo (`backend/render.yaml` is picked up).
3. Fill the secret env vars: `MONGODB_URI`, `ADMIN_SIGNUP_CODE`, `CORS_ORIGINS`
   (your Vercel URL), and the `SEED_ADMIN_*` values. `JWT_SECRET` is generated.
4. After the first deploy, run the seed once — either locally pointed at Atlas
   (`npm run seed`) or via Render's Shell.
5. Note the service URL, e.g. `https://maison-lumiere-api.onrender.com`.

### 3. Frontend — Vercel

1. Vercel → **New Project** → import the repo, root directory `frontend`.
2. Add env var `VITE_API_URL = https://<your-render-app>.onrender.com/api/v1`.
3. Deploy. `vercel.json` handles SPA routing.
4. Set the API's `CORS_ORIGINS` to the resulting Vercel URL and redeploy the API.

---

## Assumptions

- **One restaurant, fixed floor.** Per the brief. Tables are seeded and admin-manageable.
- **Dinner service only**, 5–10 PM, 30-minute slots, 90-minute table holds. These are
  named constants (`backend/src/lib/time.js`) and easy to change in one spot.
- **Single-location wall-clock time.** No per-user timezones.
- **New registrations are customers**; admins are minted only via the access code.
- **Party size 1–12** in the UI; a table only accepts a party up to its capacity.

## Known limitations

- **Overlap uniqueness isn't fully enforced at the DB layer.** The partial unique index
  stops _identical-slot_ races; two overlapping-but-different start times booked in the
  exact same instant could in theory both pass the read-then-write check. In practice the
  window is tiny; a transaction or a per-table lock would close it (see below).
- **No pagination** on the admin list yet — fine for a single venue's nightly volume,
  but it would grow unbounded over months.
- **No email/notifications, payments, or waitlist** — explicitly out of scope.
- **No automated test suite committed** (skipped to hit the timebox). The boot smoke
  (`scripts/smoke.js`, 21 checks) covers the core conflict/capacity/RBAC paths; a Jest +
  supertest suite is the natural next step.

## With more time

- Convert the create/update path to a **MongoDB transaction** (or a short-lived per-table
  advisory lock) to make overlap checks fully atomic under concurrency.
- **Jest + supertest** suite around the availability service and RBAC, run in CI.
- Admin **pagination, search, and a day/week calendar view**; export to CSV.
- Guest niceties: edit (not just cancel) a booking, reminders, and a waitlist when the
  requested slot is full.
- Configurable **service hours / durations per day** (e.g. lunch + dinner), and
  multi-restaurant tenancy if the product ever grows beyond one room.
