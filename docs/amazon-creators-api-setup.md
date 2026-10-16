# Amazon Creators API setup for Nestora

The live product finder is implemented in `functions/api/products.js`. It deliberately does not put Amazon credentials in browser JavaScript or commit them to GitHub.

## Before you start

Amazon's Creators API requires a fully accepted Amazon Associates account, approved API access for the target marketplace, and API credentials. Amazon's current documentation says API access is subject to qualifying-sales and acceptance requirements. See the [Creators API onboarding guide](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/onboarding/register-for-creators-api).

## Add credentials to Cloudflare Pages

1. Sign in to Cloudflare and open **Workers & Pages**.
2. Select the **nesstora** Pages project.
3. Open **Settings → Variables and Secrets** (the exact label may vary).
4. Add these values for the **Production** environment. Add Preview values only if you also want product lookup on preview deployments.

| Variable | Type | Value |
|---|---|---|
| `CREATORS_API_CLIENT_ID` | Secret | Client ID from Amazon Associates Central |
| `CREATORS_API_CLIENT_SECRET` | Secret | Client Secret from Amazon Associates Central |
| `CREATORS_API_VERSION` | Plain text variable | Exact credential version from Amazon, e.g. `3.2` or `3.1` |

5. Save the settings and trigger a new deployment.
6. Open `https://nesstora.pages.dev/shop/`, choose a category, and select **Find products**.

**Never commit the Client Secret to GitHub, paste it into website JavaScript, or share it in a public issue.** Use Cloudflare's encrypted Secret field.

## Marketplaces

The server endpoint only permits the configured tracking IDs:

- UAE: `nestora073-21` for `www.amazon.ae`
- UK: `trivenico-21` for `www.amazon.co.uk`
- US: `trivenico-20` for `www.amazon.com`

Amazon API access and a valid Associates account must cover the marketplace being queried. A tracking ID alone does not grant API access.

## What the product finder displays

The endpoint requests product titles, product images, and the affiliate product detail URL. It intentionally does not display prices or star ratings yet. Add those only after confirming the API fields and the current marketplace-specific rules for displaying and refreshing that data.

Until credentials are configured, the shop page remains usable through its category-level affiliate search links. Editorial lifestyle photographs are not presented as Amazon product photos.
