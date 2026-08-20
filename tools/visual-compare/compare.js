import { comparePair, comparisonFileStem, comparisonMetadata, diffPixels } from "./compare-core.mjs";

const leftInput = document.getElementById("left-files");
const rightInput = document.getElementById("right-files");
const modeInput = document.getElementById("mode");
const opacityInput = document.getElementById("opacity");
const thresholdInput = document.getElementById("threshold");
const status = document.getElementById("status");
const canvas = document.getElementById("comparison");
const save = document.getElementById("save");
const context = canvas.getContext("2d", { willReadFrequently: true });
let last = null;

async function loadSide(fileList, label) {
  const files = [...fileList];
  const imageFile = files.find((file) => file.name.toLowerCase().endsWith(".png"));
  const imageStem = imageFile?.name.replace(/\.png$/i, "");
  const metadataFile = files.find((file) => file.name === `${imageStem}.json`) ?? files.find((file) => file.name.toLowerCase().endsWith(".json"));
  if (!imageFile || !metadataFile) throw new Error(`${label}: select one PNG and one JSON sidecar`);
  const metadata = JSON.parse(await metadataFile.text());
  const image = new Image();
  const url = URL.createObjectURL(imageFile);
  try {
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error(`${label}: PNG could not be decoded`)); image.src = url; });
  } finally { URL.revokeObjectURL(url); }
  if (image.width !== metadata.pixelSize?.width || image.height !== metadata.pixelSize?.height) throw new Error(`${label}: PNG ${image.width}x${image.height} does not match metadata pixelSize ${metadata.pixelSize?.width}x${metadata.pixelSize?.height}`);
  return { image, metadata };
}

function sourcePixels(image) {
  const scratch = document.createElement("canvas");
  scratch.width = image.width; scratch.height = image.height;
  const scratchContext = scratch.getContext("2d", { willReadFrequently: true });
  scratchContext.drawImage(image, 0, 0);
  return scratchContext.getImageData(0, 0, image.width, image.height);
}

async function render() {
  save.disabled = true; last = null;
  try {
    const [left, right] = await Promise.all([loadSide(leftInput.files, "left"), loadSide(rightInput.files, "right")]);
    const compatibility = comparePair(left.metadata, right.metadata);
    if (!compatibility.compatible) {
      const details = [...compatibility.errors, ...compatibility.mismatches.map((entry) => `${entry.field}: ${entry.left} != ${entry.right}`)];
      throw new Error(`Capture metadata is incompatible:\n${details.join("\n")}`);
    }
    if (left.image.width !== right.image.width || left.image.height !== right.image.height) throw new Error(`Pixel geometry mismatch: left ${left.image.width}x${left.image.height}, right ${right.image.width}x${right.image.height}. Capture both at the same viewport and GUI scale.`);
    const mode = modeInput.value;
    const width = left.image.width, height = left.image.height;
    let difference = null;
    if (mode === "side-by-side") {
      canvas.width = width * 2; canvas.height = height;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(left.image, 0, 0); context.drawImage(right.image, width, 0);
    } else if (mode === "overlay") {
      canvas.width = width; canvas.height = height;
      context.clearRect(0, 0, width, height); context.globalAlpha = 1; context.drawImage(left.image, 0, 0);
      context.globalAlpha = Number(opacityInput.value) / 100; context.drawImage(right.image, 0, 0); context.globalAlpha = 1;
    } else {
      const leftPixels = sourcePixels(left.image), rightPixels = sourcePixels(right.image);
      difference = diffPixels(leftPixels.data, rightPixels.data, Number(thresholdInput.value));
      canvas.width = width; canvas.height = height;
      context.putImageData(new ImageData(difference.pixels, width, height), 0, 0);
    }
    const notes = compatibility.limitations.length ? `\nLimitations:\n- ${compatibility.limitations.join("\n- ")}` : "";
    const metric = difference ? `\nHighlighted pixels: ${difference.changedPixels}/${difference.totalPixels} (${(difference.ratio * 100).toFixed(2)}%), threshold ${difference.threshold}.` : "";
    status.className = "status ok"; status.textContent = `Compatible: ${left.metadata.screen} / ${left.metadata.fixture} / ${left.metadata.locale}.\nPair: ${left.metadata.pairKey || "legacy metadata without pairKey"}.${metric}${notes}`;
    last = { left: left.metadata, right: right.metadata, mode, difference };
    save.disabled = false;
  } catch (error) { status.className = "status error"; status.textContent = error.message; }
}

function download(name, blob) {
  const link = document.createElement("a"); link.download = name; link.href = URL.createObjectURL(blob); link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 0);
}

document.getElementById("render").addEventListener("click", render);
opacityInput.addEventListener("input", () => { document.getElementById("opacity-value").textContent = `${opacityInput.value}%`; if (last?.mode === "overlay") render(); });
save.addEventListener("click", () => {
  if (!last) return;
  const stem = comparisonFileStem(last.left, last.right, last.mode);
  canvas.toBlob((blob) => { if (blob) download(`${stem}.png`, blob); }, "image/png");
  const metadata = comparisonMetadata(last.left, last.right, last.mode, last.difference ?? {});
  download(`${stem}.json`, new Blob([`${JSON.stringify(metadata, null, 2)}\n`], { type: "application/json" }));
});
