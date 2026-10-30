# Leads — Internships & Placements

Local-first static website that **auto-fetches** IT and software internships and graduate placements, with direct **Apply** URLs. Career portals are listed by region (Global, India, Japan, Europe, USA & Canada, Latin America).

## Run locally

Open the folder with any static server (required so browser `fetch` works):

```bash
npx --yes serve .
```

Then open the URL shown in the terminal (usually `http://localhost:3000`).

Or with Python:

```bash
python -m http.server 5500
```

## What it fetches

| Source | What you get |
|--------|----------------|
| SimplifyJobs 2027 | Summer 2027 SWE roles from the community GitHub list |
| ApplyGuy 2027 | Verified US software internship JSON feed |
| LinkedIn | Internship software-engineering feed (via aggregator) |
| The Muse | Public Software Engineering internship feed |
| Greenhouse | Company boards (Stripe, Cloudflare, HackerRank, …) intern + software |
| Ashby | Notion, Ramp, Snowflake, Cursor, Perplexity, … |
| Lever | Public company boards |
| Jobicy / Remotive / Remote OK / Arbeitnow | Remote / EU student & intern software roles |

Regional **Career portals** (Internshala, Unstop, Handshake, Wantedly, EURES, PM Internship Scheme, etc.) are linked for browsing boards that do not expose public CORS APIs.

## Files

- `index.html` — page structure
- `css/styles.css` — layout & brand styles
- `js/app.js` — live fetch, filters, and rendering

## Internship and placement flow

Choose an opportunity type and region, confirm eligibility on the employer page, apply, and track applications or notes in the spreadsheet. CSV export includes the filtered shortlist. Tracking is local to this browser.

The Simplify new-graduate feed includes multiple graduation cohorts; 2027 eligibility is not guaranteed. Unknown posting dates are shown explicitly. FresherFlow India and Surya Tracker are ingested alongside the Simplify internship and new-graduate feeds.

## Features

- Separate internship and placement tabs, role/location filters, remote opportunities.
- Icon-controlled navigation drawer for opportunities, tracker, saved profile, portals and source directory.
- Application statuses, notes and tracked role snapshots saved in browser localStorage.
- Reusable profile with automatic local saving and selected-field copying. External application forms open separately; cross-site autofill is not provided.
- CSV export with status and GitHub source URLs.
- Automatic feed refresh every 15 minutes while the page is visible.

Saved information is specific to the browser and origin. Profile data is not encrypted. Feeds can fail because of network or CORS restrictions; some adapters limit the returned rows. Check eligibility and availability on the employer site.

## Validation

```bash
node --check js/app.js
node --check js/application-profile.js
node tests/feeds.cjs
```

For an optional network integration check, run `node tests/live-feeds.cjs`.

Hosting manifests, release archives and build copies are excluded from this repository. Run locally with the instructions above.
