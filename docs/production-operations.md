# Nesstora production operations runbook

## Monitoring

- The GitHub Actions quality gate runs on pushes and pull requests to `main`.
- The production smoke monitor runs every 30 minutes, can be started manually, and runs after a successful quality-gate workflow on `main`.
- The monitor checks key HTML routes, required response security headers, sitemap and robots references, and the product API's documented configured/unconfigured response shapes. Static requests use cache-busting query parameters; expected HTML fragments are retried to tolerate brief deployment propagation delays.
- Review the run history in GitHub Actions. A failed smoke run means production needs investigation; it does not automatically mean the static storefront is unavailable.

## Incident triage

1. Open the failed production-smoke run and identify the first failed assertion and URL.
2. Check the latest Cloudflare Pages deployment status and compare its commit SHA with the latest successful quality-gate run.
3. Check whether the failure is limited to the optional Amazon product API. A 503 response with `configured: false` is an expected state when approved API credentials are not configured.
4. For a security-header failure, inspect the deployed response headers before changing policy. Do not weaken CSP blindly to make a test pass.
5. For a product API failure, inspect status codes and safe error messages only. Never print or paste Amazon API secrets into logs or issues.

## Rollback procedure

1. Open Cloudflare Dashboard → Workers & Pages → Pages → `nesstora` → Deployments.
2. Identify the last known-good production deployment using the commit SHA and successful smoke/quality results.
3. Use the dashboard's available rollback/restore action for that deployment if supported. If rollback is not available, revert the offending Git commit and push the revert to `main`.
4. Wait for the new Pages deployment to complete, then run the production smoke workflow manually.
5. Record the incident, the failed check, the rollback commit/deployment, and the follow-up corrective action.

## Rate limiting limitation

The product function has an isolate-local fallback throttle and now supports an optional `PRODUCT_RATE_LIMITER` Cloudflare Rate Limiting binding. When configured, the binding shares counters across isolates within a Cloudflare location, but Cloudflare documents it as permissive/eventually consistent and not globally consistent. The binding is not yet configured in `wrangler.jsonc` or verified in production, so the isolate-local throttle remains the active protection. Before enabling the binding, select a positive integer `namespace_id` unique within the Cloudflare account and configure the `ratelimits` binding using Wrangler 4.36.0 or later. The project currently has no custom domain, so zone-level WAF rules need a suitable custom domain/zone. Do not claim edge binding or WAF protection is active until deployed and tested.

## Release checklist

- [ ] GitHub quality gate passes.
- [ ] Cloudflare Pages deployment completes successfully.
- [ ] Production smoke monitor passes after deployment.
- [ ] Marketplace tags and Associates account eligibility are verified independently.
- [ ] API credentials remain in Cloudflare secrets and are never committed.
