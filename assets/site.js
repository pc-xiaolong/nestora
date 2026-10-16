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
   el.href = buildUrl(el.getAttribute("data-amazon-query"), current);
   el.setAttribute("rel", "sponsored nofollow noopener");
   el.setAttribute("target", "_blank");
  });
  document.querySelectorAll("[data-market-label]").forEach(el => { el.textContent = marketplaces[current].label; });\n  if (typeof window.loadNestoraProducts === "function") window.loadNestoraProducts();
 };
 const initGuideFinder = () => {
  const search = document.querySelector("[data-guide-search]");
  const filter = document.querySelector("[data-guide-filter]");
  const cards = [...document.querySelectorAll("[data-guide-card]")];
  const count = document.querySelector("[data-guide-count]");
  const empty = document.querySelector("[data-guide-empty]");
  if (!cards.length || (!search && !filter)) return;
  const update = () => {
   const q = (search ? search.value : "").trim().toLowerCase();
   const category = filter ? filter.value : "all";
   let shown = 0;
   cards.forEach(card => {
    const matchesText = card.textContent.toLowerCase().includes(q);
    const matchesCategory = category === "all" || card.dataset.category === category;
    const visible = matchesText && matchesCategory;
    card.hidden = !visible;
    if (visible) shown++;
   });
   if (count) count.textContent = shown + (shown === 1 ? " guide found" : " guides found");
   if (empty) empty.hidden = shown !== 0;
  };
  if (search) search.addEventListener("input", update);
  if (filter) filter.addEventListener("change", update);
  update();
 };
 document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-market-select]").forEach(el => {
   el.value = current;
   el.addEventListener("change", () => applyMarket(el.value));
  });
  document.querySelectorAll("[data-amazon-query]").forEach(el => {
   el.addEventListener("click", () => { el.href = buildUrl(el.getAttribute("data-amazon-query"), current); });
  });
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (toggle && nav) toggle.addEventListener("click", () => {
   const open = nav.classList.toggle("open");
   toggle.setAttribute("aria-expanded", String(open));
  });
  initGuideFinder();
  applyMarket(current);
 });
})();