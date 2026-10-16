# Nestora

**Make Every Space Work Smarter.**

Nestora is a static affiliate-content website starter focused on practical small-space organization, storage, and home-office guides.

## Files
- `index.html` — homepage
- `about.html` — about page
- `disclosure.html` — affiliate disclosure
- `privacy.html` — privacy policy starter
- `guides/` — editorial guides
- `assets/` — site styles and JavaScript
- `robots.txt` and `sitemap.xml` — search engine starter files

## Before launch
1. Replace all placeholder canonical URLs with the final domain in the HTML pages, `robots.txt`, and `sitemap.xml`.
2. Add and verify real affiliate links for the exact products and marketplace in which each product is available.
3. Keep affiliate disclosures clear and conspicuous near affiliate links and on the disclosure page.
4. Review the privacy policy and all legal copy for the actual site's data practices and applicable law.
5. Test all pages, navigation, and responsive layouts on mobile and desktop.

This is a static starter, not a finished or legally reviewed production site.

## Cloudflare deployment
This repository is configured as a static-assets Cloudflare Worker using `wrangler.jsonc`. Pushes to `main` trigger deployment through Cloudflare Workers Builds.
