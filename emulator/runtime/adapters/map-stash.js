import { cloneItemStack, getItemStackKey, canMergeItemStacks } from "../item-stack.js";

export const MAP_STASH_CAPACITY = 768;
export const MAP_STASH_PAGE_SIZE = 96;
export const PLAYER_INVENTORY_SIZE = 36;

const EMPTY_ITEM = { itemId: "", count: 0, maxStackSize: 0, tag: null, components: null };
function normalizeSlot(value) { if (value == null) return null; const stack = cloneItemStack(value); return stack.itemId === EMPTY_ITEM.itemId && stack.count === 0 ? null : stack; }
function cloneSlots(slots, size) { if (slots !== undefined && (!Array.isArray(slots) || slots.length > size)) throw new RangeError("slot array exceeds capacity"); return Array.from({ length: size }, (_, i) => normalizeSlot(slots?.[i])); }
const codePointCompare = (left, right) => { const a = String(left); const b = String(right); const length = Math.min(a.length, b.length); for (let i = 0; i < length; i += 1) { const x = a.codePointAt(i); const y = b.codePointAt(i); if (x !== y) return x - y; } return a.length - b.length; };
const PRODUCTION_RARITIES = ["all", "common", "uncommon", "rare", "epic", "legendary", "mythic", "unique", "other"];
function classification(selector, stack) { if (!stack) return null; let value; try { value = selector(cloneItemStack(stack)); } catch { return null; } if (!value || value.accepted !== true || typeof value.layout !== "string" || typeof value.rarity !== "string") return null; return { accepted: true, layout: value.layout.trim(), rarity: value.rarity.trim().toLowerCase() }; }
function totals(slots) { const out = new Map(); for (const stack of slots) if (stack) { const key = getItemStackKey(stack); out.set(key, (out.get(key) ?? 0) + stack.count); } return out; }
function sameTotals(a, b) { if (a.size !== b.size) return false; for (const [key, count] of a) if (b.get(key) !== count) return false; return true; }
const cloneResult = value => structuredClone(value);

export function defaultMapClassification(stack) {
  const value = stack.components?.map_stash ?? stack.tag?.map_stash;
  return value && typeof value === "object" && typeof value.layout === "string" && typeof value.rarity === "string" ? { accepted: true, layout: value.layout, rarity: value.rarity } : { accepted: false };
}

export function createMapStashAdapter(options = {}) {
  const selector = options.selector ?? defaultMapClassification;
  if (typeof selector !== "function") throw new TypeError("selector must be a function");
  if (!Array.isArray(options.validLayouts) || options.validLayouts.length === 0 || options.validLayouts.some(value => typeof value !== "string") || new Set(options.validLayouts).size !== options.validLayouts.length || !options.validLayouts.includes("all")) throw new TypeError("validLayouts catalog is required");
  if (!Array.isArray(options.validRarities) || options.validRarities.length !== PRODUCTION_RARITIES.length || options.validRarities.some(value => typeof value !== "string") || new Set(options.validRarities).size !== options.validRarities.length || PRODUCTION_RARITIES.some(value => !options.validRarities.includes(value))) throw new TypeError("production rarity catalog is required");
  const validLayouts = new Set(options.validLayouts);
  const validRarities = new Set(options.validRarities);
  let physical = cloneSlots(options.storage?.slots ?? options.slots, MAP_STASH_CAPACITY);
  let player = cloneSlots(options.playerInventory, PLAYER_INVENTORY_SIZE);
  let carried = options.carried == null ? null : normalizeSlot(options.carried);
  let layout = options.layout ?? "all"; let rarity = options.rarity ?? "all"; let page = Number.isSafeInteger(options.page) && options.page >= 0 ? options.page : 0;
  const filterValid = (value, set, rarityValue = false) => typeof value === "string" && set.has(rarityValue ? value.trim().toLowerCase() : value);
  rarity = typeof rarity === "string" ? rarity.trim().toLowerCase() : rarity;
  if (!filterValid(layout, validLayouts) || !filterValid(rarity, validRarities, true)) throw new RangeError("unknown layout or rarity");
  function classify(stack) { try { const value = classification(selector, stack); return value && filterValid(value.layout, validLayouts) && filterValid(value.rarity, validRarities, true) ? value : null; } catch { return null; } }
  function selected(stack, selectedLayout = layout, selectedRarity = rarity) { const c = classify(stack); return c !== null && (selectedLayout === "all" || c.layout === selectedLayout) && (selectedRarity === "all" || c.rarity === selectedRarity); }
  function matches() { return physical.flatMap((stack, index) => stack && selected(stack) ? [index] : []); }
  function pageCount() { return Math.max(1, Math.ceil(matches().length / MAP_STASH_PAGE_SIZE)); }
  function clampPage() { page = Math.min(Math.max(page, 0), pageCount() - 1); }
  function projection() {
    clampPage();
    const allMatches = matches();
    const ids = allMatches.slice(page * MAP_STASH_PAGE_SIZE, (page + 1) * MAP_STASH_PAGE_SIZE);
    const layoutCounts = Object.fromEntries([...validLayouts].map(layoutId => [layoutId, physical.reduce((count, stack) => count + (stack && selected(stack, layoutId, rarity) ? 1 : 0), 0)]));
    return { page, pageCount: Math.max(1, Math.ceil(allMatches.length / MAP_STASH_PAGE_SIZE)), matchCount: allMatches.length, layoutCounts, physicalIndices: [...ids], slots: ids.map(index => cloneItemStack(physical[index])) };
  }
  function snapshot() { clampPage(); return { capacity: MAP_STASH_CAPACITY, storage: cloneSlots(physical, MAP_STASH_CAPACITY), playerInventory: cloneSlots(player, PLAYER_INVENTORY_SIZE), carried: carried ? cloneItemStack(carried) : null, layout, rarity, page }; }
  function emptyPhysicalIndex() { return physical.findIndex(stack => stack === null); }
  function resolveDisplay(displayIndex, allowEmpty = false) { if (!Number.isSafeInteger(displayIndex) || displayIndex < 0 || displayIndex >= MAP_STASH_PAGE_SIZE) return -1; const ids = projection().physicalIndices; return ids[displayIndex] ?? (allowEmpty ? emptyPhysicalIndex() : -1); }
  function commit(before, nextPhysical, nextPlayer, nextCarried) { const beforeTotals = totals([...before.storage, ...before.playerInventory, before.carried].filter(Boolean)); const afterTotals = totals([...nextPhysical, ...nextPlayer, nextCarried].filter(Boolean)); if (!sameTotals(beforeTotals, afterTotals)) throw new Error("conservation failure"); physical = nextPhysical; player = nextPlayer; carried = nextCarried; }
  function result(accepted, reason, before, nextPhysical = physical, nextPlayer = player, nextCarried = carried, extra = {}) { if (accepted) commit(before, nextPhysical, nextPlayer, nextCarried); return cloneResult({ accepted, reason, carried: carried ? cloneItemStack(carried) : null, ...extra, snapshot: snapshot() }); }

  function click(target = {}, _ignoredCarried = undefined, requestedButton = 0) {
    const index = resolveDisplay(target.displayIndex, true); const before = snapshot(); const button = requestedButton ?? 0;
    if (![0, 1, 2].includes(button) || index < 0) return result(false, index < 0 ? "bounds" : "button", before);
    const nextPhysical = cloneSlots(physical, MAP_STASH_CAPACITY); let nextCarried = carried ? cloneItemStack(carried) : null; const slot = nextPhysical[index];
    if (button === 0) {
      if (!nextCarried && slot) { nextPhysical[index] = null; nextCarried = cloneItemStack(slot); }
      else if (nextCarried && !slot) { if (!selected(nextCarried)) return result(false, "filter", before); nextPhysical[index] = cloneItemStack(nextCarried); nextCarried = null; }
      else if (nextCarried && slot && canMergeItemStacks(nextCarried, slot)) { const amount = Math.min(nextCarried.count, slot.maxStackSize - slot.count); if (amount === 0) return result(false, "capacity", before); nextPhysical[index] = { ...slot, count: slot.count + amount }; nextCarried = amount === nextCarried.count ? null : { ...nextCarried, count: nextCarried.count - amount }; }
      else if (nextCarried && slot) { if (!selected(nextCarried)) return result(false, "filter", before); nextPhysical[index] = cloneItemStack(nextCarried); nextCarried = cloneItemStack(slot); }
      else return result(false, "empty", before);
    } else if (button === 1) {
      if (!nextCarried && slot) { const amount = Math.ceil(slot.count / 2); nextPhysical[index] = amount === slot.count ? null : { ...slot, count: slot.count - amount }; nextCarried = { ...slot, count: amount }; }
      else if (nextCarried && (!slot || canMergeItemStacks(nextCarried, slot))) { if (!selected(nextCarried) || (slot && slot.count >= slot.maxStackSize)) return result(false, slot ? "capacity" : "filter", before); nextPhysical[index] = slot ? { ...slot, count: slot.count + 1 } : { ...nextCarried, count: 1 }; nextCarried = nextCarried.count === 1 ? null : { ...nextCarried, count: nextCarried.count - 1 }; }
      else return result(false, "incompatible", before);
    } else return result(false, "unsupported", before);
    return result(true, "ok", before, nextPhysical, player, nextCarried);
  }

  function quickMove(direction, displayIndex) {
    const before = snapshot(); const nextPhysical = cloneSlots(physical, MAP_STASH_CAPACITY); const nextPlayer = cloneSlots(player, PLAYER_INVENTORY_SIZE);
    if (direction === "storage") {
      const index = resolveDisplay(displayIndex, false); if (index < 0) return result(false, "bounds", before); const source = nextPhysical[index]; let remaining = source.count;
      const order = [8, 7, 6, 5, 4, 3, 2, 1, 0, ...Array.from({ length: 27 }, (_, i) => 35 - i)];
      for (const target of order) if (nextPlayer[target] && canMergeItemStacks(nextPlayer[target], source)) { const amount = Math.min(remaining, source.maxStackSize - nextPlayer[target].count); if (amount) nextPlayer[target] = { ...nextPlayer[target], count: nextPlayer[target].count + amount }; remaining -= amount; }
      for (const target of order) if (!nextPlayer[target] && remaining) { const amount = Math.min(remaining, source.maxStackSize); nextPlayer[target] = { ...source, count: amount }; remaining -= amount; }
      if (remaining) return result(false, "capacity", before); nextPhysical[index] = null; return result(true, "ok", before, nextPhysical, nextPlayer, carried, { moved: source.count });
    }
    if (direction !== "player" || !Number.isSafeInteger(displayIndex) || displayIndex < 0 || displayIndex >= PLAYER_INVENTORY_SIZE || !nextPlayer[displayIndex]) return result(false, direction === "player" ? "bounds" : "direction", before);
    const source = nextPlayer[displayIndex]; if (!classify(source)) return result(false, "unclassified", before); const empty = nextPhysical.findIndex(stack => stack === null); if (empty < 0) return result(false, "capacity", before); nextPhysical[empty] = cloneItemStack(source); nextPlayer[displayIndex] = null; return result(true, "ok", before, nextPhysical, nextPlayer, carried, { moved: source.count, physicalIndex: empty });
  }

  function organize() {
    const before = snapshot(); const ids = physical.flatMap((stack, index) => stack && selected(stack) ? [index] : []); const records = ids.map(index => ({ index, stack: cloneItemStack(physical[index]), classification: classify(physical[index]) }));
    records.sort((a, b) => codePointCompare(a.classification.layout, b.classification.layout) || codePointCompare(a.classification.rarity, b.classification.rarity) || codePointCompare(a.stack.itemId, b.stack.itemId) || codePointCompare(getItemStackKey(a.stack), getItemStackKey(b.stack)) || a.index - b.index);
    const nextPhysical = cloneSlots(physical, MAP_STASH_CAPACITY); ids.forEach((index, position) => { nextPhysical[index] = cloneItemStack(records[position].stack); }); const changed = JSON.stringify(nextPhysical) !== JSON.stringify(physical); if (changed) commit(before, nextPhysical, player, carried); return cloneResult({ accepted: true, changed, reason: changed ? "ok" : "no_change", snapshot: snapshot() });
  }
  function setView(next = {}) { const rawLayout = next.layout ?? layout; const requestedLayout = typeof rawLayout === "string" && rawLayout.trim() === "" ? "all" : rawLayout; const requestedRarity = typeof (next.rarity ?? rarity) === "string" ? (next.rarity ?? rarity).trim().toLowerCase() : next.rarity ?? rarity; if (!filterValid(requestedLayout, validLayouts) || !filterValid(requestedRarity, validRarities, true) || (next.page !== undefined && (!Number.isSafeInteger(next.page) || next.page < 0))) return { accepted: false, reason: "filter", snapshot: snapshot() }; layout = requestedLayout; rarity = requestedRarity; if (next.page !== undefined) page = next.page; clampPage(); return cloneResult({ accepted: true, reason: "ok", projection: projection(), snapshot: snapshot() }); }
  function restore(input) { if (!input || input.capacity !== MAP_STASH_CAPACITY || !Array.isArray(input.storage) || input.storage.length !== MAP_STASH_CAPACITY || !Array.isArray(input.playerInventory) || input.playerInventory.length !== PLAYER_INVENTORY_SIZE || !Number.isSafeInteger(input.page) || input.page < 0 || !filterValid(input.layout, validLayouts) || !filterValid(input.rarity, validRarities, true)) throw new TypeError("invalid adapter snapshot"); const nextPhysical = cloneSlots(input.storage, MAP_STASH_CAPACITY); const nextPlayer = cloneSlots(input.playerInventory, PLAYER_INVENTORY_SIZE); const nextCarried = input.carried == null ? null : normalizeSlot(input.carried); const nextLayout = input.layout; const nextRarity = input.rarity.trim().toLowerCase(); const nextPage = input.page; physical = nextPhysical; player = nextPlayer; carried = nextCarried; layout = nextLayout; rarity = nextRarity; page = nextPage; clampPage(); return snapshot(); }
  return Object.freeze({ snapshot, restore, projection, setView, click, quickMove, organize, selector, resolvePhysicalIndex: target => resolveDisplay(target?.displayIndex ?? target, false) });
}
