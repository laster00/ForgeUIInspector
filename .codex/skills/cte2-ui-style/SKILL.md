---
name: cte2-ui-style
description: Apply and verify the shared Craft to Exile 2 Minecraft UI language across Forge screens and the ForgeUIInspector browser emulator. Use when adding, restyling, or reviewing Map Stash, Currency Stash, Master Stash, Profession Workshop, Advanced Salvage, or related CTE2 UI surfaces.
---

# CTE2 UI style

Keep the in-game Forge screens and the deterministic browser emulator visually consistent without changing menu authority, storage semantics, or network protocols. Use the shared Java theme class and the emulator CSS tokens as the single visual source of truth.

## Workflow

1. Read [ui-style-tokens.md](references/ui-style-tokens.md) before editing. Confirm the screen's logical size, slot coordinates, and text-width budget.
2. For Minecraft code, use `cte2-ja-patch/addon/cte2-talent-description-search/src/main/java/jp/cte2/client/ui/Cte2UiTheme.java`. Reference its constants and drawing helpers instead of introducing literal palette values in a screen.
3. For the emulator, use `ForgeUIInspector/emulator/emulator.css` variables and `UI_THEME` in `emulator.js`. Keep the Minecraft preview at 320x230 logical pixels and scale it for the requested viewport.
4. Preserve vanilla Minecraft font rendering in Forge. The browser may use the deterministic fallback stack; do not add a remote font or CDN dependency.
5. Keep labels single-line. Clip by measured pixel width before appending counts or status text. Do not allow Japanese text to overlap slots, buttons, or adjacent panels.
6. Keep interaction states understandable with the same semantic colors: selected, success, error, and muted. Do not encode state with color alone when a label is available.
7. Verify with the browser contract tests, Forge Java tests, and a build. When a visual change is significant, use `tools/minecraft-ui/capture.ps1` at GUI scale 2 and 3 for the last real-font/item-rendering check.

## Boundaries

- Do not change server-side classification, revision, session, NBT, or inventory logic merely to restyle a screen.
- Do not add search, detail panels, tier fields, or action buttons to Map Stash or Currency Stash unless the feature specification explicitly changes.
- Do not depend on Minecraft startup for daily layout work; use the emulator first and reserve the real client for final font/item rendering.
- Preserve unrelated worktree changes and do not copy the emulator into a modpack.

## Validation

Run from `ForgeUIInspector`:

- `node --test tests/emulator_contract.test.mjs tests/ui_style_contract.test.mjs`
- `git diff --check`

Run from the Forge addon directory with Java 17:

- `.\gradlew.bat test`
- `.\gradlew.bat build`

Only report a visual task complete after checking both the 960x540 / GUI-2 and 1280x720 / GUI-3 emulator states when those states are in scope.
