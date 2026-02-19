# Meeting Room Scheduler — Frontend

Next.js 15 UI. Auth via NextAuth (Credentials → backend login). Data from backend REST API.

## Run locally

Backend must be running (see `../backend/README.md`).

```bash
cp .env.example .env
# Edit .env: BACKEND_URL, NEXT_PUBLIC_API_URL (e.g. http://localhost:4000), NEXTAUTH_SECRET

npm install
npm run dev
```

Open http://localhost:3000. Login uses backend `POST /api/auth/login`.

## Copy shared UI from monolith (if you split from existing app)

From repo root:

```bash
cp -r components/ui frontend/components/
cp components/dashboard-header.tsx components/date-nav.tsx components/no-rooms-message.tsx components/language-switcher.tsx components/calendar.tsx frontend/components/
mkdir -p frontend/app/login && cp app/login/page.tsx frontend/app/login/
```

## Env

| Variable | Description |
|----------|-------------|
| `BACKEND_URL` | Backend base URL (server-side) |
| `NEXT_PUBLIC_API_URL` | Backend base URL (client; empty = same origin) |
| `NEXTAUTH_URL` | Public app URL |
| `NEXTAUTH_SECRET` | Session secret |
