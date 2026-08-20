export const CAPTURE_SCHEMA = "forge-ui-inspector.capture";
export const CAPTURE_VERSION = 1;
export const CAPTURE_KINDS = Object.freeze(["browser", "forge", "comparison"]);
export const COMPARISON_FIELDS = Object.freeze(["project", "screen", "fixture", "state", "locale", "variant", "alignment.status", "logicalSize.width", "logicalSize.height", "pixelSize.width", "pixelSize.height", "guiScale"]);

function valueAt(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

export function captureToken(value, fallback = "default") {
  const token = String(value ?? "").trim().toLowerCase().replaceAll(/[^a-z0-9_-]+/g, "-").replaceAll(/^-+|-+$/g, "");
  return token || fallback;
}

export function captureFileStem(metadata) {
  const size = metadata.logicalSize ?? {};
  const pixels = metadata.pixelSize ?? size;
  return [
    metadata.kind,
    metadata.project,
    metadata.screen,
    metadata.fixture,
    metadata.state,
    metadata.locale,
    metadata.variant || "default",
    `${Number(size.width) || 0}x${Number(size.height) || 0}`,
    `viewport${Number(pixels.width) || 0}x${Number(pixels.height) || 0}`,
    `scale${Number(metadata.guiScale) || 1}`,
  ].map((value) => captureToken(value)).join("__");
}

export function validateCaptureMetadata(metadata) {
  const errors = [];
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return { valid: false, errors: ["capture metadata must be an object"] };
  if (metadata.schema !== CAPTURE_SCHEMA) errors.push(`schema must be ${CAPTURE_SCHEMA}`);
  if (metadata.version !== CAPTURE_VERSION) errors.push(`version must be ${CAPTURE_VERSION}`);
  if (!CAPTURE_KINDS.includes(metadata.kind)) errors.push("kind must be browser, forge, or comparison");
  for (const field of ["project", "screen", "fixture", "state", "locale", "image"]) if (typeof metadata[field] !== "string" || metadata[field].length === 0) errors.push(`${field} must be a non-empty string`);
  for (const field of ["width", "height"]) if (!Number.isInteger(metadata.logicalSize?.[field]) || metadata.logicalSize[field] <= 0) errors.push(`logicalSize.${field} must be a positive integer`);
  for (const field of ["width", "height"]) if (!Number.isInteger(metadata.pixelSize?.[field]) || metadata.pixelSize[field] <= 0) errors.push(`pixelSize.${field} must be a positive integer`);
  if (!Number.isFinite(Number(metadata.guiScale)) || Number(metadata.guiScale) <= 0) errors.push("guiScale must be positive");
  if (metadata.variant !== null && metadata.variant !== undefined && typeof metadata.variant !== "string") errors.push("variant must be a string or null");
  return { valid: errors.length === 0, errors };
}

export function capturePairKey(metadata) {
  return [metadata.project, metadata.screen, metadata.fixture, metadata.state, metadata.locale, metadata.variant || "default", `${metadata.logicalSize?.width}x${metadata.logicalSize?.height}`, `scale${metadata.guiScale}`].map((value) => captureToken(value)).join(":");
}

export function compareCaptureMetadata(left, right, options = {}) {
  const leftValidation = validateCaptureMetadata(left);
  const rightValidation = validateCaptureMetadata(right);
  const errors = [...leftValidation.errors.map((error) => `left: ${error}`), ...rightValidation.errors.map((error) => `right: ${error}`)];
  const mismatches = [];
  for (const field of COMPARISON_FIELDS) {
    const leftValue = valueAt(left, field) ?? null;
    const rightValue = valueAt(right, field) ?? null;
    if (leftValue !== rightValue) mismatches.push({ field, left: leftValue, right: rightValue });
  }
  if (options.requireDifferentKinds && left.kind === right.kind) mismatches.push({ field: "kind", left: left.kind, right: right.kind, expected: "different capture kinds" });
  return { compatible: errors.length === 0 && mismatches.length === 0, errors, mismatches };
}

export function browserCaptureMetadata(entry) {
  const metadata = {
    schema: CAPTURE_SCHEMA,
    version: CAPTURE_VERSION,
    kind: "browser",
    project: entry.project,
    screen: entry.screen,
    fixture: entry.fixture,
    state: entry.state,
    locale: entry.locale,
    variant: entry.variant ?? null,
    alignment: entry.alignment ?? null,
    logicalSize: { width: entry.logicalSize.width, height: entry.logicalSize.height },
    pixelSize: { width: entry.pixelSize.width, height: entry.pixelSize.height },
    guiScale: Number(entry.guiScale) || 1,
    canonicalUrl: entry.canonicalUrl,
    image: entry.image,
    limitations: ["No matching Forge capture is attached to this browser artifact; browser-only review cannot prove Minecraft-specific rendering."],
  };
  return { ...metadata, pairKey: capturePairKey(metadata) };
}
