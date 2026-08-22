# hackathon_form

# Hackathon Team Registration

Full-stack hackathon team registration app built with Next.js, Tailwind CSS, and MongoDB (Mongoose).

## Features

- Google Forms-style dynamic team registration with add/remove member rows
- Live validation for team size, female quota, and university email domain
- MongoDB-enforced uniqueness for team names, emails, and registration IDs
- Transactional team creation to prevent partial saves
- JWT-protected admin dashboard with search, stats, settings, edit, and delete

## Getting Started

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Update `.env.local` with your MongoDB URI and admin credentials.

3. Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) for registration and [http://localhost:3000/admin/login](http://localhost:3000/admin/login) for admin access.

## MongoDB Notes

MongoDB transactions require a replica set. MongoDB Atlas works out of the box. For local MongoDB, initialize a replica set before using registration:

```bash
mongosh --eval "rs.initiate()"
```

## Project Structure

- `app/` — Next.js routes and API endpoints
- `components/` — Registration form and admin UI
- `lib/models/` — Mongoose models and indexes
- `lib/schemas/` — Shared Zod validation
- `proxy.ts` — Admin route protection

## Vercel Deployment

1. Import the GitHub repo in Vercel.
2. Set **Root Directory** to empty (repo root). Do not use `hackathon-form-temp`.
3. Set **Framework Preset** to **Next.js**.
4. Add environment variables in Vercel → Settings → Environment Variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
5. Redeploy after env vars are saved.

## Default Config

On first run, the app creates a config document with:

- Min team size: 2
- Max team size: 4
- Min female members: 1
- Allowed email domain: `shoolini.edu.in`
- Registration open: true

These can be changed from the admin settings panel.
