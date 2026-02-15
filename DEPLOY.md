# Deployment (VPS with Docker)

## Requirements

- Ubuntu 22.04 (or any server with Docker and Docker Compose)
- A domain or IP for the app

## 1. Install Docker on the server

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER
# Log out and back in so the docker group applies
```

## 2. Clone and configure the project

```bash
cd /opt   # or your preferred directory
sudo git clone <REPO_URL> meetings-room
cd meetings-room
```

## 3. Create `.env` on the server

Create `.env` in the project root:

```env
# Database (password must match POSTGRES_PASSWORD in docker-compose)
DATABASE_URL="postgresql://postgres:YOUR_DB_PASSWORD@db:5432/meetings_room?schema=public"

# Public URL of the app (required for NextAuth)
NEXTAUTH_URL="https://your-domain.com"

# Session secret (generate: openssl rand -base64 32)
NEXTAUTH_SECRET="your-long-secret"

# Optional: restrict sign-up to this email domain (e.g. @company.com)
ALLOWED_DOMAIN="@company.com"

# SMTP for verification emails (optional; leave unset to disable email verification)
SMTP_HOST="smtp.example.com"
SMTP_PORT="465"
SMTP_USER="noreply@example.com"
SMTP_PASSWORD="app-password"
SMTP_FROM="Booking Service <noreply@example.com>"

# PostgreSQL password for the db service
POSTGRES_PASSWORD="your-secure-password"
```

## 4. First run and database schema

```bash
# Build and run in the background
docker compose -f docker-compose.prod.yml up -d --build

# Apply Prisma schema to the database (once after first run)
docker compose -f docker-compose.prod.yml exec app npx prisma db push
```

## 5. Verify

- Open `https://your-domain.com` (or `http://IP:3000`) in a browser.
- Register the first user — they get the ADMIN role.
- Sign in and add rooms in the admin section if needed.

## 6. Useful commands

```bash
# Application logs
docker compose -f docker-compose.prod.yml logs -f app

# Stop
docker compose -f docker-compose.prod.yml down

# Update after git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## 7. HTTPS (recommended)

Use Nginx as a reverse proxy with Let's Encrypt (certbot):

- Proxy requests to `http://127.0.0.1:3000`.
- Set in `.env`: `NEXTAUTH_URL=https://your-domain.com`.
