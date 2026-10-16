# Nestora

**Make Every Space Work Smarter.**

Nestora is a static multi-page affiliate-content website focused on practical small-space organization, storage, and home-office guides. Its optional product finder uses Cloudflare Pages Functions to call Amazon's Creators API server-side.

## Production architecture

- Hosting: Cloudflare Pages project `nesstora`, connected to `pc-xiaolong/nestora`, production branch `main`, output directory `.`.
- Static frontend: HTML pages, `assets/styles.css`, and `assets/site.js`.
- API: `functions/api/products.js`, automatically routed by Cloudflare Pages to `/api/products`.
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