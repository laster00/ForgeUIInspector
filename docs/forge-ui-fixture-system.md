# ForgeUIInspector project-scoped Fixture system

ForgeUIInspector is a reusable UI preview shell. The CTE2 screens are the default project, not a hard-coded requirement for every consumer.

## Directory layout

```text
emulator/
  projects/
    index.json
    <project-id>/
      project.json
      fixtures/<screen-id>.json
  fixtures/                    # legacy CTE2 paths kept for compatibility
```

`projects/index.json` registers projects. A project manifest registers screens, logical dimensions, a renderer name, and a fixture path relative to that manifest. The browser loads the selected project and fixture without changing the Forge preview classes.

The canonical CTE2 project lives at `emulator/projects/cte2/project.json`; its fixture files remain under `emulator/fixtures` so old links and tests continue to work.

## Adding a project

Use the bundled local skill and generator:

```text
python .codex/skills/forge-ui-fixture-generator/scripts/generate_fixture.py init \
  --project-id demo \
  --project-label-key project.demo.name \
  --screen-id inventory \
  --screen-label-key screen.demo.inventory \
  --renderer generic \
  --width 360 --height 240 \
  --output emulator/projects/demo
python .codex/skills/forge-ui-fixture-generator/scripts/generate_fixture.py validate emulator/projects/demo
```

Add the generated project to `emulator/projects/index.json`, add Japanese and English translation keys in `emulator/emulator.js`, then run `npm run test:all`. Use `--force` only for an intentional regeneration.

## Reproducible URLs and API

The existing CTE2 URL remains valid:

```text
index.html?screen=map_stash&fixture=many&locale=ja&page=1
```

Project-scoped URLs add the project id:

```text
index.html?project=demo&screen=inventory&fixture=many&locale=ja&page=1
```

`window.forgeUIInspector.getState()` includes `project` for non-CTE2 projects. `setState`, `reset`, and `getCanonicalUrl` continue to work; changing screen or project reloads the appropriate manifest so fixture data cannot silently cross projects.

## Renderer policy

`compact-stash`, `master-stash`, `profession-workshop`, and `advanced-salvage` preserve the existing CTE2 previews. Any unknown renderer is shown in a deterministic generic panel with a title, fixture label, item slots, and read-only status. This keeps new projects useful immediately while leaving room for a deliberately added renderer when a project needs distinctive interaction.

The Map/Currency screen contract uses a 12x8 (96-slot) grid at 474x326. The `master-stash` visual page keeps its existing 9x9 (81-slot) grid. URL `page` and `getSnapshot().fixture.pageSize` use the visual renderer size.
