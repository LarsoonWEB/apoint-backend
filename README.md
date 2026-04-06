# aPoint Backend — MVP API

NestJS backend for the aPoint booking platform. Handles authentication, business management, bookings, payments (Stripe Connect), notifications, search, calendar, reviews, and WhatsApp integration.

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Framework | NestJS 11 (TypeScript) |
| ORM | Prisma 5.22 |
| Database | PostgreSQL (Supabase) |
| Auth | JWT (dual-token: access + refresh) |
| Payments | Stripe Connect (Express accounts) |
| Cache | Redis (Upstash) |
| Push | Firebase Cloud Messaging (planned) |
| Email | Resend (planned) |
| WhatsApp | Meta Cloud API |

## Project Structure

```
src/
├── auth/               # JWT auth, register, login, OAuth, password reset
├── bookings/           # Availability engine, booking CRUD, status transitions
├── businesses/         # Business CRUD, locations, services, workers, hours
├── calendar/           # Day/week/month views, blocked slots
├── common/             # Guards, decorators, filters, interceptors, utils
├── config/             # Environment configuration with validation
├── health/             # Health check endpoint
├── notifications/      # Event-driven push, email, SMS notifications
├── payments/           # Stripe Connect, PaymentIntent, webhooks, refunds
├── prisma/             # Prisma service (global)
├── reviews/            # Double-sided rating system
├── search/             # Text + geospatial search, categories
├── users/              # User profile CRUD, favorites
├── whatsapp/           # WhatsApp webhook, keyword-based booking flow
└── main.ts             # App bootstrap with CORS, Swagger, validation
```

## Quick Start

### 1. Prerequisites

- Node.js 22+
- pnpm 10+
- PostgreSQL (or Supabase project)
- Redis (or Upstash account)
- Stripe account (for payments)

### 2. Install

```bash
git clone https://github.com/LarsoonWEB/aPoint.git
cd apoint-backend
pnpm install
```

### 3. Configure

```bash
cp .env.example .env
# Fill in your values (see .env.example for all variables)
```

### 4. Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed categories
npx ts-node prisma/seed.ts
```

### 5. Run

```bash
# Development
pnpm start:dev

# Production
pnpm build
pnpm start:prod
```

### 6. API Docs

Swagger UI available at: `http://localhost:3000/api/docs`

## API Endpoints

### Auth (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/register` | Public | Register with email |
| POST | `/login` | Public | Login with email/password |
| POST | `/refresh` | Public | Refresh access token |
| POST | `/logout` | JWT | Logout (revoke refresh token) |
| POST | `/forgot-password` | Public | Request password reset |
| POST | `/reset-password` | Public | Reset password with token |

### Users (`/api/v1/users`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/me` | JWT | Get current user profile |
| PATCH | `/me` | JWT | Update profile |
| GET | `/me/bookings` | JWT | Get user's bookings |
| GET | `/me/favorites` | JWT | Get favorites |
| POST | `/me/favorites/:businessId` | JWT | Add favorite |
| DELETE | `/me/favorites/:businessId` | JWT | Remove favorite |

### Businesses (`/api/v1/businesses`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/` | JWT | Create business |
| GET | `/:id` | JWT+Role | Get business details |
| PATCH | `/:id` | JWT+Admin | Update business |
| GET | `/:slug/public` | Public | Get public profile |
| POST | `/:id/locations` | JWT+Admin | Add location |
| POST | `/:id/services` | JWT+Admin | Add service |
| POST | `/:id/workers` | JWT+Admin | Invite team member |
| POST | `/:id/locations/:lid/working-hours` | JWT+LocMgr | Set working hours |

### Bookings (`/api/v1/bookings`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/availability` | Public | Get available slots |
| POST | `/` | JWT | Create booking |
| POST | `/guest` | Public | Create guest booking |
| GET | `/:id` | JWT | Get booking by ID |
| GET | `/number/:num` | Public | Get by booking number |
| PATCH | `/:id/cancel` | JWT | Cancel booking |
| PATCH | `/:id/reschedule` | JWT | Reschedule booking |
| PATCH | `/:id/confirm` | JWT+Provider | Confirm booking |
| PATCH | `/:id/reject` | JWT+Provider | Reject booking |
| PATCH | `/:id/complete` | JWT+Provider | Mark completed |
| PATCH | `/:id/no-show` | JWT+Provider | Mark no-show |
| GET | `/business/:id` | JWT+Worker | List business bookings |

### Payments (`/api/v1/payments`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/connect/:businessId` | JWT+Owner | Create Stripe Connect |
| GET | `/connect/:businessId/status` | JWT | Get Connect status |
| GET | `/connect/:businessId/dashboard` | JWT | Get Stripe dashboard link |
| POST | `/intent/:bookingId` | JWT | Create payment intent |
| POST | `/refund/:bookingId` | JWT | Refund payment |
| POST | `/webhook` | Public | Stripe webhook |

### Calendar (`/api/v1/calendar`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/:businessId/day` | JWT+Worker | Day view |
| GET | `/:businessId/week` | JWT+Worker | Week view |
| GET | `/:businessId/month` | JWT+Worker | Month view |
| POST | `/:businessId/blocked-slots` | JWT+LocMgr | Add blocked slot |
| DELETE | `/:businessId/blocked-slots/:id` | JWT+LocMgr | Remove blocked slot |

### Search (`/api/v1/search`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/` | Public | Search businesses |
| GET | `/categories` | Public | Get categories |

### Reviews (`/api/v1/reviews`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/` | JWT | Create review |
| PATCH | `/:id/reply` | JWT+Admin | Reply to review |
| GET | `/business/:id` | Public | Get business reviews |

### WhatsApp (`/api/v1/whatsapp`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/webhook` | Public | Webhook verification |
| POST | `/webhook` | Public | Incoming messages |

### Notifications (`/api/v1/notifications`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/device` | JWT | Register push token |
| DELETE | `/device` | JWT | Unregister push token |

## Key Features

### Availability Engine
- Calculates available time slots based on working hours, existing bookings, blocked slots, and Redis soft locks
- Supports multi-service bookings with combined duration
- 15-minute slot intervals

### Slot Locking
- Redis-based soft lock (5 minutes) prevents double-booking during checkout
- DB-level constraint as final safety net

### Booking Number
- Format: `AP-YYYYMMDD-NNN` (e.g., AP-20260406-001)
- Sequential daily counter

### RBAC (Role-Based Access Control)
- 4-level hierarchy: Owner > Admin > Location Manager > Worker
- `BusinessRolesGuard` validates role per business context

### Stripe Connect
- Express accounts for providers
- Platform fee on each transaction
- Automatic refunds based on cancellation policy

### Event-Driven Notifications
- `@nestjs/event-emitter` for decoupled notification triggers
- Croatian language notification templates
- Push (FCM), Email (Resend), SMS (Twilio) channels

## Environment Variables

See `.env.example` for the complete list. Key variables:

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT token signing |
| `STRIPE_SECRET_KEY` | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `REDIS_URL` | Upstash Redis connection URL |
| `WHATSAPP_ACCESS_TOKEN` | Meta Cloud API token |

## License

Proprietary — aPoint d.o.o.
