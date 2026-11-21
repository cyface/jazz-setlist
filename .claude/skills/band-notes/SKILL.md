---
name: band-notes
description: Apply pasted band rehearsal notes / arrangement sheets (tune title, BPM, HEAD / SOLOS / HEAD OUT lines) to the production tunes - sets each tune's tempo and solo order in the production D1. Use when the user pastes notes like "Cantaloupe Island: 116BPM ... SOLOS: Sax, Guitar, Keys" and asks to update the tunes or production data.
---

# Band notes → production tunes

The user pastes free-form notes from the band leader, one block per tune. Update each tune's `tempo` and `solo_order` in the production D1 (`jazz-setlist`) to match. Nothing else changes: leave `notes`, feel, form details (AABA, "x2", intro bars, endings) alone unless asked.

## Reading the notes

- Title: first line of a block, any case, sometimes followed by `:` and the tempo. Tempo is `135 BPM`, `BPM 135`, `150BPM`.
- A line with no tempo and no SOLOS (e.g. "Detective Acosta Keep working on the head") is a practice reminder: skip that tune.
- A block with a tempo but no solos line sets the tempo only; its solo order stays as it is.
- `SOLOS:` (or `SOLO:`) gives the order. Each named instrument becomes `{"type":"solo","instrument":"<name>"}`, in the order written. "Sax and Guitar 2 times each" is two solos, sax then guitar.
- Instrument names are lowercase and follow what production already uses: keys / keyboard → `piano`; tenor / alto → `sax`. Others as written (`guitar`, `bass`, `drums`, `trumpet`).
- Drums soloing while the band plays the head out ("... while the drums are soloing") → `{"type":"over_head","instrument":"drums"}` as the last entry.
- A drum solo elsewhere at the end ("then drums solo over the coda vamp") → a plain `solo` entry for `drums`, last.
- Trading ("trade 4s with drums") → `{"type":"trade","instruments":[...],"bars":2|4|8}`.
- The sheet replaces the whole solo order. If the existing order has an entry the sheet doesn't mention (often a bass ⇄ drums trade from the PolyNome import), drop it and say so in the report with the old value.

Shapes are defined by `soloEntrySchema` and `arrangementInputSchema` in `src/shared/validation.js`. The SQL below bypasses that validation, so keep to its limits by hand: tempo is a whole number from 20 to 400, an instrument name is 1 to 30 characters, a trade has 2 to 6 instruments, and a solo order has at most 30 entries.

## Steps

1. Read the current rows (read-only), matching titles case-insensitively with `LIKE`:

   ```bash
   pnpm exec wrangler d1 execute jazz-setlist --remote --json --command \
     "SELECT a.id, a.user_id, u.email, a.title, a.tempo, a.solo_order FROM arrangements a JOIN users u ON u.id = a.user_id WHERE lower(a.title) LIKE '%cantaloupe%' OR ..."
   ```

   Tunes are per user. Only update the user's own tunes: if the matches belong to more than one email, ask which account before writing anything.

   When a title has no match, look once more for the tune under another name it is known by (e.g. "Until I Met You" is filed as "Corner Pocket") and in `notes`. A match found that way, no match at all, or more than one match is a question for the user, not a guess. Do not create or rename tunes unless asked.

2. Write one `UPDATE` per tune to a file in the scratchpad, keyed on `id` and `user_id`:

   ```sql
   UPDATE arrangements SET tempo = 116, solo_order = '[{"type":"solo","instrument":"sax"}]',
     updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
   WHERE id = '<id>' AND user_id = '<user_id>';
   ```

   Double any single quote inside the JSON (`'` → `''`).

3. Apply it with `pnpm exec wrangler d1 execute jazz-setlist --remote --yes --file <file>`; `changes` should equal the number of tunes.

4. Select the rows again and report, per tune: tempo (changed or already right), old → new solo order, anything dropped, and tunes skipped.

The app picks the change up on its next load; phones holding an offline copy refresh it when they next come to the foreground online.
