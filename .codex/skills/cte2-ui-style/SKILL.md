---
name: cte2-ui-style
description: Applies and verifies the shared CTE2 UI language. Use when styling or auditing MineAndSlashAddons screens and ForgeUIInspector previews.
---

# CTE2 UI style and audit

Keep the in-game Forge screens and the deterministic browser emulator visually consistent without changing menu authority, storage semantics, or network protocols. Use the shared Java theme class and the emulator CSS tokens as the single visual source of truth.

## Audit mode

When reviewing an existing screen, check the production contract before styling: verify Japanese and English labels, normal/empty/many/other fixtures, and both GUI scale 2 (960x540) and GUI scale 3 (1280x720). Check slot bounds, pagination, long labels, and unavailable/unknown states in the canonical fixture schema. Use the emulator first, then `tools/minecraft-ui/capture.ps1` for the final real-font and item-rendering capture when the change is significant. Report contract failures separately from visual findings.

## Workflow

1. Read [ui-style-tokens.md](references/ui-style-tokens.md) before editing. Confirm the screen's logical size, slot coordinates, and text-width budget.
2. Check `MineAndSlashAddons/docs/migration-2.0.md` when a linked catalog contains historical IDs. Preserve current compatibility IDs, NBT keys, network channel names, and existing translation keys; change only user-facing labels unless a migration is explicitly designed.
3. For Minecraft code, use workspace-root-relative `MineAndSlashAddons/src/main/java/io/github/laster00/mnsutilities/client/ui/MnsUiTheme.java` and `MnsStashLayout.java`. Reference their constants and drawing helpers instead of introducing literal palette values in a screen.
4. For the emulator, use `ForgeUIInspector/emulator/emulator.css` variables and `UI_THEME` in `emulator.js`. Keep logical preview geometry contract/manifest driven (currently 474x326) and scale it for the requested viewport.
5. Preserve vanilla Minecraft font rendering in Forge. The browser may use the deterministic fallback stack; do not add a remote font or CDN dependency.
6. Keep labels single-line. Clip by measured pixel width before appending counts or status text. Do not allow Japanese text to overlap slots, buttons, or adjacent panels.
7. Keep interaction states understandable with the same semantic colors: selected, success, error, and muted. Do not encode state with color alone when a label is available.
8. Verify with the browser contract tests, Forge Java tests, and a build. When a visual change is significant, use `tools/minecraft-ui/capture.ps1` at GUI scale 2 and 3 for the last real-font/item-rendering check.

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
