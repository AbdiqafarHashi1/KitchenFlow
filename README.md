# KitchenFlow (Phase 1 MVP)

KitchenFlow is a production-ready internal operations dashboard for restaurants.

## Stack
- Next.js 14 App Router + TypeScript + Tailwind
- Supabase (Postgres + Auth + RLS)
- Server Actions + Zod validation

## Modules
- Dashboard
- Staff & Payroll
- Inventory
- Purchases
- Sales
- Reports
- Settings

## Local setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env file:
   ```bash
   cp .env.example .env.local
   ```
3. Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Run dev server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`.

## Supabase database setup
1. Create a Supabase project.
2. Open SQL Editor and run:
   - `supabase/migrations/001_init.sql`
3. Create an Auth user in **Authentication > Users** (email/password).
4. Copy that user UUID.
5. In `supabase/seed.sql`, replace `00000000-0000-0000-0000-000000000000` with that auth user UUID.
6. Run `supabase/seed.sql`.

## Manual admin setup required
- Ensure the auth user used for login has a matching `admin_profiles.id` row.
- Ensure that `admin_profiles.restaurant_id` is linked to the seeded restaurant.

## Weighted average cost behavior
When creating purchases, KitchenFlow:
1. Stores purchase history with actual `unit_cost` and `total_cost`.
2. Updates `inventory_items.current_quantity`.
3. Recalculates `average_unit_cost` using weighted average.
4. Adds an `inventory_movements` row.

## Deploy
- Frontend: deploy repo to Vercel.
- Supabase: keep schema/seed in SQL scripts in `supabase/`.
- Add env vars in Vercel project settings.

## Notes
- Scope intentionally excludes POS, attendance, AI forecasting, recipe costing, multi-branch/multi-tenant.
