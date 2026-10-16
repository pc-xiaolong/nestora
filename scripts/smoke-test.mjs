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
assert.ok(api.includes("AbortSignal.timeout(8000)"), "OAuth requests must have a bounded timeout");
assert.ok(api.includes("AbortSignal.timeout(10000)"), "Catalog requests must have a bounded timeout");
assert.ok(api.includes("PRODUCT_CACHE_TTL_MS"), "Product results must be cached to reduce repeated upstream calls");
assert.ok(api.includes("s-maxage=300"), "Successful product search responses should be eligible for short shared caching");
assert.ok(api.includes('response.status === 429'), "Amazon rate limits must produce a controlled response");
assert.ok(api.includes("fingerprintSecret(env.CREATORS_API_CLIENT_SECRET)"), "Credential rotation must invalidate cached tokens and product results");
assert.ok(api.includes("parsed.searchParams.get(\"tag\") === market.tag"), "Vended links must match the configured marketplace Partner tag");
assert.ok(!api.includes("parsed.searchParams.set(\"tag\""), "Never rewrite Amazon-vended links because it can break attribution");

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
