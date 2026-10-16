# Nesstora

**Make Every Space Work Smarter.**

Nesstora is a static multi-page affiliate-content website focused on practical small-space organisation, technology gadgets, charging accessories, computer peripherals, smart-home products, and home-office guides. Its optional product finder uses Cloudflare Pages Functions to call Amazon's Creators API server-side. Marketplace and category changes cancel stale in-flight searches so the interface does not display results for a previous selection.

## Production architecture

- Hosting: Cloudflare Pages project `nesstora`, connected to `pc-xiaolong/nestora`, production branch `main`, output directory `.`.
- Static frontend: HTML pages, `assets/styles.css`, and `assets/site.js`.
- API: `functions/api/products.js`, automatically routed by Cloudflare Pages to `/api/products`.
- API abuse defence: an isolate-local per-client-IP throttle returns HTTP 429 after 30 requests per 60-second window. This is defense in depth only; configure a Cloudflare edge rate-limiting rule for globally consistent enforcement across isolates and deployments.
- Function routing: `_routes.json` limits function invocations to `/api/*`, avoiding unnecessary function invocations for static pages.
- Deployment configuration: `wrangler.jsonc` uses `pages_build_output_dir`, not the Workers static-assets configuration.
- Quality gate: `.github/workflows/quality.yml` runs syntax and smoke tests on pushes and pull requests.

## Amazon marketplaces

The configured tracking IDs are currently:

- UAE: `nestora073-21` for `www.amazon.ae`
- UK: `trivenico-21` for `www.amazon.co.uk`
- US: `trivenico-20` for `www.amazon.com`

Verify that each ID belongs to the correct Associates account and marketplace before production promotion. These IDs are configuration values, not proof of account approval or Creators API access.

## Configure live product lookup

The shop remains usable through marketplace-specific affiliate search links without API credentials. Individual live product cards require approved Creators API access for the selected marketplace.

In Cloudflare, open the `nesstora` Pages project, then **Settings → Variables and Secrets**. Add the following for Production (and Preview only if needed):

| Variable | Type | Purpose |
|---|---|---|
| `CREATORS_API_CLIENT_ID` | Secret | Amazon Creators API client ID |
| `CREATORS_API_CLIENT_SECRET` | Secret | Amazon Creators API client secret |
| `CREATORS_API_VERSION` | Plain text | Exact version associated with issued credentials, such as `3.2` |

Only set the version Amazon actually issued. An accepted Associates account and separate API approval are required. Never place the client secret in browser code, repository files, issues, or logs.

## Multi-network affiliate catalogue (Awin-ready)

`assets/affiliate-products.json` is the versioned catalogue for approved non-Amazon partner offers. It intentionally starts empty: Awin advertiser approval and real tracking URLs are not available yet, so Nesstora must not fabricate links or publish unverified offers.

Each active product must use this shape:

```json
{
  "id": "approved-offer-001",
  "title": "Product title",
  "category": "Home organisation",
  "network": "awin",
  "retailer": "Approved advertiser",
  "market": "uk",
  "affiliateUrl": "https://www.awin1.com/cread.php?...",
  "imageUrl": null,
  "status": "active"
}
```

- Add an offer only after the relevant advertiser programme approves the account and the URL is generated or verified in Awin.
- `network` must be `awin`, `status` must be `active`, and `market` must be `uk`, `ae`, or `us`.
- Affiliate URLs must be HTTPS Awin tracking URLs (`awin1.com` / `awin.com`). Direct retailer URLs and placeholders are rejected by the frontend validator.
- Product images are optional; only use images the advertiser/network permits. Confirm image rights and market availability before activation.
- Offers render only on `/shop/` and only for the currently selected market. If the catalogue is empty or invalid, the section stays hidden and Amazon shopping remains unaffected.
- Update the affiliate disclosure before enabling a new network publicly, and make the network relationship clear near recommendations.

## Quality checks

Requires Node.js 22 or later:

```sh
node --input-type=module --check < functions/api/products.js
node --input-type=module --check < assets/site.js
node scripts/smoke-test.mjs
```

## Production verification checklist

1. `/`, `/shop/`, and `/guides/` load successfully.
2. Unknown paths return HTTP 404 and display `404.html`.
3. `/api/products?market=uk&category=cables` returns a controlled JSON response when credentials are absent, and returns product listings only when credentials and marketplace access are valid.
4. Marketplace links use the corresponding Amazon domain and Associates tracking ID.
5. The GitHub Actions quality gate passes and the latest Cloudflare Pages production deployment completes successfully.

This is an engineering baseline. Live affiliate attribution, Creators API access, and production behavior must be verified separately; the source code alone cannot prove those external conditions.