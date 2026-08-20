import {
  DEFAULT_CTE2_PROJECT,
  DEFAULT_PROJECT_ID,
  DEFAULT_PROJECT_INDEX,
  FIXTURE_SCHEMA,
  PAGE_SIZE as PROJECT_PAGE_SIZE,
  PROJECT_INDEX_SCHEMA,
  PROJECT_SCHEMA,
  createFixtureRegistry,
  createProjectIndex,
  rendererFor,
  screenIdsFor,
  screenMetaFor,
  validateFixtureDocument,
  normalizeFixtureItems,
  validateProjectManifest,
} from "./fixture-system.js";

export { DEFAULT_CTE2_PROJECT, DEFAULT_PROJECT_ID, DEFAULT_PROJECT_INDEX, FIXTURE_SCHEMA, PROJECT_INDEX_SCHEMA, PROJECT_SCHEMA, createFixtureRegistry, createProjectIndex, screenIdsFor, screenMetaFor, rendererFor, validateFixtureDocument, normalizeFixtureItems, validateProjectManifest };

export const PAGE_SIZE = PROJECT_PAGE_SIZE;
export const MAP_PAGE_SIZE = 96;
export const MASTER_PAGE_SIZE = 81;
export const FIXTURE_IDS = ["normal", "empty", "many", "other"];
export const STATE_IDS = ["normal", "loading", "full", "stale", "unsupported"];
export const SCREEN_IDS = Object.freeze(screenIdsFor(DEFAULT_CTE2_PROJECT));
export const SCREEN_META = Object.freeze(Object.fromEntries(SCREEN_IDS.map((screenId) => [screenId, screenMetaFor(DEFAULT_CTE2_PROJECT, screenId)])));
export const MASTER_VARIANT_IDS = Object.freeze(["current", "classic", "dual", "rail", "overview", "clean_dual", "rail_dual", "single_focus"]);
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
    "project.cte2.name": "Craft to Exile 2",
    "project.generic.name": "UIプロジェクト",
    "screen.forgeuiinspector.genericTitle": "UIプレビュー",
    "screen.forgeuiinspector.genericFixture": "Fixture：{0}",
    "screen.forgeuiinspector.genericReadonly": "読み取り専用・汎用レンダラー",
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
    "screen.forgeuiinspector.master.title": "マスタースタッシュ プレビュー",
    "screen.forgeuiinspector.profession.title": "職業ワークショップ プレビュー",
    "screen.forgeuiinspector.salvage.title": "高度サルベージ プレビュー",
    "screen.forgeuiinspector.master.search": "スタッシュを検索", "screen.forgeuiinspector.master.tab.all": "すべて", "screen.forgeuiinspector.master.tab.maps": "マップ", "screen.forgeuiinspector.master.tab.special": "特殊",
    "screen.forgeuiinspector.master.detail": "選択アイテム", "screen.forgeuiinspector.master.selected": "マップ報酬の詳細とアフィックス", "screen.forgeuiinspector.master.status": "保管領域接続済み（フィクスチャ）", "screen.forgeuiinspector.master.page": "ページ 1 / 2", "screen.forgeuiinspector.master.readonly": "読み取り専用プレビュー", "screen.forgeuiinspector.master.action": "選択アイテムを移動",
    "screen.forgeuiinspector.master.variant.current": "現行UI", "screen.forgeuiinspector.master.variant.classic": "標準チェスト型", "screen.forgeuiinspector.master.variant.dual": "2ページ同時型", "screen.forgeuiinspector.master.variant.rail": "カテゴリナビ型", "screen.forgeuiinspector.master.variant.overview": "概要カード型", "screen.forgeuiinspector.master.variant.clean_dual": "2ページ＋下部情報", "screen.forgeuiinspector.master.variant.rail_dual": "レール＋2ページ", "screen.forgeuiinspector.master.variant.single_focus": "単ページ集中型",
    "screen.forgeuiinspector.master.category.gear": "ギア", "screen.forgeuiinspector.master.category.maps": "マップ", "screen.forgeuiinspector.master.category.currency": "通貨", "screen.forgeuiinspector.master.category.gems": "ジェム", "screen.forgeuiinspector.master.category.profession": "職業",
    "screen.forgeuiinspector.master.deposit": "収納", "screen.forgeuiinspector.master.organize": "整理", "screen.forgeuiinspector.master.sort": "並べ替え", "screen.forgeuiinspector.master.previous": "前", "screen.forgeuiinspector.master.next": "次", "screen.forgeuiinspector.master.refresh": "更新",
    "screen.forgeuiinspector.master.summary.categories": "5カテゴリ", "screen.forgeuiinspector.master.summary.items": "保管済み {0} 件", "screen.forgeuiinspector.master.summary.select": "カテゴリを選択", "screen.forgeuiinspector.master.summary.currency": "通貨は合計表示", "screen.forgeuiinspector.master.summary.readonly": "読み取り専用フィクスチャ",
    "screen.forgeuiinspector.profession.tab.crafting": "クラフト", "screen.forgeuiinspector.profession.tab.gathering": "採集", "screen.forgeuiinspector.profession.tab.smelting": "精錬", "screen.forgeuiinspector.profession.search": "レシピを検索", "screen.forgeuiinspector.profession.filter": "絞り込み", "screen.forgeuiinspector.profession.recipe": "レシピ {0}", "screen.forgeuiinspector.profession.detail": "レシピ詳細", "screen.forgeuiinspector.profession.output": "完成品", "screen.forgeuiinspector.profession.materials": "素材", "screen.forgeuiinspector.profession.craft": "クラフト（プレビュー）", "screen.forgeuiinspector.profession.readonly": "読み取り専用フィクスチャプレビュー", "screen.forgeuiinspector.profession.status": "準備完了・サーバーデータ未接続",
    "screen.forgeuiinspector.salvage.workflow": "ワークフロー：プレビュー", "screen.forgeuiinspector.salvage.fixture": "ローカルフィクスチャ", "screen.forgeuiinspector.salvage.catalog": "プリセット一覧", "screen.forgeuiinspector.salvage.preset": "プリセット {0}", "screen.forgeuiinspector.salvage.keep": "KEEP", "screen.forgeuiinspector.salvage.salvage": "SALVAGE", "screen.forgeuiinspector.salvage.selected": "選択中プリセット", "screen.forgeuiinspector.salvage.selectedName": "マップ安全優先ルール", "screen.forgeuiinspector.salvage.ruleSummary": "保護4件・ルール7件", "screen.forgeuiinspector.salvage.held": "手持ちアイテムプレビュー", "screen.forgeuiinspector.salvage.history": "履歴・診断", "screen.forgeuiinspector.salvage.historyEntry": "診断エントリ {0}", "screen.forgeuiinspector.salvage.readonly": "読み取り専用・ネットワーク／保管領域なし", "screen.forgeuiinspector.salvage.status": "決定的で安全に確認できるフィクスチャ",
  },
  en: {
    "project.cte2.name": "Craft to Exile 2",
    "project.generic.name": "UI Project",
    "screen.forgeuiinspector.genericTitle": "UI Preview",
    "screen.forgeuiinspector.genericFixture": "Fixture: {0}",
    "screen.forgeuiinspector.genericReadonly": "Read-only · generic renderer",
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
    "screen.forgeuiinspector.master.title": "Master Stash Preview",
    "screen.forgeuiinspector.profession.title": "Profession Workshop Preview",
    "screen.forgeuiinspector.salvage.title": "Advanced Salvage Preview",
    "screen.forgeuiinspector.master.search": "Search stash", "screen.forgeuiinspector.master.tab.all": "All Items", "screen.forgeuiinspector.master.tab.maps": "Maps", "screen.forgeuiinspector.master.tab.special": "Special",
    "screen.forgeuiinspector.master.detail": "Selected item", "screen.forgeuiinspector.master.selected": "Map reward details and affixes", "screen.forgeuiinspector.master.status": "Storage connected (fixture)", "screen.forgeuiinspector.master.page": "Page 1 / 2", "screen.forgeuiinspector.master.readonly": "Read-only preview", "screen.forgeuiinspector.master.action": "Move selected item",
    "screen.forgeuiinspector.master.variant.current": "Current UI", "screen.forgeuiinspector.master.variant.classic": "Classic chest", "screen.forgeuiinspector.master.variant.dual": "Dual page", "screen.forgeuiinspector.master.variant.rail": "Category rail", "screen.forgeuiinspector.master.variant.overview": "Overview cards", "screen.forgeuiinspector.master.variant.clean_dual": "Dual + footer", "screen.forgeuiinspector.master.variant.rail_dual": "Rail + dual page", "screen.forgeuiinspector.master.variant.single_focus": "Single page focus",
    "screen.forgeuiinspector.master.category.gear": "Gear", "screen.forgeuiinspector.master.category.maps": "Maps", "screen.forgeuiinspector.master.category.currency": "Currency", "screen.forgeuiinspector.master.category.gems": "Gems", "screen.forgeuiinspector.master.category.profession": "Profession",
    "screen.forgeuiinspector.master.deposit": "Deposit", "screen.forgeuiinspector.master.organize": "Organize", "screen.forgeuiinspector.master.sort": "Sort", "screen.forgeuiinspector.master.previous": "Prev", "screen.forgeuiinspector.master.next": "Next", "screen.forgeuiinspector.master.refresh": "Refresh",
    "screen.forgeuiinspector.master.summary.categories": "5 categories", "screen.forgeuiinspector.master.summary.items": "{0} stored", "screen.forgeuiinspector.master.summary.select": "Select a category", "screen.forgeuiinspector.master.summary.currency": "Currency is aggregated", "screen.forgeuiinspector.master.summary.readonly": "Read-only fixture",
    "screen.forgeuiinspector.profession.tab.crafting": "Crafting", "screen.forgeuiinspector.profession.tab.gathering": "Gathering", "screen.forgeuiinspector.profession.tab.smelting": "Smelting", "screen.forgeuiinspector.profession.search": "Search recipes", "screen.forgeuiinspector.profession.filter": "Filters", "screen.forgeuiinspector.profession.recipe": "Recipe {0}", "screen.forgeuiinspector.profession.detail": "Recipe details", "screen.forgeuiinspector.profession.output": "Output", "screen.forgeuiinspector.profession.materials": "Materials", "screen.forgeuiinspector.profession.craft": "Craft (preview)", "screen.forgeuiinspector.profession.readonly": "Read-only fixture preview", "screen.forgeuiinspector.profession.status": "Ready · server data not connected",
    "screen.forgeuiinspector.salvage.workflow": "Workflow: Preview", "screen.forgeuiinspector.salvage.fixture": "Local fixture", "screen.forgeuiinspector.salvage.catalog": "Preset catalog", "screen.forgeuiinspector.salvage.preset": "Preset {0}", "screen.forgeuiinspector.salvage.keep": "KEEP", "screen.forgeuiinspector.salvage.salvage": "SALVAGE", "screen.forgeuiinspector.salvage.selected": "Selected preset", "screen.forgeuiinspector.salvage.selectedName": "Map-safe salvage rules", "screen.forgeuiinspector.salvage.ruleSummary": "4 protections · 7 rules", "screen.forgeuiinspector.salvage.held": "Held item preview", "screen.forgeuiinspector.salvage.history": "History / diagnostics", "screen.forgeuiinspector.salvage.historyEntry": "Diagnostic entry {0}", "screen.forgeuiinspector.salvage.readonly": "Read-only preview · no network or storage access", "screen.forgeuiinspector.salvage.status": "Fixture is deterministic and safe to inspect",
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
    slot: index % MAP_PAGE_SIZE,
    page: Math.floor(index / MAP_PAGE_SIZE),
    icon: index % 7 === 2 ? "unknown-icon" : index % 2 ? "paper" : "map",
    count: (index % 64) + 1,
    layout: layoutFor(index),
  }));
  const normalItems = makeItems(18, (index) => index < 4 ? "layout_01" : index < 6 ? "other" : `layout_${String((index - 2) % 12 + 2).padStart(2, "0")}`);
  const manyItems = makeItems(108, (index) => index % 17 === 0 ? "other" : `layout_${String(index % 28 + 1).padStart(2, "0")}`);
  const otherItems = makeItems(6, () => "other");
  return {
    schema: FIXTURE_SCHEMA,
    version: 1,
    project: DEFAULT_PROJECT_ID,
    screen: "map_stash",
    renderer: "compact-stash",
    pageSize: MAP_PAGE_SIZE,
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
  const make = (count) => Array.from({ length: count }, (_, index) => ({ slot: index % MAP_PAGE_SIZE, page: Math.floor(index / MAP_PAGE_SIZE), id: `cte2:currency_${index + 1}`, label: `Currency ${index + 1}`, icon: index % 11 === 0 ? "unknown-icon" : index % 3 === 0 ? "coin" : "orb", count: (index % 40) + 1, category: CURRENCY_CATEGORY_IDS[1 + (index % 8)] }));
  return { schema: FIXTURE_SCHEMA, version: 1, project: DEFAULT_PROJECT_ID, screen: "currency_stash", renderer: "compact-stash", titleKey: "screen.forgeuiinspector.currencyTitle", pageSize: MAP_PAGE_SIZE, fixtures: [
    { id: "normal", titleKey: "screen.forgeuiinspector.currencyFixture.normal", layouts: labels, items: make(18) },
    { id: "empty", titleKey: "screen.forgeuiinspector.currencyFixture.empty", layouts: labels, items: [] },
    { id: "many", titleKey: "screen.forgeuiinspector.currencyFixture.many", layouts: labels, items: make(108) },
    { id: "other", titleKey: "screen.forgeuiinspector.currencyFixture.other", layouts: labels, items: make(6).map((item) => ({ ...item, category: "other" })) },
  ] };
}

export function createExtendedFallbackData(screen = "master_stash") {
  const meta = SCREEN_META[screen] ?? SCREEN_META.master_stash;
  const labels = screen === "profession_workshop"
    ? [{ id: "all", labelKey: "screen.forgeuiinspector.profession.tab.crafting", count: 0 }]
    : [{ id: "all", labelKey: "screen.forgeuiinspector.all", count: 0 }];
  const makeFixture = (id, count) => ({
    id,
    titleKey: `screen.forgeuiinspector.${id}`,
    layouts: labels.map((layout) => ({ ...layout, count })),
    itemCount: count,
    items: [],
  });
  return {
    schema: FIXTURE_SCHEMA,
    version: 1,
    project: DEFAULT_PROJECT_ID,
    screen,
    renderer: meta.renderer,
    pageSize: meta.grid?.slots ?? PAGE_SIZE,
    titleKey: meta.titleKey,
    fixtures: [makeFixture("normal", 18), makeFixture("empty", 0), makeFixture("many", 108), makeFixture("other", 6)],
  };
}

export function createGenericFallbackData(project = DEFAULT_CTE2_PROJECT, screen = project?.defaultScreen ?? "screen") {
  const meta = screenMetaFor(project, screen);
  const projectId = project?.id || "project";
  const layout = { id: "all", labelKey: "screen.forgeuiinspector.all", count: 0 };
  const fixture = (id, count) => ({
    id,
    titleKey: `screen.forgeuiinspector.${id}`,
    layouts: [{ ...layout, count }],
    itemCount: count,
    items: Array.from({ length: count }, (_, index) => ({
      slot: index % (meta.grid?.slots ?? PAGE_SIZE),
      page: Math.floor(index / (meta.grid?.slots ?? PAGE_SIZE)),
      icon: index % 3 === 0 ? "paper" : index % 3 === 1 ? "orb" : "unknown-icon",
      count: (index % 32) + 1,
      label: `Fixture item ${index + 1}`,
    })),
  });
  return {
    schema: FIXTURE_SCHEMA,
    version: 1,
    project: projectId,
    screen,
    renderer: meta.renderer,
    titleKey: meta.labelKey || "screen.forgeuiinspector.genericTitle",
    pageSize: meta.grid?.slots ?? PAGE_SIZE,
    fixtures: [fixture("normal", 18), fixture("empty", 0), fixture("many", 108), fixture("other", 6)],
  };
}

export function createFallbackForScreen(screen = "map_stash") {
  if (screen === "currency_stash") return createCurrencyFallbackData();
  if (SCREEN_META[screen] && !["map_stash", "currency_stash"].includes(screen)) return createExtendedFallbackData(screen);
  return createFallbackData();
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
  let all = Array.isArray(fixture?.items) ? fixture.items : [];
  if (all.length === 0 && Number(fixture?.itemCount) > 0) {
    all = Array.from({ length: Math.max(0, Number(fixture.itemCount)) }, (_, index) => ({
      slot: index % (Number(fixture?.pageSize) || PAGE_SIZE),
      page: Math.floor(index / (Number(fixture?.pageSize) || PAGE_SIZE)),
      icon: index % 3 === 0 ? "orb" : index % 3 === 1 ? "map" : "paper",
      count: (index % 32) + 1,
      layout: layoutId === "other" ? "other" : "all",
      label: `Fixture item ${index + 1}`,
    }));
  }
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
  return data?.screen === "currency_stash" && data?.pageSize === MAP_PAGE_SIZE && Array.isArray(data?.fixtures)
    && data.fixtures.every((fixture) => FIXTURE_IDS.includes(fixture.id) && Array.isArray(fixture.items)
      && fixture.items.every((item) => CURRENCY_CATEGORY_IDS.includes(item.category) && Number.isInteger(item.slot) && item.slot >= 0 && item.slot < MAP_PAGE_SIZE));
}

export function pageCount(itemsOrCount, pageSize = PAGE_SIZE) {
  const count = Array.isArray(itemsOrCount) ? itemsOrCount.length : Math.max(0, Number(itemsOrCount) || 0);
  return Math.max(1, Math.ceil(count / pageSize));
}

/**
 * Return the visual page size for a renderer. Fixture slots remain compatible
 * with the screen-owned grid contract; Master Stash keeps its 9x9 visual page.
 */
export function renderPageSize(data = createFallbackData(), project = DEFAULT_CTE2_PROJECT, screen = data?.screen ?? "map_stash") {
  const meta = screenMetaFor(project, screen);
  return meta.grid?.slots ?? PAGE_SIZE;
}

export function layoutScrollMax(fixture, visibleRows = 10) {
  return Math.max(0, (fixture?.layouts?.length || 0) - visibleRows);
}

export function normalize(input = {}, data = createFallbackData(), project = DEFAULT_CTE2_PROJECT) {
  const projectScreens = screenIdsFor(project);
  const screen = projectScreens.includes(input.screen) ? input.screen : (projectScreens.includes(data.screen) ? data.screen : (project.defaultScreen ?? projectScreens[0] ?? "map_stash"));
  const meta = screenMetaFor(project, screen);
  const fixtureId = FIXTURE_IDS.includes(input.fixture) ? input.fixture : "normal";
  const locale = ["ja", "en"].includes(input.locale) ? input.locale : "ja";
  const fixture = data.fixtures?.find((candidate) => candidate.id === fixtureId) ?? data.fixtures?.[0] ?? { layouts: [], items: [] };
  const layout = layoutById(fixture, input.layout) ? input.layout : "all";
  const items = itemsForLayout(fixture, layout);
  const listGeometry = meta.geometry?.list;
  const pageMax = pageCount(items, renderPageSize(data, project, screen)) - 1;
  const scaleNumber = Number(input.scale);
  const next = {
    fixture: fixtureId,
    screen,
    locale,
    layout,
    page: clamp(finiteInteger(input.page, 0), 0, pageMax),
    scroll: clamp(finiteInteger(input.scroll, 0), 0, layoutScrollMax(fixture, listGeometry?.rows ?? 6)),
    width: Math.max(meta.width, finiteInteger(input.width, 960)),
    height: Math.max(meta.height, finiteInteger(input.height, 540)),
    scale: Math.max(0.5, Number.isFinite(scaleNumber) ? scaleNumber : 2),
    state: STATE_IDS.includes(input.state) ? input.state : "normal",
  };
  if (screen === "master_stash") next.variant = MASTER_VARIANT_IDS.includes(input.variant) ? input.variant : "rail_dual";
  if (project?.id && project.id !== DEFAULT_PROJECT_ID) next.project = project.id;
  return next;
}

export function mergeState(current, partial = {}, data = createFallbackData(), project = DEFAULT_CTE2_PROJECT) {
  const layoutChanged = Object.prototype.hasOwnProperty.call(partial, "layout") && partial.layout !== current.layout;
  const fixtureChanged = Object.prototype.hasOwnProperty.call(partial, "fixture") && partial.fixture !== current.fixture;
  const next = { ...current, ...partial };
  if (fixtureChanged && !Object.prototype.hasOwnProperty.call(partial, "layout")) next.layout = "all";
  if (layoutChanged) next.page = 0;
  return normalize(next, data, project);
}

export function canonical(state, base = "index.html") {
  const keys = ["screen", "fixture", "locale", "layout", "page", "scroll", "width", "height", "scale", "state"];
  const query = new URLSearchParams();
  if (state.project && state.project !== DEFAULT_PROJECT_ID) query.set("project", state.project);
  keys.forEach((key) => query.set(key, state[key]));
  if (state.screen === "master_stash") query.set("variant", state.variant ?? "rail_dual");
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

export function displayScale(state, viewportWidth = Number.POSITIVE_INFINITY, viewportHeight = Number.POSITIVE_INFINITY, project = DEFAULT_CTE2_PROJECT) {
  const meta = screenMetaFor(project, state.screen);
  return Math.max(0.25, Math.min(
    Number(state.scale) || 2,
    Number(state.width) / meta.width,
    Number(state.height) / meta.height,
    Number(viewportWidth) / meta.width,
    Number(viewportHeight) / meta.height,
  ));
}

function buildItems(fixture, layoutId, page, pageSize) {
  const items = itemsForLayout(fixture, layoutId);
  return items.slice(page * pageSize, (page + 1) * pageSize);
}

function snapshotFor(state, data, project) {
  const meta = screenMetaFor(project, state.screen);
  const fixture = data.fixtures?.find((candidate) => candidate.id === state.fixture) ?? data.fixtures?.[0] ?? { layouts: [], items: [] };
  const items = itemsForLayout(fixture, state.layout);
  const pageSize = renderPageSize(data, project, state.screen);
  return {
    state: { ...state },
    canonicalUrl: canonical(state),
    project: { id: project.id, labelKey: project.labelKey ?? "" },
    screen: { id: state.screen, renderer: meta.renderer, width: meta.width, height: meta.height },
    fixture: {
      id: fixture.id ?? state.fixture,
      titleKey: fixture.titleKey ?? "",
      itemCount: items.length,
      layoutCount: fixture.layouts?.length ?? 0,
      pageSize,
      pageCount: pageCount(items, pageSize),
      grid: { ...meta.grid },
    },
  };
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

function screenItemIcon(item, index = 0) {
  const icon = iconGlyph(item?.icon || (index % 2 ? "paper" : "map"));
  const node = createElement("span", icon.className, icon.glyph);
  if (item?.count !== undefined) node.append(createElement("span", "count", String(item.count)));
  return node;
}

const MASTER_CATEGORIES = Object.freeze([
  { id: "gear", key: "screen.forgeuiinspector.master.category.gear" },
  { id: "maps", key: "screen.forgeuiinspector.master.category.maps" },
  { id: "currency", key: "screen.forgeuiinspector.master.category.currency" },
  { id: "gems", key: "screen.forgeuiinspector.master.category.gems" },
  { id: "profession", key: "screen.forgeuiinspector.master.category.profession" },
]);

function masterCategoryCount(total, index) {
  if (!total) return 0;
  const shares = [0.42, 0.2, 0.18, 0.1, 0.1];
  if (index === shares.length - 1) return Math.max(0, total - shares.slice(0, -1).reduce((sum, share) => sum + Math.floor(total * share), 0));
  return Math.floor(total * shares[index]);
}

function masterCategoryTabs(locale, total, selected = 0, className = "master-variant-tabs") {
  const tabs = createElement("div", className);
  tabs.setAttribute("role", "tablist");
  MASTER_CATEGORIES.forEach((category, index) => {
    const tab = createElement("div", `master-category-tab${index === selected ? " selected" : ""}`);
    tab.dataset.testid = `master-category-${category.id}`;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", String(index === selected));
    tab.append(createElement("span", "master-category-label", t(category.key, locale)), createElement("em", "master-category-count", String(masterCategoryCount(total, index))));
    tabs.append(tab);
  });
  return tabs;
}

function masterCategoryRail(locale, total, selected = 0) {
  const rail = createElement("nav", "master-category-rail");
  rail.dataset.testid = "master-category-rail";
  rail.setAttribute("aria-label", "Master Stash categories");
  MASTER_CATEGORIES.forEach((category, index) => {
    const row = createElement("div", `master-category-rail-row${index === selected ? " selected" : ""}`);
    row.dataset.testid = `master-rail-${category.id}`;
    row.setAttribute("aria-current", index === selected ? "true" : "false");
    row.append(createElement("span", "master-category-label", t(category.key, locale)), createElement("em", "master-category-count", String(masterCategoryCount(total, index))));
    rail.append(row);
  });
  return rail;
}

function masterGrid(items, offset, testPrefix) {
  const grid = createElement("div", "large-grid master-variant-grid");
  grid.setAttribute("role", "grid");
  grid.setAttribute("aria-label", testPrefix);
  grid.style.setProperty("--grid-columns", "9");
  grid.style.setProperty("--grid-rows", "9");
  for (let index = 0; index < MASTER_PAGE_SIZE; index += 1) {
    const slot = createElement("div", "slot");
    slot.dataset.testid = `${testPrefix}-slot-${index}`;
    slot.setAttribute("role", "gridcell");
    slot.setAttribute("aria-colindex", String((index % 9) + 1));
    slot.setAttribute("aria-rowindex", String(Math.floor(index / 9) + 1));
    const item = items[offset + index];
    if (item) slot.append(screenItemIcon(item, offset + index));
    grid.append(slot);
  }
  return grid;
}

function masterPagePanel(items, offset, testPrefix, caption) {
  const panel = createElement("section", "extended-panel master-variant-page-panel");
  panel.dataset.testid = `${testPrefix}-panel`;
  panel.append(masterGrid(items, offset, testPrefix), createElement("small", "panel-caption", caption));
  return panel;
}

function masterInventory(locale) {
  const inventory = createElement("section", "extended-inventory master-variant-inventory");
  inventory.dataset.testid = "master-variant-inventory";
  inventory.append(createElement("h3", "", t("screen.forgeuiinspector.inventory", locale)));
  const grid = createElement("div", "large-grid inventory-grid master-inventory-grid");
  grid.dataset.testid = "master-variant-inventory-grid";
  grid.setAttribute("role", "grid");
  for (let index = 0; index < 36; index += 1) {
    const slot = createElement("div", "slot");
    slot.dataset.testid = `master-variant-inventory-slot-${index}`;
    slot.setAttribute("role", "gridcell");
    grid.append(slot);
  }
  inventory.append(grid);
  return inventory;
}

function masterActions(locale) {
  const actions = createElement("div", "master-action-strip");
  ["deposit", "organize", "sort", "previous", "next", "refresh"].forEach((key) => actions.append(createElement("span", "master-action", t(`screen.forgeuiinspector.master.${key}`, locale))));
  return actions;
}

function masterFooter(locale, total, pageText) {
  const footer = createElement("footer", "master-detail-less-footer");
  const line = createElement("div", "master-footer-line");
  line.append(createElement("span", "success", t("screen.forgeuiinspector.master.summary.items", locale, [total])), createElement("span", "", pageText || t("screen.forgeuiinspector.master.readonly", locale)));
  footer.append(line, masterActions(locale));
  return footer;
}

function masterInfoFooter(locale, total, pageText) {
  const footer = createElement("footer", "master-detail-less-footer");
  const line = createElement("div", "master-footer-line");
  line.append(createElement("span", "success", t("screen.forgeuiinspector.master.summary.items", locale, [total])), createElement("span", "", pageText || t("screen.forgeuiinspector.master.readonly", locale)));
  footer.append(line);
  return footer;
}

function masterPageText(locale, items, page) {
  const pages = pageCount(items, MASTER_PAGE_SIZE);
  return pages > 1 ? t("screen.forgeuiinspector.page", locale, [clamp(page + 1, 1, pages), pages]) : "";
}

function renderMasterVariant(body, state, fixture) {
  const variant = state.variant ?? "rail_dual";
  const root = createElement("div", `master-variant-root master-variant-${variant}`);
  root.dataset.testid = `master-variant-${variant}`;
  const items = itemsForLayout(fixture, "all");
  const total = items.length;
  const locale = state.locale;
  const pageText = masterPageText(locale, items, state.page);

  if (variant === "classic") {
    root.append(masterCategoryTabs(locale, total));
    const panel = masterPagePanel(items, state.page * MASTER_PAGE_SIZE, "master-classic", pageText);
    panel.classList.add("master-classic-grid-panel");
    root.append(panel);
    const status = createElement("section", "extended-panel master-variant-status master-classic-status");
    status.append(createElement("strong", "", t("screen.forgeuiinspector.master.status", locale)), createElement("p", "", t("screen.forgeuiinspector.master.summary.items", locale, [total])), createElement("p", "", pageText || t("screen.forgeuiinspector.master.readonly", locale)));
    root.append(status, masterInventory(locale), masterActions(locale));
  } else if (variant === "dual") {
    root.append(masterCategoryTabs(locale, total));
    const leftPanel = masterPagePanel(items, 0, "master-dual-left", "1");
    const rightPanel = masterPagePanel(items, MASTER_PAGE_SIZE, "master-dual-right", "2");
    leftPanel.classList.add("master-dual-left-panel");
    rightPanel.classList.add("master-dual-right-panel");
    root.append(leftPanel, rightPanel);
    const status = createElement("section", "master-variant-status master-dual-status");
    status.append(createElement("strong", "", t("screen.forgeuiinspector.master.status", locale)), createElement("span", "", t("screen.forgeuiinspector.master.summary.items", locale, [total])), createElement("span", "", pageText || t("screen.forgeuiinspector.master.readonly", locale)));
    root.append(status, masterInventory(locale), masterActions(locale));
  } else if (variant === "rail") {
    root.append(masterCategoryRail(locale, total));
    const panel = masterPagePanel(items, state.page * MASTER_PAGE_SIZE, "master-rail-grid", pageText);
    panel.classList.add("master-rail-grid-panel");
    root.append(panel);
    const status = createElement("section", "extended-panel master-variant-status master-rail-status");
    status.append(createElement("strong", "", t("screen.forgeuiinspector.master.summary.select", locale)), createElement("p", "", t("screen.forgeuiinspector.master.status", locale)), createElement("p", "", pageText || t("screen.forgeuiinspector.master.readonly", locale)));
    root.append(status, masterInventory(locale), masterActions(locale));
  } else if (variant === "clean_dual") {
    root.append(masterCategoryTabs(locale, total));
    const leftPanel = masterPagePanel(items, 0, "master-clean-dual-left", "1");
    const rightPanel = masterPagePanel(items, MASTER_PAGE_SIZE, "master-clean-dual-right", "2");
    leftPanel.classList.add("master-clean-dual-left-panel");
    rightPanel.classList.add("master-clean-dual-right-panel");
    root.append(leftPanel, rightPanel, masterInventory(locale), masterFooter(locale, total, pageText));
  } else if (variant === "rail_dual") {
    root.append(masterCategoryRail(locale, total));
    const leftPanel = masterPagePanel(items, 0, "master-rail-dual-left", "1");
    const rightPanel = masterPagePanel(items, MASTER_PAGE_SIZE, "master-rail-dual-right", "2");
    leftPanel.classList.add("master-rail-dual-left-panel");
    rightPanel.classList.add("master-rail-dual-right-panel");
    root.append(leftPanel, rightPanel, masterInventory(locale), masterInfoFooter(locale, total, pageText));
  } else if (variant === "single_focus") {
    root.append(masterCategoryTabs(locale, total));
    const panel = masterPagePanel(items, state.page * MASTER_PAGE_SIZE, "master-single-focus", pageText);
    panel.classList.add("master-single-focus-panel");
    root.append(panel, masterInventory(locale), masterFooter(locale, total, pageText));
  } else if (variant === "overview") {
    const heading = createElement("div", "master-overview-heading");
    heading.append(createElement("strong", "", t("screen.forgeuiinspector.master.summary.categories", locale)), createElement("span", "", t("screen.forgeuiinspector.master.summary.items", locale, [total])));
    root.append(heading);
    const cards = createElement("div", "master-overview-cards");
    MASTER_CATEGORIES.forEach((category, index) => {
      const card = createElement("section", `master-overview-card${index === 0 ? " selected" : ""}`);
      card.dataset.testid = `master-overview-${category.id}`;
      card.append(createElement("strong", "", t(category.key, locale)), createElement("span", "", `${masterCategoryCount(total, index)}`));
      if (category.id === "currency") card.append(createElement("small", "", t("screen.forgeuiinspector.master.summary.currency", locale)));
      cards.append(card);
    });
    root.append(cards, masterInventory(locale));
    const status = createElement("section", "master-overview-status");
    status.append(createElement("p", "", t("screen.forgeuiinspector.master.summary.select", locale)), createElement("p", "", t("screen.forgeuiinspector.master.summary.readonly", locale)), masterActions(locale));
    root.append(status);
  }
  body.append(root);
}

function renderExtendedPreview(container, state, fixture, data, project = DEFAULT_CTE2_PROJECT) {
  if (!container) return "";
  const meta = screenMetaFor(project, state.screen);
  container.hidden = false;
  container.className = `mc extended-preview mc-${state.screen}`;
  container.style.width = `${meta.width}px`;
  container.style.height = `${meta.height}px`;
  container.replaceChildren();
  const header = createElement("header");
  header.dataset.testid = "preview-header";
  header.dataset.state = state.state;
  header.append(createElement("strong", "extended-title", t(meta.titleKey || meta.labelKey || "screen.forgeuiinspector.genericTitle", state.locale)), createElement("span", "extended-fixture", t("screen.forgeuiinspector.fixture", state.locale, [t(fixture?.titleKey, state.locale)])));
  container.append(header);
  const body = createElement("div", "extended-body");
  const items = itemsForLayout(fixture, state.layout);
  const screenPageSize = renderPageSize(data, project, state.screen);
  const pageItems = items.slice(state.page * screenPageSize, (state.page + 1) * screenPageSize);
  const pages = pageCount(items, screenPageSize);
  const pageLabel = pages > 1 ? t("screen.forgeuiinspector.page", state.locale, [state.page + 1, pages]) : "";
  if (meta.renderer === "master-stash") {
    if (state.variant && state.variant !== "current") {
      renderMasterVariant(body, state, fixture);
    } else {
    body.append(createElement("div", "extended-search", t("screen.forgeuiinspector.master.search", state.locale)));
    const tabs = createElement("div", "extended-tabs");
    ["all", "maps", "special"].forEach((id) => tabs.append(createElement("span", `extended-tab${id === "all" ? " selected" : ""}`, t(`screen.forgeuiinspector.master.tab.${id}`, state.locale))));
    body.append(tabs);
    const pages = createElement("div", "master-pages", "");
    [0, 1].forEach((page) => {
      const panel = createElement("section", "extended-panel master-page-panel");
      panel.dataset.testid = `master-stash-page-${page}`;
      panel.setAttribute("role", "region");
      panel.setAttribute("aria-label", `Master Stash page ${page + 1}`);
      const grid = createElement("div", "large-grid");
      grid.setAttribute("role", "grid");
      grid.style.setProperty("--grid-columns", "9");
      grid.style.setProperty("--grid-rows", "9");
      for (let i = 0; i < MASTER_PAGE_SIZE; i += 1) {
        const slot = createElement("div", "slot");
        slot.dataset.testid = `master-stash-page-${page}-slot-${i}`;
        slot.setAttribute("role", "gridcell");
        slot.setAttribute("aria-colindex", String((i % 9) + 1));
        slot.setAttribute("aria-rowindex", String(Math.floor(i / 9) + 1));
        const item = page === 0 ? items[i] : items[i + MASTER_PAGE_SIZE];
        if (item) slot.append(screenItemIcon(item, i));
        grid.append(slot);
      }
      panel.append(grid, createElement("small", "panel-caption", page === 0 ? "1" : "2"));
      pages.append(panel);
    });
    body.append(pages);
    const detail = createElement("section", "extended-panel master-detail");
    detail.dataset.testid = "master-stash-detail";
    ["detail", "selected", "status", "page", "readonly"].forEach((key) => {
      const value = key === "page" ? (pageLabel || t("screen.forgeuiinspector.master.page", state.locale)) : t(`screen.forgeuiinspector.master.${key}`, state.locale);
      detail.append(createElement("p", key === "status" ? "success" : "", value));
    });
    body.append(detail);
    const inventory = createElement("section", "extended-inventory");
    inventory.dataset.testid = "master-stash-inventory";
    inventory.append(createElement("h3", "", t("screen.forgeuiinspector.inventory", state.locale)));
    const inv = createElement("div", "large-grid inventory-grid");
    inv.dataset.testid = "master-stash-inventory-grid";
    inv.setAttribute("role", "grid");
    for (let i = 0; i < 36; i += 1) { const slot = createElement("div", "slot"); slot.dataset.testid = `master-stash-inventory-slot-${i}`; slot.setAttribute("role", "gridcell"); inv.append(slot); }
    inventory.append(inv);
    body.append(inventory);
    }
  } else if (meta.renderer === "profession-workshop") {
    const tabs = createElement("div", "extended-tabs profession-tabs");
    ["crafting", "gathering", "smelting"].forEach((id, index) => tabs.append(createElement("span", `extended-tab${index === 0 ? " selected" : ""}`, t(`screen.forgeuiinspector.profession.tab.${id}`, state.locale))));
    body.append(tabs, createElement("div", "extended-search profession-search", t("screen.forgeuiinspector.profession.search", state.locale)), createElement("div", "extended-filter", t("screen.forgeuiinspector.profession.filter", state.locale)));
    const list = createElement("section", "extended-panel recipe-list"); list.dataset.testid = "profession-workshop-list";
    const recipeCount = fixture?.itemCount === 0 ? 0 : state.fixture === "many" ? 9 : state.fixture === "other" ? 1 : 5;
    for (let i = 0; i < 9; i += 1) { const row = createElement("div", `recipe-row${i === 0 ? " selected" : ""}`); row.dataset.testid = `profession-workshop-recipe-${i}`; row.setAttribute("aria-selected", String(i === 0)); if (i < recipeCount) { row.append(screenItemIcon({ icon: i % 2 ? "orb" : "paper", count: 1 }, i), createElement("span", "recipe-label", clipLabel(t("screen.forgeuiinspector.profession.recipe", state.locale, [i + 1]), 160)), createElement("em", "recipe-count", String(12 + i))); } list.append(row); }
    body.append(list);
    const detail = createElement("section", "extended-panel recipe-detail"); detail.dataset.testid = "profession-workshop-detail";
    ["detail", "output", "materials", "craft", "readonly", "status"].forEach((key) => detail.append(createElement("p", key === "status" ? "success" : "", t(`screen.forgeuiinspector.profession.${key}`, state.locale))));
    body.append(detail);
  } else if (meta.renderer === "advanced-salvage") {
    body.append(createElement("div", "salvage-workflow", t("screen.forgeuiinspector.salvage.workflow", state.locale)));
    const catalog = createElement("section", "extended-panel salvage-catalog"); catalog.dataset.testid = "advanced-salvage-catalog"; catalog.append(createElement("h3", "", t("screen.forgeuiinspector.salvage.catalog", state.locale)));
    const presetCount = state.fixture === "empty" ? 0 : state.fixture === "many" ? 11 : state.fixture === "other" ? 2 : 4;
    for (let i = 0; i < 11; i += 1) { const row = createElement("div", `preset-row${i === 0 ? " selected" : ""}`); row.dataset.testid = `advanced-salvage-preset-${i}`; row.setAttribute("aria-selected", String(i === 0)); if (i < presetCount) row.textContent = `${t("screen.forgeuiinspector.salvage.preset", state.locale, [i + 1])} · ${i % 2 ? t("screen.forgeuiinspector.salvage.salvage", state.locale) : t("screen.forgeuiinspector.salvage.keep", state.locale)}`; catalog.append(row); }
    const detail = createElement("section", "extended-panel salvage-detail"); detail.dataset.testid = "advanced-salvage-detail";
    ["selected", "selectedName", "ruleSummary", "held", "history"].forEach((key) => detail.append(createElement("p", "", t(`screen.forgeuiinspector.salvage.${key}`, state.locale))));
    const grid = createElement("div", "large-grid salvage-items"); grid.dataset.testid = "advanced-salvage-items"; grid.setAttribute("role", "grid"); pageItems.slice(0, 18).forEach((item, index) => { const slot = createElement("div", "slot"); slot.dataset.testid = `advanced-salvage-slot-${index}`; slot.setAttribute("role", "gridcell"); slot.append(screenItemIcon(item, index)); grid.append(slot); }); detail.append(grid); for (let i = 0; i < 4; i += 1) detail.append(createElement("small", "history-row", t("screen.forgeuiinspector.salvage.historyEntry", state.locale, [i + 1])));
    body.append(catalog, detail);
    body.append(createElement("div", "salvage-footer", `${t("screen.forgeuiinspector.salvage.readonly", state.locale)} · ${t("screen.forgeuiinspector.salvage.status", state.locale)}`));
  } else {
    const genericList = createElement("div", "generic-fixture-summary");
    genericList.append(createElement("strong", "", t("screen.forgeuiinspector.genericReadonly", state.locale)));
    genericList.append(createElement("p", "", t("screen.forgeuiinspector.fixture", state.locale, [t(fixture?.titleKey, state.locale)])));
    const genericGrid = createElement("div", "large-grid generic-grid");
    genericGrid.setAttribute("role", "grid");
    const columns = meta.grid?.columns ?? 9;
    const rows = meta.grid?.rows ?? 6;
    const slots = meta.grid?.slots ?? columns * rows;
    genericGrid.style.setProperty("--grid-columns", String(columns));
    genericGrid.style.setProperty("--grid-rows", String(rows));
    for (let index = 0; index < slots; index += 1) {
      const slot = createElement("div", "slot");
      slot.dataset.testid = `generic-slot-${index}`;
      slot.setAttribute("role", "gridcell");
      const item = pageItems[index];
      if (item) slot.append(screenItemIcon(item, index));
      genericGrid.append(slot);
    }
    body.append(genericList, genericGrid, createElement("p", "generic-note", t(meta.labelKey || "screen.forgeuiinspector.genericTitle", state.locale)));
  }
  container.append(body);
  container.dataset.state = state.state;
  container.dataset.screen = state.screen;
  container.dataset.fixture = state.fixture;
  container.dataset.renderer = meta.renderer;
  container.dataset.project = project.id;
  container.dataset.layout = state.layout;
  container.dataset.page = String(state.page);
  container.dataset.pageCount = String(pages);
  container.dataset.itemCount = String(items.length);
  return pageLabel;
}

export function initEmulator(data, options = {}) {
  if (typeof document === "undefined" || typeof window === "undefined") return null;
  const project = options.project ?? DEFAULT_CTE2_PROJECT;
  const projectIndex = options.projectIndex ?? DEFAULT_PROJECT_INDEX;
  const fixtureControl = document.getElementById("fixture-control");
  const projectControl = document.getElementById("project-control");
  const screenControl = document.getElementById("screen-control");
  const masterVariantControl = document.getElementById("master-variant-control");
  const masterVariantControlWrap = document.getElementById("master-variant-control-wrap");
  const localeControl = document.getElementById("locale-control");
  const layoutControl = document.getElementById("layout-control");
  const pageControl = document.getElementById("page-control");
  const pagePrevious = document.getElementById("stash-page-previous");
  const pageNext = document.getElementById("stash-page-next");
  const scrollControl = document.getElementById("scroll-control");
  const stateControl = document.getElementById("state-control");
  const readUrl = () => Object.fromEntries(new URLSearchParams(window.location.search));
  let state = normalize({ ...readUrl(), project: options.projectId ?? readUrl().project }, data, project);
  let syncingList = false;

  FIXTURE_IDS.forEach((id) => fixtureControl?.add(new Option(id, id)));

  const fixtureForState = () => data.fixtures?.find((fixture) => fixture.id === state.fixture) ?? data.fixtures?.[0];
  const publishSnapshot = () => {
    state = normalize(state, data, project);
    safeReplaceUrl(canonical(state));
    render();
  };
  const setState = (partial = {}) => {
    if (Object.prototype.hasOwnProperty.call(partial, "project") && partial.project && partial.project !== project.id
      && (projectIndex.projects ?? []).some((entry) => entry.id === partial.project)) {
      const url = new URL(window.location.href);
      if (partial.project === DEFAULT_PROJECT_ID) url.searchParams.delete("project"); else url.searchParams.set("project", partial.project);
      url.searchParams.delete("screen");
      url.searchParams.set("layout", "all");
      url.searchParams.set("page", "0");
      window.location.href = url.toString();
      return;
    }
    if (Object.prototype.hasOwnProperty.call(partial, "screen") && screenIdsFor(project).includes(partial.screen) && partial.screen !== state.screen) {
      const url = new URL(window.location.href);
      url.searchParams.set("screen", partial.screen);
      url.searchParams.set("layout", "all");
      url.searchParams.set("page", "0");
      window.location.href = url.toString();
      return;
    }
    state = mergeState(state, partial, data, project);
    publishSnapshot();
    return { ...state };
  };

  function render() {
    state = normalize(state, data, project);
    const fixture = fixtureForState();
    const screenPageSize = renderPageSize(data, project, state.screen);
    const selectedItems = itemsForLayout(fixture, state.layout);
    const preview = document.getElementById("map-stash-preview");
    const list = document.getElementById("layout-list");
    const grid = document.getElementById("stash-grid");
    const pageLabel = document.getElementById("stash-page");
    const meta = screenMetaFor(project, state.screen);
    const geometry = meta.geometry ?? {};
    const listGeometry = geometry.list ?? {};
    const stashGeometry = geometry.stash ?? {};
    const inventoryGeometry = geometry.inventory ?? {};
    const pageGeometry = geometry.page ?? {};
    const setGeometry = (name, value) => { if (Number.isFinite(value)) preview.style.setProperty(name, `${value}px`); };
    setGeometry("--list-x", listGeometry.x); setGeometry("--list-y", listGeometry.y); setGeometry("--list-width", listGeometry.width); setGeometry("--list-row-height", listGeometry.rowHeight); preview.style.setProperty("--list-rows", String(listGeometry.rows ?? 10));
    setGeometry("--stash-x", stashGeometry.x); setGeometry("--stash-y", stashGeometry.y); setGeometry("--stash-slot", stashGeometry.slot); preview.style.setProperty("--stash-columns", String(stashGeometry.columns ?? 12)); preview.style.setProperty("--stash-rows", String(stashGeometry.rows ?? 8));
    setGeometry("--inventory-x", inventoryGeometry.x); setGeometry("--inventory-y", inventoryGeometry.y); preview.style.setProperty("--inventory-columns", String(inventoryGeometry.columns ?? 9)); preview.style.setProperty("--inventory-rows", String(inventoryGeometry.rows ?? 3));
    setGeometry("--hotbar-y", geometry.hotbar?.y); preview.style.setProperty("--hotbar-columns", String(geometry.hotbar?.columns ?? 9)); preview.style.setProperty("--hotbar-rows", String(geometry.hotbar?.rows ?? 1));
    setGeometry("--inventory-label-x", geometry.inventoryLabel?.x); setGeometry("--inventory-label-y", geometry.inventoryLabel?.y);
    setGeometry("--page-previous-x", pageGeometry.previousX); setGeometry("--page-next-x", pageGeometry.nextX); setGeometry("--page-button-y", pageGeometry.buttonY); setGeometry("--page-button-width", pageGeometry.buttonWidth); setGeometry("--page-button-height", pageGeometry.buttonHeight); setGeometry("--page-label-x", pageGeometry.labelX); setGeometry("--page-label-y", pageGeometry.labelY);
    const pageItems = buildItems(fixture, state.layout, state.page, screenPageSize);
    const selectedLayout = layoutById(fixture, state.layout) ?? { id: "all", labelKey: "screen.forgeuiinspector.all", count: 0 };
    const itemCount = selectedItems.length;
    const pages = pageCount(itemCount, screenPageSize);
    const snapshot = snapshotFor(state, data, project);
    const app = document.getElementById("forge-ui-emulator");
    const snapshotNode = document.getElementById("inspector-state");
    app?.setAttribute("data-ready", "true");
    app?.setAttribute("data-project", project.id);
    app?.setAttribute("data-screen", state.screen);
    app?.setAttribute("data-fixture", state.fixture);
    app?.setAttribute("data-state", state.state);
    app?.setAttribute("data-layout", state.layout);
    app?.setAttribute("data-scroll", String(state.scroll));
    app?.setAttribute("data-page", String(state.page));
    app?.setAttribute("data-page-count", String(pages));
    app?.setAttribute("data-item-count", String(itemCount));
    if (snapshotNode) {
      const snapshotText = JSON.stringify(snapshot);
      snapshotNode.textContent = snapshotText;
      snapshotNode.value = snapshotText;
    }
    preview.classList.toggle("page-active", pages > 1);

    if (fixtureControl) {
      fixtureControl.replaceChildren();
      (data.fixtures ?? []).forEach((candidate) => fixtureControl.add(new Option(t(candidate.titleKey, state.locale), candidate.id)));
      fixtureControl.value = state.fixture;
    }
    if (localeControl) localeControl.value = state.locale;
    if (projectControl) {
      projectControl.replaceChildren();
      (projectIndex.projects ?? [{ id: project.id, labelKey: project.labelKey }]).forEach((entry) => {
        projectControl.add(new Option(t(entry.labelKey || "project.generic.name", state.locale), entry.id));
      });
      projectControl.value = project.id;
    }
    if (screenControl) {
      screenControl.replaceChildren();
      screenIdsFor(project).forEach((screenId) => {
        const meta = screenMetaFor(project, screenId);
        screenControl.add(new Option(t(meta.labelKey || "screen.forgeuiinspector.genericTitle", state.locale), screenId));
      });
      screenControl.value = state.screen;
    }
    if (masterVariantControl) {
      masterVariantControl.replaceChildren();
      MASTER_VARIANT_IDS.forEach((variant) => masterVariantControl.add(new Option(t(`screen.forgeuiinspector.master.variant.${variant}`, state.locale), variant)));
      masterVariantControl.value = state.variant ?? "rail_dual";
      masterVariantControlWrap?.toggleAttribute("hidden", state.screen !== "master_stash");
    }
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
    const expanded = meta.renderer !== "compact-stash";
    const extendedContainers = ["master-stash-preview", "profession-workshop-preview", "advanced-salvage-preview", "extended-preview"].map((id) => document.getElementById(id)).filter(Boolean);
    extendedContainers.forEach((container) => { container.hidden = true; });
    document.documentElement.lang = state.locale;
    if (expanded) {
      preview.hidden = true;
      const knownContainer = document.getElementById(`${state.screen.replaceAll("_", "-")}-preview`);
      const expandedContainer = knownContainer ?? document.getElementById("extended-preview");
      renderExtendedPreview(expandedContainer, state, fixture, data, project);
      const displayScaleValue = displayScale(state, Math.max(1, window.innerWidth - 32), Math.max(1, window.innerHeight - 32), project);
      const wrap = document.querySelector(".preview-wrap");
      wrap.style.setProperty("--preview-scale", String(displayScaleValue));
      wrap.style.width = `${meta.width * displayScaleValue}px`;
      wrap.style.height = `${meta.height * displayScaleValue}px`;
      document.getElementById("canonical").textContent = canonical(state);
      return;
    }
    preview.hidden = false;
    document.getElementById("title").textContent = t(data.titleKey || meta.labelKey || "screen.forgeuiinspector.genericTitle", state.locale);
    const stateNode = document.getElementById("state");
    const selectedSummary = `${clipLabel(t(selectedLayout.labelKey, state.locale), 54)} (${itemCount})`;
    const visualState = t(`screen.forgeuiinspector.state.${state.state}`, state.locale);
    stateNode.textContent = `${selectedSummary} · ${visualState}`;
    stateNode.title = t("screen.forgeuiinspector.fixture", state.locale, [t(fixture?.titleKey, state.locale)]);
    stateNode.setAttribute("aria-label", stateNode.title);
    stateNode.className = `state-${state.state}`;
    document.getElementById("selected-layout").textContent = `${clipLabel(t(selectedLayout.labelKey, state.locale), 108)} (${itemCount})`;
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-label", t(meta.labelKey || "screen.forgeuiinspector.genericTitle", state.locale));
    list.setAttribute("aria-activedescendant", `layout-row-${state.layout}`);
    list.setAttribute("aria-setsize", String(fixture?.layouts?.length ?? 0));

    list.replaceChildren();
    (fixture?.layouts ?? []).forEach((layout, index) => {
      const row = createElement("div", `layout-row${layout.id === state.layout ? " selected" : ""}`);
      row.dataset.testid = `layout-row-${layout.id}`;
      row.id = `layout-row-${layout.id}`;
      row.setAttribute("role", "option");
      row.setAttribute("aria-selected", String(layout.id === state.layout));
      row.setAttribute("aria-posinset", String(index + 1));
      row.setAttribute("aria-setsize", String(fixture?.layouts?.length ?? 0));
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
    list.scrollTop = state.scroll * (listGeometry?.rowHeight ?? 18);
    syncingList = false;

    grid.setAttribute("role", "grid");
    grid.setAttribute("aria-label", t(meta.labelKey || "screen.forgeuiinspector.genericTitle", state.locale));
    grid.replaceChildren();
    const columns = meta.grid?.columns ?? 9;
    const rows = meta.grid?.rows ?? 6;
    const slots = meta.grid?.slots ?? columns * rows;
    grid.style.setProperty("--grid-columns", String(columns));
    grid.style.setProperty("--grid-rows", String(rows));
    for (let slotIndex = 0; slotIndex < slots; slotIndex += 1) {
      const slot = createElement("div", "slot");
      slot.dataset.testid = `stash-slot-${slotIndex}`;
      slot.setAttribute("role", "gridcell");
      slot.setAttribute("aria-colindex", String((slotIndex % columns) + 1));
      slot.setAttribute("aria-rowindex", String(Math.floor(slotIndex / columns) + 1));
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
    pageLabel.setAttribute("role", "status");
    pageLabel.textContent = pages > 1 ? t("screen.forgeuiinspector.page", state.locale, [state.page + 1, pages]) : "";
    pageLabel.hidden = pages <= 1;
    if (pagePrevious) { pagePrevious.hidden = pages <= 1; pagePrevious.disabled = pages <= 1 || state.page <= 0; }
    if (pageNext) { pageNext.hidden = pages <= 1; pageNext.disabled = pages <= 1 || state.page >= pages - 1; }
    const inventory = document.getElementById("player-inventory");
    inventory.replaceChildren();
    inventory.append(createElement("div", "inventory-title", t("screen.forgeuiinspector.inventory", state.locale)));
    const mainRow = createElement("div", "inv-row inventory-main");
    for (let index = 0; index < 27; index += 1) {
      const slot = createElement("div", "slot");
      slot.dataset.testid = `inventory-slot-${index}`;
      slot.setAttribute("role", "gridcell");
      mainRow.append(slot);
    }
    const hotbarRow = createElement("div", "inv-row inventory-hotbar");
    for (let index = 0; index < 9; index += 1) {
      const slot = createElement("div", "slot");
      slot.dataset.testid = `inventory-slot-${index + 27}`;
      slot.setAttribute("role", "gridcell");
      hotbarRow.append(slot);
    }
    inventory.append(mainRow, hotbarRow);

    const displayScaleValue = displayScale(state, Math.max(1, window.innerWidth - 32), Math.max(1, window.innerHeight - 32), project);
    const wrap = document.querySelector(".preview-wrap");
    wrap.style.setProperty("--preview-scale", String(displayScaleValue));
    const compactMeta = meta;
    wrap.style.width = `${compactMeta.width * displayScaleValue}px`;
    wrap.style.height = `${compactMeta.height * displayScaleValue}px`;
    preview.dataset.state = state.state;
    preview.dataset.screen = state.screen;
    preview.dataset.project = project.id;
    preview.dataset.fixture = state.fixture;
    preview.dataset.renderer = meta.renderer;
    preview.dataset.layout = state.layout;
    preview.dataset.page = String(state.page);
    preview.dataset.pageCount = String(pages);
    preview.dataset.itemCount = String(itemCount);
    document.getElementById("canonical").textContent = canonical(state);
  }

  fixtureControl?.addEventListener("change", (event) => setState({ fixture: event.target.value, layout: "all", page: 0 }));
  screenControl?.addEventListener("change", (event) => {
    const target = screenIdsFor(project).includes(event.target.value) ? event.target.value : (project.defaultScreen ?? screenIdsFor(project)[0]);
    const url = new URL(window.location.href); url.searchParams.set("screen", target); url.searchParams.set("layout", "all"); url.searchParams.set("page", "0"); window.location.href = url.toString();
  });
  projectControl?.addEventListener("change", (event) => {
    const target = event.target.value || DEFAULT_PROJECT_ID;
    const url = new URL(window.location.href);
    if (target === DEFAULT_PROJECT_ID) url.searchParams.delete("project"); else url.searchParams.set("project", target);
    url.searchParams.delete("screen");
    url.searchParams.set("layout", "all");
    url.searchParams.set("page", "0");
    window.location.href = url.toString();
  });
  localeControl?.addEventListener("change", (event) => setState({ locale: event.target.value }));
  layoutControl?.addEventListener("change", (event) => setState({ layout: event.target.value }));
  pageControl?.addEventListener("change", (event) => setState({ page: event.target.value }));
  pagePrevious?.addEventListener("click", () => setState({ page: state.page - 1 }));
  pageNext?.addEventListener("click", () => setState({ page: state.page + 1 }));
  scrollControl?.addEventListener("change", (event) => setState({ scroll: event.target.value }));
  stateControl?.addEventListener("change", (event) => setState({ state: event.target.value }));
  masterVariantControl?.addEventListener("change", (event) => setState({ variant: event.target.value }));
  ["width", "height", "scale"].forEach((key) => document.getElementById(`${key}-control`)?.addEventListener("change", (event) => setState({ [key]: event.target.value })));
  document.getElementById("reset")?.addEventListener("click", () => { state = normalize({}, data, project); publishSnapshot(); });
  document.getElementById("copy")?.addEventListener("click", () => navigator.clipboard?.writeText(canonical(state)));
  document.getElementById("layout-list")?.addEventListener("scroll", (event) => {
    if (syncingList) return;
    const listGeometry = screenMetaFor(project, state.screen).geometry?.list ?? {};
    setState({ scroll: Math.round(event.target.scrollTop / (listGeometry.rowHeight ?? 18)) });
  });
  document.getElementById("stash-grid")?.addEventListener("wheel", (event) => {
    const max = pageCount(itemsForLayout(fixtureForState(), state.layout), renderPageSize(data, project, state.screen)) - 1;
    if (max > 0) { event.preventDefault(); setState({ page: state.page + (event.deltaY > 0 ? 1 : -1) }); }
  }, { passive: false });
  window.addEventListener("resize", render);

  const getSnapshot = () => snapshotFor(state, data, project);
  window.forgeUIInspector = {
    getState: () => ({ ...state }),
    setState,
    reset: () => { state = normalize({}, data, project); publishSnapshot(); return { ...state }; },
    getCanonicalUrl: () => canonical(state),
    getSnapshot,
  };
  safeReplaceUrl(canonical(state));
  render();
  return window.forgeUIInspector;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`request failed: ${response.status}`);
  return response.json();
}

function validProjectIndex(index) {
  if (index?.schema !== PROJECT_INDEX_SCHEMA || index.version !== 1 || !Array.isArray(index.projects)) return DEFAULT_PROJECT_INDEX;
  const projects = index.projects.filter((entry) => entry && typeof entry.id === "string" && typeof entry.manifest === "string");
  return projects.length > 0 ? { ...index, projects } : DEFAULT_PROJECT_INDEX;
}

async function loadData() {
  if (typeof window === "undefined") return;
  const query = new URLSearchParams(window.location.search);
  const baseUrl = new URL(".", window.location.href);
  let projectIndex = DEFAULT_PROJECT_INDEX;
  let project = DEFAULT_CTE2_PROJECT;
  try {
    projectIndex = validProjectIndex(await fetchJson(new URL("projects/index.json", baseUrl)));
  } catch {
    projectIndex = DEFAULT_PROJECT_INDEX;
  }
  const requestedProject = query.get("project") || projectIndex.defaultProject || DEFAULT_PROJECT_ID;
  const projectEntry = projectIndex.projects.find((entry) => entry.id === requestedProject) ?? projectIndex.projects.find((entry) => entry.id === DEFAULT_PROJECT_ID);
  if (projectEntry) {
    try {
      project = await fetchJson(new URL(`projects/${projectEntry.manifest}`, baseUrl));
      if (!validateProjectManifest(project).valid) throw new Error("invalid project manifest");
    } catch {
      project = DEFAULT_CTE2_PROJECT;
    }
  }
  const screenIds = screenIdsFor(project);
  const requestedScreen = screenIds.includes(query.get("screen")) ? query.get("screen") : (project.defaultScreen ?? screenIds[0]);
  const meta = screenMetaFor(project, requestedScreen);
  let data;
  try {
    const projectUrl = projectEntry ? new URL(`projects/${projectEntry.manifest}`, baseUrl) : baseUrl;
    data = await fetchJson(new URL(meta.fixturePath, projectUrl));
  } catch {
    data = project.id === DEFAULT_PROJECT_ID ? createFallbackForScreen(requestedScreen) : createGenericFallbackData(project, requestedScreen);
  }
  const validation = validateFixtureDocument(data, { project: project.id, screen: requestedScreen, pageSize: meta.grid?.slots });
  if (!validation.valid) {
    document.body.textContent = `Fixture load error: ${validation.errors.join("; ")}`;
    document.body.dataset.fixtureError = "true";
    return;
  }
  data = normalizeFixtureItems(data);
  initEmulator(data, { project, projectIndex, projectId: project.id });
}

if (typeof window !== "undefined" && typeof document !== "undefined") loadData();
