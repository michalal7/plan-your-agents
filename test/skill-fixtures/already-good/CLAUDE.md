# CLAUDE.md

## Verify changes
- `npm test` (vitest) — must be green before any commit.
- `npm run lint` and `npm run build` for typecheck.

## Conventions
- Money is always integer cents, never floats. Rounding happens once, at render time.
- Every API route needs a matching test in `test/` — no route ships untested.
- Use `node:` prefixed imports for builtins.

## Corrections
- Don't add a date library; `Intl.DateTimeFormat` covers every case we have.
- Invoice IDs are opaque strings, not sortable — never order by them.
