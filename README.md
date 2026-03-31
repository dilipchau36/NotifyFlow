# NotifyFlow

> Multi-tenant notification delivery platform — one API to send emails, SMS, and webhooks with async queuing, automatic retries, and real-time delivery tracking.

Inspired by [Courier](https://courier.com), [Knock](https://knock.app), and [Novu](https://novu.co). Built to demonstrate production-grade backend architecture.

```http
POST /v1/notify
x-api-key: nf_live_xxxxxxxxxxxxxxxx

{
  "channel": "email",
  "to": "user@example.com",
  "subject": "Your order is confirmed",
  "body": "Order #1042 has been placed successfully."
}
```

---

## What it does

NotifyFlow lets developers send notifications to their users without building delivery infrastructure from scratch. Sign up, get an API key, call one endpoint — NotifyFlow handles routing, delivery, retries, and full observability.

---

## Architecture

```
Client / Tenant App
       │
       ▼
  API Gateway  (Node.js + TypeScript + Express)
  ├── API key auth   → Redis cache + PostgreSQL
  ├── Idempotency    → prevents duplicate sends
  └── Enqueue        → AWS SQS (FIFO)
       │
       ▼
  Worker Service  (separate Node.js process)
  ├── Email   → SendGrid
  ├── SMS     → Twilio
  └── Webhook → tenant endpoints (HMAC signed)
       │
       ▼
  PostgreSQL  (delivery logs, tenants, retry state)
       │
       ▼
  Dashboard  (Next.js + Socket.IO)
  └── Real-time delivery status per tenant
```

---

## Key Features

- **Multi-tenant** — isolated API keys, rate limiting, and delivery logs per tenant
- **Async delivery** — notifications queued in AWS SQS, fully decoupled from the API response
- **Retry logic** — exponential backoff with dead-letter queue for permanently failed deliveries
- **Idempotency** — pass an `Idempotency-Key` header and duplicate requests never trigger duplicate sends
- **Real-time dashboard** — live delivery status updates via WebSockets
- **Secure API keys** — SHA-256 hashed at rest, shown to the user exactly once, never stored in plaintext
- **Redis caching** — API key lookups cached for 5 minutes to avoid DB hits on every request
- **SOC-ready logging** — every delivery attempt logged with status, error message, and timestamp

---

## Tech Stack

| Layer     | Technology                          |
| --------- | ----------------------------------- |
| API       | Node.js, TypeScript, Express        |
| Queue     | AWS SQS (FIFO)                      |
| Database  | PostgreSQL (via Knex.js)            |
| Cache     | Redis (API key lookup, rate limit)  |
| Email     | SendGrid                            |
| SMS       | Twilio                              |
| Dashboard | Next.js 16, Tailwind CSS, Socket.IO |
| Monorepo  | Turborepo + pnpm workspaces         |
| Infra     | Docker, AWS                         |

---

## Project Structure

```
notifyflow/
├── apps/
│   ├── api/                  # Express API gateway
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/     # JWT + API key auth
│   │       │   ├── notify/   # Notification send + logs
│   │       │   ├── tenants/  # Tenant management
│   │       │   └── webhooks/ # Inbound webhook handling
│   │       └── shared/
│   │           ├── db/       # Postgres + Redis clients
│   │           ├── queue/    # SQS producer
│   │           └── middleware/
│   ├── worker/               # SQS consumer + delivery handlers
│   │   └── src/
│   │       ├── handlers/     # email, sms, webhook handlers
│   │       └── retry/        # exponential backoff strategy
│   └── dashboard/            # Next.js real-time dashboard
│       └── app/
│           ├── dashboard/    # delivery logs + stats
│           └── settings/     # API key management
└── packages/
    └── shared-types/         # TypeScript types shared across apps
```

```
API (producer)          Kafka Topic           Worker (consumer)
     │                 ┌──────────────┐            │
     │  produce msg    │ notifications│  consume   │
     └────────────────►│  partition 0 ├───────────►│
                       │  partition 1 │            │
                       └──────────────┘
                       messages stay 7 days
                       regardless of consumption
```

---

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker (for Postgres + Redis)
- AWS account (free tier is enough for SQS)

### Installation

```bash
# Clone the repo
git clone https://github.com/chaudilip/notifyflow.git
cd notifyflow

# Install all dependencies
pnpm install

# Copy environment variables
cp .env.example .env
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/notifyflow

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your_super_secret_jwt_key

# AWS
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
SQS_QUEUE_URL=https://sqs.ap-south-1.amazonaws.com/your-account-id/notifyflow.fifo

# Email
SENDGRID_API_KEY=your_sendgrid_key

# SMS
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

### Start Services

```bash
# Start Postgres + Redis via Docker
docker-compose up -d

# Run database migrations
pnpm --filter @notifyflow/api run migrate

# Start all apps in parallel
pnpm dev
```

This starts:

- API on `http://localhost:3001`
- Dashboard on `http://localhost:3000`
- Worker polling SQS in the background
- Shared types compiling in watch mode

---

## API Reference

### Auth

| Method | Endpoint           | Description           |
| ------ | ------------------ | --------------------- |
| POST   | `/auth/register`   | Create tenant account |
| POST   | `/auth/login`      | Get JWT token         |
| POST   | `/auth/rotate-key` | Rotate API key        |

### Notifications

| Method | Endpoint          | Auth    | Description         |
| ------ | ----------------- | ------- | ------------------- |
| POST   | `/v1/notify`      | API key | Send a notification |
| GET    | `/v1/notify/logs` | API key | List delivery logs  |
| GET    | `/v1/notify/:id`  | API key | Get delivery detail |

### Channels

```json
{ "channel": "email",   "to": "user@example.com", "subject": "Hello", "body": "..." }
{ "channel": "sms",     "to": "+919876543210",     "body": "Your OTP is 123456" }
{ "channel": "webhook", "to": "https://your.app/webhooks", "body": "{\"event\": \"order.placed\"}" }
```

### Idempotency

Pass `Idempotency-Key: <unique-string>` header to prevent duplicate sends on network retries. Safe to retry indefinitely — the same notification will never be sent twice.

```http
POST /v1/notify
x-api-key: nf_live_xxxx
Idempotency-Key: order-1042-confirmation

{ "channel": "email", ... }
```

---

## Database Schema

```
tenants          → one row per customer account
api_keys         → hashed keys linked to a tenant
notifications    → one row per send request (status: queued → delivered / failed)
delivery_attempts→ one row per attempt (tracks retries + error messages)
webhook_endpoints→ outbound webhook URLs registered by tenants
```

---

## Retry Logic

Failed deliveries are retried with exponential backoff:

```
Attempt 1 → immediate
Attempt 2 → 30 seconds
Attempt 3 → 5 minutes
Attempt 4 → 30 minutes
Attempt 5 → dead-letter queue (status: dead)
```

Dead-letter notifications are visible in the dashboard and can be manually retried.

---

## API Key Security

- Keys are generated as `nf_live_[48 random hex chars]`
- Only the SHA-256 hash is stored in the database
- The raw key is shown **once** on creation and never again
- Redis caches validated keys for 5 minutes to reduce DB load
- Keys can be rotated any time from the dashboard or `POST /auth/rotate-key`

---

## License

MIT

---

Built by [Dilip Chau](https://github.com/chaudilip)
