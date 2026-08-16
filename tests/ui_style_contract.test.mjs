import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { UI_THEME } from "../emulator/emulator.js";

const css = fs.readFileSync(new URL("../emulator/emulator.css", import.meta.url), "utf8");
const javaTheme = fs.readFileSync(new URL("../../cte2-ja-patch/addon/cte2-talent-description-search/src/main/java/jp/cte2/client/ui/Cte2UiTheme.java", import.meta.url), "utf8");
const stashLayout = fs.readFileSync(new URL("../../cte2-ja-patch/addon/cte2-talent-description-search/src/main/java/jp/cte2/client/ui/Cte2StashLayout.java", import.meta.url), "utf8");
const storageConstants = fs.readFileSync(new URL("../../cte2-ja-patch/addon/cte2-talent-description-search/src/main/java/jp/cte2/storage/Cte2StorageConstants.java", import.meta.url), "utf8");
const modsToml = fs.readFileSync(new URL("../../cte2-ja-patch/addon/cte2-talent-description-search/src/main/resources/META-INF/mods.toml", import.meta.url), "utf8");
const advancedEn = fs.readFileSync(new URL("../../cte2-ja-patch/addon/cte2-talent-description-search/src/main/resources/assets/cte2_advanced_salvage/lang/en_us.json", import.meta.url), "utf8");
const advancedJa = fs.readFileSync(new URL("../../cte2-ja-patch/addon/cte2-talent-description-search/src/main/resources/assets/cte2_advanced_salvage/lang/ja_jp.json", import.meta.url), "utf8");
const mapJa = fs.readFileSync(new URL("../../cte2-ja-patch/addon/cte2-talent-description-search/src/main/resources/assets/cte2_map_stash/lang/ja_jp.json", import.meta.url), "utf8");
const masterEn = fs.readFileSync(new URL("../../cte2-ja-patch/addon/cte2-talent-description-search/src/main/resources/assets/cte2_master_stash/lang/en_us.json", import.meta.url), "utf8");
const masterJa = fs.readFileSync(new URL("../../cte2-ja-patch/addon/cte2-talent-description-search/src/main/resources/assets/cte2_master_stash/lang/ja_jp.json", import.meta.url), "utf8");

test("browser and Java theme expose the same core palette", () => {
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
    assert.match(javaTheme, new RegExp(`public static final int ${name === "slotOuter" ? "SLOT_OUTER" : name === "slotInner" ? "SLOT_INNER" : name.toUpperCase()}\\s*=`), name);
    assert.match(css, new RegExp(UI_THEME[name].slice(1), "i"), name);
  }
});

test("shared theme keeps the Minecraft font and deterministic preview geometry", () => {
  assert.match(css, /--minecraft-font:/);
  assert.match(css, /width:\s*320px/);
  assert.match(css, /height:\s*230px/);
  assert.match(javaTheme, /slotGroup\(GuiGraphics graphics/);
  assert.match(javaTheme, /public static String clip\(Font font/);
});

test("Map and Currency Stash share the canonical storage and screen geometry", () => {
  assert.match(storageConstants, /PHYSICAL_CAPACITY\s*=\s*243/);
  assert.match(storageConstants, /PAGE_SIZE\s*=\s*54/);
  assert.match(javaTheme, /SLOT_SIZE\s*=\s*18/);
  assert.match(stashLayout, /SLOT_SIZE\s*=\s*Cte2UiTheme\.SLOT_SIZE/);
  assert.match(stashLayout, /WIDTH\s*=\s*360/);
  assert.match(stashLayout, /HEIGHT\s*=\s*248/);
  assert.match(stashLayout, /LIST_ROWS\s*=\s*10/);
  assert.match(stashLayout, /Cte2UiTheme\.slotGroup\(graphics/);
  for (const name of ["MapStashScreen.java", "CurrencyStashScreen.java"]) {
    const path = `../../cte2-ja-patch/addon/cte2-talent-description-search/src/main/java/jp/cte2/${name.startsWith("Map") ? "mapstash" : "currencystash"}/client/${name}`;
    const source = fs.readFileSync(new URL(path, import.meta.url), "utf8");
    assert.match(source, /import jp\.cte2\.client\.ui\.Cte2StashLayout;/, name);
    assert.match(source, /Cte2StashLayout\.drawBackground/, name);
  }
});

test("extension catalog names keep compatibility IDs while normalizing labels", () => {
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
});

test("all five Forge screens consume the shared theme", () => {
  const screenPaths = [
    "../../cte2-ja-patch/addon/cte2-talent-description-search/src/main/java/jp/cte2/mapstash/client/MapStashScreen.java",
    "../../cte2-ja-patch/addon/cte2-talent-description-search/src/main/java/jp/cte2/currencystash/client/CurrencyStashScreen.java",
    "../../cte2-ja-patch/addon/cte2-talent-description-search/src/main/java/jp/cte2/masterstash/client/MasterStashScreen.java",
    "../../cte2-ja-patch/addon/cte2-talent-description-search/src/main/java/jp/cte2/professionworkshop/client/ProfessionWorkshopScreen.java",
    "../../cte2-ja-patch/addon/cte2-talent-description-search/src/main/java/jp/cte2/advancedsalvage/client/AdvancedSalvageScreen.java",
  ];
  for (const path of screenPaths) {
    const source = fs.readFileSync(new URL(path, import.meta.url), "utf8");
    assert.match(source, /import jp\.cte2\.client\.ui\.Cte2UiTheme;/, path);
    assert.match(source, /Cte2UiTheme\./, path);
  }
});
