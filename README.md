# Nestora

**Make Every Space Work Smarter.**

Nestora is a static affiliate-content website focused on practical small-space organization, storage, and home-office guides, with an optional server-side Amazon Creators API product finder.

## Architecture

- Static multi-page HTML site; no user accounts or application database.
- assets/site.js — marketplace selector, tagged search links, copy-link controls, guide search, and live product-finder UI.
- functions/api/products.js — server-side Amazon Creators API integration. Credentials must be configured as Cloudflare secrets and must never be committed.
- worker.js — routes /api/* to the product handler and serves remaining requests through the static ASSETS binding.
- wrangler.jsonc — Worker entry point, static assets, API routing, and custom 404 behavior.
- scripts/smoke-test.mjs — configuration, affiliate ID consistency, and local-link smoke tests.
- .github/workflows/quality.yml — JavaScript syntax checks and smoke tests on pushes and pull requests.

## Amazon marketplaces

The configured tracking IDs are currently:

- UAE: nestora073-21 for www.amazon.ae
- UK: trivenico-21 for www.amazon.co.uk
- US: trivenico-20 for www.amazon.com

Verify that each ID is registered to the correct Associates account and marketplace before production promotion. These IDs are project configuration, not proof of approval or API access.

## Configure live product lookup

The shop remains usable through marketplace-specific affiliate search links without API credentials. Live product cards require approved Creators API access for the requested marketplace.

In Cloudflare, add the following under the production environment's Variables and Secrets:

| Variable | Type | Purpose |
|---|---|---|
| CREATORS_API_CLIENT_ID | Secret | Amazon Creators API client ID |
| CREATORS_API_CLIENT_SECRET | Secret | Amazon Creators API client secret |
| CREATORS_API_VERSION | Plain text | Exact version associated with issued credentials, such as 3.2 |

Only set the API version Amazon actually issued. A qualifying Associates account and separate API approval are required. Never put the client secret in browser code, repository files, issues, or logs.

## Local quality checks

Requires Node.js 22 or later:

    node --input-type=module --check < worker.js
    node --input-type=module --check < functions/api/products.js
    node --input-type=module --check < assets/site.js
    node scripts/smoke-test.mjs

GitHub Actions runs these checks for pushes and pull requests targeting main.

## Deployment notes

The repository is configured for Cloudflare Workers static assets. Ensure the Cloudflare deployment is connected to this repository and uses wrangler.jsonc as its configuration. After deployment, verify:

1. /, /shop/, and /guides/ load.
2. An unknown path returns HTTP 404 and the custom 404.html.
3. /api/products?market=uk&category=cables returns a controlled JSON response when credentials are absent, and product results only after credentials and marketplace access are valid.
4. Each marketplace's affiliate links use the matching store and tracking ID.
5. The GitHub Actions quality gate passes.

This is an engineering baseline, not a claim that live affiliate IDs, Amazon API access, or production deployment have been independently verified.