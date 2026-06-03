# FlashProxy Reseller Dashboard

A public reseller operations dashboard built on top of the FlashProxy Reseller API.

This project was built for the FlashProxy practical task: a reseller should be able to log in with an API key, understand account balance and usage, buy and extend proxy plans, copy connection details, inspect performance, and review meaningful dashboard activity through a backend audit trail.

The goal is a thoughtful working product slice, not a thin API explorer. The app keeps the browser away from the FlashProxy API and uses a small Next.js backend-for-frontend to handle sessions, validation, audit logging, and balance-spending safeguards.

## What Is Built

- API-key login validated through FlashProxy balance lookup.
- HTTP-only dashboard sessions backed by PostgreSQL.
- Server-side encrypted API-key storage and stable API-key hashing for audit grouping.
- Reseller overview with balance, plan, usage, and realtime account signals.
- Buy proxy flow with product-specific validation, price check, confirmation, and idempotent plan creation.
- Plans list with filters, search-oriented table UI, status, expiry, and usage indicators.
- Plan detail screen with credentials, usage, expiry, extension, metrics, and connection tools.
- Plan extension flow with price preview before confirmation and idempotent balance spend.
- Balance transaction history with filters, totals, and pagination.
- Dashboard audit log with filters, request context, metadata, and pagination.
- Plan performance metrics for supported products, including throughput, latency, errors, status codes, destinations, and hourly usage.
- Proxy connection helper with HTTP and SOCKS connection strings plus curl, Python, and Node examples.
- Upstream request logging for operational visibility.

## Tech Stack

- TypeScript
- Next.js App Router
- React
- Tailwind CSS
- shadcn/ui primitives
- Prisma
- PostgreSQL
- Zod
- Recharts
- lucide-react icons
- Geist font

## Architecture

The application uses Next.js as a backend-for-frontend:

```txt
Browser UI
  -> Next.js pages and client components
  -> Next.js Route Handlers
  -> FlashProxy Reseller API
```

The browser never calls FlashProxy directly. All upstream traffic goes through internal route handlers and shared server-side services so the app can centralize:

- session lookup
- API-key decryption
- request validation
- upstream error normalization
- idempotency headers
- audit logging
- upstream request logging

The main architecture notes live in [docs/architecture.md](docs/architecture.md).

## Product Scope

The implemented slice follows the planned reseller workflow:

1. The reseller logs in with a FlashProxy API key.
2. The backend validates the key with `GET /balance`.
3. The browser receives only an HTTP-only session cookie.
4. The dashboard shows balance, usage, plans, and realtime account state.
5. The reseller checks a proxy price before spending balance.
6. Plan creation requires explicit confirmation and uses an idempotency key.
7. The reseller opens a plan detail page to copy credentials and connection strings.
8. Plan usage and performance metrics are shown where FlashProxy supports them.
9. Plan extension previews the price before confirmation.
10. Important actions appear in the dashboard audit log.

The planning note and endpoint priority decisions live in [docs/planning.md](docs/planning.md). The commit-oriented roadmap lives in [docs/roadmap.md](docs/roadmap.md).

## Security Model

The API key is handled as sensitive server-side material.

- The API key is submitted only during login.
- Login is validated by calling `GET /balance`.
- The raw API key is not stored in localStorage or sessionStorage.
- The raw API key is not kept in client state after login submission.
- The browser stores only an HTTP-only session cookie.
- The database stores an encrypted API key.
- The database stores a stable API-key hash for audit grouping.
- Server-side code decrypts the key only when calling FlashProxy.
- Audit metadata must not include raw API keys, proxy passwords, or full secrets.
- Balance-spending operations use idempotency keys.
- Real API keys, secrets, database URLs, and private credentials must never be committed.

The session and audit tables are intentionally small, but they show who used the dashboard, what they did, and which upstream requests were made.

## FlashProxy Coverage

The app focuses on the endpoints that matter for a daily reseller workflow.

### Account And Balance

- `GET /balance`
- `GET /balance/pricing`
- `GET /balance/transactions`

Used for login validation, dashboard balance cards, transaction history, and spend visibility.

### Purchase And Plans

- `POST /plans/check-price`
- `POST /plans`
- `GET /plans`
- `GET /plans/{planId}`
- `GET /plans/{planId}/usage`
- `POST /plans/{planId}/extend`

Used for the core buy-proxy flow, plan browsing, plan detail, usage progress, and plan extension.

### Usage

- `GET /usage/summary`
- `GET /usage/realtime`

Used for overview cards and account-level usage signals.

### Metrics

- `GET /plans/{planId}/metrics/summary`
- `GET /plans/{planId}/metrics/throughput`
- `GET /plans/{planId}/metrics/latency`
- `GET /plans/{planId}/metrics/errors`
- `GET /plans/{planId}/metrics/status-codes`
- `GET /plans/{planId}/metrics/destinations`
- `GET /plans/{planId}/metrics/hourly-usage`

Metrics are product-specific. Unsupported metrics are treated as normal product behavior, not as a broken dashboard state. Individual metric sections can also be empty without disabling the whole metrics panel.

### Proxy Connection

- `GET /proxies/connection-info`

Used to build copyable HTTP and SOCKS connection strings and developer examples.

## Local Setup

### Requirements

- Node.js
- npm
- PostgreSQL
- A FlashProxy reseller API key for login testing

### Install Dependencies

```bash
npm install
```

### Configure Environment

Copy the example environment file:

```powershell
Copy-Item .env.example .env
```

Fill in the required values:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/flash_proxy"
FLASHPROXY_API_BASE_URL="https://rapi.flashproxy.com/api/v1"
SESSION_SECRET=""
API_KEY_ENCRYPTION_SECRET=""
```

Generate strong local secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Use a different generated value for `SESSION_SECRET` and `API_KEY_ENCRYPTION_SECRET`.

### Database Setup

Generate Prisma client:

```bash
npm run prisma:generate
```

Run migrations:

```bash
npm run prisma:migrate
```

### Run The App

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

Log in with a FlashProxy reseller API key. The key should be entered only in the login form and should not be committed or pasted into repository files.

## Available Scripts

```bash
npm run dev
```

Starts the local Next.js development server.

```bash
npm run build
```

Builds the production Next.js app.

```bash
npm run start
```

Starts the production server after a successful build.

```bash
npm run lint
```

Runs ESLint across the project.

```bash
npm run prisma:generate
```

Generates the Prisma client.

```bash
npm run prisma:migrate
```

Runs Prisma migrations against the configured PostgreSQL database.

## Database Tables

### `ResellerSession`

Stores dashboard sessions and encrypted API-key material.

Important fields:

- `id`
- `apiKeyHash`
- `encryptedApiKey`
- `ipAddress`
- `userAgent`
- `expiresAt`
- `revokedAt`
- `lastSeenAt`

### `AuditLog`

Stores meaningful dashboard activity.

Important fields:

- `sessionId`
- `apiKeyHash`
- `action`
- `resourceType`
- `resourceId`
- `metadata`
- `ipAddress`
- `userAgent`
- `createdAt`

### `ApiRequestLog`

Stores upstream FlashProxy request metadata.

Important fields:

- `sessionId`
- `method`
- `path`
- `statusCode`
- `durationMs`
- `success`
- `errorCode`
- `createdAt`

## UI Notes

The dashboard is built as an operational SaaS interface:

- desktop sidebar navigation
- compact cards and tables
- shadcn/ui form, dialog, select, table, tabs, tooltip, badge, and pagination primitives
- lucide-react icons
- chart-focused usage and metrics views
- concise production copy
- light theme with dark mode support

The UI avoids explanatory filler and keeps visible text focused on reseller workflows: balance, plans, usage, pricing, connection details, metrics, and audit events.

## Real Balance Safety

The task uses a real reseller balance, so spending flows are deliberately guarded.

- Price check happens before plan creation.
- Plan creation requires confirmation.
- Plan extension previews price before confirmation.
- Plan creation and extension use idempotency keys.
- Balance transactions make spending visible after the fact.
- Audit logs record meaningful actions for review.

When testing with a live key, choose the smallest useful plan or extension and inspect the balance transaction history after spending.

## Test Spending Log

I spent a small amount of the provided live balance to verify the real purchase and plan-management flows end to end.

| Product | Cost | Why it was purchased |
| --- | ---: | --- |
| Datacenter | `$1.80` | Tested the guarded purchase flow, plan list rendering, plan detail page, connection details, and metrics-supported product behavior. |
| IPv6 Residential | `$0.45` | Tested another supported product type, IPv6 connection details, plan usage, and metrics handling for product-specific API behavior. |
| Residential Lite | `$2.10` | Tested residential plan creation, plan detail rendering, extension flow, balance transaction history, and audit logging around spending actions. |
| Residential Lite extension, 5GB | `$1.05` | Tested extension price preview, confirmed plan extension, idempotent spending behavior, balance transaction updates, and audit logging for follow-up reseller actions. |

Total live balance spent during implementation testing: `$5.40`.

## Current Tradeoffs

The app intentionally prioritizes the core reseller workflow over covering every endpoint.

Deferred or partial areas:

- crypto top-up flow
- sub-user management
- plan cancellation
- paid investigation tools
- product-specific server operations
- allowed-IP editing UI
- geo catalog and stock browsing
- full automated integration test suite

These were left out to keep the first version focused on a working daily dashboard slice.

## Next Steps

The next useful product steps are:

1. Add allowed-IP management on the plan detail page.
2. Add geo catalog and stock-aware purchase helpers.
3. Add stronger automated tests around auth, purchase, extension, and audit logging.
4. Add mocked FlashProxy fixtures for safe local and CI testing.
5. Add deployment notes for production database, secret rotation, and session hardening.
6. Expand metrics diagnostics with clearer drill-down for errors and destinations.
7. Add reseller customer references and lightweight customer grouping before full sub-users.
8. Implement database log retention rules (e.g. `pg_cron` jobs) to delete `ApiRequestLog` entries older than 30 days to prevent uncontrolled database growth.

## Documentation

- [Planning](docs/planning.md)
- [Architecture](docs/architecture.md)
- [Roadmap](docs/roadmap.md)
- [FlashProxy public docs](https://rapi.flashproxy.com/docs)
