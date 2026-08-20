import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { CURRENCY_CATEGORY_IDS, DEFAULT_CTE2_PROJECT, UI_THEME } from "../emulator/emulator.js";

const css = fs.readFileSync(new URL("../emulator/emulator.css", import.meta.url), "utf8");
const stashContract = JSON.parse(fs.readFileSync(new URL("../emulator/contracts/cte2-stash.json", import.meta.url), "utf8"));
const cte2Manifest = JSON.parse(fs.readFileSync(new URL("../emulator/projects/cte2/project.json", import.meta.url), "utf8"));
const cte2AddonRoot = new URL("../../cte2-ja-patch/addon/cte2-talent-description-search/", import.meta.url);
const readOptionalCte2File = (relativePath) => {
  const url = new URL(relativePath, cte2AddonRoot);
  const path = fileURLToPath(url);
  return fs.existsSync(path) ? fs.readFileSync(path, "utf8") : null;
};
const cte2Integration = {
  javaTheme: readOptionalCte2File("src/main/java/jp/cte2/client/ui/Cte2UiTheme.java"),
  stashLayout: readOptionalCte2File("src/main/java/jp/cte2/client/ui/Cte2StashLayout.java"),
  storageConstants: readOptionalCte2File("src/main/java/jp/cte2/storage/Cte2StorageConstants.java"),
  modsToml: readOptionalCte2File("src/main/resources/META-INF/mods.toml"),
  advancedEn: readOptionalCte2File("src/main/resources/assets/cte2_advanced_salvage/lang/en_us.json"),
  advancedJa: readOptionalCte2File("src/main/resources/assets/cte2_advanced_salvage/lang/ja_jp.json"),
  mapJa: readOptionalCte2File("src/main/resources/assets/cte2_map_stash/lang/ja_jp.json"),
  masterEn: readOptionalCte2File("src/main/resources/assets/cte2_master_stash/lang/en_us.json"),
  masterJa: readOptionalCte2File("src/main/resources/assets/cte2_master_stash/lang/ja_jp.json"),
  currencyIndex: readOptionalCte2File("src/main/java/jp/cte2/currencystash/CurrencyStashIndex.java"),
  mapIndex: readOptionalCte2File("src/main/java/jp/cte2/mapstash/MapStashIndex.java"),
  masterCategories: readOptionalCte2File("src/main/java/jp/cte2/masterstash/MasterStashCategory.java"),
  currencyMenu: readOptionalCte2File("src/main/java/jp/cte2/currencystash/menu/CurrencyStashMenu.java"),
  mapMenu: readOptionalCte2File("src/main/java/jp/cte2/mapstash/menu/MapStashMenu.java"),
};
const hasCte2Integration = Object.values(cte2Integration).every((value) => value !== null);

test("browser theme exposes the shared core palette", () => {
  const cssTokens = {
    background: "--ui-background",
    panel: "--ui-panel",
    border: "--ui-border",
    slotOuter: "--ui-slot-outer",
    slotInner: "--ui-slot-inner",
    text: "--ui-text",
    muted: "--ui-muted",
    selected: "--ui-selected",
    success: "--ui-success",
    error: "--ui-error",
  };
  for (const [name, variable] of Object.entries(cssTokens)) {
    assert.match(css, new RegExp(`${variable}\\s*:`), variable);
    assert.match(css, new RegExp(UI_THEME[name].slice(1), "i"), name);
  }
});

test("browser preview keeps the Minecraft font token and deterministic geometry", () => {
  assert.match(css, /--minecraft-font:/);
  assert.match(css, new RegExp(`width:\\s*${stashContract.logicalSize.width}px`));
  assert.match(css, new RegExp(`height:\\s*${stashContract.logicalSize.height}px`));
});

test("checked-in stash contract is required by manifest and CSS geometry checks", () => {
  const { geometry, grid, logicalSize } = stashContract;
  assert.equal(stashContract.schema, "forge-ui-inspector.cte2-stash-contract");
  assert.equal(stashContract.version, 1);
  for (const screenId of ["map_stash", "currency_stash"]) {
    const screen = cte2Manifest.screens.find((candidate) => candidate.id === screenId);
    assert.deepEqual(screen.logicalSize, logicalSize, screenId);
    assert.deepEqual(screen.geometry, geometry, screenId);
    assert.deepEqual(screen.grid, grid, screenId);
  }
  for (const value of [geometry.stash.x, geometry.stash.y, geometry.stash.slot, geometry.list.width, geometry.list.rowHeight, geometry.page.buttonY, geometry.page.buttonWidth, geometry.page.buttonHeight, geometry.inventory.y, geometry.hotbar.y, geometry.inventoryLabel.x, geometry.inventoryLabel.y]) {
    assert.match(css, new RegExp(`${value}px`), `${value}px`);
  }
  assert.match(css, new RegExp(`--stash-columns,\\s*${grid.columns}\\)`));
  assert.match(css, new RegExp(`--stash-rows,\\s*${grid.rows}\\)`));
  assert.match(css, new RegExp(`--list-rows,\\s*${geometry.list.rows}\\)`));
});

test("compact geometry is sourced from the production Cte2StashLayout contract", { skip: !hasCte2Integration }, () => {
  const manifest = JSON.parse(fs.readFileSync(new URL("../emulator/projects/cte2/project.json", import.meta.url), "utf8"));
  const names = ["WIDTH", "HEIGHT", "LIST_X", "LIST_Y", "LIST_WIDTH", "LIST_ROW_HEIGHT", "LIST_ROWS", "STASH_X", "STASH_Y", "STASH_COLUMNS", "STASH_ROWS", "SLOT_SIZE", "PLAYER_INVENTORY_X", "PLAYER_INVENTORY_Y", "HOTBAR_Y", "PAGE_PREVIOUS_X", "PAGE_NEXT_X", "PAGE_BUTTON_Y", "PAGE_BUTTON_WIDTH", "PAGE_BUTTON_HEIGHT", "PAGE_LABEL_X", "PAGE_LABEL_Y", "INVENTORY_LABEL_X", "INVENTORY_LABEL_Y"];
  const value = (name) => Number((cte2Integration.stashLayout.match(new RegExp(`(?:int|final int)\\s+${name}\\s*=\\s*(\\d+)`)) ?? cte2Integration.javaTheme.match(new RegExp(`(?:int|final int)\\s+${name}\\s*=\\s*(\\d+)`)))?.[1]);
  const geometry = manifest.screens.find((screen) => screen.id === "map_stash").geometry;
  const expected = { width: value("WIDTH"), height: value("HEIGHT"), list: { x: value("LIST_X"), y: value("LIST_Y"), width: value("LIST_WIDTH"), rowHeight: value("LIST_ROW_HEIGHT"), rows: value("LIST_ROWS") }, stash: { x: value("STASH_X"), y: value("STASH_Y"), columns: value("STASH_COLUMNS"), rows: value("STASH_ROWS"), slot: value("SLOT_SIZE") }, inventory: { x: value("PLAYER_INVENTORY_X"), y: value("PLAYER_INVENTORY_Y"), columns: 9, rows: 3 }, hotbar: { y: value("HOTBAR_Y"), columns: 9, rows: 1 }, page: { previousX: value("PAGE_PREVIOUS_X"), nextX: value("PAGE_NEXT_X"), buttonY: value("PAGE_BUTTON_Y"), buttonWidth: value("PAGE_BUTTON_WIDTH"), buttonHeight: value("PAGE_BUTTON_HEIGHT"), labelX: value("PAGE_LABEL_X"), labelY: value("PAGE_LABEL_Y") }, inventoryLabel: { x: value("INVENTORY_LABEL_X"), y: value("INVENTORY_LABEL_Y") } };
  assert.equal(geometry ? JSON.stringify(geometry) : null, JSON.stringify((( { width: _width, height: _height, ...contract } ) => contract)(expected)));
  assert.deepEqual(manifest.screens.find((screen) => screen.id === "map_stash").logicalSize, { width: expected.width, height: expected.height });
  assert.deepEqual(DEFAULT_CTE2_PROJECT.screens.find((screen) => screen.id === "currency_stash").geometry, geometry);
});

test("compact stash follows the production geometry contract without page offsets", () => {
  assert.match(css, /grid-template-columns:\s*repeat\(var\(--stash-columns,\s*12\),\s*var\(--stash-slot,\s*18px\)\)/);
  assert.match(css, /grid-template-rows:\s*repeat\(var\(--stash-rows,\s*8\),\s*var\(--stash-slot,\s*18px\)\)/);
  assert.match(css, /\.stash\s*\{[^}]*left:\s*var\(--stash-x,\s*240px\)[^}]*top:\s*var\(--stash-y,\s*34px\)/);
  assert.match(css, /\.mc aside\s*\{[^}]*box-sizing:\s*border-box[^}]*width:\s*var\(--list-width,\s*200px\)[^}]*height:\s*calc\(var\(--list-row-height,\s*18px\) \* var\(--list-rows,\s*10\)\)[^}]*padding:\s*0[^}]*border:\s*0/);
  assert.match(css, /\.layout-row\s*\{[^}]*box-sizing:\s*border-box[^}]*height:\s*var\(--list-row-height,\s*18px\)/);
  assert.match(css, /\.page-button[^}]*box-sizing:\s*border-box[^}]*top:\s*var\(--page-button-y,\s*186px\)[^}]*width:\s*var\(--page-button-width,\s*54px\)[^}]*height:\s*var\(--page-button-height,\s*20px\)/);
  assert.doesNotMatch(css, /page-active \\.stash-grid|page-active \\.inventory/);
  assert.match(css, /\.inventory-title\s*\{[^}]*left:\s*var\(--inventory-label-x,\s*267px\)[^}]*top:\s*var\(--inventory-label-y,\s*216px\)/);
  assert.match(css, /\.inventory-main\s*\{[^}]*top:\s*var\(--inventory-y,\s*228px\)[^}]*grid-template-rows:\s*repeat\(var\(--inventory-rows,\s*3\),\s*var\(--stash-slot,\s*18px\)\)/);
  assert.match(css, /\.inventory-hotbar\s*\{[^}]*top:\s*var\(--hotbar-y,\s*290px\)/);
  assert.match(fs.readFileSync(new URL("../emulator/emulator.js", import.meta.url), "utf8"), /if \(Number\.isFinite\(value\)\) preview\.style\.setProperty\(name, `\$\{value\}px`\)/);
});

test("CTE2 project integration keeps the shared theme and extension labels aligned", { skip: !hasCte2Integration }, () => {
  const {
    javaTheme, stashLayout, storageConstants, modsToml, advancedEn, advancedJa, mapJa, masterEn, masterJa,
    currencyIndex, mapIndex, masterCategories, currencyMenu, mapMenu,
  } = cte2Integration;
  assert.match(storageConstants, /PHYSICAL_CAPACITY\s*=\s*PAGE_SIZE\s*\*\s*8/);
  assert.match(storageConstants, /PAGE_SIZE\s*=\s*PAGE_COLUMNS\s*\*\s*PAGE_ROWS/);
  assert.match(storageConstants, /PAGE_COLUMNS\s*=\s*12/);
  assert.match(storageConstants, /PAGE_ROWS\s*=\s*8/);
  assert.match(javaTheme, /SLOT_SIZE\s*=\s*18/);
  assert.match(javaTheme, /slotGroup\(GuiGraphics graphics/);
  assert.match(javaTheme, /public static String clip\(Font font/);
  assert.match(stashLayout, /SLOT_SIZE\s*=\s*Cte2UiTheme\.SLOT_SIZE/);
  assert.match(stashLayout, /WIDTH\s*=\s*474/);
  assert.match(stashLayout, /HEIGHT\s*=\s*326/);
  assert.match(stashLayout, /LIST_ROWS\s*=\s*10/);
  assert.match(stashLayout, /Cte2UiTheme\.slotGroup\(graphics/);
  for (const name of ["MapStashScreen.java", "CurrencyStashScreen.java"]) {
    const path = new URL(`src/main/java/jp/cte2/${name.startsWith("Map") ? "mapstash" : "currencystash"}/client/${name}`, cte2AddonRoot);
    const source = fs.readFileSync(path, "utf8");
    assert.match(source, /import jp\.cte2\.client\.ui\.Cte2StashLayout;/, name);
    assert.match(source, /Cte2StashLayout\.drawBackground/, name);
  }
  for (const [id, displayName] of [
    ["cte2_talent_description_search", "CTE2 Helper Suite"],
    ["cte2_profession_workshop", "CTE2 Profession Workshop"],
    ["cte2_advanced_salvage", "CTE2 Advanced Salvage"],
    ["cte2_master_stash", "CTE2 Master Stash"],
    ["cte2_map_stash", "CTE2 Map Stash"],
    ["cte2_currency_stash", "CTE2 Currency Stash"],
  ]) {
    assert.match(modsToml, new RegExp(`modId=\"${id}\"`), id);
    assert.match(modsToml, new RegExp(`displayName=\"${displayName}\"`), id);
  }
  assert.match(advancedEn, /"screen\.cte2_advanced_salvage\.title":"Advanced Salvage"/);
  assert.match(advancedJa, /"screen\.cte2_advanced_salvage\.title":"高度サルベージ"/);
  assert.match(mapJa, /"cte2_map_stash\.layout\.other"\s*:\s*"不明／その他"/);
  assert.match(masterEn, /"container\.cte2_master_stash\.master_stash": "Master Stash"/);
  assert.match(masterJa, /"container\.cte2_master_stash\.master_stash": "マスタースタッシュ"/);
  assert.match(currencyIndex, /ALL\s*=\s*"all"/);
  assert.match(currencyIndex, /OTHER\s*=\s*"other"/);
  assert.match(currencyIndex, new RegExp(`List\\.of\\(${CURRENCY_CATEGORY_IDS.map((id) => id.toUpperCase()).join(",\\s*")}`));
  assert.match(mapIndex, /ALL\s*=\s*"all"/);
  assert.match(mapIndex, /OTHER\s*=\s*"other"/);
  assert.match(masterCategories, /GEAR\([\s\S]*MAPS\([\s\S]*CURRENCY\([\s\S]*GEMS\([\s\S]*PROFESSION\(/);
  for (const [name, source] of [["MapStashMenu", mapMenu], ["CurrencyStashMenu", currencyMenu]]) {
    assert.match(source, /import jp\.cte2\.storage\.Cte2StashGeometry;/, name);
    assert.doesNotMatch(source, /import jp\.cte2\.client\.ui\./, name);
  }
  const screenPaths = [
    "src/main/java/jp/cte2/mapstash/client/MapStashScreen.java",
    "src/main/java/jp/cte2/currencystash/client/CurrencyStashScreen.java",
    "src/main/java/jp/cte2/masterstash/client/MasterStashScreen.java",
    "src/main/java/jp/cte2/professionworkshop/client/ProfessionWorkshopScreen.java",
    "src/main/java/jp/cte2/advancedsalvage/client/AdvancedSalvageScreen.java",
  ];
  for (const relativePath of screenPaths) {
    const source = fs.readFileSync(new URL(relativePath, cte2AddonRoot), "utf8");
    assert.match(source, /import jp\.cte2\.client\.ui\.Cte2UiTheme;/, relativePath);
    assert.match(source, /Cte2UiTheme\./, relativePath);
  }
});

/* The optional CTE2 checks above intentionally do not make the public inspector
 * depend on the sibling addon repository.  A standalone clone still runs all
 * generic tests; a full CTE2 workspace gets the extra integration coverage. */
test("CTE2 integration is optional for standalone clones", () => {
  assert.equal(typeof hasCte2Integration, "boolean");
});

/* Keep the generic test file independent from the CTE2 production screens. */
test("generic preview sources do not import the CTE2 addon", () => {
  const sourceFiles = ["../emulator/emulator.js", "../emulator/fixture-system.js"];
  for (const relativePath of sourceFiles) {
    const source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
    assert.doesNotMatch(source, /cte2-ja-patch/);
  }
});
