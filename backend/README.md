# SavingsApp API — Backend Skeleton

ASP.NET Core (.NET 8) Web API for an automated SEPA savings platform. This is the **backend
skeleton**: it compiles, runs, migrates, and seeds. Third-party integrations (GoCardless,
Swan) are coded to their documented API shapes with credentials left blank — no live calls
are made until you supply sandbox secrets.

## Stack

- ASP.NET Core Web API, EF Core 8 + Npgsql (PostgreSQL)
- Hangfire (PostgreSQL storage) for recurring debit scheduling
- JWT bearer auth, BCrypt password hashing
- GoCardless (REST) for SEPA mandates + payments
- Swan (GraphQL) for virtual IBAN wallets

## Run with Docker

```bash
cd backend
docker compose up --build
```

- API: http://localhost:8080/swagger
- Hangfire dashboard: http://localhost:8080/hangfire
- Postgres: localhost:5432 (postgres/postgres)

## Run locally (Postgres only in Docker)

```bash
cd backend
docker compose up -d postgres
dotnet run --project SavingsApp.API
```

- Swagger: https://localhost:5001/swagger

Migrations are applied and the dev seed runs automatically on startup.

## Seeded test user

| Email                  | Password       |
|------------------------|----------------|
| test@savingsapp.dev    | Password123!   |

Comes with a confirmed (fake) mandate and one active goal, "Trip to France" (€5 on day 11).

## Configuration

Secrets are blank in `appsettings.json`. Provide them via environment variables or
`appsettings.Development.json` / user-secrets:

- `Jwt__Secret` (min 32 chars — set in `appsettings.Development.json` and compose for dev)
- `GoCardless__AccessToken`, `GoCardless__WebhookSecret`
- `Swan__ClientId`, `Swan__ClientSecret`

## Endpoints

| Method | Route | Auth |
|--------|-------|------|
| POST | `/api/auth/register` | — |
| POST | `/api/auth/login` | — |
| POST | `/api/auth/refresh` | — |
| POST | `/api/mandates/initiate` | JWT |
| GET  | `/api/mandates/callback` | — (GoCardless redirect) |
| POST | `/api/webhooks/gocardless` | signature |
| POST | `/api/webhooks/swan` | bearer |
| GET  | `/api/goals` | JWT |
| POST | `/api/goals` | JWT |
| GET  | `/api/goals/{id}` | JWT |
| PATCH | `/api/goals/{id}/pause` | JWT |
| PATCH | `/api/goals/{id}/resume` | JWT |
| DELETE | `/api/goals/{id}` | JWT |
| GET  | `/api/goals/{id}/transactions` | JWT |
| GET  | `/api/wallet` | JWT |

## Migrations

```bash
dotnet ef migrations add <Name> --project SavingsApp.API --output-dir Data/Migrations
dotnet ef database update --project SavingsApp.API
```

## What's stubbed (flesh out next)

- **GoCardless redirect/callback**: the `(redirectFlowId → userId)` pair should be persisted at
  initiation rather than re-derived from the session token.
- **Swan OAuth**: `GetAccessTokenAsync` returns null until client-credentials token exchange +
  caching is wired.
- **Swan webhook**: bearer token is checked for presence only; add JWKS/introspection validation.
- **DebitJob attempt counter**: reads a constant; wire to Hangfire's retry context for true
  attempt numbers.
- Mobile app (React Native / Expo) — separate pass.
```
