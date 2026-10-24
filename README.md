# Leads — 2027 Software Internships

Static website that **auto-fetches** off-campus software internship openings for the **2027 batch** and shows each role with a direct **Apply** URL. Career portals are listed by region (Global, India, Japan, Europe, USA & Canada, Latin America).

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
