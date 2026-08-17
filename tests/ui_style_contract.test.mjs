import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { UI_THEME } from "../emulator/emulator.js";

const css = fs.readFileSync(new URL("../emulator/emulator.css", import.meta.url), "utf8");
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
  assert.match(css, /width:\s*320px/);
  assert.match(css, /height:\s*230px/);
});

test("CTE2 project integration keeps the shared theme and extension labels aligned", { skip: !hasCte2Integration }, () => {
  const { javaTheme, stashLayout, storageConstants, modsToml, advancedEn, advancedJa, mapJa, masterEn, masterJa } = cte2Integration;
  assert.match(storageConstants, /PHYSICAL_CAPACITY\s*=\s*243/);
  assert.match(storageConstants, /PAGE_SIZE\s*=\s*54/);
  assert.match(javaTheme, /SLOT_SIZE\s*=\s*18/);
  assert.match(javaTheme, /slotGroup\(GuiGraphics graphics/);
  assert.match(javaTheme, /public static String clip\(Font font/);
  assert.match(stashLayout, /SLOT_SIZE\s*=\s*Cte2UiTheme\.SLOT_SIZE/);
  assert.match(stashLayout, /WIDTH\s*=\s*360/);
  assert.match(stashLayout, /HEIGHT\s*=\s*248/);
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
  assert.match(mapJa, /"cte2_map_stash\.layout\.other":"不明／その他"/);
  assert.match(masterEn, /"container\.cte2_master_stash\.master_stash": "Master Stash"/);
  assert.match(masterJa, /"container\.cte2_master_stash\.master_stash": "マスタースタッシュ"/);
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
