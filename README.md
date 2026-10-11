# Bomber Burger – Smart Menu

React + Vite prototype with an AI recommendation backend (`api/recommend.ts`, a Vercel serverless function that calls Claude).

## How recommendations work

- The "Cari Rekomendasi" button sends `POST /api/recommend` with `{ chips, text }`.
- The function sends the menu from `src/data/bomber_burger_menu.json`, the chips and the text to `claude-haiku-5-5`, then checks the answer: valid JSON, ids that exist, no avoided ingredients, no duplicates, exactly 3 items.
- If that check fails, the API errors, or the call takes longer than 12 s, it returns the local rule-based recommendation (`src/utils/recommend.ts`) with `fallback: true`. The app then shows a short notice above the results.
- Guards: `text` is limited to 200 characters, unknown chip values are ignored, and each IP gets 10 requests per minute. The rate limit is in memory, so it counts per function instance; that's fine for a prototype, not a hard limit.
- **Avoid chips (Bawang/Keju):** items whose ingredients are fully known and free of the avoided ingredient come first. Ingredients count as unknown for burgers with Saus OG or Bomber Secret Sauce, for sets and Bomber Shakes with components that have no data, and for the Chicken Fingers. Only if fewer than 3 verified items exist, unknown items that are not proven to contain the ingredient fill up the list, marked "Bahan belum dipastikan, tanyakan ke kasir". Items proven to contain it never appear.
- The API key is read on the server only (`process.env.ANTHROPIC_API_KEY`) and is never sent to the browser.

## Run locally (Menjalankan secara lokal)

Requirements: Node 20+, the [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`).

1. `npm install`
2. **Create `.env` yourself.** It is gitignored, so it does not come with the GitHub repo. Copy `.env.example` to `.env` and fill in `ANTHROPIC_API_KEY=...`. `vercel dev` passes functions only the variables in `.env`; it does **not** read `.env.local`. (Alternative: with no `.env` at all, `vercel env add ANTHROPIC_API_KEY development` and `vercel dev` uses the dashboard value.)
3. `npm run dev:full` – one command that starts both servers (works in Windows PowerShell):
   - **web**: Vite on http://localhost:5173 serves the UI and proxies `/api/*` to port 3000 (`vite.config.ts`).
   - **api**: `vercel dev --listen 3000 --local-config vercel.dev.json` serves only the `/api` functions. `vercel.dev.json` is a dev-only config that builds just `api/recommend.ts` and runs no dev command, so `vercel dev` never starts a second Vite. Deploys still use `vercel.json`.
4. Open **http://localhost:5173**. (Port 3000 only answers `/api/*`; the UI is not served there.) The first run asks you to link the Vercel project.

Stop both with Ctrl+C. If port 3000 or 5173 is already in use (for example an old `vercel dev`), stop that process first; if one server fails to start, the other is stopped too.

If every result comes back with `fallback: true`, check the `[api]` lines in the terminal. `recommend: unexpected error Could not resolve authentication method` means the key didn't reach the function.

`npm run dev` (Vite only) also works, but without the api server every search uses the local fallback.

### Checks

- `npm run typecheck` – type-checks the frontend (`tsconfig.json`) and the API + scripts (`api/tsconfig.json`).
- `npm run build` – production build of the frontend.
- `npm run test:claims` – unit tests for the reason claim checker and the avoid tiers (no API calls).
- `npm run test:recommend` – with `npm run dev:full` (or `npm run dev:api`) running, sends 10 sample requests to http://localhost:3000 and prints the picked items and reasons. Point it elsewhere with `BASE_URL=https://your-app.vercel.app npm run test:recommend` (PowerShell: `$env:BASE_URL="https://your-app.vercel.app"; npm run test:recommend`).

## Deploy (Vercel)

1. Push the repo and import it in Vercel (framework preset: Vite), or run `vercel` from the project root.
2. In Project → Settings → Environment Variables, add `ANTHROPIC_API_KEY` for Production (and Preview if you use it).
3. Deploy with `vercel --prod`, or push to the production branch.

`vercel.json` bundles the menu JSON with the function and rewrites non-API routes to `index.html`, so page reloads on routes like `/hasil` keep working.
