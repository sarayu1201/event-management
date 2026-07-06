# EventHub — Full-Stack Event Ticketing Platform (Demo)

A BookMyShow-style event ticketing platform built with **React + Vite** (frontend),
**Node.js + Express** (backend), and **MongoDB** (database), including a **fake/simulated
payment gateway** for demo purposes. It replicates the 3-tier login/signup workflow shown
in your reference screenshot:

- **For Users** — Login / Signup
- **For Event Organisers** — Login / Signup
- **For Promoters** — Login only (promoter accounts are created by an organiser/admin,
  not self-registered — matching the original app's behavior)

---

## 1. Architecture Overview

```
eventapp/
├── backend/                  Node.js + Express REST API
│   ├── config/db.js          MongoDB connection (Mongoose)
│   ├── models/                User, Event, Booking schemas
│   ├── middleware/            JWT auth guard, role guard, error handler
│   ├── controllers/           Business logic per resource
│   ├── routes/                Express routers
│   ├── seed/seed.js           Creates demo accounts + sample events
│   └── server.js              App entry point
│
└── frontend/                 React 18 + Vite SPA
    └── src/
        ├── api/axios.js       Axios instance w/ JWT interceptor
        ├── context/            AuthContext (global user/session state)
        ├── components/         Navbar (3-tier dropdown), EventCard, ProtectedRoute, DashboardNav
        ├── pages/               All routed pages (see Workflow below)
        └── styles/global.css   Dark theme UI (matches reference design)
```

**Auth model:** a single `User` collection with a `role` field
(`user | organiser | promoter | admin`). JWT tokens carry the role, and both frontend
route guards and backend middleware (`protect` + `authorize(...roles)`) enforce it —
so an organiser token can never hit a promoter-only endpoint, etc.

**Payment:** there is no real payment integration. `POST /api/payment/process/:bookingId`
simulates a gateway: it validates the card fields look plausible (16-digit number, MM/YY,
CVV), waits ~1.4s on the frontend to feel real, then marks the booking `success`,
generates a fake `transactionId`, and decrements seat inventory. No real money or card
data is ever transmitted anywhere.

---

## 2. The Workflow (matches your screenshot)

1. **Home** → browse premium events, hero banner, popular events grid.
2. **Navbar → account icon dropdown** shows exactly:
   - FOR USERS: Login / Signup
   - FOR EVENT ORGANISERS: Login / Signup
   - FOR PROMOTERS: Login (no signup button — by design)
3. **User flow:** Signup/Login → browse Events → Event Detail → pick ticket count →
   Checkout (attendee info + optional promo code) → Fake Payment Gateway (card form) →
   Booking Confirmation (ticket ID, transaction ID) → My Bookings.
4. **Organiser flow:** Signup/Login → Dashboard (revenue/tickets overview) → Create Event →
   Manage Event (view bookings, assign a promoter by their code/email).
5. **Promoter flow:** Login (account pre-created, see demo logins) → Dashboard shows their
   referral code, commission rate, bookings made with their code, and revenue/commission
   generated → My Events (events they're assigned to).

Promo codes give a 10% demo discount and are only valid if the organiser has explicitly
assigned that promoter to that specific event (`event.promoters[]`).

---

## 3. Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI

### Backend

```bash
cd backend
npm install
cp .env.example .env        # edit MONGO_URI / JWT_SECRET if needed
npm run seed                 # creates demo accounts + sample events (see below)
npm run dev                  # starts API on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env        # defaults to http://localhost:5000/api
npm run dev                  # starts app on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

> Run backend and frontend in two separate terminals — both need to stay running.

---

## 4. Demo Login Credentials

After running `npm run seed` in the backend, these accounts are ready to use:

| Role       | Email               | Password    | Notes                          |
|------------|----------------------|-------------|---------------------------------|
| User       | `user@demo.com`      | `password123` | Book tickets via the dropdown → For Users → Login |
| Organiser  | `organiser@demo.com` | `password123` | Create/manage events, view sales |
| Promoter   | `promoter@demo.com`  | `password123` | Referral code: `PRIYA10` — try it as a promo code at checkout |
| Admin      | `admin@demo.com`     | `password123` | Reserved for future admin features |

You can also freely sign up new **User** or **Organiser** accounts from the UI.
Promoters cannot self-signup (matches your screenshot) — create more via the seed
script or directly in MongoDB by setting `role: "promoter"` and a unique `promoCode`.

### Test payment card (fake gateway)
Any of the following works — nothing is actually charged:
- Card number: `4242 4242 4242 4242`
- Expiry: any future `MM/YY`, e.g. `12/28`
- CVV: any 3 digits, e.g. `123`

---

## 5. Key API Endpoints

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public (role: user/organiser only) |
| POST | `/api/auth/login` | Public |
| GET | `/api/events` | Public — list/filter events |
| GET | `/api/events/:id` | Public |
| POST | `/api/events` | Organiser |
| GET | `/api/events/mine/organiser` | Organiser |
| POST | `/api/events/:id/assign-promoter` | Organiser |
| POST | `/api/bookings` | User — creates a pending booking |
| POST | `/api/payment/process/:bookingId` | User — fake payment gateway |
| GET | `/api/bookings/mine` | User |
| GET | `/api/bookings/event/:eventId` | Organiser |
| GET | `/api/promoter/events` | Promoter |
| GET | `/api/promoter/stats` | Promoter |

---

## 6. Notes for Going to Production

This is a demo/portfolio-grade build. Before using it for real bookings you'd want to:
- Swap the fake payment gateway for a real one (Razorpay/Stripe) — the `paymentController.js`
  is intentionally isolated to make this a drop-in swap.
- Add server-side seat locking/holds to prevent race conditions on high-demand events.
- Add email/SMS OTP verification, password reset, and rate limiting.
- Add pagination to event/booking listings.
- Move image uploads to a real storage service (S3/Cloudinary) instead of URL fields.
