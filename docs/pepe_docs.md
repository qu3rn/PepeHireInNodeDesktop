You are building a desktop-first MVP of a local job application assistant.

Important product decision:
This is NOT a web SaaS right now.
This is NOT PostgreSQL right now.
This is a local desktop app using Electron + React + TypeScript + SQLite.

However, the architecture must be backend-ready:
- business logic should live in services
- data access should go through repository interfaces
- UI should not talk directly to SQLite
- later we should be able to replace local SQLite repositories with an HTTP API backend adapter

Product goal:
Build a desktop app that helps the user collect React/Frontend job offers, extract details, score offers, build an apply queue, and rapidly apply with Playwright while keeping final job application submission manual.

Safety rules:
- Never auto-submit job applications by default.
- Final submit must remain manual.
- Do not bypass CAPTCHA, login walls, bot protection, paywalls, or access controls.
- Do not create fake accounts.
- Do not spam portals.
- Keep user data local.
- Do not store secrets in git.

Tech stack:
- Electron
- React
- Vite
- TypeScript
- SQLite
- Drizzle ORM preferred
- Zod
- Playwright
- TanStack Query
- Vitest
- ESLint
- Prettier
- pnpm

If the project already uses another reasonable SQLite library, inspect it and keep it if appropriate.
Do not introduce PostgreSQL.
Do not introduce a remote backend yet.
Do not introduce auth/multi-tenancy now.

Target architecture:

src/
  main/
    index.ts
    ipc/
      offers.ipc.ts
      collection.ipc.ts
      queue.ipc.ts
      applications.ipc.ts
      debug.ipc.ts
      settings.ipc.ts
    db/
      sqlite.ts
      schema.ts
      migrations/
    repositories/
      offers.sqlite-repo.ts
      collected-urls.sqlite-repo.ts
      collection-runs.sqlite-repo.ts
      queue.sqlite-repo.ts
      applications.sqlite-repo.ts
      debug.sqlite-repo.ts
      settings.sqlite-repo.ts
    services/
      offer.service.ts
      collection.service.ts
      import.service.ts
      extraction.service.ts
      deep-extraction.service.ts
      scoring.service.ts
      relevance.service.ts
      queue.service.ts
      rapid-apply.service.ts
      cleanup.service.ts
      normalization.service.ts
    automation/
      playwright-collector.ts
      playwright-debugger.ts
      form-filler.ts
      browser-helpers.ts
      modal-handler.ts
    normalization/
      salary.ts
      stack.ts
      description.ts
      title.ts
    calculators/
      rateCalculator.ts
    adapters/
      repositories.ts
      local-repositories.ts
      api-repositories.placeholder.ts
    shared/
      types.ts
      schemas.ts
      constants.ts
      result.ts
      pagination.ts
      urls.ts

  preload/
    index.ts

  renderer/
    main.tsx
    App.tsx
    routes/
      DashboardPage.tsx
      JobSearchPage.tsx
      OffersPage.tsx
      OfferDetailsPage.tsx
      ApplyQueuePage.tsx
      RapidApplyPage.tsx
      RateCalculatorPage.tsx
      ApplicationsPage.tsx
      DebugPage.tsx
      SettingsPage.tsx
    components/
      layout/
      offers/
      queue/
      debug/
      common/
    lib/
      apiClient.ts
      queryClient.ts
      formatters.ts

tests/

data/
  app.db
  cv/
  debug/
  backups/
  exports/

Repository/adapter architecture:

Define repository interfaces in:

src/main/adapters/repositories.ts

Example:
interface OfferRepository {
  create(input: CreateOfferInput): Promise<Offer>
  getById(id: string): Promise<Offer | null>
  getByUrl(url: string): Promise<Offer | null>
  list(query: OfferListQuery): Promise<PaginatedResult<Offer>>
  update(id: string, patch: UpdateOfferInput): Promise<Offer>
  delete(id: string): Promise<void>
  bulkDelete(ids: string[]): Promise<BulkDeleteResult>
}

Create local SQLite implementation:
src/main/repositories/offers.sqlite-repo.ts

Create placeholder future API adapter:
src/main/adapters/api-repositories.placeholder.ts

The UI must only call IPC/API client functions.
IPC handlers call services.
Services call repository interfaces.
Repository implementation can be swapped later.

Database:
Use SQLite stored in user data directory, not project root, for production.
For dev, allow data/app.db.

Electron:
Use app.getPath("userData") for production DB path.
Use config/env to switch dev DB path.

Drizzle schema:

Tables:

offers:
- id text primary key
- source text
- url text unique not null
- title text
- company text
- location text
- remote_mode text
- contract_type text
- seniority text
- salary_raw text
- salary_min integer nullable
- salary_max integer nullable
- salary_currency text
- salary_period text
- salary_tax_mode text
- salary_monthly_min integer nullable
- salary_monthly_max integer nullable
- salary_confidence real nullable
- salary_warnings_json text
- technologies_json text
- description text
- description_summary text
- score integer nullable
- decision text
- reasons_json text
- extraction_status text
- extraction_source text
- extraction_confidence real nullable
- extraction_warnings_json text
- created_at text
- updated_at text

collected_urls:
- id text primary key
- source text
- url text unique
- listing_url text
- classification text
- classification_reason text
- title_preview text
- company_preview text
- raw_text_preview text
- relevance_score integer nullable
- relevance_decision text
- matched_keywords_json text
- matched_technologies_json text
- negative_keywords_json text
- import_status text
- offer_id text nullable
- error text nullable
- created_at text
- updated_at text

collection_runs:
- id text primary key
- mode text
- source text
- criteria_json text
- status text
- raw_links_count integer
- job_offer_count integer
- listing_count integer
- imported_count integer
- failed_count integer
- warnings_json text
- debug_path text
- started_at text
- finished_at text nullable

apply_queue_items:
- id text primary key
- offer_id text not null
- status text
- priority_score real
- selected_cv_id text nullable
- selected_cv_name text nullable
- reasons_json text
- warnings_json text
- skip_reason text nullable
- created_at text
- updated_at text

applications:
- id text primary key
- offer_id text not null
- status text
- selected_cv_id text nullable
- selected_cv_name text nullable
- sent_at text nullable
- follow_up_due_at text nullable
- last_contact_at text nullable
- notes text nullable
- created_at text
- updated_at text

application_events:
- id text primary key
- application_id text not null
- type text
- note text nullable
- metadata_json text
- created_at text

debug_runs:
- id text primary key
- type text
- source text nullable
- status text
- metadata_json text
- path text nullable
- created_at text

settings:
- key text primary key
- value_json text
- updated_at text

Migrations:
- Use drizzle-kit if already configured.
- Otherwise implement simple initDb() that creates tables for MVP.
- Do not overcomplicate migrations yet.

IPC API:
Use typed IPC channels.

Expose in preload:
window.jobAssistant = {
  offers: {
    list(query),
    get(id),
    rescore(id),
    deepExtract(id),
    delete(id),
    bulkDelete(ids),
    renormalize(ids)
  },
  collection: {
    collectPlaywright(criteria),
    listRuns(),
    getRun(id),
    importCollectedUrls(input)
  },
  queue: {
    list(query),
    build(input),
    fillItem(id),
    markSent(id),
    skip(id, reason),
    getNext()
  },
  applications: {
    list(query),
    updateStatus(id, status),
    markSent(id),
    getEvents(id)
  },
  debug: {
    listRuns(query),
    getRun(id),
    debugSource(input)
  },
  settings: {
    get(),
    update(patch)
  }
}

Validate IPC inputs with Zod.
Never expose raw Node APIs to renderer.

Renderer:
React pages should use TanStack Query to call window.jobAssistant APIs.

Pages:

Dashboard:
- offers count
- queued count
- sent count
- maybe/apply/skip counts

JobSearch:
- search criteria form
- collector mode default Playwright
- collect URLs
- import job_offer URLs
- import + score + queue
- collection diagnostics

Offers:
- paginated list
- search/filter/sort
- expandable details
- salary normalized display
- technologies
- description summary
- deep extract button
- re-score button
- bulk delete selected
- re-normalize selected

RapidApply:
- one-by-one queue processing
- current offer card
- fill form
- mark sent
- skip
- next
- deep extract before filling if incomplete
- final submit must be manual warning

ApplyQueue:
- paginated queue
- build queue
- sync queue from offers
- fill selected
- mark sent
- skip

Applications:
- paginated history
- status updates
- sent/follow-up fields

Debug:
- latest Playwright collector debug runs
- screenshots
- classified links
- modal actions
- login detection details

Settings:
- job search criteria
- Playwright settings
- salary normalization config
- CV path/profile placeholder

Core features:

1. Playwright collector

Default collector mode:
playwright

Flow:
- open public listing page
- handle cookies/modals
- scroll gradually
- extract links with context
- classify URLs
- run relevance matcher
- save CollectedUrl records
- do not import listing/navigation/company URLs automatically

Supported sources:
- pracuj
- nofluffjobs
- justjoin
- rocketjobs

URL classification:

Pracuj:
- job_offer if URL contains ",oferta,"
- generic /praca pages are listing

JustJoinIT:
- job_offer if path starts with /job-offer/ and slug is non-empty
- listing if path starts with /job-offers

RocketJobs:
- job_offer if path starts with /oferta-pracy/ and slug is non-empty
- listing if path starts with /oferty-pracy

NoFluffJobs:
- conservative existing rules or implement safe fallback

Only job_offer URLs can be imported automatically.
unknown/needs_review require explicit import anyway.

2. Modal/cookie handler

Create reusable Playwright helper.

Default:
cookie_mode = reject_optional

Support:
- reject_optional
- accept_all
- close_only
- disabled

Must:
- reject optional cookies by default
- close newsletter overlays
- detect CAPTCHA
- detect real login wall
- avoid false positives from header login links
- never click Apply, Submit, Register, Login, Send buttons

3. Relevance matcher

Use JobSearchCriteria.
No separate duplicated config.

React/Frontend emergency mode:
Positive:
- React
- React.js
- ReactJS
- Frontend
- Front-end
- Front end
- TypeScript
- JavaScript
- Next.js
- Node.js

Polish:
- programista frontend
- programista front-end
- programista React

Negative:
- sprzedawca
- kasjer
- magazynier
- operator
- kierowca
- call center
- PHP
- WordPress
- Angular
- Vue
- Java
- .NET
- C#

Return:
- relevanceScore
- relevanceDecision
- matchedKeywords
- matchedTechnologies
- negativeKeywords
- reasons

4. Import/extraction

Import flow:
- import CollectedUrl if classification == job_offer
- run source-specific extractor if available
- fallback to generic Playwright extraction
- fallback to URL/preview only if extraction fails
- mark low extraction confidence if fallback is used
- normalize title/salary/stack/description
- save Offer
- score Offer

5. Deep extraction

If offer is incomplete:
- open offer URL
- handle modals
- extract visible details
- salary
- location
- contract
- technologies
- description
- normalize
- merge safely
- re-score
- sync queue item

Completeness:
- salary missing/low confidence
- technologies missing/fewer than 2
- description missing/too short
- company missing
- title slug-like

6. Salary normalization

Support:
- 150 PLN/h
- 150 zł/h
- 120-180 PLN netto + VAT / h
- 1000 PLN/day
- 1000 zł / dzień
- 18 000 - 24 000 PLN
- 18k - 24k PLN
- 100k - 150k PLN/year

Detect:
- currency
- period: hourly | daily | weekly | monthly | yearly | unknown
- taxMode: net | gross | net_plus_vat | unknown

Convert:
- hourly to monthly using 168h
- daily to monthly using 21 days
- yearly / 12

Do not convert net/gross taxes.

7. Stack extraction

Canonical tech:
- React
- TypeScript
- JavaScript
- Next.js
- Node.js
- Redux
- Zustand
- GraphQL
- REST
- Tailwind
- HTML
- CSS
- Playwright
- Cypress
- Jest
- Vite
- Vue
- Angular
- Java
- .NET
- C#
- PHP
- WordPress
- SQL
- PostgreSQL
- MongoDB
- Docker
- AWS

Avoid false positives:
- "next step" is not Next.js
- "rest of team" is not REST
- "JavaScript" is not Java

8. Scoring

For React/Frontend:
- high score for React + Frontend + TypeScript
- boost Next.js, JavaScript, Node.js
- salary meeting minimum boosts score
- missing salary is warning, not auto skip
- obvious non-IT roles skip
- Angular/Vue/PHP/WordPress lower score unless React is strong

Decision:
- apply >= 70
- maybe 40-69
- skip < 40

9. Queue

Build queue from offers:
- apply/maybe only
- sort by priority score
- skip already sent
- sync queue item from Offer as source of truth

10. Safe form filling skeleton

Use Playwright.
Endpoint IPC:
queue.fillItem(id)

Behavior:
- open offer URL
- handle modals
- click safe apply button if found
- fill known candidate fields if configured
- upload CV if configured
- DO NOT click final submit
- return FillResult with debug data

11. Cleanup

Implement:
- delete selected offers
- bulk delete offers
- cleanup dev/test data
- backup before destructive delete

Do not delete sent applications by default.

12. Pagination

All large lists:
- Offers
- Collected URLs
- Queue
- Applications
- Debug Runs

Default:
- 25 for offers/queue/applications
- 10 for debug

13. Tests

Add Vitest tests for:
- URL classification
- relevance matcher
- salary normalization
- stack extraction
- title normalization
- scoring
- pagination helpers
- repository CRUD with test SQLite
- queue building
- offer completeness
- safe merge
- cleanup backup logic
- login wall detection helpers

No real website calls in tests.
Mock Playwright.

14. GitHub Actions

Add CI:
- pnpm install
- lint
- typecheck
- test
- build

15. README

Document:
- local desktop MVP
- setup
- pnpm install
- run dev
- SQLite location
- Playwright install
- safety rules
- job collection
- import/score/queue
- Rapid Apply
- debug
- backups
- future backend migration path

Future backend migration path:
Explain:
- current repository interfaces can be implemented by HTTP API adapter later
- services can move to backend later
- renderer can keep same API client shape
- SQLite can become backend DB later
- do not implement this now

Implementation phases:

Phase 1:
- scaffold Electron + React + TypeScript
- SQLite/Drizzle schema
- repository interfaces + SQLite repos
- IPC bridge
- basic UI pages
- simple Rate Calculator page
- pagination helpers
- salary/url/relevance/scoring modules with tests

Phase 2:
- Playwright collector
- collected URL import
- offer extraction fallback
- deep extraction
- queue

Phase 2 current status (desktop local MVP):
- implemented collector service in main process with Playwright browser service
- implemented pracuj.pl portal adapter (listing collection)
- implemented offer upsert/dedup by sourceId or normalized URL
- implemented search run persistence (collection_runs table)
- implemented IPC and preload methods: start/getStatus/cancel/listRuns/getProgress
- implemented Job Search UI collector controls and run summary
- implemented tests for collector service flow and repository upsert
- known limits: only pracuj adapter implemented in this phase increment; detail-page deep extraction not yet enabled

Phase 3:
- Rapid Apply
- debug UI
- cleanup
- polish

Acceptance criteria for first vertical slice:
- App starts as Electron desktop app.
- SQLite DB is created.
- User can manually add or import a job offer URL.
- Offer is normalized and scored.
- Offers page shows paginated offers.
- Queue can be built.
- Rate Calculator shows simple local B2B/UoP comparisons.
- Rapid Apply shows next queue item.
- No auto-submit exists.
