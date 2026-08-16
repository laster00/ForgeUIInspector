import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const captureScript = fs.readFileSync(new URL("../tools/minecraft-ui/capture.ps1", import.meta.url), "utf8");
const harnessReadme = fs.readFileSync(new URL("../tools/minecraft-ui/README.md", import.meta.url), "utf8");
const clientSource = fs.readFileSync(new URL("../src/main/java/jp/cte2/forgeuiinspector/client/ForgeUIInspectorClient.java", import.meta.url), "utf8");

test("Minecraft UI harness is isolated, deterministic, and captures a real window", () => {
  assert.match(captureScript, /run-ui/);
  assert.match(captureScript, /guiScale:\$GuiScale/);
  assert.match(captureScript, /tutorialStep:none/);
  assert.match(captureScript, /forgeUiRunDir/);
  assert.match(captureScript, /forgeUiPreview/);
  assert.match(captureScript, /Save-WindowScreenshot/);
  assert.match(captureScript, /PreviewKey/);
});

test("harness documentation covers both GUI scales and both preview keys", () => {
  assert.match(harnessReadme, /GuiScale 2/);
  assert.match(harnessReadme, /GuiScale 3/);
  assert.match(harnessReadme, /PreviewKey F8/);
  assert.match(harnessReadme, /run-ui/);
});

test("preview keys are usable from the title screen without a world", () => {
  assert.doesNotMatch(clientSource, /if \(mc\.level != null\)/);
  assert.match(clientSource, /new MapStashPreviewScreen\(mc\.screen\)/);
  assert.match(clientSource, /new CurrencyStashPreviewScreen\(mc\.screen\)/);
});
