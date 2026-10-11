# Bomber Burger – Smart Menu

React + Vite prototype with an AI recommendation backend (`api/recommend.ts`, a Vercel serverless function that calls Claude).

## How recommendations work

- The "Cari Rekomendasi" button sends `POST /api/recommend` with `{ chips, text }`.
- The function sends the menu from `src/data/bomber_burger_menu.json`, the chips and the text to `claude-haiku-5-5`, then checks the answer: valid JSON, ids that exist, no avoided ingredients, no duplicates, exactly 3 items.
- If that check fails, the API errors, or the call takes longer than 12 s, it returns the local rule-based recommendation (`src/utils/recommend.ts`) with `fallback: true`. The app then shows a short notice above the results.
- Guards: `text` is limited to 200 characters, unknown chip values are ignored, and each IP gets 10 requests per minute. The rate limit is in memory, so it counts per function instance; that's fine for a prototype, not a hard limit.
- **Avoid chips (Bawang/Keju):** sets and Bomber Shakes get their ingredients from the burgers they contain. Their other components (nasi, ayam krispi, fries, onion rings, drinks, sauces, dipping cheese) have no ingredient data in the JSON, and neither do the Chicken Fingers. Items like that are never recommended while an avoid is active.
- The API key is read on the server only (`process.env.ANTHROPIC_API_KEY`) and is never sent to the browser.

## Run locally

Requirements: Node 20+, the [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`).

1. `npm install`
2. Make the key available to the function. `vercel dev` passes functions only the variables in **`.env`**; it does **not** read `.env.local`. If there is no `.env`, it uses the project's *Development* variables from the Vercel dashboard. Pick one:
   - put `ANTHROPIC_API_KEY=...` in `.env` (gitignored; see `.env.example`), or
   - `vercel env add ANTHROPIC_API_KEY development` – but only if no `.env` exists, since a local `.env` takes precedence.
3. `vercel dev` – serves the app and `/api/recommend` together on http://localhost:3000. The first run asks you to link the project.

If every result comes back with `fallback: true`, check the `vercel dev` log. `recommend: unexpected error Could not resolve authentication method` means the key didn't reach the function.

`npm run dev` (plain Vite) also works, but it has no `/api` route, so every search uses the local fallback.

### Checks

- `npm run typecheck` – type-checks the frontend (`tsconfig.json`) and the API + scripts (`api/tsconfig.json`).
- `npm run build` – production build of the frontend.
- `npm run test:recommend` – with `vercel dev` running, sends 5 sample requests and prints the picked items and reasons. Point it elsewhere with `BASE_URL=https://your-app.vercel.app npm run test:recommend`.

## Deploy (Vercel)

1. Push the repo and import it in Vercel (framework preset: Vite), or run `vercel` from the project root.
2. In Project → Settings → Environment Variables, add `ANTHROPIC_API_KEY` for Production (and Preview if you use it).
3. Deploy with `vercel --prod`, or push to the production branch.

`vercel.json` bundles the menu JSON with the function and rewrites non-API routes to `index.html`, so page reloads on routes like `/hasil` keep working.
