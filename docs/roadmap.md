# Implementation Roadmap

This roadmap keeps the work intentionally small and reviewable. Each slice should produce a focused commit that explains what changed and why.

## Commit Plan

### 1. Planning Note

Commit:

```txt
docs: define dashboard scope and API priorities
```

Purpose:

- Capture the product story, architecture, endpoint priorities, and safety decisions before feature work starts.
- Show that the dashboard is planned as a real reseller product, not a thin API explorer.

Status: ready

### 2. UI Foundation

Commit:

```txt
chore: configure shadcn UI foundation
```

Purpose:

- Add shadcn/ui configuration.
- Add shared UI utilities.
- Establish the base design system before building dashboard screens.

Expected work:

- `components.json`
- `lib/utils.ts`
- Base shadcn components needed early: button, input, card, badge, table, dialog, form, select, tabs, tooltip, skeleton.
- Initial design tokens aligned with a premium SaaS dashboard.

### 3. Database Foundation

Commit:

```txt
feat: add Prisma session and audit log schema
```

Purpose:

- Add PostgreSQL-backed persistence for sessions, audit logs, and upstream request logs.
- Support the task requirement to see who used the dashboard and what they did.

Expected work:

- Prisma setup.
- `.env.example` with `DATABASE_URL`.
- `ResellerSession` model.
- `AuditLog` model.
- `ApiRequestLog` model.

### 4. Environment And Crypto Helpers

Commit:

```txt
feat: add environment validation and API key crypto helpers
```

Purpose:

- Validate required runtime configuration.
- Keep FlashProxy API keys out of the browser and out of plaintext database storage.

Expected work:

- Environment schema.
- API key hashing helper.
- API key encryption/decryption helper.
- Session token generation helper.

### 5. FlashProxy API Client

Commit:

```txt
feat: add FlashProxy API client
```

Purpose:

- Centralize upstream FlashProxy requests.
- Normalize errors, timing, and response handling.

Expected work:

- Base URL configuration.
- Bearer token handling.
- Typed request helper.
- Upstream error normalization.
- Request duration measurement for logging.

### 6. API Key Login Sessions

Commit:

```txt
feat: implement API key login sessions
```

Purpose:

- Let a reseller log in with an API key.
- Validate the key using `GET /balance`.
- Create an HTTP-only session and audit login activity.

Expected work:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- Session cookie handling.
- Login success/failure audit events.

### 7. Authenticated Dashboard Shell

Commit:

```txt
feat: build authenticated dashboard shell
```

Purpose:

- Create the premium dashboard frame that future pages will use.
- Establish navigation and layout consistency early.

Expected work:

- Authenticated route group.
- Sidebar navigation.
- Top bar with account/balance area.
- Placeholder dashboard pages.
- Responsive shell behavior.

### 8. Reseller Overview

Commit:

```txt
feat: add reseller overview summary
```

Purpose:

- Give the reseller an immediate understanding of account health.

Expected APIs:

- `GET /balance`
- `GET /plans`
- `GET /usage/summary`
- `GET /usage/realtime`

Expected UI:

- Balance card.
- Active plans count.
- Total usage.
- Realtime sessions.
- Recent plan and usage highlights.

### 9. Purchase Price Check

Commit:

```txt
feat: add proxy purchase price check flow
```

Purpose:

- Start the core buy-proxy flow without spending balance yet.
- Show exact pricing and balance impact before purchase.

Expected API:

- `POST /plans/check-price`

Expected UI:

- Product-specific purchase form.
- Price preview panel.
- Validation and error states.

### 10. Guarded Plan Creation

Commit:

```txt
feat: add guarded proxy plan creation
```

Purpose:

- Complete the main reseller action: buying a proxy.
- Spend real balance only after explicit confirmation.

Expected API:

- `POST /plans`

Expected behavior:

- Confirmation dialog.
- `X-Idempotency-Key`.
- Audit log event.
- Refresh balance/plans.
- Redirect to created plan detail.

### 11. Proxy Plans List

Commit:

```txt
feat: add proxy plans list
```

Purpose:

- Let resellers browse and search their purchased proxy plans.

Expected API:

- `GET /plans`

Expected UI:

- Plans table.
- Status filter.
- Product filter.
- Search by plan id, username, or customer reference.
- Usage and expiry indicators.

### 12. Plan Detail And Usage

Commit:

```txt
feat: add plan detail and usage view
```

Purpose:

- Show everything needed to hand a proxy to a customer and monitor it.

Expected APIs:

- `GET /plans/{planId}`
- `GET /plans/{planId}/usage`
- `GET /usage/plans/{planId}`

Expected UI:

- Credentials and connection strings.
- Copy actions.
- Usage progress.
- Billing and expiry details.
- Allowed IP display.

### 13. Balance Transactions

Commit:

```txt
feat: add balance transaction history
```

Purpose:

- Help resellers understand balance movement and spending history.

Expected APIs:

- `GET /balance`
- `GET /balance/transactions`
- `GET /balance/pricing`

Expected UI:

- Transaction table.
- Transaction type filters.
- Balance summary.
- Pricing overview.

### 14. Dashboard Audit Log

Commit:

```txt
feat: add dashboard audit log view
```

Purpose:

- Expose our backend audit trail in the dashboard.

Expected UI:

- Audit log table.
- Action filters.
- Resource metadata.
- Request context such as timestamp, user agent, and IP address.

### 15. Plan Performance Metrics

Commit:

```txt
feat: add plan performance metrics
```

Purpose:

- Add deeper operational visibility for products that support metrics.

Expected APIs:

- `GET /plans/{planId}/metrics/summary`
- `GET /plans/{planId}/metrics/throughput`
- `GET /plans/{planId}/metrics/latency`
- `GET /plans/{planId}/metrics/errors`
- `GET /plans/{planId}/metrics/status-codes`
- `GET /plans/{planId}/metrics/destinations`
- `GET /plans/{planId}/metrics/hourly-usage`

Expected UI:

- Throughput chart.
- Latency chart.
- Error chart.
- Success rate and peak Mbps cards.
- Unsupported-product state.

### 16. Proxy Connection Helper

Commit:

```txt
feat: add proxy connection helper
```

Purpose:

- Make proxy usage easier for reseller customers and developers.

Expected API:

- `GET /proxies/connection-info`

Expected UI:

- HTTP and SOCKS formats.
- Copyable connection strings.
- curl, Python, and Node examples.

### 17. README And Final Notes

Commit:

```txt
docs: add setup guide and implementation notes
```

Purpose:

- Explain how to run the project.
- Explain what was built.
- Document tradeoffs, safety choices, and next steps.

Expected work:

- Setup instructions.
- Environment variables.
- Database setup.
- API key safety notes.
- Feature summary.
- Future improvements.

## Working Rules

- Keep commits small and descriptive.
- Prefer one feature or foundation layer per commit.
- Run lint and build before major commits.
- Never commit real API keys or secrets.
- Keep purchase and extension flows confirmed and idempotent.
- Add audit logging for meaningful user actions.
