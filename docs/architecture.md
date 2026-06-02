# Application Architecture Conventions

This document defines how the dashboard should be built as it grows. The goal is to keep the codebase clear, reviewable, secure, and product-focused.

## Core Architecture

The app uses Next.js as a backend-for-frontend.

```txt
Browser UI
  -> Next.js pages and client components
  -> Next.js Route Handlers
  -> FlashProxy Reseller API
```

The browser must not call FlashProxy directly. All FlashProxy traffic goes through our backend so we can handle sessions, validation, upstream errors, idempotency, and audit logging consistently.

## Folder Structure

Use route groups to separate public/auth pages from the authenticated dashboard.

```txt
app/
  (auth)/
    login/
      page.tsx
  (dashboard)/
    layout.tsx
    dashboard/
      page.tsx
    buy/
      page.tsx
    plans/
      page.tsx
      [planId]/
        page.tsx
    usage/
      page.tsx
    balance/
      page.tsx
    audit/
      page.tsx
  api/
    auth/
      login/
        route.ts
      logout/
        route.ts
    dashboard/
      summary/
        route.ts
    plans/
      route.ts
      check-price/
        route.ts
      create/
        route.ts
      [planId]/
        route.ts
        usage/
          route.ts
        extend/
          route.ts
        metrics/
          route.ts
    balance/
      route.ts
    transactions/
      route.ts
    audit/
      route.ts
```

Feature components should live outside `app/` so pages stay small.

```txt
components/
  ui/
  shell/
  auth/
  dashboard/
  purchase/
  plans/
  usage/
  balance/
  audit/

lib/
  auth/
  audit/
  db/
  flashproxy/
  validation/
  formatters/
  errors/
```

## Page And Component Pattern

Pages should orchestrate. They should not become large UI or business-logic files.

Preferred pattern:

- `app/**/page.tsx`: route-level composition and initial server data loading.
- `components/<feature>/*`: feature UI and interaction components.
- `components/ui/*`: shadcn primitives only.
- `lib/*`: server-side logic, API clients, validation, formatting, persistence helpers.

Client components should be used only when interactivity is needed, such as forms, dialogs, filters, theme controls, copy actions, and chart interactions.

## Data Fetching Pattern

Use server components for initial page data where practical.

Use internal API routes for client-side interactions:

- login/logout
- check price
- create plan
- extend plan
- update allowed IPs
- paginated/filterable client tables when needed

All upstream calls must go through `lib/flashproxy/client.ts`.

Do not duplicate raw FlashProxy `fetch` calls across pages, components, or route handlers.

## Route Handler Pattern

Every protected route handler should follow the same shape:

```txt
requireSession()
validate input if needed
call FlashProxy through the shared client
write audit log for meaningful actions
return normalized response
```

For balance-spending actions:

```txt
requireSession()
validate input
require or generate idempotency key
call FlashProxy
write audit log
return normalized response
```

## FlashProxy API Client Pattern

`lib/flashproxy/client.ts` should own:

- base URL configuration
- bearer token handling
- query string construction
- JSON body handling
- idempotency header support
- request duration measurement
- upstream error normalization

The client should return predictable application-level results instead of leaking arbitrary upstream response shapes into UI code.

## Validation Pattern

Use Zod at backend boundaries:

- login request
- check-price request
- create-plan request
- extend-plan request
- allowed IP update request
- route query filters where needed

Product-specific purchase validation should be explicit. For example, bandwidth products require `bandwidth_gb`, time-billed hybrid products require `duration` and `mbps`, and Dedicated ISP requires `pool` and `quantity`.

## Session Pattern

The dashboard session is separate from the FlashProxy API key.

- Browser stores only an HTTP-only session cookie.
- Database stores encrypted API key material.
- Database stores API key hash for grouping audit events without revealing the key.
- `requireSession()` returns session metadata and a decrypted API key only on the server.
- Logout revokes the local dashboard session.

## Audit Pattern

Audit logging is part of the backend, not a UI-only feature.

Log meaningful events:

- login success
- login failure
- logout
- balance viewed
- plans listed
- plan detail viewed
- price checked
- plan created
- plan extended
- allowed IPs updated
- transactions viewed
- metrics viewed

Audit logs should include:

- session id
- API key hash
- action
- resource type
- resource id when available
- safe metadata
- request IP
- user agent
- timestamp

Never log raw API keys, proxy passwords, full credentials, or secrets.

## Error Handling Pattern

Normalize errors before they reach UI components.

Application errors should have:

- `status`
- `code`
- `message`
- optional safe `details`

The UI should show short, actionable errors. It should not show raw upstream JSON unless we explicitly build a developer/debug view.

Unsupported metrics are not a broken state. They should render a normal unsupported-product state.

## Design And UI Pattern

Use shadcn/ui primitives and feature-specific components.

Production screens should contain only operational copy that helps the reseller:

- read account state
- buy proxies
- understand pricing
- copy connection details
- monitor usage
- diagnose issues
- review audit history

Do not add filler descriptions about the UI, implementation, setup status, or framework choices.

Desktop dashboard layout should use a sidebar. Mobile authenticated navigation should use a bottom nav pattern.

## Commit Discipline

Keep commits small and intentional.

Good examples:

```txt
feat: add FlashProxy API client
feat: implement API key login sessions
feat: add proxy purchase price check flow
feat: add guarded proxy plan creation
```

Avoid broad commits like:

```txt
feat: build dashboard
```

Before major commits, run:

```txt
npm run lint
npm run build
```
