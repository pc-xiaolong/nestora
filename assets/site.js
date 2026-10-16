(() => {
  const marketplaces = {
    ae: { label: "United Arab Emirates", host: "www.amazon.ae", tag: "nestora073-21" },
    uk: { label: "United Kingdom", host: "www.amazon.co.uk", tag: "trivenico-21" },
    us: { label: "United States", host: "www.amazon.com", tag: "trivenico-20" }
  };
  const productsByMarket = {
    uk: [
      { icon: "▤", tag: "Small-space storage", title: "Vacuum compression storage bags", why: "A useful way to reduce the bulk of seasonal bedding and clothing.", query: "vacuum compression storage bags with hand pump", signal: "Useful seasonal-storage category" },
      { icon: "↔", tag: "Cable control", title: "Reusable cable ties", why: "Simple, inexpensive cable organisation for desks, TV units and chargers.", query: "reusable cable ties hook and loop", signal: "Common desk-organisation need" },
      { icon: "⌁", tag: "Desk setup", title: "Cable tidy clips and sleeves", why: "Route loose leads along desk edges and bundle longer runs.", query: "desk cable tidy clips cable sleeve", signal: "Common cable-routing option" },
      { icon: "▱", tag: "Under desk", title: "Clamp-on cable management trays", why: "Lift power strips and excess cable away from the floor.", query: "under desk cable management tray clamp no drill", signal: "Practical workspace-storage category" },
      { icon: "▦", tag: "Drawer order", title: "Adjustable drawer organiser trays", why: "Create separate zones for stationery, tools or everyday essentials.", query: "adjustable drawer organiser trays set", signal: "Common home-organisation use case" },
      { icon: "▥", tag: "Vertical space", title: "Over-door storage organisers", why: "Add storage without using another patch of floor space.", query: "over door storage organiser pockets", signal: "Useful for compact rooms" },
      { icon: "⚡", tag: "Charging tech", title: "GaN USB-C fast chargers", why: "Compare compact multi-port chargers for phones, tablets and laptops.", query: "GaN USB C fast charger multi port UK plug", signal: "Useful everyday charging accessory" },
      { icon: "▰", tag: "Portable power", title: "USB-C power banks", why: "Check capacity, output wattage, airline rules and device compatibility.", query: "USB C PD power bank 20000mAh", signal: "Practical mobile-power category" },
      { icon: "⌘", tag: "Desk tech", title: "USB-C hubs and docks", why: "Add the ports your laptop actually needs; verify display and power-delivery support.", query: "USB C hub HDMI power delivery laptop", signal: "Common laptop-accessory need" },
      { icon: "♫", tag: "Audio", title: "Wireless earbuds", why: "Compare fit, microphone quality, battery life and multipoint support.", query: "wireless earbuds multipoint USB C charging", signal: "Popular personal-electronics category" }
    ],
    ae: [
      { icon: "▦", tag: "Drawer order", title: "Clear drawer organiser trays", why: "Separate small items in bathroom, kitchen or office drawers.", query: "clear drawer organiser trays set", signal: "Useful compact-storage category" },
      { icon: "▤", tag: "Stackable storage", title: "Stackable clear storage drawers", why: "Make shelves and vanity areas easier to sort and see.", query: "stackable clear storage drawers home organisation", signal: "Useful compact-storage category" },
      { icon: "▥", tag: "Vertical space", title: "Stackable metal storage shelves", why: "Use vertical space in kitchens, utility rooms and compact storage areas.", query: "stackable metal storage shelves kitchen bathroom", signal: "Common household-storage option" },
      { icon: "↔", tag: "Cable control", title: "Reusable cable ties and clips", why: "Keep charging cables and workstation leads grouped together.", query: "reusable cable ties adhesive cable clips", signal: "Common desk-organisation need" },
      { icon: "⌁", tag: "Desk setup", title: "Under-desk cable trays", why: "Keep adapters and spare cable length off the floor.", query: "under desk cable management tray", signal: "Practical workspace-storage category" },
      { icon: "▤", tag: "Flexible storage", title: "Lidded stackable storage bins", why: "Store household essentials while keeping contents grouped.", query: "stackable storage bins with lids", signal: "Common home-organisation use case" },
      { icon: "⚡", tag: "Charging tech", title: "USB-C GaN chargers", why: "Compare multi-port chargers against your devices' required wattage and plug type.", query: "USB C GaN charger 65W 100W UAE plug", signal: "Useful everyday charging accessory" },
      { icon: "▰", tag: "Portable power", title: "USB-C power banks", why: "Check capacity, fast-charge protocols and airline carry-on limits.", query: "USB C PD power bank 20000mAh UAE", signal: "Practical mobile-power category" },
      { icon: "⌂", tag: "Smart home", title: "Smart plugs and bulbs", why: "Verify Wi-Fi band, app support and compatibility with your smart-home platform.", query: "Matter compatible smart plug smart bulb UAE", signal: "Useful home-automation category" },
      { icon: "⌘", tag: "Desk tech", title: "USB-C laptop hubs", why: "Check HDMI resolution, USB speeds and pass-through charging before buying.", query: "USB C hub HDMI PD laptop UAE", signal: "Common laptop-accessory need" }
    ],
    us: [
      { icon: "↔", tag: "Cable control", title: "Reusable hook-and-loop cable ties", why: "A low-cost way to bundle cords for home offices and entertainment setups.", query: "reusable hook and loop cable ties", signal: "Common low-cost cable-management category" },
      { icon: "⌁", tag: "Cable protection", title: "Split cable sleeves", why: "Bundle several wires into a neater run behind a desk or TV.", query: "split cable sleeve wire loom protector", signal: "Common cable-management accessory" },
      { icon: "▱", tag: "Under desk", title: "No-drill cable management trays", why: "Route power strips and loose cable below a desk surface.", query: "under desk cable management tray no drill clamp", signal: "Practical cable-management use case" },
      { icon: "⌖", tag: "Cable routing", title: "Adhesive cable clips", why: "Keep frequently used charging leads near the edge of a table.", query: "adhesive cable clips desk cord organizer", signal: "Practical cable-management use case" },
      { icon: "▦", tag: "Drawer order", title: "Stackable clear storage drawers", why: "Make small items visible and easier to retrieve in cabinets or closets.", query: "stackable clear storage drawers organizer", signal: "Common home-organisation use case" },
      { icon: "▤", tag: "Flexible storage", title: "Vacuum storage bags", why: "Compress bulky clothing and bedding for closets or seasonal storage.", query: "vacuum storage bags with hand pump", signal: "Common home-organisation use case" },
      { icon: "⚡", tag: "Charging tech", title: "GaN USB-C chargers", why: "Compare wattage, port sharing and USB Power Delivery support.", query: "GaN USB C charger 65W 100W US plug", signal: "Useful everyday charging accessory" },
      { icon: "▰", tag: "Portable power", title: "USB-C power banks", why: "Compare capacity, charging speed and the devices you need to top up.", query: "USB C PD power bank 20000mAh", signal: "Practical mobile-power category" },
      { icon: "⌂", tag: "Smart home", title: "Smart plugs and sensors", why: "Check ecosystem compatibility, connectivity and required hubs.", query: "Matter smart plug motion sensor smart home", signal: "Useful home-automation category" },
      { icon: "⌘", tag: "Computer accessories", title: "USB-C hubs and laptop stands", why: "Match ports, display output and ergonomics to your workstation.", query: "USB C hub HDMI laptop stand adjustable", signal: "Common laptop-accessory need" }
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
  let productFinderRequestId = 0;
  let productFinderAbortController = null;
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
    productFinderRequestId++;
    // Cancel an in-flight lookup when the marketplace changes so it cannot waste upstream work.
    if (productFinderAbortController) {
      productFinderAbortController.abort();
      productFinderAbortController = null;
    }
    try { localStorage.setItem(key, market); } catch (_) {}
    // Never leave results from a previous marketplace visible after the user switches stores.
    const liveGrid = document.querySelector("#live-products-grid");
    const liveStatus = document.querySelector("#product-api-status");
    const liveButton = document.querySelector("#find-products");
    if (liveGrid) liveGrid.replaceChildren();
    if (liveStatus) liveStatus.textContent = "Selected marketplace: Amazon " + marketplaces[market].label + ". Search to load products for this store.";
    if (liveButton) {
      liveButton.disabled = false;
      liveButton.textContent = "Find live products ↗";
    }
    document.querySelectorAll("[data-market-select]").forEach(el => { el.value = market; });
    document.querySelectorAll("[data-amazon-query]").forEach(el => setAmazonLink(el, el.getAttribute("data-amazon-query")));
    document.querySelectorAll("[data-market-label]").forEach(el => { el.textContent = marketplaces[current].label; });
    renderTrending();
  };
  const initLiveProductFinder = () => {
    const button = document.querySelector("#find-products");
    const category = document.querySelector("#product-category");
    const grid = document.querySelector("#live-products-grid");
    const status = document.querySelector("#product-api-status");
    if (!button || !category || !grid || !status) return;

    const renderItems = items => {
      grid.replaceChildren();
      items.forEach(item => {
        const card = document.createElement("article");
        card.className = "trend-card";
        const art = document.createElement("div");
        art.className = "trend-art product-photo";
        const img = document.createElement("img");
        img.src = item.image;
        img.alt = item.title;
        img.loading = "lazy";
        img.referrerPolicy = "no-referrer";
        art.append(img);
        const content = document.createElement("div");
        content.className = "trend-content";
        const title = document.createElement("h3");
        title.textContent = item.title;
        const asin = document.createElement("p");
        asin.className = "trend-signal";
        asin.textContent = item.asin ? "Amazon ASIN: " + item.asin : "Product details from Amazon";
        const link = document.createElement("a");
        link.className = "button";
        link.href = item.url;
        link.target = "_blank";
        link.rel = "sponsored nofollow noopener";
        link.textContent = "View product on Amazon ↗";
        content.append(title, asin, link);
        card.append(art, content);
        grid.append(card);
      });
    };

    category.addEventListener("change", () => {
      // Results must always correspond to the category currently selected in the UI.
      productFinderRequestId++;
      if (productFinderAbortController) {
        productFinderAbortController.abort();
        productFinderAbortController = null;
      }
      button.disabled = false;
      button.textContent = "Find live products ↗";
      grid.replaceChildren();
      status.textContent = "Category changed. Search to load products for the selected category.";
    });

    button.addEventListener("click", async () => {
      const requestId = ++productFinderRequestId;
      button.disabled = true;
      button.textContent = "Searching…";
      status.textContent = "Requesting current product details from Amazon…";
      grid.replaceChildren();
      const controller = new AbortController();
      productFinderAbortController = controller;
      try {
        const response = await fetch("/api/products?market=" + encodeURIComponent(current) + "&category=" + encodeURIComponent(category.value), {
          method: "GET",
          headers: { "accept": "application/json" },
          credentials: "omit",
          signal: controller.signal
        });
        const data = await response.json();
        if (requestId !== productFinderRequestId) return;
        if (!response.ok) {
          if (response.status === 503 && data.configured === false) {
            status.textContent = "Live product lookup is not configured yet. Add approved Amazon Creators API credentials as Cloudflare secrets; meanwhile, use the tagged search links below.";
          } else {
            status.textContent = data.error || "Product lookup is temporarily unavailable. Please use the marketplace search links below.";
          }
          return;
        }
        if (!Array.isArray(data.items) || data.items.length === 0) {
          status.textContent = "Amazon returned no usable product listings for this category and marketplace. Try another category.";
          return;
        }
        renderItems(data.items);
        status.textContent = data.items.length + " current product listing(s) returned by Amazon for the " + marketplaces[current].label + " marketplace. Check the retailer page for availability and terms.";
      } catch (_) {
        if (requestId === productFinderRequestId && !controller.signal.aborted) {
          status.textContent = "Could not reach the product service. Check the deployment and try again; tagged marketplace searches remain available below.";
        }
      } finally {
        if (productFinderAbortController === controller) productFinderAbortController = null;
        if (requestId === productFinderRequestId) {
          button.disabled = false;
          button.textContent = "Find live products ↗";
        }
      }
    });
  };

  const validAffiliateProduct = product => {
    if (!product || typeof product !== "object" || Array.isArray(product)) return false;
    if (product.network !== "awin" || product.status !== "active") return false;
    if (!["uk", "ae", "us"].includes(product.market)) return false;
    if (typeof product.id !== "string" || !/^[a-z0-9][a-z0-9-]{2,79}$/i.test(product.id)) return false;
    if (typeof product.title !== "string" || !product.title.trim() || product.title.length > 180) return false;
    if (typeof product.retailer !== "string" || !product.retailer.trim() || product.retailer.length > 100) return false;
    if (typeof product.category !== "string" || !product.category.trim() || product.category.length > 80) return false;
    try {
      const url = new URL(product.affiliateUrl);
      if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
      if (!["awin1.com", "www.awin1.com", "awin.com", "www.awin.com"].includes(url.hostname.toLowerCase())) return false;
    } catch (_) { return false; }
    if (product.imageUrl) {
      try {
        const image = new URL(product.imageUrl);
        if (image.protocol !== "https:" || image.username || image.password) return false;
      } catch (_) { return false; }
    }
    return true;
  };
  const initPartnerCatalogue = async () => {
    const section = document.querySelector("#partner-products-section");
    const grid = document.querySelector("#partner-products-grid");
    const status = document.querySelector("#partner-products-status");
    if (!section || !grid || !status) return;
    try {
      const response = await fetch("/assets/affiliate-products.json", {
        headers: { "accept": "application/json" },
        credentials: "omit",
        cache: "no-cache"
      });
      if (!response.ok) throw new Error("Catalogue unavailable");
      const catalogue = await response.json();
      if (!catalogue || catalogue.schemaVersion !== 1 || !Array.isArray(catalogue.products)) throw new Error("Invalid catalogue");
      const seen = new Set();
      const products = catalogue.products.filter(product => {
        if (!validAffiliateProduct(product) || seen.has(product.id)) return false;
        seen.add(product.id);
        return true;
      });
      if (!products.length) {
        section.hidden = true;
        return;
      }
      products.filter(product => product.market === current).forEach(product => {
        const card = document.createElement("article");
        card.className = "trend-card";
        if (product.imageUrl) {
          const art = document.createElement("div");
          art.className = "trend-art product-photo";
          const img = document.createElement("img");
          img.src = product.imageUrl;
          img.alt = "";
          img.loading = "lazy";
          img.referrerPolicy = "no-referrer";
          art.append(img);
          card.append(art);
        } else {
          const art = document.createElement("div");
          art.className = "trend-art";
          art.setAttribute("aria-hidden", "true");
          art.textContent = "↗";
          card.append(art);
        }
        const content = document.createElement("div");
        content.className = "trend-content";
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = product.category;
        const title = document.createElement("h3");
        title.textContent = product.title;
        const retailer = document.createElement("p");
        retailer.textContent = "Retailer: " + product.retailer;
        const link = document.createElement("a");
        link.className = "button";
        link.href = product.affiliateUrl;
        link.target = "_blank";
        link.rel = "sponsored nofollow noopener";
        link.textContent = "View deal ↗";
        content.append(tag, title, retailer, link);
        card.append(content);
        grid.append(card);
      });
      const visible = grid.childElementCount;
      if (visible) {
        section.hidden = false;
        status.textContent = visible + " approved partner offer(s) for " + marketplaces[current].label + ". Check the retailer page for current price and availability.";
      } else {
        section.hidden = true;
      }
    } catch (_) {
      // A failed optional partner feed must not break the Amazon catalogue or the rest of the site.
      section.hidden = true;
    }
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
    initLiveProductFinder();
    initPartnerCatalogue();
    applyMarket(current);
  });
})();