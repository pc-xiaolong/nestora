import { onRequestGet } from "./functions/api/products.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/products" || url.pathname === "/api/products/") {
      if (request.method !== "GET") {
        return new Response(JSON.stringify({ error: "Method not allowed." }), {
          status: 405,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
            "allow": "GET",
            "x-content-type-options": "nosniff"
          }
        });
      }
      return onRequestGet({ request, env });
    }

    return env.ASSETS.fetch(request);
  }
};
