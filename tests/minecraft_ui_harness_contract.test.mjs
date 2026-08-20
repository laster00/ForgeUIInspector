import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const captureScript = fs.readFileSync(new URL("../tools/minecraft-ui/capture.ps1", import.meta.url), "utf8");
const harnessReadme = fs.readFileSync(new URL("../tools/minecraft-ui/README.md", import.meta.url), "utf8");
const clientSource = fs.readFileSync(new URL("../src/main/java/jp/cte2/forgeuiinspector/client/ForgeUIInspectorClient.java", import.meta.url), "utf8");
const masterPreviewSource = fs.readFileSync(new URL("../src/main/java/jp/cte2/forgeuiinspector/client/MasterStashPreviewScreen.java", import.meta.url), "utf8");
const mapPreviewSource = fs.readFileSync(new URL("../src/main/java/jp/cte2/forgeuiinspector/client/MapStashPreviewScreen.java", import.meta.url), "utf8");
const currencyPreviewSource = fs.readFileSync(new URL("../src/main/java/jp/cte2/forgeuiinspector/client/CurrencyStashPreviewScreen.java", import.meta.url), "utf8");
const previewGeometrySource = fs.readFileSync(new URL("../src/main/java/jp/cte2/forgeuiinspector/client/Cte2StashPreviewGeometry.java", import.meta.url), "utf8");
const mapFixtureSource = fs.readFileSync(new URL("../src/main/java/jp/cte2/forgeuiinspector/client/PreviewFixture.java", import.meta.url), "utf8");
const currencyFixtureSource = fs.readFileSync(new URL("../src/main/java/jp/cte2/forgeuiinspector/client/CurrencyPreviewFixture.java", import.meta.url), "utf8");
const cte2AddonRoot = new URL("../../cte2-ja-patch/addon/cte2-talent-description-search/", import.meta.url);
const productionLayoutUrl = new URL("src/main/java/jp/cte2/client/ui/Cte2StashLayout.java", cte2AddonRoot);
const productionThemeUrl = new URL("src/main/java/jp/cte2/client/ui/Cte2UiTheme.java", cte2AddonRoot);
const productionLayoutSource = fs.existsSync(productionLayoutUrl) ? fs.readFileSync(productionLayoutUrl, "utf8") : null;
const productionThemeSource = fs.existsSync(productionThemeUrl) ? fs.readFileSync(productionThemeUrl, "utf8") : null;

test("Minecraft UI harness is isolated, deterministic, and captures a real window", () => {
  assert.match(captureScript, /run-ui/);
  assert.match(captureScript, /guiScale:\$GuiScale/);
  assert.match(captureScript, /tutorialStep:none/);
  assert.match(captureScript, /forgeUiRunDir/);
  assert.match(captureScript, /forgeUiPreview/);
  assert.match(captureScript, /Save-WindowScreenshot/);
  assert.match(captureScript, /PreviewKey/);
});

test("harness documentation covers both GUI scales and all preview keys", () => {
  assert.match(harnessReadme, /GuiScale 2/);
  assert.match(harnessReadme, /GuiScale 3/);
  assert.match(harnessReadme, /PreviewKey F8/);
  assert.match(harnessReadme, /Master StashはF9/);
  assert.match(harnessReadme, /Profession WorkshopはF10/);
  assert.match(harnessReadme, /Advanced SalvageはF11/);
  assert.match(harnessReadme, /run-ui/);
});

test("preview keys are usable from the title screen without a world", () => {
  assert.doesNotMatch(clientSource, /if \(mc\.level != null\)/);
  assert.match(clientSource, /new MapStashPreviewScreen\(mc\.screen\)/);
  assert.match(clientSource, /new CurrencyStashPreviewScreen\(mc\.screen\)/);
  assert.match(clientSource, /new MasterStashPreviewScreen\(mc\.screen\)/);
  assert.match(clientSource, /new ProfessionWorkshopPreviewScreen\(mc\.screen\)/);
  assert.match(clientSource, /new AdvancedSalvagePreviewScreen\(mc\.screen\)/);
});

test("capture harness maps every development key to a server-free preview", () => {
  for (const key of ["F7", "F8", "F9", "F10", "F11"]) assert.match(captureScript, new RegExp(`'${key}'`));
  assert.match(captureScript, /advanced_salvage/);
});

test("Map and Currency capture previews follow the production stash geometry and 96-slot boundary", { skip: productionLayoutSource === null || productionThemeSource === null }, () => {
  const productionValue = (name) => Number((productionLayoutSource.match(new RegExp(`(?:int|final int)\\s+${name}\\s*=\\s*(\\d+)`)) ?? productionThemeSource.match(new RegExp(`(?:int|final int)\\s+${name}\\s*=\\s*(\\d+)`)))?.[1]);
  const previewValue = (name) => Number(previewGeometrySource.match(new RegExp(`\\b${name}\\s*=\\s*(\\d+)`))?.[1]);
  const sharedNames = ["WIDTH", "HEIGHT", "LIST_X", "LIST_Y", "LIST_WIDTH", "LIST_ROW_HEIGHT", "LIST_ROWS", "STASH_X", "STASH_Y", "STASH_COLUMNS", "STASH_ROWS", "SLOT_SIZE", "HOTBAR_Y", "PAGE_PREVIOUS_X", "PAGE_NEXT_X", "PAGE_BUTTON_Y", "PAGE_BUTTON_WIDTH", "PAGE_BUTTON_HEIGHT", "PAGE_LABEL_X", "PAGE_LABEL_Y", "INVENTORY_LABEL_X", "INVENTORY_LABEL_Y"];
  for (const name of sharedNames) assert.equal(previewValue(name), productionValue(name), name);
  assert.equal(previewValue("INVENTORY_X"), productionValue("PLAYER_INVENTORY_X"));
  assert.equal(previewValue("INVENTORY_Y"), productionValue("PLAYER_INVENTORY_Y"));

  const pageSize = previewValue("STASH_COLUMNS") * previewValue("STASH_ROWS");
  assert.equal(previewValue("WIDTH"), 474);
  assert.equal(previewValue("HEIGHT"), 326);
  assert.equal(pageSize, 96);
  assert.equal(Math.max(1, Math.ceil(96 / pageSize)), 1);
  assert.equal(Math.max(1, Math.ceil(97 / pageSize)), 2);
  assert.match(previewGeometrySource, /PAGE_SIZE\s*=\s*STASH_COLUMNS\s*\*\s*STASH_ROWS/);
  assert.match(mapFixtureSource, /MANY\("screen\.forgeuiinspector\.many",\s*97\)/);
  for (const fixtureSource of [mapFixtureSource, currencyFixtureSource]) assert.match(fixtureSource, /Cte2StashPreviewGeometry\.PAGE_SIZE/);
  for (const previewSource of [mapPreviewSource, currencyPreviewSource]) {
    for (const name of ["WIDTH", "HEIGHT", "LIST_X", "LIST_Y", "LIST_WIDTH", "LIST_ROWS", "LIST_ROW_HEIGHT", "STASH_X", "STASH_Y", "STASH_COLUMNS", "PAGE_SIZE", "INVENTORY_X", "INVENTORY_Y", "HOTBAR_Y", "PAGE_LABEL_X", "PAGE_LABEL_Y"]) assert.match(previewSource, new RegExp(`Cte2StashPreviewGeometry\\.${name}`), name);
    assert.match(previewSource, /INVENTORY_COLUMNS\s*\*\s*Cte2StashPreviewGeometry\.INVENTORY_ROWS/);
    assert.match(previewSource, /Cte2StashPreviewGeometry\.HOTBAR_COLUMNS/);
    assert.match(previewSource, /drawSlot\(g, sx, sy,/);
    assert.match(previewSource, /g\.fill\(x, y, x \+ Cte2StashPreviewGeometry\.SLOT_SIZE, y \+ Cte2StashPreviewGeometry\.SLOT_SIZE, 0xff8b8b8b\)/);
    assert.match(previewSource, /g\.fill\(x \+ 1, y \+ 1, x \+ Cte2StashPreviewGeometry\.SLOT_SIZE - 1, y \+ Cte2StashPreviewGeometry\.SLOT_SIZE - 1, 0xff373737\)/);
    assert.match(previewSource, /g\.fill\(x \+ 1, y \+ 1, x \+ Cte2StashPreviewGeometry\.SLOT_SIZE - 1, y \+ 2, 0xffb6b6b6\)/);
    assert.match(previewSource, /g\.fill\(x \+ 1, y \+ Cte2StashPreviewGeometry\.SLOT_SIZE - 2, x \+ Cte2StashPreviewGeometry\.SLOT_SIZE - 1, y \+ Cte2StashPreviewGeometry\.SLOT_SIZE - 1, 0xff202020\)/);
    assert.doesNotMatch(previewSource, /g\.fill\(x, y, x \+ Cte2StashPreviewGeometry\.SLOT_SIZE - 1/);
    assert.doesNotMatch(previewSource, /s[xy] \+ 17/);
    for (const name of ["PAGE_PREVIOUS_X", "PAGE_NEXT_X", "PAGE_BUTTON_Y", "PAGE_BUTTON_WIDTH", "PAGE_BUTTON_HEIGHT"]) assert.match(previewSource, new RegExp(`Cte2StashPreviewGeometry\\.${name}`), name);
    assert.match(previewSource, /g\.fill\(Cte2StashPreviewGeometry\.PAGE_PREVIOUS_X, Cte2StashPreviewGeometry\.PAGE_BUTTON_Y, Cte2StashPreviewGeometry\.PAGE_PREVIOUS_X \+ Cte2StashPreviewGeometry\.PAGE_BUTTON_WIDTH, Cte2StashPreviewGeometry\.PAGE_BUTTON_Y \+ Cte2StashPreviewGeometry\.PAGE_BUTTON_HEIGHT/);
    assert.match(previewSource, /g\.fill\(Cte2StashPreviewGeometry\.PAGE_NEXT_X, Cte2StashPreviewGeometry\.PAGE_BUTTON_Y, Cte2StashPreviewGeometry\.PAGE_NEXT_X \+ Cte2StashPreviewGeometry\.PAGE_BUTTON_WIDTH, Cte2StashPreviewGeometry\.PAGE_BUTTON_Y \+ Cte2StashPreviewGeometry\.PAGE_BUTTON_HEIGHT/);
    assert.doesNotMatch(previewSource, /\b206\b/);
  }
  assert.match(productionThemeSource, /graphics\.fill\(x, y, x \+ SLOT_SIZE, y \+ SLOT_SIZE, SLOT_OUTER\)/);
  assert.match(productionThemeSource, /graphics\.fill\(x \+ 1, y \+ 1, x \+ SLOT_SIZE - 1, y \+ SLOT_SIZE - 1, SLOT_INNER\)/);
  assert.match(mapPreviewSource, /LayoutMath\.pageFor\(selectedCount\(\), Cte2StashPreviewGeometry\.PAGE_SIZE, page - 1\)/);
  assert.match(mapPreviewSource, /LayoutMath\.pageFor\(selectedCount\(\), Cte2StashPreviewGeometry\.PAGE_SIZE, page \+ 1\)/);
  assert.match(currencyPreviewSource, /page = Math\.max\(0, Math\.min\(fixture\.pageCountForCategory\(category\) - 1, page - 1\)\)/);
  assert.match(currencyPreviewSource, /page = Math\.max\(0, Math\.min\(fixture\.pageCountForCategory\(category\) - 1, page \+ 1\)\)/);
});

test("Master Stash preview starts on Gear and has no all-items rail", () => {
  assert.match(masterPreviewSource, /master\.category\.gear/);
  assert.doesNotMatch(masterPreviewSource, /screen\.forgeuiinspector\.all/);
});
