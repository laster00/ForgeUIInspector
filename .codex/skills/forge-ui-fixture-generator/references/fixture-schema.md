# ForgeUIInspector Fixture schema

## Project index

`emulator/projects/index.json` is a small catalog:

```json
{
  "schema": "forge-ui-inspector.project-index",
  "version": 1,
  "defaultProject": "demo",
  "projects": [{ "id": "demo", "labelKey": "project.demo.name", "manifest": "demo/project.json" }]
}
```

The manifest path is relative to `emulator/projects/index.json`.

## Project manifest

```json
{
  "schema": "forge-ui-inspector.project",
  "version": 1,
  "id": "demo",
  "labelKey": "project.demo.name",
  "defaultScreen": "inventory",
  "screens": [{
    "id": "inventory",
    "labelKey": "screen.demo.inventory",
    "renderer": "generic",
    "logicalSize": { "width": 360, "height": 240 },
    "fixturePath": "fixtures/inventory.json"
  }]
}
```

Ids use lowercase letters, digits, `_`, and `-`. Screen ids are unique within a project. `fixturePath` is relative to the manifest. A renderer that is not known by the emulator is displayed by the generic safe renderer.

## Fixture document

Every screen fixture uses:

```json
{
  "schema": "forge-ui-inspector.fixture",
  "version": 1,
  "project": "demo",
  "screen": "inventory",
  "renderer": "generic",
  "pageSize": 54,
  "fixtures": [{
    "id": "normal",
    "titleKey": "screen.demo.normal",
    "layouts": [{ "id": "all", "labelKey": "screen.demo.all", "count": 18 }],
    "itemCount": 18,
    "items": [{ "slot": 0, "icon": "paper", "count": 1, "label": "Example" }]
  }]
}
```

Fixture ids and layout ids are unique. Counts are non-negative. Item slots are integers from `0` through `pageSize - 1`; `itemCount` may describe deterministic generated items when `items` is empty. Unknown icons and labels are safe fallbacks. Keep `pageSize` at `54` for compatibility with the standard preview grid.
