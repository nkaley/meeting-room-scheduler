# Meeting Rooms

A simple meeting room booking app: calendar view, email verification on sign-up, and admin management for rooms, users, and schedule settings.

## Architecture (microservices)

The project is split into **two services** for DevOps practice:

| Service   | Stack                    | Role |
|----------|---------------------------|------|
| **backend**  | Express, Prisma, PostgreSQL, JWT | REST API: auth, rooms, bookings, users, settings |
| **frontend** | Next.js 15, NextAuth, Tailwind, shadcn/ui | UI; calls backend API |

- **backend** — `backend/`. Port 4000.  
- **frontend** — `frontend/`. Port 3000.  
- **DB** — PostgreSQL (shared by backend).

### Run locally (microservices)

1. **Backend**
   ```bash
   cd backend
   cp .env.example .env   # set DATABASE_URL, JWT_SECRET, optional SMTP_*, ALLOWED_DOMAIN
   npm install
   npx prisma db push
   npm run dev
   ```
   → http://localhost:4000, health: http://localhost:4000/health

2. **Frontend**
   ```bash
   cd frontend
   cp .env.example .env   # set BACKEND_URL, NEXT_PUBLIC_API_URL (e.g. http://localhost:4000), NEXTAUTH_SECRET
   npm install
   npm run dev
   ```
   → http://localhost:3000

3. **First run**: open frontend, register (first user becomes admin), then add rooms.

### Run with Docker (microservices)

From repo root:

```bash
# Create .env with at least: NEXTAUTH_SECRET, JWT_SECRET, optional POSTGRES_PASSWORD, SMTP_*, NEXT_PUBLIC_API_URL
docker compose up -d --build
docker compose exec backend npx prisma db push
```

- Frontend: http://localhost:3000  
- Backend API: http://localhost:4000  

For production (single host) use a reverse proxy so frontend and API are on one domain; set `NEXT_PUBLIC_API_URL` accordingly (or leave empty for same-origin).

---

## Features

- **Booking**: View rooms in a timeline, book slots (with optional description), cancel your own bookings.
- **Sign-up**: Email + password; verification via 6-digit code sent by SMTP (e.g. Yandex, SendGrid).
- **Restrict sign-up** by email domain (e.g. `@company.com`).
- **Admin**: Rooms (CRUD), users, all bookings, schedule settings (work hours, grid step, max duration, etc.).
- **i18n**: UI in English (default), Russian, Spanish, French, German, Chinese, Portuguese.

## Env vars (microservices)

| Variable | Service | Description |
|----------|---------|-------------|
| `DATABASE_URL` | backend | PostgreSQL connection string |
| `JWT_SECRET` | backend | JWT signing secret (`openssl rand -base64 32`) |
| `BACKEND_URL` | frontend | Backend base URL (server-side) |
| `NEXT_PUBLIC_API_URL` | frontend | Backend base URL (client; e.g. `http://localhost:4000`) |
| `NEXTAUTH_URL` | frontend | Public app URL |
| `NEXTAUTH_SECRET` | frontend | Session secret |
| `ALLOWED_DOMAIN` | backend | Optional; comma-separated email domains for sign-up |
| `SMTP_*` | backend | For verification emails |

## Monolith (legacy)

The original single-app version (Next.js + Prisma in one repo) is still in the root `app/`, `lib/`, `prisma/` etc. For Docker deploy of the monolith see `docker-compose.prod.yml` and [DEPLOY.md](./DEPLOY.md).

## Author

Created by [Nikita Aleinikov](https://github.com/nkaley).

## License

MIT
