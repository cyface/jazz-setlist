#!/bin/sh
# Turn a PolyNome Pro backup (.pln) into tunes + setlists for one user.
#
#   scripts/polynome/import.sh <backup.pln> <user email> [--local | --remote] ["active setlist name"]
#
# Writes scripts/polynome/out/{raw.json,import.json,import.sql} (git-ignored: they hold your data and email) and
# prints a review table. With --local or --remote it also runs the SQL against that D1 database. The user must have
# signed in to the app once so their users row exists. Rerunning skips tunes/setlists that already exist by name.
# Every setlist except the active one (default: the newest in the backup) is imported archived.
set -eu
[ $# -ge 2 ] || { sed -n '4p' "$0" | cut -c3-; exit 1; }
PLN=$1 EMAIL=$2 TARGET=${3:-} ACTIVE=${4:-}
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=$HERE/out
mkdir -p "$OUT"

python3 -I "$HERE/extract.py" "$PLN" "$OUT/raw.json"
if [ -n "$ACTIVE" ]; then python3 -I "$HERE/transform.py" "$OUT/raw.json" "$OUT/import.json" "$ACTIVE"
else python3 -I "$HERE/transform.py" "$OUT/raw.json" "$OUT/import.json"; fi
node "$HERE/to-sql.js" "$OUT/import.json" "$OUT/import.sql" "$EMAIL"

case $TARGET in
  --local | --remote) cd "$HERE/../.." && pnpm exec wrangler d1 execute jazz-setlist "$TARGET" --file "$OUT/import.sql" ;;
  '') echo "Review the table above, then rerun with --local or --remote to import." ;;
  *) echo "Unknown target $TARGET (use --local or --remote)" >&2; exit 1 ;;
esac
