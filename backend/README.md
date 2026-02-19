# Meeting Room Scheduler — Backend

REST API: auth, rooms, bookings, users, settings. Express + Prisma + PostgreSQL + JWT.

## Run locally

```bash
cp .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET, optional ALLOWED_DOMAIN, SMTP_*

npm install
npx prisma db push
npm run dev
```

API: http://localhost:4000  
Health: http://localhost:4000/health

## Env

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT signing (`openssl rand -base64 32`) |
| `ALLOWED_DOMAIN` | Optional; comma-separated email domains for sign-up |
| `SMTP_*` | For verification emails |
| `PORT` | Default 4000 |

## API (all under `/api`)

- `POST /auth/login` — body `{ email, password }` → `{ token, user }`
- `POST /auth/register/send-code` — body `{ email, password, name, surname }`
- `POST /auth/register/complete` — body `{ email, code, password, name, surname }`
- `GET /rooms` — list rooms (Bearer token)
- `POST /rooms` — create (admin)
- `PATCH /rooms/:id`, `DELETE /rooms/:id` — (admin)
- `GET /bookings?roomId=&date=` — list (auth)
- `POST /bookings` — body `{ roomId, startTime, durationMinutes, description? }` (auth)
- `DELETE /bookings/:id` — (auth, owner or admin)
- `GET /users`, `DELETE /users/:id` — (admin)
- `GET /settings`, `PATCH /settings` — get/update (auth / admin)
