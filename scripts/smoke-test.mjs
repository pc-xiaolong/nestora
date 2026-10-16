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
assert.ok(!existsSync(join(root, "worker.js")), "Do not ship a standalone Worker entrypoint in the Pages asset root");

const routes = JSON.parse(read("_routes.json"));
assert.equal(routes.version, 1, "Pages Functions route schema version must be 1");
assert.ok(routes.include.includes("/api/*"), "Pages Functions must be invoked for API routes");
assert.deepEqual(routes.exclude, [], "No API route exclusions should shadow the product endpoint");

const js = read("assets/site.js");
const api = read("functions/api/products.js");
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
