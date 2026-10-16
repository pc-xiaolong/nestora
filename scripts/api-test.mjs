import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "functions/api/products.js"), "utf8");
const executableSource = source.replace("export async function onRequestGet", "async function onRequestGet");
assert.notEqual(executableSource, source, "API handler export must exist");
const loadHandler = new Function(executableSource + "\nreturn onRequestGet;");
const onRequestGet = loadHandler();

const request = (query = "") => new Request("https://nesstora.pages.dev/api/products" + query);
const readJson = async response => ({ status: response.status, body: await response.json() });

const invalid = await readJson(await onRequestGet({ request: request("?market=xx&category=cables"), env: {} }));
assert.equal(invalid.status, 400, "Unknown marketplace must be rejected");
assert.match(invalid.body.error, /Unsupported marketplace/);

const missingCredentials = await readJson(await onRequestGet({ request: request("?market=uk&category=cables"), env: {} }));
assert.equal(missingCredentials.status, 503, "Missing API credentials must return service unavailable");
assert.equal(missingCredentials.body.configured, false);

const originalFetch = globalThis.fetch;
try {
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.ok(options.signal, "Upstream requests must have an abort timeout");
    if (String(url).includes("/auth/o2/token")) {
      return new Response(JSON.stringify({ access_token: "test-access-token", expires_in: 3600 }), {
        status: 200, headers: { "content-type": "application/json" }
      });
    }
    assert.equal(String(url), "https://creatorsapi.amazon/catalog/v1/searchItems");
    assert.equal(options.headers["x-marketplace"], "www.amazon.co.uk");
    const payload = JSON.parse(options.body);
    assert.equal(payload.marketplace, "www.amazon.co.uk");
    assert.equal(payload.partnerTag, "trivenico-21");
    return new Response(JSON.stringify({
      searchResult: { items: [
        {
          asin: "TEST123",
          detailPageURL: "https://www.amazon.co.uk/dp/TEST123",
          itemInfo: { title: { displayValue: "Test cable organiser" } },
          images: { primary: { medium: { url: "https://m.media-amazon.com/images/I/test.jpg" } } }
        },
        {
          asin: "EVIL123",
          detailPageURL: "https://evil.example/dp/EVIL123",
          itemInfo: { title: { displayValue: "Untrusted product URL" } },
          images: { primary: { medium: { url: "https://m.media-amazon.com/images/I/evil.jpg" } } }
        },
        {
          asin: "IMG123",
          detailPageURL: "https://www.amazon.co.uk/dp/IMG123",
          itemInfo: { title: { displayValue: "Untrusted image URL" } },
          images: { primary: { medium: { url: "https://evil.example/image.jpg" } } }
        }
      ] }
    }), { status: 200, headers: { "content-type": "application/json" } });
  };

  const env = {
    CREATORS_API_CLIENT_ID: "test-client-id",
    CREATORS_API_CLIENT_SECRET: "test-client-secret",
    CREATORS_API_VERSION: "3.2"
  };
  const result = await readJson(await onRequestGet({ request: request("?market=uk&category=cables"), env }));
  assert.equal(result.status, 200);
  assert.equal(result.body.configured, true);
  assert.equal(result.body.items.length, 1, "Unsafe product URLs and image hosts must be excluded");
  assert.equal(result.body.items[0].asin, "TEST123");
  assert.equal(result.body.items[0].url, "https://www.amazon.co.uk/dp/TEST123?tag=trivenico-21");
  assert.equal(calls, 2, "One token request and one catalog request expected");

  const unsupportedVersion = await readJson(await onRequestGet({
    request: request("?market=us&category=cables"),
    env: { ...env, CREATORS_API_VERSION: "9.9" }
  }));
  assert.equal(unsupportedVersion.status, 500, "Unknown credential versions must fail closed");
} finally {
  globalThis.fetch = originalFetch;
}

console.log("Nestora API tests passed: input validation, missing credentials, request construction, and unsafe product filtering.");
