# Commands

Run from the project root:

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL (if using Docker for DB)
docker compose up -d

# 3. Apply Prisma schema (required after changes to prisma/schema.prisma)
npx prisma db push

# 4. Generate Prisma Client (runs automatically on npm install via postinstall)
npx prisma generate
```

**Note:** After adding new fields to the schema (e.g. in `SystemSettings`), run `npx prisma db push` again to update the database.

Development:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Register first — the first user becomes admin. Add rooms in the Rooms section (admin only) if needed.
