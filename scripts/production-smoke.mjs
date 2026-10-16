import assert from "node:assert/strict";

const origin = (process.env.PRODUCTION_URL || "https://nesstora.pages.dev").replace(/\/$/, "");
const timeout = 10000;

async function get(path) {
  return fetch(origin + path, {
    redirect: "follow",
    signal: AbortSignal.timeout(timeout),
    headers: { "user-agent": "Nesstora-Production-Smoke/1.0", "cache-control": "no-cache" }
  });
}

async function html(path, required, options = {}) {
  const response = await get(path);
  assert.equal(response.status, options.status ?? 200, `${path} should return HTTP ${options.status ?? 200}, got ${response.status}`);
  const body = await response.text();
  for (const fragment of required) {
    assert.ok(body.includes(fragment), `${path} is missing expected content: ${fragment}`);
  }
  return { response, body };
}

const home = await html("/", [
  "<title>", "rel=\"canonical\"", "name=\"description\"", "Content-Security-Policy"
]);
for (const header of [
  "x-content-type-options",
  "x-frame-options",
  "referrer-policy",
  "strict-transport-security",
  "content-security-policy"
]) {
  assert.ok(home.response.headers.get(header), `Homepage response is missing ${header}`);
}
assert.match(home.response.headers.get("content-security-policy") || "", /default-src 'self'/);

await html("/shop/", [
  "<title>", "class=\"affiliate-notice\"", "href=\"/disclosure.html\""
]);
await html("/guides/", ["<title>", "rel=\"canonical\""]);
await html("/disclosure.html", ["<title>"]);

const robots = await get("/robots.txt");
assert.equal(robots.status, 200, "robots.txt should be public");
const robotsText = await robots.text();
assert.ok(robotsText.includes("Sitemap: " + origin + "/sitemap.xml"), "robots.txt must reference the production sitemap");

const sitemap = await get("/sitemap.xml");
assert.equal(sitemap.status, 200, "sitemap.xml should be public");
const sitemapText = await sitemap.text();
assert.match(sitemapText, /<urlset\b/);
for (const path of ["/", "/shop/", "/guides/"]) {
  assert.ok(sitemapText.includes("<loc>" + origin + path + "</loc>"), `Sitemap must include ${path}`);
}

const api = await get("/api/products?market=uk&category=cables");
const contentType = api.headers.get("content-type") || "";
assert.match(contentType, /application\/json/i, "Product API must return JSON");
const apiBody = await api.json();
if (api.status === 200) {
  assert.equal(apiBody.configured, true, "Successful product API response must be marked configured");
  assert.equal(apiBody.market, "uk", "Product API response must match the requested marketplace");
  assert.ok(Array.isArray(apiBody.items), "Product API must return an items array");
} else if (api.status === 503 && apiBody.configured === false) {
  console.log("Product API is intentionally unconfigured; storefront search links remain available.");
} else {
  assert.fail(`Product API returned unexpected status ${api.status}: ${JSON.stringify(apiBody)}`);
}

console.log(`Nesstora production smoke checks passed for ${origin}: pages, headers, sitemap, robots and product API.`);
