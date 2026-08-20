#!/usr/bin/env node
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { browserCaptureMetadata, captureFileStem } from "../capture-contract.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DEFAULT_FIXTURES = Object.freeze(["normal", "empty", "many", "other"]);
const DEFAULT_LOCALES = Object.freeze(["ja"]);
const DEFAULT_STATES = Object.freeze(["normal"]);
const MASTER_VARIANTS = Object.freeze(["current", "classic", "dual", "rail", "overview", "clean_dual", "rail_dual", "single_focus"]);

function csv(value, fallback) {
  return value ? value.split(",").map((entry) => entry.trim()).filter(Boolean) : [...fallback];
}

export function parseCaptureArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const name = argv[index];
    if (name === "--all-master-variants") values.allMasterVariants = true;
    else if (name.startsWith("--")) values[name.slice(2)] = argv[++index];
    else throw new Error(`unexpected argument: ${name}`);
  }
  const guiScale = Math.max(0.5, Number(values.scale) || 2);
  const viewportMatch = /^(\d+)x(\d+)$/.exec(values.viewport || (guiScale === 3 ? "1280x720" : "960x540"));
  if (!viewportMatch) throw new Error("--viewport must use WIDTHxHEIGHT");
  return {
    project: values.project || "cte2",
    screens: csv(values.screens, ["all"]),
    fixtures: csv(values.fixtures, DEFAULT_FIXTURES),
    locales: csv(values.locales, DEFAULT_LOCALES),
    states: csv(values.states, DEFAULT_STATES),
    variants: values.allMasterVariants ? [...MASTER_VARIANTS] : csv(values.variants, ["rail_dual"]),
    guiScale,
    pixelSize: { width: Number(viewportMatch[1]), height: Number(viewportMatch[2]) },
    browser: values.browser || process.env.FORGE_UI_BROWSER || "",
    output: path.resolve(repoRoot, values.output || "tools/browser-capture/captures"),
  };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function selectedAlignment(screen, variant) {
  return screen.alignment?.variants?.[variant] ?? screen.alignment ?? { status: "approximate", source: "undeclared" };
}

export function buildCaptureMatrix(project, options) {
  const selectedScreens = options.screens.includes("all") ? project.screens : project.screens.filter((screen) => options.screens.includes(screen.id));
  if (selectedScreens.length === 0) throw new Error("no screens matched --screens");
  const matrix = [];
  for (const screen of selectedScreens) {
    const variants = screen.id === "master_stash" ? options.variants : [null];
    for (const fixture of options.fixtures) for (const locale of options.locales) for (const state of options.states) for (const variant of variants) {
      const logicalSize = screen.logicalSize ?? { width: screen.width, height: screen.height };
      const query = new URLSearchParams({ screen: screen.id, fixture, locale, layout: "all", page: "0", scroll: "0", width: String(options.pixelSize.width), height: String(options.pixelSize.height), scale: String(options.guiScale), state, capture: "1" });
      if (project.id !== "cte2") query.set("project", project.id);
      if (variant) query.set("variant", variant);
      const alignment = selectedAlignment(screen, variant);
      query.set("alignment", alignment.status);
      matrix.push({ project: project.id, screen: screen.id, fixture, locale, state, variant, alignment, logicalSize, pixelSize: { ...options.pixelSize }, guiScale: options.guiScale, query });
    }
  }
  return matrix;
}

function browserCandidates(explicit) {
  const candidates = [explicit,
    process.platform === "win32" ? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" : "",
    process.platform === "win32" ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" : "",
    "chromium", "chromium-browser", "google-chrome", "microsoft-edge",
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (path.isAbsolute(candidate) && fs.existsSync(candidate)) return candidate;
    if (!path.isAbsolute(candidate) && spawnSync(candidate, ["--version"], { encoding: "utf8" }).status === 0) return candidate;
  }
  throw new Error("Chromium-based browser not found; pass --browser or FORGE_UI_BROWSER");
}

function mimeFor(file) {
  return ({ ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png" })[path.extname(file)] || "application/octet-stream";
}

async function startServer() {
  const server = http.createServer((request, response) => {
    const requested = new URL(request.url, "http://127.0.0.1").pathname;
    const relative = requested === "/" ? "emulator/index.html" : requested.replace(/^\/+/, "");
    const file = path.resolve(repoRoot, relative);
    if (!file.startsWith(`${repoRoot}${path.sep}`) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404); response.end("Not found"); return; }
    response.writeHead(200, { "Content-Type": mimeFor(file), "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(response);
  });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  return { server, origin: `http://127.0.0.1:${server.address().port}` };
}

function pngLooksUsable(file) {
  if (!fs.existsSync(file)) return false;
  const buffer = fs.readFileSync(file);
  return buffer.length > 256 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
}

function pngSize(file) {
  const buffer = fs.readFileSync(file);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function runBrowser(browser, args) {
  return spawnSync(browser, args, { cwd: repoRoot, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
}

async function main() {
  const options = parseCaptureArgs(process.argv.slice(2));
  const manifestPath = path.join(repoRoot, "emulator", "projects", options.project, "project.json");
  if (!fs.existsSync(manifestPath)) throw new Error(`project manifest not found: ${manifestPath}`);
  const project = readJson(manifestPath);
  const matrix = buildCaptureMatrix(project, options);
  const browser = browserCandidates(options.browser);
  fs.mkdirSync(options.output, { recursive: true });
  const { server, origin } = await startServer();
  const results = [];
  try {
    for (const entry of matrix) {
      const canonicalUrl = `index.html?${entry.query.toString().replace("&capture=1", "")}`;
      const preliminary = browserCaptureMetadata({ ...entry, canonicalUrl, image: "pending.png" });
      const stem = captureFileStem(preliminary);
      const image = `${stem}.png`;
      const imagePath = path.join(options.output, image);
      const url = `${origin}/emulator/index.html?${entry.query}`;
      const common = ["--headless=new", ...(process.getuid?.() === 0 ? ["--no-sandbox"] : []), "--disable-gpu", "--disable-extensions", "--no-first-run", "--hide-scrollbars", "--virtual-time-budget=2500", `--window-size=${entry.pixelSize.width},${entry.pixelSize.height}`];
      const dom = runBrowser(browser, [...common, "--dump-dom", url]);
      if (dom.status !== 0 || !/data-ready=["']true["']/.test(dom.stdout)) {
        results.push({ status: "failed", ...entry, error: (dom.stderr || "preview did not publish data-ready=true").trim() });
        continue;
      }
      const shot = runBrowser(browser, [...common, `--screenshot=${imagePath}`, url]);
      if (shot.status !== 0 || !pngLooksUsable(imagePath)) {
        results.push({ status: "failed", ...entry, error: (shot.stderr || "capture was missing or blank").trim() });
        continue;
      }
      const actualPixels = pngSize(imagePath);
      if (actualPixels.width !== entry.pixelSize.width || actualPixels.height !== entry.pixelSize.height) {
        results.push({ status: "failed", ...entry, error: `browser screenshot geometry ${actualPixels.width}x${actualPixels.height} did not match requested viewport ${entry.pixelSize.width}x${entry.pixelSize.height}` });
        continue;
      }
      const metadata = browserCaptureMetadata({ ...entry, canonicalUrl, image });
      fs.writeFileSync(path.join(options.output, `${stem}.json`), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
      results.push({ status: "captured", metadata: `${stem}.json`, image, canonicalUrl });
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
  const manifest = { schema: "forge-ui-inspector.capture-manifest", version: 1, project: project.id, requested: matrix.length, captured: results.filter((entry) => entry.status === "captured").length, failed: results.filter((entry) => entry.status === "failed").length, results };
  fs.writeFileSync(path.join(options.output, "capture-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({ output: options.output, requested: manifest.requested, captured: manifest.captured, failed: manifest.failed })}\n`);
  if (manifest.failed > 0) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
