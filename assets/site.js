(() => {
 const marketplaces = {
  ae: { label: "United Arab Emirates", host: "www.amazon.ae", tag: "nestora073-21" },
  uk: { label: "United Kingdom", host: "www.amazon.co.uk", tag: "trivenico-21" },
  us: { label: "United States", host: "www.amazon.com", tag: "trivenico-20" }
 };
 const key = "nestora-marketplace";
 const readMarket = () => {
  const query = new URLSearchParams(location.search).get("market");
  if (query && marketplaces[query]) return query;
  try { const saved = localStorage.getItem(key); if (saved && marketplaces[saved]) return saved; } catch (_) {}
  return "ae";
 };
 let current = readMarket();
 const buildUrl = (query, market = current) => {
  const m = marketplaces[market] || marketplaces.ae;
  return "https://" + m.host + "/s?k=" + encodeURIComponent(query) + "&tag=" + encodeURIComponent(m.tag);
 };
 const applyMarket = market => {
  if (!marketplaces[market]) return;
  current = market;
  try { localStorage.setItem(key, market); } catch (_) {}
  document.querySelectorAll("[data-market-select]").forEach(el => { el.value = market; });
  document.querySelectorAll("[data-amazon-query]").forEach(el => {
   const query = el.getAttribute("data-amazon-query");
   el.href = buildUrl(query, current);
   el.setAttribute("rel", "sponsored nofollow noopener");
   el.setAttribute("target", "_blank");
  });
  document.querySelectorAll("[data-market-label]").forEach(el => { el.textContent = marketplaces[current].label; });
 };
 document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-market-select]").forEach(el => {
   el.value = current;
   el.addEventListener("change", () => applyMarket(el.value));
  });
  document.querySelectorAll("[data-amazon-query]").forEach(el => {
   el.addEventListener("click", () => {
    // Build the destination from the visitor's explicit click and selected marketplace.
    el.href = buildUrl(el.getAttribute("data-amazon-query"), current);
   });
  });
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (toggle && nav) toggle.addEventListener("click", () => {
   const open = nav.classList.toggle("open");
   toggle.setAttribute("aria-expanded", String(open));
  });
  applyMarket(current);
 });
})();