import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  CURRENCY_CATEGORY_IDS,
  DEFAULT_CTE2_PROJECT,
  FIXTURE_IDS,
  I18N,
  MINECRAFT_FONT_STACK,
  MASTER_PAGE_SIZE,
  MAP_PAGE_SIZE,
  MASTER_VARIANT_IDS,
  PAGE_SIZE,
  SCREEN_META,
  SCREEN_IDS,
  STATE_IDS,
  canonical,
  clipLabel,
  createCurrencyFallbackData,
  createExtendedFallbackData,
  createFallbackForScreen,
  createFallbackData,
  displayScale,
  iconGlyph,
  isCurrencyFixtureData,
  itemsForCategory,
  itemsForLayout,
  layoutScrollMax,
  mergeState,
  normalize,
  pageCount,
  validateFixtureDocument,
  renderPageSize,
  t,
} from "../emulator/emulator.js";

const data = JSON.parse(fs.readFileSync(new URL("../emulator/fixtures/map-stash.json", import.meta.url), "utf8"));
const currencyData = JSON.parse(fs.readFileSync(new URL("../emulator/fixtures/currency-stash.json", import.meta.url), "utf8"));
const fixture = (id) => data.fixtures.find((candidate) => candidate.id === id);
const currencyFixture = (id) => currencyData.fixtures.find((candidate) => candidate.id === id);

test("fixture schema has the required top-level values and four fixtures", () => {
  assert.equal(data.version, 1);
  assert.equal(data.screen, "map_stash");
  assert.equal(data.pageSize, 96);
  assert.deepEqual(data.fixtures.map((candidate) => candidate.id), FIXTURE_IDS);
  assert.equal(data.fixtures.length, 4);
});

test("every fixture has unique all + 28 layouts + other", () => {
  for (const candidate of data.fixtures) {
    assert.equal(candidate.layouts.length, 30, candidate.id);
    const ids = candidate.layouts.map((layout) => layout.id);
    assert.equal(new Set(ids).size, ids.length, candidate.id);
    assert.ok(ids.includes("all"), candidate.id);
    assert.ok(ids.includes("other"), candidate.id);
    assert.ok(candidate.layouts.every((layout) => layout.count >= 0), candidate.id);
  }
});

test("fixture slots stay within one 96-slot page", () => {
  for (const candidate of data.fixtures) {
    assert.ok(candidate.items.every((item) => Number.isInteger(item.slot) && item.slot >= 0 && item.slot < 96), candidate.id);
  }
});

test("currency fixture has the required schema, categories, and slots", () => {
  assert.equal(currencyData.version, 1);
  assert.equal(currencyData.screen, "currency_stash");
  assert.equal(currencyData.pageSize, 96);
  assert.deepEqual(currencyData.fixtures.map((candidate) => candidate.id), FIXTURE_IDS);
  assert.equal(isCurrencyFixtureData(currencyData), true);
  for (const candidate of currencyData.fixtures) {
    assert.deepEqual(candidate.layouts.map((layout) => layout.id), CURRENCY_CATEGORY_IDS);
    assert.ok(candidate.items.every((item) => Number.isInteger(item.slot) && item.slot >= 0 && item.slot < 96));
  }
});

test("all five screen fixtures are available and keep deterministic four-state data", () => {
  assert.deepEqual(SCREEN_IDS, ["map_stash", "currency_stash", "master_stash", "profession_workshop", "advanced_salvage"]);
  for (const screen of SCREEN_IDS.slice(2)) {
    const file = SCREEN_META[screen].fixtureFile;
    const screenData = JSON.parse(fs.readFileSync(new URL(`../emulator/fixtures/${file}.json`, import.meta.url), "utf8"));
    assert.equal(screenData.screen, screen);
    assert.equal(screenData.pageSize, screen === "master_stash" ? 81 : screen === "map_stash" || screen === "currency_stash" ? 96 : 54);
    assert.deepEqual(screenData.fixtures.map((candidate) => candidate.id), FIXTURE_IDS);
    assert.ok(screenData.fixtures.every((candidate) => Number.isInteger(candidate.itemCount) && candidate.itemCount >= 0));
    assert.ok(screenData.fixtures.find((candidate) => candidate.id === "many").itemCount > screenData.pageSize);
  }
});

test("extended fixtures clamp pages and use their actual logical dimensions", () => {
  for (const screen of SCREEN_IDS.slice(2)) {
    const dataForScreen = createExtendedFallbackData(screen);
    const state = normalize({ screen, fixture: "many", page: 99, width: 1, height: 1 }, dataForScreen);
    assert.equal(state.screen, screen);
    assert.equal(state.page, 1);
    assert.equal(state.width, SCREEN_META[screen].width);
    assert.equal(state.height, SCREEN_META[screen].height);
    assert.equal(createFallbackForScreen(screen).screen, screen);
    assert.equal(pageCount(itemsForLayout(dataForScreen.fixtures[2], "all")), 2);
  }
});

test("currency fixture includes empty, 108-item paging, and normalized metadata", () => {
  assert.equal(currencyFixture("empty").items.length, 0);
  assert.ok(currencyFixture("many").items.length >= 108);
  assert.equal(pageCount(currencyFixture("many").items), 2);
  for (const candidate of currencyData.fixtures) candidate.items.forEach((item, index) => {
    assert.equal(item.page, Math.floor(index / 96));
    assert.equal(item.slot, index % 96);
  });
  assert.ok(currencyFixture("other").items.some((item) => item.category === "other"));
  assert.equal(itemsForCategory(currencyFixture("many"), "all").length, currencyFixture("many").items.length);
  assert.ok(itemsForCategory(currencyFixture("many"), "gear_orbs").length > 0);
});

test("normal, empty, many, and other contain the intended states", () => {
  assert.equal(fixture("normal").items.length, 18);
  assert.equal(fixture("normal").layouts.find((layout) => layout.id === "layout_01").labelKey, "screen.forgeuiinspector.layout.long");
  assert.equal(fixture("empty").items.length, 0);
  assert.equal(fixture("many").items.length, 108);
  assert.ok(fixture("other").items.length > 0);
  assert.ok(fixture("other").items.every((item) => item.layout === "other"));
});

test("layout filtering is stable and preserves the all count", () => {
  assert.equal(itemsForLayout(fixture("many"), "all").length, 108);
  assert.equal(itemsForLayout(fixture("other"), "other").length, fixture("other").items.length);
  assert.equal(itemsForLayout(fixture("empty"), "layout_01").length, 0);
});

test("96, 97, and 192 items produce the expected page counts", () => {
  assert.equal(pageCount(96, MAP_PAGE_SIZE), 1);
  assert.equal(pageCount(97, MAP_PAGE_SIZE), 2);
  assert.equal(pageCount(192, MAP_PAGE_SIZE), 2);
});

test("normalize applies safe defaults and clamps URL values", () => {
  const state = normalize({ fixture: "unknown", locale: "xx", layout: "nope", page: -3, scroll: -4, width: 1, height: 1, scale: 0, state: "bad" }, data);
  assert.deepEqual(state, { fixture: "normal", screen: "map_stash", locale: "ja", layout: "all", page: 0, scroll: 0, width: 474, height: 326, scale: 0.5, state: "normal" });
  assert.equal(normalize({ fixture: "many", layout: "all", page: 999 }, data).page, 1);
  assert.equal(normalize({ fixture: "many", layout: "all", scroll: 999 }, data).scroll, layoutScrollMax(fixture("many")));
  assert.equal(normalize({ screen: "currency_stash", fixture: "many", layout: "all", page: 999 }, currencyData).screen, "currency_stash");
  assert.equal(normalize({ screen: "currency_stash", fixture: "many", layout: "all", page: 999 }, currencyData).page, 1);
  assert.equal(normalize({ screen: "unsupported" }, data).screen, "map_stash");
});

test("all supported states and locales normalize without leaking arbitrary values", () => {
  for (const state of STATE_IDS) assert.equal(normalize({ state }, data).state, state);
  assert.equal(normalize({ locale: "en" }, data).locale, "en");
  assert.equal(normalize({ locale: "de" }, data).locale, "ja");
});

test("canonical URL contains every reproducibility parameter in a stable order", () => {
  const url = canonical(normalize({ fixture: "many", locale: "en", layout: "all", page: 1, scroll: 2, width: 640, height: 360, scale: 2, state: "full" }, data));
  assert.equal(url, "index.html?screen=map_stash&fixture=many&locale=en&layout=all&page=1&scroll=2&width=640&height=360&scale=2&state=full");
  assert.ok(SCREEN_IDS.includes(normalize({ screen: "currency_stash" }, currencyData).screen));
});

test("raw map fixture metadata follows the 96-slot page contract", () => {
  for (const candidate of data.fixtures) candidate.items.forEach((item, index) => {
    assert.equal(item.page, Math.floor(index / 96), candidate.id);
    assert.equal(item.slot, index % 96, candidate.id);
  });
});

test("fixture loading rejects a page-size mismatch against screen metadata", () => {
  const invalid = validateFixtureDocument({ ...data, pageSize: 54 }, { project: "cte2", screen: "map_stash", pageSize: 96 });
  assert.equal(invalid.valid, false);
  assert.match(invalid.errors.join("; "), /pageSize must be 96/);
  assert.equal(validateFixtureDocument(data, { project: "cte2", screen: "map_stash", pageSize: 96 }).valid, true);
  assert.equal(validateFixtureDocument(currencyData, { project: "cte2", screen: "currency_stash", pageSize: 96 }).valid, true);
});

test("fixture validation rejects raw slot and page metadata inconsistent with item index", () => {
  const invalidSlot = structuredClone(data);
  invalidSlot.fixtures[0].items[1].slot = 2;
  const slotValidation = validateFixtureDocument(invalidSlot, { project: "cte2", screen: "map_stash", pageSize: 96 });
  assert.equal(slotValidation.valid, false);
  assert.match(slotValidation.errors.join("; "), /item 1 slot must be 1/);

  const invalidPage = structuredClone(currencyData);
  invalidPage.fixtures.find((candidate) => candidate.id === "many").items[96].page = 0;
  const pageValidation = validateFixtureDocument(invalidPage, { project: "cte2", screen: "currency_stash", pageSize: 96 });
  assert.equal(pageValidation.valid, false);
  assert.match(pageValidation.errors.join("; "), /item 96 page must be 1/);
});

test("master stash UI variants normalize and remain URL-reproducible", () => {
  assert.deepEqual(MASTER_VARIANT_IDS, ["current", "classic", "dual", "rail", "overview", "clean_dual", "rail_dual", "single_focus"]);
  const masterData = createExtendedFallbackData("master_stash");
  assert.equal(normalize({ screen: "master_stash" }, masterData).variant, "rail_dual");
  const rail = normalize({ screen: "master_stash", fixture: "many", variant: "rail" }, masterData);
  assert.equal(rail.variant, "rail");
  assert.equal(normalize({ screen: "master_stash", variant: "unknown" }, masterData).variant, "rail_dual");
  assert.match(canonical(rail), /variant=rail$/);
  for (const locale of ["ja", "en"]) {
    for (const variant of MASTER_VARIANT_IDS) assert.notEqual(t(`screen.forgeuiinspector.master.variant.${variant}`, locale), `screen.forgeuiinspector.master.variant.${variant}`);
  }
});

test("renderer page boundaries match the visual grid", () => {
  const masterData = createExtendedFallbackData("master_stash");
  assert.equal(MASTER_PAGE_SIZE, 81);
  assert.equal(renderPageSize(masterData, DEFAULT_CTE2_PROJECT, "master_stash"), MASTER_PAGE_SIZE);
  assert.equal(renderPageSize(data, DEFAULT_CTE2_PROJECT, "map_stash"), MAP_PAGE_SIZE);
  assert.equal(MAP_PAGE_SIZE, 96);
  assert.equal(renderPageSize(masterData, DEFAULT_CTE2_PROJECT, "master_stash"), 81);
  assert.equal(normalize({ screen: "master_stash", fixture: "many", page: 99 }, masterData).page, 1);
});

test("agent snapshot and stable DOM identifiers are part of the public shell", () => {
  const source = fs.readFileSync(new URL("../emulator/emulator.js", import.meta.url), "utf8");
  const html = fs.readFileSync(new URL("../emulator/index.html", import.meta.url), "utf8");
  assert.match(source, /getSnapshot/);
  for (const testId of ["forge-ui-emulator", "project-control", "fixture-control", "screen-control", "layout-list", "stash-grid", "stash-page", "inspector-state"]) {
    assert.match(html, new RegExp(`data-testid="${testId}"`), testId);
  }
  for (const property of ["project", "screen", "fixture", "state", "pageCount", "itemCount"]) {
    assert.match(source, new RegExp(`dataset\\.${property}`), `dataset.${property}`);
  }
});

test("translations cover labels, page text, inventory, and all state values", () => {
  for (const locale of ["ja", "en"]) {
    assert.notEqual(t("screen.forgeuiinspector.all", locale), "screen.forgeuiinspector.all");
    assert.notEqual(t("screen.forgeuiinspector.other", locale), "screen.forgeuiinspector.other");
    assert.equal(t("screen.forgeuiinspector.page", locale, [2, 2]).includes("2"), true);
    assert.notEqual(t("screen.forgeuiinspector.inventory", locale), "screen.forgeuiinspector.inventory");
    assert.notEqual(t("screen.forgeuiinspector.currencyTitle", locale), "screen.forgeuiinspector.currencyTitle");
    for (const category of CURRENCY_CATEGORY_IDS.filter((id) => id !== "all" && id !== "other")) assert.notEqual(t(`screen.forgeuiinspector.${category}`, locale), `screen.forgeuiinspector.${category}`);
    for (const item of ["chaos", "map", "coin"]) assert.notEqual(t(`screen.forgeuiinspector.currencyItem.${item}`, locale), `screen.forgeuiinspector.currencyItem.${item}`);
    for (const state of STATE_IDS) assert.notEqual(t(`screen.forgeuiinspector.state.${state}`, locale), `screen.forgeuiinspector.state.${state}`);
    for (let index = 1; index <= 28; index += 1) assert.ok(I18N[locale][`screen.forgeuiinspector.layout.${String(index).padStart(2, "0")}`]);
  }
});

test("long labels are clipped by measured pixel width", () => {
  const measure = (value) => [...value].length * 10;
  const clipped = clipLabel("非常に長い日本語レイアウト名", 45, measure);
  assert.ok(clipped.endsWith("…"));
  assert.ok(measure(clipped) <= 45);
  assert.equal(clipLabel("短い", 45, measure), "短い");
});

test("preview text uses a deterministic Minecraft-style font stack", () => {
  assert.match(MINECRAFT_FONT_STACK, /monospace/);
  assert.doesNotMatch(MINECRAFT_FONT_STACK, /Arial/);
});

test("display scale fits both requested dimensions and a small viewport", () => {
  const state = { width: 960, height: 540, scale: 2 };
  assert.equal(displayScale(state, 640, 360), 360 / 326);
  assert.ok(displayScale(state, 300, 200) * 474 <= 300);
  assert.ok(displayScale(state, 300, 200) * 326 <= 200);
});

test("changing layout resets the page while fixture changes return to all", () => {
  const current = normalize({ fixture: "many", layout: "all", page: 1 }, data);
  assert.equal(mergeState(current, { layout: "layout_01", page: 1 }, data).page, 0);
  assert.equal(mergeState(current, { fixture: "empty" }, data).layout, "all");
  assert.equal(mergeState(current, { fixture: "empty" }, data).page, 0);
});

test("unknown icons have a visible fallback instead of breaking the slot", () => {
  assert.deepEqual(iconGlyph("unknown-icon"), { className: "icon-unknown", glyph: "?" });
  assert.deepEqual(iconGlyph("map"), { className: "icon-map", glyph: "◆" });
  assert.deepEqual(iconGlyph("orb"), { className: "icon-orb", glyph: "✦" });
  assert.deepEqual(iconGlyph("coin"), { className: "icon-coin", glyph: "●" });
});

test("the file:// fallback has the same four-fixture and layout shape", () => {
  const fallback = createFallbackData();
  assert.deepEqual(fallback.fixtures.map((candidate) => candidate.id), FIXTURE_IDS);
  assert.ok(fallback.fixtures.every((candidate) => candidate.layouts.length === 30));
  assert.equal(fallback.fixtures.find((candidate) => candidate.id === "many").items.length, 108);
});

test("the currency file:// fallback has all categories and stable paging", () => {
  const fallback = createCurrencyFallbackData();
  assert.equal(isCurrencyFixtureData(fallback), true);
  assert.deepEqual(fallback.fixtures.map((candidate) => candidate.id), FIXTURE_IDS);
  assert.equal(fallback.fixtures.find((candidate) => candidate.id === "many").items.length, 108);
  assert.equal(pageCount(fallback.fixtures.find((candidate) => candidate.id === "many").items), 2);
});
