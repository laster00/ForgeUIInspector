export const PAGE_SIZE = 54;
export const FIXTURE_IDS = ["normal", "empty", "many", "other"];
export const STATE_IDS = ["normal", "loading", "full", "stale", "unsupported"];
export const SCREEN_IDS = ["map_stash", "currency_stash"];
export const CURRENCY_CATEGORY_IDS = ["all", "gear_orbs", "map_orbs", "gem_orbs", "seeds", "special_currency", "prophecy", "coins", "other"];
export const MINECRAFT_FONT_STACK = '"Minecraft", "Unifont", "GenEiMonoGothic", "MS Gothic", "Courier New", monospace';
export const UI_THEME = Object.freeze({
  background: "#20242B",
  panel: "#151E28",
  border: "#38536A",
  slotOuter: "#8B8B8B",
  slotInner: "#373737",
  text: "#E7EDF3",
  muted: "#AAC3D8",
  selected: "#F0B45B",
  success: "#78D39A",
  error: "#E27A7A",
});

const LAYOUT_IDS = Array.from({ length: 28 }, (_, index) => `layout_${String(index + 1).padStart(2, "0")}`);

export const I18N = {
  ja: {
    "screen.forgeuiinspector.normal": "通常状態",
    "screen.forgeuiinspector.empty": "空の保管庫",
    "screen.forgeuiinspector.many": "多数のマップ",
    "screen.forgeuiinspector.otherFixture": "その他のマップ",
    "screen.forgeuiinspector.all": "すべて",
    "screen.forgeuiinspector.other": "不明／その他",
    "screen.forgeuiinspector.title": "マップ保管庫 プレビュー",
    "screen.forgeuiinspector.currencyTitle": "通貨保管庫 プレビュー",
    "screen.forgeuiinspector.fixture": "フィクスチャ：{0}",
    "screen.forgeuiinspector.currencyFixture.normal": "通常の通貨",
    "screen.forgeuiinspector.currencyFixture.empty": "空の通貨保管庫",
    "screen.forgeuiinspector.currencyFixture.many": "多数の通貨",
    "screen.forgeuiinspector.currencyFixture.other": "その他の通貨",
    "screen.forgeuiinspector.gear_orbs": "装備改変オーブ", "screen.forgeuiinspector.map_orbs": "マップ／オーメン", "screen.forgeuiinspector.gem_orbs": "ジェム",
    "screen.forgeuiinspector.seeds": "シード", "screen.forgeuiinspector.special_currency": "特殊通貨", "screen.forgeuiinspector.prophecy": "予言・好意", "screen.forgeuiinspector.coins": "硬貨",
    "screen.forgeuiinspector.currencyItem.chaos": "カオスオーブ", "screen.forgeuiinspector.currencyItem.map": "マップオーブ", "screen.forgeuiinspector.currencyItem.coin": "古代の硬貨",
    "screen.forgeuiinspector.layout.long": "非常に長い日本語のレイアウト名を確認するための表示",
    "screen.forgeuiinspector.layout.01": "レイアウト 01",
    "screen.forgeuiinspector.layout.02": "レイアウト 02",
    "screen.forgeuiinspector.layout.03": "レイアウト 03",
    "screen.forgeuiinspector.layout.04": "レイアウト 04",
    "screen.forgeuiinspector.layout.05": "レイアウト 05",
    "screen.forgeuiinspector.layout.06": "レイアウト 06",
    "screen.forgeuiinspector.layout.07": "レイアウト 07",
    "screen.forgeuiinspector.layout.08": "レイアウト 08",
    "screen.forgeuiinspector.layout.09": "レイアウト 09",
    "screen.forgeuiinspector.layout.10": "レイアウト 10",
    "screen.forgeuiinspector.layout.11": "レイアウト 11",
    "screen.forgeuiinspector.layout.12": "レイアウト 12",
    "screen.forgeuiinspector.layout.13": "レイアウト 13",
    "screen.forgeuiinspector.layout.14": "レイアウト 14",
    "screen.forgeuiinspector.layout.15": "レイアウト 15",
    "screen.forgeuiinspector.layout.16": "レイアウト 16",
    "screen.forgeuiinspector.layout.17": "レイアウト 17",
    "screen.forgeuiinspector.layout.18": "レイアウト 18",
    "screen.forgeuiinspector.layout.19": "レイアウト 19",
    "screen.forgeuiinspector.layout.20": "レイアウト 20",
    "screen.forgeuiinspector.layout.21": "レイアウト 21",
    "screen.forgeuiinspector.layout.22": "レイアウト 22",
    "screen.forgeuiinspector.layout.23": "レイアウト 23",
    "screen.forgeuiinspector.layout.24": "レイアウト 24",
    "screen.forgeuiinspector.layout.25": "レイアウト 25",
    "screen.forgeuiinspector.layout.26": "レイアウト 26",
    "screen.forgeuiinspector.layout.27": "レイアウト 27",
    "screen.forgeuiinspector.layout.28": "レイアウト 28",
    "screen.forgeuiinspector.page": "ページ {0} / {1}",
    "screen.forgeuiinspector.inventory": "インベントリ",
    "screen.forgeuiinspector.none": "アイテムなし",
    "screen.forgeuiinspector.state.normal": "通常",
    "screen.forgeuiinspector.state.loading": "読み込み中",
    "screen.forgeuiinspector.state.full": "満杯",
    "screen.forgeuiinspector.state.stale": "古い状態",
    "screen.forgeuiinspector.state.unsupported": "未対応",
  },
  en: {
    "screen.forgeuiinspector.normal": "Normal state",
    "screen.forgeuiinspector.empty": "Empty stash",
    "screen.forgeuiinspector.many": "Many maps",
    "screen.forgeuiinspector.otherFixture": "Other maps",
    "screen.forgeuiinspector.all": "All",
    "screen.forgeuiinspector.other": "Unknown / Other",
    "screen.forgeuiinspector.title": "Map Stash Preview",
    "screen.forgeuiinspector.currencyTitle": "Currency Stash Preview",
    "screen.forgeuiinspector.fixture": "Fixture: {0}",
    "screen.forgeuiinspector.currencyFixture.normal": "Normal currency",
    "screen.forgeuiinspector.currencyFixture.empty": "Empty currency stash",
    "screen.forgeuiinspector.currencyFixture.many": "Many currencies",
    "screen.forgeuiinspector.currencyFixture.other": "Other currencies",
    "screen.forgeuiinspector.gear_orbs": "Gear Orbs", "screen.forgeuiinspector.map_orbs": "Maps / Omens", "screen.forgeuiinspector.gem_orbs": "Gems",
    "screen.forgeuiinspector.seeds": "Seeds", "screen.forgeuiinspector.special_currency": "Special Currency", "screen.forgeuiinspector.prophecy": "Prophecy / Favour", "screen.forgeuiinspector.coins": "Coins",
    "screen.forgeuiinspector.currencyItem.chaos": "Chaos Orb", "screen.forgeuiinspector.currencyItem.map": "Map Orb", "screen.forgeuiinspector.currencyItem.coin": "Ancient Coin",
    "screen.forgeuiinspector.layout.long": "A deliberately very long layout label for clipping",
    "screen.forgeuiinspector.layout.01": "Layout 01",
    "screen.forgeuiinspector.layout.02": "Layout 02",
    "screen.forgeuiinspector.layout.03": "Layout 03",
    "screen.forgeuiinspector.layout.04": "Layout 04",
    "screen.forgeuiinspector.layout.05": "Layout 05",
    "screen.forgeuiinspector.layout.06": "Layout 06",
    "screen.forgeuiinspector.layout.07": "Layout 07",
    "screen.forgeuiinspector.layout.08": "Layout 08",
    "screen.forgeuiinspector.layout.09": "Layout 09",
    "screen.forgeuiinspector.layout.10": "Layout 10",
    "screen.forgeuiinspector.layout.11": "Layout 11",
    "screen.forgeuiinspector.layout.12": "Layout 12",
    "screen.forgeuiinspector.layout.13": "Layout 13",
    "screen.forgeuiinspector.layout.14": "Layout 14",
    "screen.forgeuiinspector.layout.15": "Layout 15",
    "screen.forgeuiinspector.layout.16": "Layout 16",
    "screen.forgeuiinspector.layout.17": "Layout 17",
    "screen.forgeuiinspector.layout.18": "Layout 18",
    "screen.forgeuiinspector.layout.19": "Layout 19",
    "screen.forgeuiinspector.layout.20": "Layout 20",
    "screen.forgeuiinspector.layout.21": "Layout 21",
    "screen.forgeuiinspector.layout.22": "Layout 22",
    "screen.forgeuiinspector.layout.23": "Layout 23",
    "screen.forgeuiinspector.layout.24": "Layout 24",
    "screen.forgeuiinspector.layout.25": "Layout 25",
    "screen.forgeuiinspector.layout.26": "Layout 26",
    "screen.forgeuiinspector.layout.27": "Layout 27",
    "screen.forgeuiinspector.layout.28": "Layout 28",
    "screen.forgeuiinspector.page": "Page {0} / {1}",
    "screen.forgeuiinspector.inventory": "Inventory",
    "screen.forgeuiinspector.none": "No items",
    "screen.forgeuiinspector.state.normal": "Normal",
    "screen.forgeuiinspector.state.loading": "Loading",
    "screen.forgeuiinspector.state.full": "Full",
    "screen.forgeuiinspector.state.stale": "Stale",
    "screen.forgeuiinspector.state.unsupported": "Unsupported",
  },
};

// The JSON fixture is the source of truth. This compact fallback keeps file:// usable.
export function createFallbackData() {
  const layouts = () => [
    { id: "all", labelKey: "screen.forgeuiinspector.all", count: 0 },
    ...LAYOUT_IDS.map((id) => ({ id, labelKey: id === "layout_01" ? "screen.forgeuiinspector.layout.long" : `screen.forgeuiinspector.layout.${id.slice(-2)}`, count: 0 })),
    { id: "other", labelKey: "screen.forgeuiinspector.other", count: 0 },
  ];
  const makeItems = (count, layoutFor) => Array.from({ length: count }, (_, index) => ({
    slot: index % PAGE_SIZE,
    page: Math.floor(index / PAGE_SIZE),
    icon: index % 7 === 2 ? "unknown-icon" : index % 2 ? "paper" : "map",
    count: (index % 64) + 1,
    layout: layoutFor(index),
  }));
  const normalItems = makeItems(18, (index) => index < 4 ? "layout_01" : index < 6 ? "other" : `layout_${String((index - 2) % 12 + 2).padStart(2, "0")}`);
  const manyItems = makeItems(108, (index) => index % 17 === 0 ? "other" : `layout_${String(index % 28 + 1).padStart(2, "0")}`);
  const otherItems = makeItems(6, () => "other");
  return {
    version: 1,
    screen: "map_stash",
    pageSize: PAGE_SIZE,
    fixtures: [
      { id: "normal", titleKey: "screen.forgeuiinspector.normal", layouts: layouts(), items: normalItems },
      { id: "empty", titleKey: "screen.forgeuiinspector.empty", layouts: layouts(), items: [] },
      { id: "many", titleKey: "screen.forgeuiinspector.many", layouts: layouts(), items: manyItems },
      { id: "other", titleKey: "screen.forgeuiinspector.otherFixture", layouts: layouts(), items: otherItems },
    ],
  };
}

export function createCurrencyFallbackData() {
  const labels = CURRENCY_CATEGORY_IDS.map((id) => ({ id, labelKey: id === "all" || id === "other" ? `screen.forgeuiinspector.${id}` : `screen.forgeuiinspector.${id}`, count: 0 }));
  const make = (count) => Array.from({ length: count }, (_, index) => ({ slot: index % PAGE_SIZE, page: Math.floor(index / PAGE_SIZE), id: `cte2:currency_${index + 1}`, label: `Currency ${index + 1}`, icon: index % 11 === 0 ? "unknown-icon" : index % 3 === 0 ? "coin" : "orb", count: (index % 40) + 1, category: CURRENCY_CATEGORY_IDS[1 + (index % 8)] }));
  return { version: 1, screen: "currency_stash", titleKey: "screen.forgeuiinspector.currencyTitle", pageSize: PAGE_SIZE, fixtures: [
    { id: "normal", titleKey: "screen.forgeuiinspector.currencyFixture.normal", layouts: labels, items: make(18) },
    { id: "empty", titleKey: "screen.forgeuiinspector.currencyFixture.empty", layouts: labels, items: [] },
    { id: "many", titleKey: "screen.forgeuiinspector.currencyFixture.many", layouts: labels, items: make(108) },
    { id: "other", titleKey: "screen.forgeuiinspector.currencyFixture.other", layouts: labels, items: make(6).map((item) => ({ ...item, category: "other" })) },
  ] };
}

export function t(key, locale = "ja", args = []) {
  const template = I18N[locale]?.[key] ?? I18N.ja[key] ?? key;
  return String(template).replace(/\{(\d+)\}/g, (_, index) => args[Number(index)] ?? "");
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function finiteInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.floor(number) : fallback;
}

function layoutById(fixture, layoutId) {
  return fixture?.layouts?.find((layout) => layout.id === layoutId);
}

export function itemsForLayout(fixture, layoutId = "all") {
  const all = Array.isArray(fixture?.items) ? fixture.items : [];
  if (layoutId === "all") return all;
  const explicit = all.filter((item) => item?.layout === layoutId || item?.category === layoutId);
  if (explicit.length > 0 || all.some((item) => Object.prototype.hasOwnProperty.call(item, "layout"))) return explicit;
  // Older hand-written fixtures may only provide counts. Preserve those fixtures gracefully.
  const count = Math.max(0, Number(layoutById(fixture, layoutId)?.count) || 0);
  return all.slice(0, count);
}

export function itemsForCategory(fixture, category = "all") {
  return itemsForLayout(fixture, category);
}

export function isCurrencyFixtureData(data) {
  return data?.screen === "currency_stash" && data?.pageSize === PAGE_SIZE && Array.isArray(data?.fixtures)
    && data.fixtures.every((fixture) => FIXTURE_IDS.includes(fixture.id) && Array.isArray(fixture.items)
      && fixture.items.every((item) => CURRENCY_CATEGORY_IDS.includes(item.category) && Number.isInteger(item.slot) && item.slot >= 0 && item.slot < PAGE_SIZE));
}

export function pageCount(itemsOrCount, pageSize = PAGE_SIZE) {
  const count = Array.isArray(itemsOrCount) ? itemsOrCount.length : Math.max(0, Number(itemsOrCount) || 0);
  return Math.max(1, Math.ceil(count / pageSize));
}

export function layoutScrollMax(fixture, visibleRows = 6) {
  return Math.max(0, (fixture?.layouts?.length || 0) - visibleRows);
}

export function normalize(input = {}, data = createFallbackData()) {
  const screen = SCREEN_IDS.includes(input.screen) ? input.screen : (data.screen === "currency_stash" ? "currency_stash" : "map_stash");
  const fixtureId = FIXTURE_IDS.includes(input.fixture) ? input.fixture : "normal";
  const locale = ["ja", "en"].includes(input.locale) ? input.locale : "ja";
  const fixture = data.fixtures?.find((candidate) => candidate.id === fixtureId) ?? data.fixtures?.[0] ?? { layouts: [], items: [] };
  const layout = layoutById(fixture, input.layout) ? input.layout : "all";
  const items = itemsForLayout(fixture, layout);
  const pageMax = pageCount(items, data.pageSize || PAGE_SIZE) - 1;
  const scaleNumber = Number(input.scale);
  return {
    fixture: fixtureId,
    screen,
    locale,
    layout,
    page: clamp(finiteInteger(input.page, 0), 0, pageMax),
    scroll: clamp(finiteInteger(input.scroll, 0), 0, layoutScrollMax(fixture)),
    width: Math.max(320, finiteInteger(input.width, 960)),
    height: Math.max(230, finiteInteger(input.height, 540)),
    scale: Math.max(0.5, Number.isFinite(scaleNumber) ? scaleNumber : 2),
    state: STATE_IDS.includes(input.state) ? input.state : "normal",
  };
}

export function mergeState(current, partial = {}, data = createFallbackData()) {
  const layoutChanged = Object.prototype.hasOwnProperty.call(partial, "layout") && partial.layout !== current.layout;
  const fixtureChanged = Object.prototype.hasOwnProperty.call(partial, "fixture") && partial.fixture !== current.fixture;
  const next = { ...current, ...partial };
  if (fixtureChanged && !Object.prototype.hasOwnProperty.call(partial, "layout")) next.layout = "all";
  if (layoutChanged) next.page = 0;
  return normalize(next, data);
}

export function canonical(state, base = "index.html") {
  const keys = ["screen", "fixture", "locale", "layout", "page", "scroll", "width", "height", "scale", "state"];
  const query = new URLSearchParams();
  keys.forEach((key) => query.set(key, state[key]));
  return `${base}?${query.toString()}`;
}

export function iconGlyph(icon) {
  if (icon === "map") return { className: "icon-map", glyph: "◆" };
  if (icon === "paper") return { className: "icon-paper", glyph: "▤" };
  if (icon === "orb") return { className: "icon-orb", glyph: "✦" };
  if (icon === "coin") return { className: "icon-coin", glyph: "●" };
  return { className: "icon-unknown", glyph: "?" };
}

export function measureTextPx(text, font = `10px ${MINECRAFT_FONT_STACK}`) {
  if (typeof document !== "undefined") {
    const canvas = measureTextPx.canvas || (measureTextPx.canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    if (context) {
      context.font = font;
      return context.measureText(String(text)).width;
    }
  }
  return Array.from(String(text)).reduce((width, character) => width + (character.codePointAt(0) > 0x3000 ? 10 : 5.5), 0);
}

export function clipLabel(label, maxPx = 100, measure = measureTextPx) {
  const text = String(label ?? "");
  if (measure(text) <= maxPx) return text;
  const ellipsis = "…";
  let clipped = "";
  for (const character of Array.from(text)) {
    if (measure(`${clipped}${character}${ellipsis}`) > maxPx) break;
    clipped += character;
  }
  return `${clipped}${ellipsis}`;
}

export function displayScale(state, viewportWidth = Number.POSITIVE_INFINITY, viewportHeight = Number.POSITIVE_INFINITY) {
  return Math.max(0.25, Math.min(
    Number(state.scale) || 2,
    Number(state.width) / 320,
    Number(state.height) / 230,
    Number(viewportWidth) / 320,
    Number(viewportHeight) / 230,
  ));
}

function buildItems(fixture, layoutId, page, pageSize) {
  const items = itemsForLayout(fixture, layoutId);
  return items.slice(page * pageSize, (page + 1) * pageSize);
}

function safeReplaceUrl(url) {
  if (typeof history !== "undefined" && typeof history.replaceState === "function") history.replaceState(null, "", url);
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function initEmulator(data) {
  if (typeof document === "undefined" || typeof window === "undefined") return null;
  const fixtureControl = document.getElementById("fixture-control");
  const screenControl = document.getElementById("screen-control");
  const localeControl = document.getElementById("locale-control");
  const layoutControl = document.getElementById("layout-control");
  const pageControl = document.getElementById("page-control");
  const scrollControl = document.getElementById("scroll-control");
  const stateControl = document.getElementById("state-control");
  const readUrl = () => Object.fromEntries(new URLSearchParams(window.location.search));
  let state = normalize(readUrl(), data);
  let syncingList = false;

  FIXTURE_IDS.forEach((id) => fixtureControl?.add(new Option(id, id)));

  const fixtureForState = () => data.fixtures?.find((fixture) => fixture.id === state.fixture) ?? data.fixtures?.[0];
  const sync = () => {
    state = normalize(state, data);
    safeReplaceUrl(canonical(state));
    render();
  };
  const setState = (partial = {}) => {
    if (Object.prototype.hasOwnProperty.call(partial, "screen") && SCREEN_IDS.includes(partial.screen) && partial.screen !== state.screen) {
      const url = new URL(window.location.href);
      url.searchParams.set("screen", partial.screen);
      url.searchParams.set("layout", "all");
      url.searchParams.set("page", "0");
      window.location.href = url.toString();
      return;
    }
    state = mergeState(state, partial, data);
    sync();
  };

  function render() {
    state = normalize(state, data);
    const fixture = fixtureForState();
    const preview = document.getElementById("map-stash-preview");
    const list = document.getElementById("layout-list");
    const grid = document.getElementById("stash-grid");
    const pageLabel = document.getElementById("stash-page");
    const pageItems = buildItems(fixture, state.layout, state.page, data.pageSize || PAGE_SIZE);
    const selectedLayout = layoutById(fixture, state.layout) ?? { id: "all", labelKey: "screen.forgeuiinspector.all", count: 0 };
    const itemCount = itemsForLayout(fixture, state.layout).length;
    const pages = pageCount(itemCount, data.pageSize || PAGE_SIZE);
    preview.classList.toggle("page-active", pages > 1);

    if (fixtureControl) {
      fixtureControl.replaceChildren();
      (data.fixtures ?? []).forEach((candidate) => fixtureControl.add(new Option(t(candidate.titleKey, state.locale), candidate.id)));
      fixtureControl.value = state.fixture;
    }
    if (localeControl) localeControl.value = state.locale;
    if (screenControl) screenControl.value = state.screen;
    if (layoutControl) {
      layoutControl.replaceChildren();
      (fixture?.layouts ?? []).forEach((layout) => layoutControl.add(new Option(t(layout.labelKey, state.locale), layout.id)));
      layoutControl.value = state.layout;
    }
    if (pageControl) pageControl.value = state.page;
    if (scrollControl) scrollControl.value = state.scroll;
    if (stateControl) stateControl.value = state.state;
    ["width", "height", "scale"].forEach((key) => {
      const control = document.getElementById(`${key}-control`);
      if (control) control.value = state[key];
    });
    document.documentElement.lang = state.locale;
    document.getElementById("title").textContent = t(state.screen === "currency_stash" ? (data.titleKey || "screen.forgeuiinspector.currencyTitle") : "screen.forgeuiinspector.title", state.locale);
    const stateNode = document.getElementById("state");
    const selectedSummary = `${clipLabel(t(selectedLayout.labelKey, state.locale), 54)} (${itemCount})`;
    const visualState = t(`screen.forgeuiinspector.state.${state.state}`, state.locale);
    stateNode.textContent = `${selectedSummary} · ${visualState}`;
    stateNode.title = t("screen.forgeuiinspector.fixture", state.locale, [t(fixture?.titleKey, state.locale)]);
    stateNode.setAttribute("aria-label", stateNode.title);
    stateNode.className = `state-${state.state}`;
    document.getElementById("selected-layout").textContent = `${clipLabel(t(selectedLayout.labelKey, state.locale), 108)} (${itemCount})`;
    document.getElementById("layout-list").setAttribute("aria-label", state.screen === "currency_stash" ? t("screen.forgeuiinspector.currencyTitle", state.locale) : "Layout list");

    list.replaceChildren();
    (fixture?.layouts ?? []).forEach((layout) => {
      const row = createElement("div", `layout-row${layout.id === state.layout ? " selected" : ""}`);
      row.dataset.testid = `layout-row-${layout.id}`;
      row.tabIndex = 0;
      const label = createElement("span", "layout-label", clipLabel(t(layout.labelKey, state.locale), 92));
      label.title = t(layout.labelKey, state.locale);
      row.append(label, createElement("em", "layout-count", String(itemsForLayout(fixture, layout.id).length)));
      const choose = () => setState({ layout: layout.id });
      row.addEventListener("click", choose);
      row.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(); } });
      list.append(row);
    });
    syncingList = true;
    list.scrollTop = state.scroll * 18;
    syncingList = false;

    grid.replaceChildren();
    for (let slotIndex = 0; slotIndex < PAGE_SIZE; slotIndex += 1) {
      const slot = createElement("div", "slot");
      slot.dataset.testid = `stash-slot-${slotIndex}`;
      const item = pageItems[slotIndex];
      if (item) {
        const icon = iconGlyph(item.icon);
        slot.append(createElement("span", icon.className, icon.glyph), createElement("span", "count", String(item.count)));
        const itemLabel = item.labelKey ? t(item.labelKey, state.locale) : (item.label || item.id || "");
        if (itemLabel) {
          slot.title = itemLabel;
          slot.setAttribute("aria-label", itemLabel);
        }
      }
      grid.append(slot);
    }
    pageLabel.textContent = pages > 1 ? t("screen.forgeuiinspector.page", state.locale, [state.page + 1, pages]) : "";
    pageLabel.hidden = pages <= 1;
    const inventory = document.getElementById("player-inventory");
    inventory.replaceChildren();
    inventory.append(createElement("div", "inventory-title", t("screen.forgeuiinspector.inventory", state.locale)));
    const mainRow = createElement("div", "inv-row");
    for (let index = 0; index < 27; index += 1) mainRow.append(createElement("div", "slot"));
    const hotbarRow = createElement("div", "inv-row");
    for (let index = 0; index < 9; index += 1) hotbarRow.append(createElement("div", "slot"));
    inventory.append(mainRow, hotbarRow);

    const displayScaleValue = displayScale(state, Math.max(1, window.innerWidth - 32), Math.max(1, window.innerHeight - 32));
    const wrap = document.querySelector(".preview-wrap");
    wrap.style.setProperty("--preview-scale", String(displayScaleValue));
    wrap.style.width = `${320 * displayScaleValue}px`;
    wrap.style.height = `${230 * displayScaleValue}px`;
    preview.dataset.state = state.state;
    preview.dataset.screen = state.screen;
    document.getElementById("canonical").textContent = canonical(state);
  }

  fixtureControl?.addEventListener("change", (event) => setState({ fixture: event.target.value, layout: "all", page: 0 }));
  screenControl?.addEventListener("change", (event) => {
    const target = event.target.value === "currency_stash" ? "currency_stash" : "map_stash";
    const url = new URL(window.location.href); url.searchParams.set("screen", target); url.searchParams.set("layout", "all"); url.searchParams.set("page", "0"); window.location.href = url.toString();
  });
  localeControl?.addEventListener("change", (event) => setState({ locale: event.target.value }));
  layoutControl?.addEventListener("change", (event) => setState({ layout: event.target.value }));
  pageControl?.addEventListener("change", (event) => setState({ page: event.target.value }));
  scrollControl?.addEventListener("change", (event) => setState({ scroll: event.target.value }));
  stateControl?.addEventListener("change", (event) => setState({ state: event.target.value }));
  ["width", "height", "scale"].forEach((key) => document.getElementById(`${key}-control`)?.addEventListener("change", (event) => setState({ [key]: event.target.value })));
  document.getElementById("reset")?.addEventListener("click", () => { state = normalize({}, data); sync(); });
  document.getElementById("copy")?.addEventListener("click", () => navigator.clipboard?.writeText(canonical(state)));
  document.getElementById("layout-list")?.addEventListener("scroll", (event) => {
    if (syncingList) return;
    state.scroll = clamp(Math.round(event.target.scrollTop / 18), 0, layoutScrollMax(fixtureForState()));
    safeReplaceUrl(canonical(state));
    document.getElementById("scroll-control").value = state.scroll;
    document.getElementById("canonical").textContent = canonical(state);
  });
  document.getElementById("stash-grid")?.addEventListener("wheel", (event) => {
    const max = pageCount(itemsForLayout(fixtureForState(), state.layout), data.pageSize || PAGE_SIZE) - 1;
    if (max > 0) { event.preventDefault(); setState({ page: state.page + (event.deltaY > 0 ? 1 : -1) }); }
  }, { passive: false });
  window.addEventListener("resize", render);

  window.forgeUIInspector = {
    getState: () => ({ ...state }),
    setState,
    reset: () => { state = normalize({}, data); sync(); },
    getCanonicalUrl: () => canonical(state),
  };
  render();
  return window.forgeUIInspector;
}

async function loadData() {
  if (typeof window === "undefined") return;
  const requestedScreen = new URLSearchParams(window.location.search).get("screen") === "currency_stash" ? "currency_stash" : "map_stash";
  try {
    const response = await fetch(`fixtures/${requestedScreen === "currency_stash" ? "currency-stash" : "map-stash"}.json`);
    if (!response.ok) throw new Error(`fixture request failed: ${response.status}`);
    initEmulator(await response.json());
  } catch {
    initEmulator(requestedScreen === "currency_stash" ? createCurrencyFallbackData() : createFallbackData());
  }
}

if (typeof window !== "undefined" && typeof document !== "undefined") loadData();
