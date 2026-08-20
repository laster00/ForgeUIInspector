---
name: forge-ui-fixture-generator
description: Generate, validate, and register deterministic project-scoped ForgeUIInspector fixtures for browser and Forge UI previews. Use when adding a project, screen fixture, sample state, or changing the fixture schema.
---

# ForgeUIInspector Fixture Generator

## Overview

Use this skill to add a screen without coupling its data to the existing CTE2 fixtures. A project owns its screen manifests and fixture documents; the browser emulator discovers projects from `emulator/projects/index.json`.

## Workflow

1. Read `references/fixture-schema.md` and `docs/forge-ui-fixture-system.md` before editing an existing fixture.
2. Choose a stable lowercase project id and screen id. Do not edit CTE2 fixture files for an unrelated project.
3. Generate a deterministic project and four baseline states:

```text
python .codex/skills/forge-ui-fixture-generator/scripts/generate_fixture.py init \
  --project-id demo \
  --project-label-key project.demo.name \
  --screen-id inventory \
  --screen-label-key screen.demo.inventory \
  --renderer generic \
  --width 360 --height 240 \
  --columns 9 --rows 6 \
  --output emulator/projects/demo
```

4. Add the project to `emulator/projects/index.json` and add locale keys to the emulator's project translations. Keep `fixturePath` relative to the project manifest.
5. Validate before running the UI:

```text
python .codex/skills/forge-ui-fixture-generator/scripts/generate_fixture.py validate emulator/projects/demo
npm run test:all
```

Use `--force` only when intentionally replacing generated files. The script never uses current time, random values, network access, or binary assets.

## Project rules

- A project manifest has `schema: "forge-ui-inspector.project"`, version `1`, an id, a default screen, and one or more screens.
- Every screen declares a `renderer`, logical size, label key, grid (`columns`, `rows`, and `slots = columns * rows`), and fixture path. Unknown renderers use the safe generic renderer.
- Every fixture document has `schema: "forge-ui-inspector.fixture"`, `project`, `screen`, `renderer`, a `pageSize` equal to its screen grid slots, and unique `normal`, `empty`, `many`, and `other` states.
- The generated `many` state contains exactly `pageSize + 1` items. Use `--columns 12 --rows 8` for a 96-slot screen or `--columns 9 --rows 9` for an 81-slot screen; omitted dimensions retain the generic 9x6 grid.
- Fixture values are display data only. Keep item identifiers, counts, layout ids, and slots deterministic; never put secrets, player data, or mutable runtime state in a fixture.
- Unknown icons and translation keys must remain safe: the emulator displays a fallback icon or key rather than failing.

## URL and review

Use `emulator/index.html?project=demo&screen=inventory&fixture=many&locale=ja&page=1` to reproduce a state. Check both Japanese and English, empty and two-page states, long labels, and a small viewport. Keep project-specific rendering in a separate renderer or extend the generic renderer deliberately; do not add CTE2-specific branches for every new project.

The bundled generator is stdlib-only. It is intentionally independent of Node.js, Gradle, Forge, external CDNs, and Minecraft startup.
