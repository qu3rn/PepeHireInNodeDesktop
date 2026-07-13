# Job Index

Job Index is PepeHire's unified, local-first archive of offers. Offers collected through the existing portal collectors and manually added offers share the existing SQLite `offers` table; no backend or external search service is used.

## Collection and filters

The page can start collection for selected portals and search the archive by free text, portal, status, title/company/description keywords, include/exclude terms, required technologies, location, remote mode, contract type, minimum monthly salary, and first-seen dates. Results are sortable and paginated. The current collector architecture has a production listing adapter for Pracuj; other portal choices return an explicit unsupported-collector run until their portal adapters are implemented.

Portal extraction uses three stages: portal-specific selectors and an HTML extractor produce tolerant `RawOfferListingItem`/`RawOfferDetails` values and warnings; a pure mapper normalizes them into `CollectedOffer`; persistence turns that into an `Offer`. Mapping tests do not launch Playwright.

## Deduplication and changes

Offers are matched in this order:

1. source plus source ID;
2. normalized URL (tracking parameters and fragments removed);
3. SHA-256 fingerprint of normalized title, company, and location.

A repeat discovery updates `lastSeenAt` and changed fields rather than creating a record. `saved`, `applied`, and `ignored` statuses, notes, and pins are preserved. Meaningful title, salary, description, contract, and remote-mode updates are appended to `offer_changes` and set `changedAt`.

Statuses are `new`, `seen`, `saved`, `applied`, `ignored`, `expired`, and `invalid`. Availability is tracked separately as `active`, `expired`, `unavailable`, `redirected`, or `unknown`.

## Reindex, retention, and cleanup

Reindex recalculates normalized URLs, fingerprints, searchable text/tags, and deterministic relevance; validates required fields; and merges obvious duplicates. It returns counts for checked/updated records, merged duplicates, invalid records, and errors. Individual bad rows do not abort the run.

Cleanup is preview-first. It detects stale, incomplete/invalid, duplicate, and malformed-URL records. The configurable stale age defaults to 30 days. Mark mode changes lifecycle status; archive mode is non-destructive; delete mode requires `confirmedPermanentDelete: true`. Saved/applied and pinned records are protected by default in every cleanup mode. Cleanup and reindex summaries are written to the app log.

Availability recheck uses the shared browser service, updates `lastCheckedAt`, and isolates page failures. It never overwrites a saved or applied user status merely because a page expired.

Known limitations: broken URL checks in cleanup are syntax-based unless availability recheck is run; saved views are not persisted; Pracuj is currently the only implemented listing collector; duplicate merging cannot infer that substantially renamed offers are identical without a matching source ID or URL.

## Run and test

```sh
pnpm dev
pnpm typecheck
pnpm test
```

Unit tests use local temporary SQLite files, raw fixtures, and mocks. They do not access live portals.
