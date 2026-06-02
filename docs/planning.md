# FlashProxy Reseller Dashboard Planning

## Product Goal

Build a practical reseller dashboard on top of the FlashProxy Reseller API. The dashboard should help a reseller understand their account, buy proxy plans for customers, monitor usage, and review important activity through our own backend audit trail.

This is not intended to be a thin API explorer. The goal is to build a working slice of a real product that a reseller could use every day.

## Core User Story

The first working slice will focus on the reseller's most important workflow:

1. The reseller logs in with their FlashProxy API key.
2. The dashboard validates the key and creates a secure session.
3. The reseller sees balance, spending, active plans, and usage health.
4. The reseller buys a proxy plan for a customer.
5. The dashboard checks the price before purchase, asks for confirmation, creates the plan with an idempotency key, and redirects to the new plan.
6. The reseller copies connection details and monitors usage.
7. Important dashboard actions are stored in an audit log.

## Architecture

The app will use Next.js as both the frontend and the backend-for-frontend.

```txt
Browser
  -> Next.js UI
  -> Next.js Route Handlers
  -> FlashProxy Reseller API
```

The browser will never call the FlashProxy API directly. All upstream API requests go through our backend so we can centralize authentication, validation, error handling, idempotency, and audit logging.

### Stack

- TypeScript
- Next.js App Router
- Tailwind CSS
- shadcn/ui
- Prisma
- PostgreSQL
- Zod for request validation
- HTTP-only cookies for local dashboard sessions

## API Key Handling

The reseller enters their FlashProxy API key during login. The backend validates it by calling `GET /balance`.

If validation succeeds:

- The raw API key is encrypted server-side before storage.
- A stable hash of the API key is stored for identification and auditing.
- The browser receives only an HTTP-only session cookie.
- The frontend never stores the API key in local storage, session storage, or client state beyond the login form submit.

On later requests, the backend reads the session cookie, loads the encrypted key from the database, decrypts it server-side, calls FlashProxy, and writes an audit entry for important actions.

## Data Model Direction

Initial backend tables:

- `ResellerSession`: session id, API key hash, encrypted API key, expiry, user agent, IP address, timestamps.
- `AuditLog`: who did what, resource type/id, metadata, request context, timestamp.
- `ApiRequestLog`: upstream method/path, status, duration, success/error code, timestamp.

This keeps the backend small but still shows the important operational behavior requested in the task.

## Endpoint Priorities

### P0: Core Product Flow

These endpoints matter most because they support login, account overview, buying proxies, plan management, and usage visibility.

| Endpoint | Why it matters |
| --- | --- |
| `GET /balance` | Validate API keys, show available balance and total spent. |
| `GET /balance/pricing` | Show reseller pricing before building purchase forms. |
| `POST /plans/check-price` | Preview exact cost before spending real balance. |
| `POST /plans` | Main reseller action: buy a proxy plan. Uses confirmation and idempotency. |
| `GET /plans` | Show all purchased proxy plans. |
| `GET /plans/{planId}` | Show proxy credentials, connection details, status, expiry, and limits. |
| `GET /plans/{planId}/usage` | Show plan-level usage and remaining bandwidth. |
| `GET /usage/summary` | Power overview and analytics cards. |
| `GET /usage/realtime` | Show active sessions and near-real-time usage. |
| `GET /balance/transactions` | Show spending history and balance movement. |
| `POST /plans/{planId}/extend` | Core reseller follow-up action for adding bandwidth or time. |

### P1: Strong Product Depth

These features make the dashboard more useful and differentiated after the first core slice works.

| Endpoint | Why it matters |
| --- | --- |
| `GET /plans/{planId}/metrics/summary` | High-level performance health for supported products. |
| `GET /plans/{planId}/metrics/throughput` | Traffic performance chart. |
| `GET /plans/{planId}/metrics/latency` | Latency chart and percentiles. |
| `GET /plans/{planId}/metrics/errors` | Error monitoring. |
| `GET /plans/{planId}/metrics/status-codes` | HTTP status distribution for plain HTTP traffic. |
| `GET /plans/{planId}/metrics/destinations` | Top destinations by traffic. |
| `GET /plans/{planId}/metrics/hourly-usage` | Hour-by-hour usage chart. |
| `GET /proxies/connection-info` | Build copyable proxy formats and client examples. |
| `PUT /plans/{planId}/allowed-ips` | Security feature for restricting proxy usage by source IP. |
| `GET /geo/catalog` | Help resellers understand targeting options by product. |
| `GET /proxies/stock` | Show stock and health for rotating proxy pools. |
| `GET /proxies/pools` | Required for Dedicated ISP pool selection. |

Metrics are product-specific. The UI should handle unsupported products gracefully instead of treating them as errors.

### P2: Later Scope

These are valuable but not necessary for the first thoughtful working slice.

| Endpoint | Initial decision |
| --- | --- |
| `GET /sub-users`, `POST /sub-users`, `PUT /sub-users/{id}` | Phase 2. The first slice can use `end_user_reference` for customer/order tracking. |
| `DELETE /plans/{planId}` | Destructive and no-refund action. Consider later with strong confirmation. |
| `POST /balance/topup/crypto` | Payment flow is outside the first dashboard slice. |
| `GET /balance/verify-payment/{tracking_id}` | Related to top-up flow, defer. |
| `POST /investigate/{planId}` | Costs real balance per investigation, defer. |
| `GET /servers/{planId}/*`, `POST /servers/{planId}/restart` | Product-specific advanced tools, defer until the core plan flows are stable. |

## Buy Proxy Flow

Buying a proxy is a first-class core feature, not an afterthought.

The flow should be careful because it spends real reseller balance:

1. Select product.
2. Show product-specific fields.
3. Validate input with Zod.
4. Call `POST /plans/check-price`.
5. Show cost, billing mode, and expected balance impact.
6. Require explicit confirmation.
7. Call `POST /plans` with `X-Idempotency-Key`.
8. Write audit log.
9. Refresh balance/plans and redirect to the created plan.

## UI Direction

The UI should feel like a premium SaaS dashboard built for daily reseller operations.

Priorities:

- shadcn/ui primitives for forms, tables, dialogs, cards, tabs, badges, tooltips, and command menus.
- A polished dashboard shell with strong navigation and dense but readable information.
- Charts for usage, spending, product mix, throughput, latency, and errors.
- Clear empty, loading, unsupported, and error states.
- Copy-focused proxy connection tools.
- Guarded purchase and extension flows that feel trustworthy.

The design should be visually strong, but the product should remain operational and efficient rather than becoming a decorative landing page.

## First Implementation Milestones

1. Add project planning and API priority notes.
2. Add Prisma/PostgreSQL schema for sessions and audit logs.
3. Add environment validation and FlashProxy API client.
4. Implement API key login and logout.
5. Build authenticated dashboard shell.
6. Implement overview from balance, plans, usage summary, and realtime usage.
7. Implement Buy Proxy flow with check-price and guarded creation.
8. Implement plans list and plan detail.
9. Add usage and transaction views.
10. Add audit log UI.
11. Add metrics and connection helper polish.

## Good Judgment Notes

- The dashboard should spend real balance only through explicit, confirmed flows.
- Idempotency keys are required for plan creation and extension.
- Unsupported metrics should be handled as normal product behavior.
- API keys must never be committed, logged, or exposed to the browser after login.
- The README should clearly document setup, environment variables, what was built, and what would come next.
