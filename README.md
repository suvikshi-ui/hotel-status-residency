# Hotel Status Residency — Status Ledger

Daily cash-book, guest register, expenses, staff, and A4 reports for **Hotel Status Residency, Mahape**.

Starts empty from **1 Sep 2026**. Opening balances are ₹0 — post from the register.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:8080

```bash
npm run typecheck
npm run build
```

## Stack

- TanStack Start + React 19 + Vite
- Zustand (persisted ledger)
- Tailwind CSS v4
- html-to-image (Save as JPEG)

## Pages

| Page | What it does |
|---|---|
| Overview | Night audit KPIs |
| Register | Guest / food / WS / expense / balance-received entry + Detail report |
| Balance | Source dues + collect |
| Rooms | Occupancy board |
| Expenses | Monthly tally (read-only) |
| Staff | Salary + advance sheets |
| Reports | A4 daily sheet (print + JPEG) |
| Profile | Opening balances + security code |
| Sign in | Email / password (Supabase Auth) |

Data lives in the browser. After sign-in the key is `status-ledger-v5:<user-id>` so each account has its own books. Rooms and staff names are seeded; books start at zero.

## Sign in

Staff email + password via **Supabase Auth**. URL is `https://<project-id>.supabase.co`.

Set `VITE_SUPABASE_PROJECT_ID` and `VITE_SUPABASE_ANON_KEY` (publishable key), or put them in `src/lib/supabase-config.ts`. Until those are set, the ledger stays open without a login wall.

In the Supabase dashboard enable **Email** under Authentication → Providers, and turn off “Confirm email” if you want instant access after Create account.

## GitHub Pages

Live app: [https://suvikshi-ui.github.io/hotel-status-residency/](https://suvikshi-ui.github.io/hotel-status-residency/)

Static SPA. Base path is `/hotel-status-residency/` (from the repo name). Client routes fall back through `404.html`.

Every push to `main` runs `.github/workflows/pages.yml` (`npm ci` + `npm run build:pages`).

If GitHub Settings still say “Deploy from a branch”, leave **Source = `/` on `main`**. The repo root also ships `index.html`, `404.html`, `.nojekyll` and hashed assets so the ledger still opens. Prefer **Settings → Pages → Source = GitHub Actions** when you can change it.
