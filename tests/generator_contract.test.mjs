import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const generator = path.join(repoRoot, ".codex", "skills", "forge-ui-fixture-generator", "scripts", "generate_fixture.py");
const contractExporter = path.join(repoRoot, "tools", "export_cte2_stash_contract.py");
const generatorSource = fs.readFileSync(generator, "utf8");

function runGenerator(args) {
  return spawnSync("python", [generator, ...args], { cwd: repoRoot, encoding: "utf8" });
}

function generateProject(t, columns, rows) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "forge-ui-generator-"));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const output = path.join(temp, columns === undefined ? "grid-default" : `grid-${columns}x${rows}`);
  const args = ["init", "--project-id", "demo", "--project-label-key", "project.demo.name", "--screen-id", "inventory", "--screen-label-key", "screen.demo.inventory", "--renderer", "generic"];
  if (columns !== undefined) args.push("--columns", String(columns));
  if (rows !== undefined) args.push("--rows", String(rows));
  args.push("--output", output);
  const result = runGenerator(args);
  assert.equal(result.status, 0, result.stderr);
  return output;
}

test("generator derives fixture paging from each screen grid without a fixed 54-slot constant", (t) => {
  assert.doesNotMatch(generatorSource, /\bPAGE_SIZE\s*=\s*54\b/);
  for (const [requestedColumns, requestedRows, columns, rows, pageSize] of [[undefined, undefined, 9, 6, 54], [12, 8, 12, 8, 96], [9, 9, 9, 9, 81]]) {
    const output = generateProject(t, requestedColumns, requestedRows);
    const manifest = JSON.parse(fs.readFileSync(path.join(output, "project.json"), "utf8"));
    const fixture = JSON.parse(fs.readFileSync(path.join(output, "fixtures", "inventory.json"), "utf8"));
    const many = fixture.fixtures.find((candidate) => candidate.id === "many");
    assert.deepEqual(manifest.screens[0].grid, { columns, rows, slots: pageSize });
    assert.equal(fixture.pageSize, pageSize);
    assert.equal(many.itemCount, pageSize + 1);
    assert.equal(many.items.length, pageSize + 1);
    many.items.forEach((item, index) => {
      assert.equal(item.slot, index % pageSize);
      assert.equal(item.page, Math.floor(index / pageSize));
    });
    const validation = runGenerator(["validate", output]);
    assert.equal(validation.status, 0, validation.stderr);
  }
});

test("validator uses manifest grid slots for pageSize, item metadata, and the many boundary", (t) => {
  const output = generateProject(t, 12, 8);
  const fixturePath = path.join(output, "fixtures", "inventory.json");
  const original = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  const expectFailure = (mutate, pattern) => {
    const candidate = structuredClone(original);
    mutate(candidate);
    fs.writeFileSync(fixturePath, `${JSON.stringify(candidate, null, 2)}\n`, "utf8");
    const result = runGenerator(["validate", output]);
    assert.equal(result.status, 2);
    assert.match(result.stderr, pattern);
  };
  expectFailure((fixture) => { fixture.pageSize = 54; }, /pageSize must be 96/);
  expectFailure((fixture) => { fixture.fixtures.find((candidate) => candidate.id === "many").items[1].slot = 2; }, /item 1 slot must be 1/);
  expectFailure((fixture) => { fixture.fixtures.find((candidate) => candidate.id === "many").items[96].page = 0; }, /item 96 page must be 1/);
  expectFailure((fixture) => {
    fixture.fixtures.find((candidate) => candidate.id === "many").items.length = 96;
  }, /itemCount must equal items length 96/);
  expectFailure((fixture) => {
    const many = fixture.fixtures.find((candidate) => candidate.id === "many");
    many.items.length = 96;
    many.itemCount = 96;
  }, /more than 96 items/);

  const summary = structuredClone(original);
  summary.fixtures.find((candidate) => candidate.id === "many").items = [];
  fs.writeFileSync(fixturePath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const summaryValidation = runGenerator(["validate", output]);
  assert.equal(summaryValidation.status, 0, summaryValidation.stderr);
});

test("validator rejects inconsistent and non-positive manifest grids", (t) => {
  const output = generateProject(t);
  const manifestPath = path.join(output, "project.json");
  const original = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const expectFailure = (mutate, pattern) => {
    const candidate = structuredClone(original);
    mutate(candidate.screens[0].grid);
    fs.writeFileSync(manifestPath, `${JSON.stringify(candidate, null, 2)}\n`, "utf8");
    const result = runGenerator(["validate", output]);
    assert.equal(result.status, 2);
    assert.match(result.stderr, pattern);
  };
  expectFailure((grid) => { grid.slots = 53; }, /slots must equal columns \* rows/);
  expectFailure((grid) => { grid.columns = 0; }, /columns\/rows must be positive integers/);
  expectFailure((grid) => { grid.rows = -1; }, /columns\/rows must be positive integers/);
  expectFailure((grid) => { grid.slots = 0; }, /slots must equal columns \* rows/);
});

test("validator rejects JSON booleans in every integer fixture contract", (t) => {
  const output = generateProject(t, 1, 1);
  const manifestPath = path.join(output, "project.json");
  const fixturePath = path.join(output, "fixtures", "inventory.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  const expectManifestFailure = (mutate, pattern) => {
    const candidate = structuredClone(manifest);
    mutate(candidate);
    fs.writeFileSync(manifestPath, `${JSON.stringify(candidate, null, 2)}\n`, "utf8");
    const result = runGenerator(["validate", output]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, pattern);
  };
  expectManifestFailure((candidate) => { candidate.version = true; }, /invalid project schema\/version/);
  expectManifestFailure((candidate) => { candidate.screens[0].grid = { columns: true, rows: 54, slots: 54 }; }, /columns\/rows must be positive integers/);
  expectManifestFailure((candidate) => { candidate.screens[0].grid = { columns: 54, rows: true, slots: 54 }; }, /columns\/rows must be positive integers/);
  expectManifestFailure((candidate) => { candidate.screens[0].grid = { columns: 1, rows: 1, slots: true }; }, /slots must equal columns \* rows/);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const expectFixtureFailure = (mutate, pattern) => {
    const candidate = structuredClone(fixture);
    mutate(candidate);
    fs.writeFileSync(fixturePath, `${JSON.stringify(candidate, null, 2)}\n`, "utf8");
    const result = runGenerator(["validate", output]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, pattern);
  };
  expectFixtureFailure((candidate) => { candidate.version = true; }, /invalid fixture schema\/version/);
  expectFixtureFailure((candidate) => { candidate.pageSize = true; }, /pageSize must be 1/);
  expectFixtureFailure((candidate) => { candidate.fixtures[0].items[0].slot = false; }, /item 0 slot must be 0/);
  expectFixtureFailure((candidate) => { candidate.fixtures[0].items[0].page = false; }, /item 0 page must be 0/);
  expectFixtureFailure((candidate) => { candidate.fixtures[0].itemCount = true; }, /itemCount must be non-negative/);
  expectFixtureFailure((candidate) => { candidate.fixtures[0].layouts[0].count = true; }, /layout count must be non-negative/);
});

test("checked-in CTE2 fixtures validate against all five manifest grids", () => {
  const result = runGenerator(["validate", path.join(repoRoot, "emulator", "projects", "cte2")]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /5 screen\(s\)/);
});

test("contract exporter reports unavailable production source without weakening checked-in tests", (t) => {
  const missing = fs.mkdtempSync(path.join(os.tmpdir(), "missing-cte2-source-"));
  t.after(() => fs.rmSync(missing, { recursive: true, force: true }));
  const result = spawnSync("python", [contractExporter, "--source-root", missing, "--check"], { cwd: repoRoot, encoding: "utf8" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /production source unavailable/);
  assert.ok(fs.existsSync(path.join(repoRoot, "emulator", "contracts", "cte2-stash.json")));
});

test("contract exporter derives every slot edge from production slot() source", (t) => {
  const contractPath = path.join(repoRoot, "emulator", "contracts", "cte2-stash.json");
  const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  const sourceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "cte2-contract-source-"));
  t.after(() => fs.rmSync(sourceRoot, { recursive: true, force: true }));
  const layoutPath = path.join(sourceRoot, contract.sources.layout);
  const themePath = path.join(sourceRoot, contract.sources.theme);
  fs.mkdirSync(path.dirname(layoutPath), { recursive: true });
  const { geometry, logicalSize } = contract;
  fs.writeFileSync(layoutPath, `
public final class Cte2StashLayout {
  public static final int WIDTH = ${logicalSize.width};
  public static final int HEIGHT = ${logicalSize.height};
  public static final int LIST_X = ${geometry.list.x};
  public static final int LIST_Y = ${geometry.list.y};
  public static final int LIST_WIDTH = ${geometry.list.width};
  public static final int LIST_ROW_HEIGHT = ${geometry.list.rowHeight};
  public static final int LIST_ROWS = ${geometry.list.rows};
  public static final int STASH_X = ${geometry.stash.x};
  public static final int STASH_Y = ${geometry.stash.y};
  public static final int STASH_COLUMNS = ${geometry.stash.columns};
  public static final int STASH_ROWS = ${geometry.stash.rows};
  public static final int PLAYER_INVENTORY_X = ${geometry.inventory.x};
  public static final int PLAYER_INVENTORY_Y = ${geometry.inventory.y};
  public static final int HOTBAR_Y = ${geometry.hotbar.y};
  public static final int PAGE_PREVIOUS_X = ${geometry.page.previousX};
  public static final int PAGE_NEXT_X = ${geometry.page.nextX};
  public static final int PAGE_BUTTON_Y = ${geometry.page.buttonY};
  public static final int PAGE_BUTTON_WIDTH = ${geometry.page.buttonWidth};
  public static final int PAGE_BUTTON_HEIGHT = ${geometry.page.buttonHeight};
  public static final int PAGE_LABEL_X = ${geometry.page.labelX};
  public static final int PAGE_LABEL_Y = ${geometry.page.labelY};
  public static final int INVENTORY_LABEL_X = ${geometry.inventoryLabel.x};
  public static final int INVENTORY_LABEL_Y = ${geometry.inventoryLabel.y};
}
`, "utf8");
  const theme = `
public final class Cte2UiTheme {
  public static final int SLOT_SIZE = ${geometry.stash.slot};
  public static void slot(GuiGraphics graphics, int x, int y) {
    graphics.fill(x, y, x + SLOT_SIZE, y + SLOT_SIZE, SLOT_OUTER);
    graphics.fill(x + 1, y + 1, x + SLOT_SIZE - 1, y + SLOT_SIZE - 1, SLOT_INNER);
    graphics.fill(x + 1, y + 1, x + SLOT_SIZE - 1, y + 2, SLOT_HIGHLIGHT);
    graphics.fill(x + 1, y + 1, x + 2, y + SLOT_SIZE - 1, SLOT_HIGHLIGHT);
    graphics.fill(x + 1, y + SLOT_SIZE - 2, x + SLOT_SIZE - 1, y + SLOT_SIZE - 1, SLOT_SHADOW);
    graphics.fill(x + SLOT_SIZE - 2, y + 1, x + SLOT_SIZE - 1, y + SLOT_SIZE - 1, SLOT_SHADOW);
  }
}
`;
  fs.writeFileSync(themePath, theme, "utf8");
  const runCheck = () => spawnSync("python", [contractExporter, "--source-root", sourceRoot, "--output", contractPath, "--check"], { cwd: repoRoot, encoding: "utf8" });
  assert.equal(runCheck().status, 0);

  const drifts = [
    ["x + SLOT_SIZE - 1, y + 2, SLOT_HIGHLIGHT", "x + SLOT_SIZE - 1, y + 3, SLOT_HIGHLIGHT"],
    ["x + 2, y + SLOT_SIZE - 1, SLOT_HIGHLIGHT", "x + 3, y + SLOT_SIZE - 1, SLOT_HIGHLIGHT"],
    ["x + 1, y + SLOT_SIZE - 2, x + SLOT_SIZE - 1", "x + 1, y + SLOT_SIZE - 3, x + SLOT_SIZE - 1"],
    ["x + SLOT_SIZE - 2, y + 1, x + SLOT_SIZE - 1", "x + SLOT_SIZE - 3, y + 1, x + SLOT_SIZE - 1"],
  ];
  for (const [before, after] of drifts) {
    fs.writeFileSync(themePath, theme.replace(before, after), "utf8");
    const result = runCheck();
    assert.equal(result.status, 2);
    assert.match(result.stderr, /contract export is stale/);
  }
});
