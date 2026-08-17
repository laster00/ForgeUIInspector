# CTE2 UI tokens and geometry

Use these values for both the Forge screens and the browser emulator. Java uses opaque ARGB integers; CSS uses the equivalent hex values.

| Token | Value | Use |
| --- | --- | --- |
| background | `#20242B` | full screen surface |
| panel | `#151E28` | list, stash, and detail panels |
| panel-alt | `#1D2936` | selected header/status strip |
| border | `#38536A` | panel outlines and separators |
| slot-outer | `#8B8B8B` | 18px slot outer edge |
| slot-inner | `#373737` | slot inset |
| text | `#E7EDF3` | primary labels and item names |
| muted | `#AAC3D8` | counts, captions, secondary text |
| selected | `#F0B45B` | selected row, active action, title accent |
| success | `#78D39A` | ready/connected/valid |
| error | `#E27A7A` | invalid/missing/disconnected |
| info | `#9FC4E1` | informational detail |

## Layout rules

- Use an 18x18 logical slot and 8px as the base gap where the screen is not constrained by the vanilla menu slot coordinates.
- Keep Map Stash and Currency Stash at 360x248 logical pixels. Their stash grid is 9x6 at `(178,24)`, player inventory at `(178,150)`, and hotbar at `(178,208)`.
- Keep the browser preview at 320x230 logical pixels. Scale the complete preview instead of selectively shrinking text or slots.
- Put the title at the upper-left, keep the selected category/layout summary in the same horizontal band, and place the player inventory below the stash grid.
- Use one scrollable list on the left. A selected row gets a selected-color edge/background; counts remain muted.
- Show page controls only when more than one page exists. Page changes and category/layout changes remain server-authoritative.
- Clip long Japanese labels by pixel width, reserving space for the count. Never wrap or let a label overlap a slot or control.

## Screen-specific guidance

- Map Stash and Currency Stash are compact storage screens: no search field, detail pane, tier field, rarity field, or extra action buttons.
- Master Stash may retain its search, tabs, and storage status because those are existing functions, but use the shared palette and slot treatment.
- Profession Workshop may retain its filters and recipe detail pane; use shared semantic colors for recipe states and keep item tooltips vanilla.
- Advanced Salvage is a read-only preset/diagnostic screen. Keep the two-panel composition, use the shared header/panel tokens, and leave authoring in the Wiki.

## Font and verification

- Forge always uses the active Minecraft `Font` instance and `plainSubstrByWidth` for clipping.
- The emulator uses the local deterministic stack beginning with `Minecraft`, followed by installed fallback fonts. Never fetch a font from the network.
- Check `?screen=map_stash&fixture=normal&locale=ja&scale=2` and `?screen=currency_stash&fixture=many&locale=ja&page=1&scale=3` before building.
