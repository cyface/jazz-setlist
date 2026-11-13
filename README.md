# Jazz Setlist

Arrangements (feel, brushes/sticks, drum entry, solo order, tempo) with a built-in metronome, and show setlists with set breaks. Light and dark themes.

## Setup

```bash
pnpm install
cp .env.example .env                  # set DEV_AUTH_EMAIL
pnpm db:migrate:local
pnpm dev                              # http://localhost:5188
```

## Deploy (Cloudflare)

Merges to `main` deploy to the timlwhite Cloudflare account via `.github/workflows/deploy.yml`; PRs run CI. The D1 database `jazz-setlist` exists in that account. One-time setup:

1. Create a Cloudflare API token in the timlwhite account with Workers Scripts Edit and D1 Edit, then `gh secret set CLOUDFLARE_API_TOKEN --repo cyface/jazz-setlist`.
2. Zero Trust → Access → Applications: add a self-hosted app for `setlist.cyface.com` with an allow policy for your email(s). Do this before the domain is deployed so it is never public.
3. The custom domain is set in `routes` in `wrangler.jsonc`; the API token also needs access to the `cyface.com` zone (Workers Routes Edit) to attach it.
4. Access bypass policies for the PWA's static files (manifest, service worker, icons); the paths are listed at the bottom of `wrangler.jsonc`.

Manual deploy from a laptop: `pnpm release`.
