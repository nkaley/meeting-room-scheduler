# Meeting Rooms

A simple meeting room booking app: calendar view, email verification on sign-up, and admin management for rooms, users, and schedule settings.

## Features

- **Booking**: View rooms in a timeline, book slots (with optional description), cancel your own bookings.
- **Sign-up**: Email + password; verification via 6-digit code sent by SMTP (e.g. Yandex, SendGrid).
- **Restrict sign-up** by email domain (e.g. `@company.com`).
- **Admin**: Rooms (CRUD), users, all bookings, schedule settings (work hours, grid step, max duration, etc.).
- **i18n**: UI in English (default), Russian, Spanish, French, German, Chinese, Portuguese.

## Stack

- **Next.js 15** (App Router), **NextAuth**, **Prisma**, **PostgreSQL**, **Tailwind**, **shadcn/ui**.

## Quick start (local)

```bash
cp .env.example .env
# Edit .env: DATABASE_URL, NEXTAUTH_SECRET, optional ALLOWED_DOMAIN and SMTP_*

npm install
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Register the first user (they become admin), then sign in and add rooms.

## Deployment with Docker

The app runs in Docker with PostgreSQL. Use the production Compose file and env from the repo.

- **[Deployment guide (Docker)](./DEPLOY.md)** — step-by-step: build, env vars, first run, DB schema, HTTPS.

Summary:

```bash
# Clone, create .env (see DEPLOY.md), then:
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec app npx prisma db push
```

## Env vars

| Variable           | Description |
|--------------------|-------------|
| `DATABASE_URL`     | PostgreSQL connection string |
| `NEXTAUTH_URL`     | Public app URL (e.g. `https://your-domain.com`) |
| `NEXTAUTH_SECRET`  | Session secret (`openssl rand -base64 32`) |
| `ALLOWED_DOMAIN`   | Optional; comma-separated email domains for sign-up (e.g. `@company.com`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | For sending verification emails on sign-up |

## Author

Created by [Nikita Aleinikov](https://github.com/nkaley).

## License

MIT
