import { CAPTURE_SCHEMA, CAPTURE_VERSION, compareCaptureMetadata } from "../capture-contract.mjs";

export const COMPARISON_MODES = Object.freeze(["side-by-side", "overlay", "difference"]);

export function comparePair(left, right, options = {}) {
  const metadata = compareCaptureMetadata(left, right, { requireDifferentKinds: options.requireDifferentKinds === true });
  const limitations = [...new Set([...(left.limitations ?? []), ...(right.limitations ?? [])])];
  if (left.kind === "browser" || right.kind === "browser") limitations.push("Browser rendering does not prove Minecraft font, ItemStack, tooltip, shader, or resource-pack fidelity.");
  if (left.alignment?.status === "concept" || right.alignment?.status === "concept") limitations.push("At least one capture is a design concept and must not be treated as production evidence.");
  return { ...metadata, limitations };
}

export function diffPixels(left, right, threshold = 16) {
  if (!(left instanceof Uint8ClampedArray) || !(right instanceof Uint8ClampedArray) || left.length !== right.length || left.length % 4 !== 0) throw new Error("pixel buffers must be equal RGBA arrays");
  const cutoff = Math.max(0, Math.min(255, Number(threshold) || 0));
  const pixels = new Uint8ClampedArray(left.length);
  let changedPixels = 0;
  for (let offset = 0; offset < left.length; offset += 4) {
    const distance = Math.max(Math.abs(left[offset] - right[offset]), Math.abs(left[offset + 1] - right[offset + 1]), Math.abs(left[offset + 2] - right[offset + 2]), Math.abs(left[offset + 3] - right[offset + 3]));
    const changed = distance > cutoff;
    if (changed) changedPixels += 1;
    const luminance = Math.round((left[offset] + left[offset + 1] + left[offset + 2]) / 3 * 0.35);
    pixels[offset] = changed ? 242 : luminance;
    pixels[offset + 1] = changed ? 90 : luminance;
    pixels[offset + 2] = changed ? 90 : luminance;
    pixels[offset + 3] = 255;
  }
  return { pixels, changedPixels, totalPixels: left.length / 4, threshold: cutoff, ratio: changedPixels / (left.length / 4) };
}

export function comparisonFileStem(left, right, mode = "side-by-side") {
  const token = (value) => String(value ?? "default").toLowerCase().replaceAll(/[^a-z0-9_-]+/g, "-").replaceAll(/^-+|-+$/g, "");
  return ["compare", left.project, left.screen, left.fixture, left.state, left.locale, left.variant || "default", mode, `${left.kind}-vs-${right.kind}`].map(token).join("__");
}

export function comparisonMetadata(left, right, mode, result = {}) {
  return {
    schema: CAPTURE_SCHEMA,
    version: CAPTURE_VERSION,
    kind: "comparison",
    project: left.project,
    screen: left.screen,
    fixture: left.fixture,
    state: left.state,
    locale: left.locale,
    variant: left.variant ?? null,
    logicalSize: { ...left.logicalSize },
    pixelSize: { ...left.pixelSize },
    guiScale: left.guiScale,
    image: `${comparisonFileStem(left, right, mode)}.png`,
    mode,
    sources: [{ kind: left.kind, image: left.image }, { kind: right.kind, image: right.image }],
    difference: mode === "difference" ? { threshold: result.threshold, changedPixels: result.changedPixels, totalPixels: result.totalPixels, ratio: result.ratio } : null,
    interpretation: "Visual evidence only. Pixel differences require reviewer judgment and are not automatically product defects.",
  };
}
