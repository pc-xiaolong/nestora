import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = normalize(join(dirname(fileURLToPath(import.meta.url)), ".."));
const read = path => readFileSync(join(root, path), "utf8");
const config = JSON.parse(read("wrangler.jsonc"));

assert.equal(config.name, "nesstora", "Pages project name must match the production project");
assert.equal(config.pages_build_output_dir, ".", "Pages must publish the repository root");
assert.ok(config.compatibility_date, "Pages Functions compatibility date must be set");
assert.ok(existsSync(join(root, "functions/api/products.js")), "Product Pages Function must exist");
assert.ok(existsSync(join(root, "404.html")), "Custom 404 page must exist");
const securityHeaders = read("_headers");
for (const header of ["X-Content-Type-Options: nosniff", "X-Frame-Options: DENY", "Referrer-Policy:", "Content-Security-Policy:"]) {
  assert.ok(securityHeaders.includes(header), `Security header must be configured: ${header}`);
}
assert.ok(!existsSync(join(root, "worker.js")), "Do not ship a standalone Worker entrypoint in the Pages asset root");

const routes = JSON.parse(read("_routes.json"));
assert.equal(routes.version, 1, "Pages Functions route schema version must be 1");
assert.ok(routes.include.includes("/api/*"), "Pages Functions must be invoked for API routes");
assert.deepEqual(routes.exclude, [], "No API route exclusions should shadow the product endpoint");

const js = read("assets/site.js");
const api = read("functions/api/products.js");
assert.ok(!js.includes("CREATORS_API_CLIENT_SECRET"), "Amazon client secrets must never be included in browser JavaScript");
assert.ok(js.includes("productFinderAbortController.abort()"), "Stale product lookups must be cancelled on state changes");
assert.ok(js.includes('category.addEventListener("change"'), "Changing the selected category must invalidate previous results");
assert.ok(js.includes('button.textContent = "Find live products ↗"'), "Product finder button must reset after cancellation");
assert.ok(api.includes("AbortSignal.timeout(8000)"), "OAuth requests must have a bounded timeout");
assert.ok(api.includes("AbortSignal.timeout(10000)"), "Catalog requests must have a bounded timeout");
assert.ok(api.includes("PRODUCT_CACHE_TTL_MS"), "Product results must be cached to reduce repeated upstream calls");
assert.ok(api.includes("s-maxage=300"), "Successful product search responses should be eligible for short shared caching");
assert.ok(api.includes('response.status === 429'), "Amazon rate limits must produce a controlled response");
assert.ok(api.includes("fingerprintSecret(env.CREATORS_API_CLIENT_SECRET)"), "Credential rotation must invalidate cached tokens and product results");
assert.ok(api.includes("parsed.searchParams.get(\"tag\") === market.tag"), "Vended links must match the configured marketplace Partner tag");
assert.ok(!api.includes("parsed.searchParams.set(\"tag\""), "Never rewrite Amazon-vended links because it can break attribution");
for (const category of ["charging", "power", "audio", "smart-home", "desk-tech", "computer-accessories", "wearables", "streaming"]) {
  assert.ok(api.includes(category + ":") || api.includes("\"" + category + "\":"), `API technology category must be supported: ${category}`);
  assert.ok(js.includes('title: "') && js.includes(category) || read("shop/index.html").includes('value="' + category + '"'), `Shop should expose technology category: ${category}`);
}


assert.ok(api.includes("IMAGE_HOSTS.has(imageUrl.hostname)"), "Product image hosts must be allowlisted");
assert.ok(api.includes("!env.CREATORS_API_VERSION"), "Credential version must be explicit; do not silently assume a region");
assert.ok(!api.includes('env.CREATORS_API_VERSION || "3.2"'), "API must not silently select an OAuth region");
for (const [market, tag, host] of [
  ["ae", "nestora073-21", "www.amazon.ae"],
  ["uk", "trivenico-21", "www.amazon.co.uk"],
  ["us", "trivenico-20", "www.amazon.com"]
]) {
  assert.ok(js.includes(`${market}: { label:`), `Frontend marketplace ${market} must exist`);
  assert.ok(js.includes(`tag: "${tag}"`), `Frontend tracking ID for ${market} must exist`);
  assert.ok(api.includes(`tag: "${tag}"`), `API tracking ID for ${market} must match`);
  assert.ok(api.includes(`host: "${host}"`), `API host for ${market} must exist`);
}

const amazonPicks = JSON.parse(read("assets/amazon-picks.json"));
assert.equal(amazonPicks.schemaVersion, 1, "Amazon picks schema version must be explicit");
assert.equal(amazonPicks.products.length, 30, "Publish ten Amazon search candidates for each of three marketplaces");
for (const market of ["uk", "ae", "us"]) {
  assert.equal(amazonPicks.products.filter(product => product.market === market).length, 10, `Exactly ten Amazon candidates must exist for ${market}`);
}
for (const product of amazonPicks.products) {
  assert.ok(product.title && product.query && product.sourceUrl, "Every Amazon candidate must have title, search query and source");
  assert.ok(product.sourceUrl.startsWith("https://www.amazon."), "Bestseller source must be an Amazon HTTPS page");
}
assert.ok(js.includes("renderMarketplacePicks"), "Marketplace shortlist renderer must exist");
assert.ok(read("shop/index.html").includes('id="amazon-picks-grid"'), "Shop must contain the Amazon picks grid");

const affiliateCatalogue = JSON.parse(read("assets/affiliate-products.json"));
assert.equal(affiliateCatalogue.schemaVersion, 1, "Affiliate catalogue schema version must be explicit");
assert.ok(Array.isArray(affiliateCatalogue.products), "Affiliate catalogue products must be an array");
assert.equal(affiliateCatalogue.products.length, 0, "Do not publish placeholder or unverified partner offers");
assert.ok(js.includes("validAffiliateProduct"), "Partner products must pass browser-side validation");
assert.ok(js.includes('product.network !== "awin"'), "Only explicitly tagged Awin products may render in the partner catalogue");
assert.ok(js.includes('product.status !== "active"'), "Draft or unapproved partner products must not render");
assert.ok(js.includes('url.protocol !== "https:"'), "Partner tracking links must use HTTPS");
assert.ok(js.includes('"awin1.com", "www.awin1.com", "awin.com", "www.awin.com"'), "Partner links must be restricted to Awin tracking domains");
assert.ok(js.includes("renderPartnerCatalogue();"), "Partner offers must refresh when the selected marketplace changes");
const shopHtml = read("shop/index.html");
assert.ok(shopHtml.includes('id="partner-products-section"'), "Shop must contain the conditional partner-offers section");
assert.ok(shopHtml.includes('id="partner-products-grid"'), "Shop must contain the partner product grid");

const htmlFiles = [];
function walk(dir) {
  for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "functions" || entry.name === "docs" || entry.name === "scripts") continue;
    const relative = join(dir, entry.name);
    if (entry.isDirectory()) walk(relative);
    else if (entry.isFile() && entry.name.endsWith(".html")) htmlFiles.push(relative);
  }
}
walk(".");
const broken = [];
for (const file of htmlFiles) {
  const html = read(file);
  const attrs = [...html.matchAll(/\b(?:href|src)\s*=\s*["']([^"'#]+)["']/gi)].map(match => match[1]);
  for (const value of attrs) {
    if (/^(?:https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(value)) continue;
    const pathname = value.split(/[?#]/, 1)[0];
    if (!pathname) continue;
    const target = normalize(pathname.startsWith("/")
      ? join(root, pathname.replace(/^\/+/, ""))
      : join(root, dirname(file), pathname));
    if (!target.startsWith(root)) {
      broken.push(`${file}: unsafe local path ${value}`);
      continue;
    }
    if (!existsSync(target) && !existsSync(target + ".html") && !existsSync(join(target, "index.html"))) {
      broken.push(`${file}: missing local target ${value}`);
    }
  }
}
assert.deepEqual(broken, [], "Every local HTML href/src should resolve");
console.log(`Nestora smoke checks passed: configuration, API routing, affiliate IDs, and ${htmlFiles.length} HTML pages checked.`);
