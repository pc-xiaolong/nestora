(() => {
  const marketplaces = {
    ae: { label: "United Arab Emirates", host: "www.amazon.ae", tag: "nestora073-21" },
    uk: { label: "United Kingdom", host: "www.amazon.co.uk", tag: "trivenico-21" },
    us: { label: "United States", host: "www.amazon.com", tag: "trivenico-20" }
  };
  const productsByMarket = {
    uk: [
      { icon: "▤", tag: "Small-space storage", title: "Vacuum compression storage bags", why: "A useful way to reduce the bulk of seasonal bedding and clothing.", query: "vacuum compression storage bags with hand pump", signal: "UK Home & Kitchen bestseller signal" },
      { icon: "↔", tag: "Cable control", title: "Reusable cable ties", why: "Simple, inexpensive cable organisation for desks, TV units and chargers.", query: "reusable cable ties hook and loop", signal: "Cross-market cable-management demand" },
      { icon: "⌁", tag: "Desk setup", title: "Cable tidy clips and sleeves", why: "Route loose leads along desk edges and bundle longer runs.", query: "desk cable tidy clips cable sleeve", signal: "Current cable-tidy product listings" },
      { icon: "▱", tag: "Under desk", title: "Clamp-on cable management trays", why: "Lift power strips and excess cable away from the floor.", query: "under desk cable management tray clamp no drill", signal: "Workspace organisation staple" },
      { icon: "▦", tag: "Drawer order", title: "Adjustable drawer organiser trays", why: "Create separate zones for stationery, tools or everyday essentials.", query: "adjustable drawer organiser trays set", signal: "Home organisation category demand" },
      { icon: "▥", tag: "Vertical space", title: "Over-door storage organisers", why: "Add storage without using another patch of floor space.", query: "over door storage organiser pockets", signal: "Small-space organisation staple" }
    ],
    ae: [
      { icon: "▦", tag: "Drawer order", title: "Clear drawer organiser trays", why: "Separate small items in bathroom, kitchen or office drawers.", query: "clear drawer organiser trays set", signal: "UAE home-storage category report" },
      { icon: "▤", tag: "Stackable storage", title: "Stackable clear storage drawers", why: "Make shelves and vanity areas easier to sort and see.", query: "stackable clear storage drawers home organisation", signal: "UAE home-storage category report" },
      { icon: "▥", tag: "Vertical space", title: "Stackable metal storage shelves", why: "Use vertical space in kitchens, utility rooms and compact storage areas.", query: "stackable metal storage shelves kitchen bathroom", signal: "UAE home category listings" },
      { icon: "↔", tag: "Cable control", title: "Reusable cable ties and clips", why: "Keep charging cables and workstation leads grouped together.", query: "reusable cable ties adhesive cable clips", signal: "Cross-market cable-management demand" },
      { icon: "⌁", tag: "Desk setup", title: "Under-desk cable trays", why: "Keep adapters and spare cable length off the floor.", query: "under desk cable management tray", signal: "Workspace organisation staple" },
      { icon: "▤", tag: "Flexible storage", title: "Lidded stackable storage bins", why: "Store household essentials while keeping contents grouped.", query: "stackable storage bins with lids", signal: "Home organisation category demand" }
    ],
    us: [
      { icon: "↔", tag: "Cable control", title: "Reusable hook-and-loop cable ties", why: "A low-cost way to bundle cords for home offices and entertainment setups.", query: "reusable hook and loop cable ties", signal: "Cable organiser report: leading products estimated at 6k–10k monthly sales in June 2026" },
      { icon: "⌁", tag: "Cable protection", title: "Split cable sleeves", why: "Bundle several wires into a neater run behind a desk or TV.", query: "split cable sleeve wire loom protector", signal: "Cable organiser report: established high-review category" },
      { icon: "▱", tag: "Under desk", title: "No-drill cable management trays", why: "Route power strips and loose cable below a desk surface.", query: "under desk cable management tray no drill clamp", signal: "Cable-management product research" },
      { icon: "⌖", tag: "Cable routing", title: "Adhesive cable clips", why: "Keep frequently used charging leads near the edge of a table.", query: "adhesive cable clips desk cord organizer", signal: "Cable-management product research" },
      { icon: "▦", tag: "Drawer order", title: "Stackable clear storage drawers", why: "Make small items visible and easier to retrieve in cabinets or closets.", query: "stackable clear storage drawers organizer", signal: "Home organisation category demand" },
      { icon: "▤", tag: "Flexible storage", title: "Vacuum storage bags", why: "Compress bulky clothing and bedding for closets or seasonal storage.", query: "vacuum storage bags with hand pump", signal: "Home organisation category demand" }
    ]
  };
  const key = "nestora-marketplace";
  const readMarket = () => {
    const params = new URLSearchParams(location.search);
    const requested = params.get("market");
    if (requested && marketplaces[requested]) return requested;
    try { const saved = localStorage.getItem(key); if (saved && marketplaces[saved]) return saved; } catch (_) {}
    return "uk";
  };
  let current = readMarket();
  const buildUrl = (query, market = current) => {
    const m = marketplaces[market] || marketplaces.uk;
    return "https://" + m.host + "/s?k=" + encodeURIComponent(query) + "&tag=" + encodeURIComponent(m.tag);
  };
  const setAmazonLink = (el, query) => {
    el.href = buildUrl(query, current);
    el.setAttribute("rel", "sponsored nofollow noopener");
    el.setAttribute("target", "_blank");
  };
  const renderTrending = () => {
    const grid = document.querySelector("#trend-grid");
    if (!grid) return;
    grid.innerHTML = "";
    (productsByMarket[current] || productsByMarket.uk).forEach(product => {
      const card = document.createElement("article");
      card.className = "trend-card";
      const art = document.createElement("div");
      art.className = "trend-art";
      art.setAttribute("aria-hidden", "true");
      art.textContent = product.icon;
      const content = document.createElement("div");
      content.className = "trend-content";
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = product.tag;
      const title = document.createElement("h3");
      title.textContent = product.title;
      const why = document.createElement("p");
      why.textContent = product.why;
      const signal = document.createElement("p");
      signal.className = "trend-signal";
      signal.textContent = "Why it's on the list: " + product.signal + ".";
      const link = document.createElement("a");
      link.className = "button";
      link.textContent = "View Amazon results ↗";
      link.setAttribute("data-amazon-query", product.query);
      setAmazonLink(link, product.query);
      const copy = document.createElement("button");
      copy.className = "copy-link";
      copy.type = "button";
      copy.textContent = "Copy affiliate link";
      copy.setAttribute("data-copy-query", product.query);
      content.append(tag, title, why, signal, link, copy);
      card.append(art, content);
      grid.append(card);
    });
  };
  const applyMarket = market => {
    if (!marketplaces[market]) return;
    current = market;
    try { localStorage.setItem(key, market); } catch (_) {}
    document.querySelectorAll("[data-market-select]").forEach(el => { el.value = market; });
    document.querySelectorAll("[data-amazon-query]").forEach(el => setAmazonLink(el, el.getAttribute("data-amazon-query")));
    document.querySelectorAll("[data-market-label]").forEach(el => { el.textContent = marketplaces[current].label; });
    renderTrending();
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
        const visible = card.textContent.toLowerCase().includes(q) && (category === "all" || card.dataset.category === category);
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
    document.addEventListener("click", async event => {
      const copy = event.target.closest("[data-copy-query]");
      if (!copy) return;
      const url = buildUrl(copy.getAttribute("data-copy-query"), current);
      const status = document.querySelector("#copy-status");
      try {
        await navigator.clipboard.writeText(url);
        copy.textContent = "Copied!";
        if (status) status.textContent = "Affiliate link copied for Amazon " + marketplaces[current].label + ".";
      } catch (_) {
        if (status) status.textContent = "Copy was blocked by this browser. Open the Amazon result and copy the address bar URL instead: " + url;
      }
      window.setTimeout(() => { copy.textContent = "Copy affiliate link"; }, 1800);
    });
    document.querySelectorAll("[data-amazon-query]").forEach(el => {
      el.addEventListener("click", () => setAmazonLink(el, el.getAttribute("data-amazon-query")));
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