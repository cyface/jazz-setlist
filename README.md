# Jazz Setlist

Arrangements (feel, brushes/sticks, drum entry, solo order, tempo) with a built-in metronome, and show setlists with set breaks. Light and dark themes.

## Setup

```bash
pnpm install
cp .dev.vars.example .dev.vars        # set DEV_AUTH_EMAIL
pnpm db:migrate:local
pnpm dev                              # http://localhost:5188
```

## Deploy (Cloudflare)

The D1 database `jazz-setlist` exists and is set in `wrangler.jsonc`. Remaining one-time setup:

1. Workers & Pages → Create → Import a repository → `cyface/jazz-setlist`. Build command `pnpm build`, deploy command `pnpm release:ci`.
2. Add a custom domain to the Worker (and to `routes` in `wrangler.jsonc`).
3. Zero Trust → Access → Applications: add a self-hosted app for that domain with an allow policy for your email(s).

Manual deploy from a laptop: `pnpm release`.
