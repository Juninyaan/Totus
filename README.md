# Fithub

Fithub is a phased multi-sport platform for fitness, coaching, bookings, shop discovery, and business growth tools.

This workspace starts with the Phase 1 MVP foundation:

- Next.js frontend in `frontend/`
- Express API in `backend/`
- MongoDB-ready environment configuration
- Modular backend structure for auth, trainers, services, bookings, shops, ads, rewards, subscriptions, and admin

## Phase 1 scope

- User authentication foundation
- Trainer and service discovery
- Booking API surface
- Shop listings and product discovery
- Admin-ready modular structure

## Workspace structure

- `frontend/`: Next.js web app
- `backend/`: Express API and modules
- `.github/copilot-instructions.md`: setup checklist tracked in-repo

## Environment setup

Create these files before connecting real services:

- `backend/.env` from `backend/.env.example`
- `frontend/.env.local` from `frontend/.env.example`

## Scripts

From the repo root:

- `npm run dev`: run frontend and backend together
- `npm run dev:frontend`: run only the Next.js app
- `npm run dev:backend`: run only the API
- `npm run build`: build the frontend
- `npm run lint`: lint the frontend

## Initial API

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/profile`
- `GET /api/trainers`
- `GET /api/services`
- `POST /api/bookings`
- `GET /api/shops`
- `GET /api/ads/active`

The backend starts without a MongoDB connection if `MONGO_URI` is not set so the scaffold remains runnable during early UI work.