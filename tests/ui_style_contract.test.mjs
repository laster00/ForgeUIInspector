import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { UI_THEME } from "../emulator/emulator.js";

const css = fs.readFileSync(new URL("../emulator/emulator.css", import.meta.url), "utf8");
const javaTheme = fs.readFileSync(new URL("../../cte2-ja-patch/addon/cte2-talent-description-search/src/main/java/jp/cte2/client/ui/Cte2UiTheme.java", import.meta.url), "utf8");

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
