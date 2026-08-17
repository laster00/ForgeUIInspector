#!/usr/bin/env python3
"""Create and validate deterministic ForgeUIInspector project fixtures."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


ID_PATTERN = re.compile(r"^[a-z0-9][a-z0-9_-]*$")
FIXTURE_SCHEMA = "forge-ui-inspector.fixture"
PROJECT_SCHEMA = "forge-ui-inspector.project"
PAGE_SIZE = 54


def fail(message: str) -> None:
    raise ValueError(message)


def check_id(value: str, label: str) -> str:
    if not ID_PATTERN.fullmatch(value):
        fail(f"{label} must match {ID_PATTERN.pattern}: {value!r}")
    return value


def read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        fail(f"missing JSON: {path}")
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON {path}: {exc}")
    if not isinstance(value, dict):
        fail(f"JSON root must be an object: {path}")
    return value


def write_json(path: Path, value: dict[str, Any], force: bool) -> None:
    if path.exists() and not force:
        fail(f"refusing to overwrite {path}; pass --force to regenerate")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def item(index: int, layout: str = "all") -> dict[str, Any]:
    icons = ("paper", "orb", "unknown-icon")
    return {
        "slot": index % PAGE_SIZE,
        "page": index // PAGE_SIZE,
        "icon": icons[index % len(icons)],
        "count": (index % 32) + 1,
        "layout": layout,
        "label": f"Fixture item {index + 1}",
    }


def make_fixture(fixture_id: str, count: int) -> dict[str, Any]:
    layout = "other" if fixture_id == "other" else "all"
    items = [item(index, layout) for index in range(count)]
    return {
        "id": fixture_id,
        "titleKey": f"screen.generated.{fixture_id}",
        "layouts": [
            {"id": "all", "labelKey": "screen.forgeuiinspector.all", "count": count if layout == "all" else 0},
            {"id": "other", "labelKey": "screen.forgeuiinspector.other", "count": count if layout == "other" else 0},
        ],
        "itemCount": count,
        "items": items,
    }


def generate(args: argparse.Namespace) -> int:
    project_id = check_id(args.project_id, "project id")
    screen_id = check_id(args.screen_id, "screen id")
    output = Path(args.output)
    project = {
        "schema": PROJECT_SCHEMA,
        "version": 1,
        "id": project_id,
        "labelKey": args.project_label_key,
        "defaultScreen": screen_id,
        "screens": [{
            "id": screen_id,
            "labelKey": args.screen_label_key,
            "renderer": args.renderer,
            "logicalSize": {"width": args.width, "height": args.height},
            "fixturePath": f"fixtures/{screen_id}.json",
        }],
    }
    fixture = {
        "schema": FIXTURE_SCHEMA,
        "version": 1,
        "project": project_id,
        "screen": screen_id,
        "renderer": args.renderer,
        "pageSize": PAGE_SIZE,
        "fixtures": [
            make_fixture("normal", 18),
            make_fixture("empty", 0),
            make_fixture("many", 108),
            make_fixture("other", 6),
        ],
    }
    write_json(output / "project.json", project, args.force)
    write_json(output / "fixtures" / f"{screen_id}.json", fixture, args.force)
    print(f"created {output / 'project.json'}")
    print(f"created {output / 'fixtures' / f'{screen_id}.json'}")
    print("add this project to emulator/projects/index.json")
    return 0


def validate_fixture(data: dict[str, Any], path: Path, project_id: str, screen_id: str) -> None:
    if data.get("schema") != FIXTURE_SCHEMA or data.get("version") != 1:
        fail(f"invalid fixture schema/version: {path}")
    if data.get("project") != project_id or data.get("screen") != screen_id:
        fail(f"fixture project/screen mismatch: {path}")
    if data.get("pageSize") != PAGE_SIZE:
        fail(f"pageSize must be {PAGE_SIZE}: {path}")
    fixtures = data.get("fixtures")
    if not isinstance(fixtures, list) or not fixtures:
        fail(f"fixtures must be a non-empty array: {path}")
    fixture_ids: set[str] = set()
    for fixture in fixtures:
        if not isinstance(fixture, dict):
            fail(f"fixture entry must be an object: {path}")
        fixture_id = check_id(str(fixture.get("id", "")), "fixture id")
        if fixture_id in fixture_ids:
            fail(f"duplicate fixture id {fixture_id}: {path}")
        fixture_ids.add(fixture_id)
        layouts = fixture.get("layouts")
        if not isinstance(layouts, list) or not layouts:
            fail(f"fixture layouts must be a non-empty array: {path}")
        layout_ids: set[str] = set()
        for layout in layouts:
            layout_id = check_id(str(layout.get("id", "")), "layout id")
            if layout_id in layout_ids:
                fail(f"duplicate layout id {layout_id}: {path}")
            layout_ids.add(layout_id)
            if not isinstance(layout.get("count", 0), int) or layout.get("count", 0) < 0:
                fail(f"layout count must be non-negative: {path}")
        items = fixture.get("items", [])
        if not isinstance(items, list):
            fail(f"fixture items must be an array: {path}")
        for entry in items:
            if not isinstance(entry, dict) or not isinstance(entry.get("slot"), int) or not 0 <= entry["slot"] < PAGE_SIZE:
                fail(f"item slot out of range: {path}")
            if "count" in entry and (not isinstance(entry["count"], (int, float)) or entry["count"] < 0):
                fail(f"item count must be non-negative: {path}")
        if not isinstance(fixture.get("itemCount", 0), int) or fixture.get("itemCount", 0) < 0:
            fail(f"itemCount must be non-negative: {path}")
    for required in ("normal", "empty", "many", "other"):
        if required not in fixture_ids:
            fail(f"missing required fixture {required}: {path}")
    many = next(entry for entry in fixtures if entry["id"] == "many")
    many_count = many.get("itemCount", len(many.get("items", [])))
    if many_count < 55:
        fail(f"many fixture must contain at least 55 items: {path}")


def validate_project(path: Path) -> int:
    root = path
    manifest_path = root / "project.json"
    manifest = read_json(manifest_path)
    if manifest.get("schema") != PROJECT_SCHEMA or manifest.get("version") != 1:
        fail(f"invalid project schema/version: {manifest_path}")
    project_id = check_id(str(manifest.get("id", "")), "project id")
    screens = manifest.get("screens")
    if not isinstance(screens, list) or not screens:
        fail(f"project screens must be a non-empty array: {manifest_path}")
    screen_ids: set[str] = set()
    for screen in screens:
        if not isinstance(screen, dict):
            fail(f"screen entry must be an object: {manifest_path}")
        screen_id = check_id(str(screen.get("id", "")), "screen id")
        if screen_id in screen_ids:
            fail(f"duplicate screen id {screen_id}: {manifest_path}")
        screen_ids.add(screen_id)
        size = screen.get("logicalSize", {})
        if not isinstance(size.get("width"), (int, float)) or not isinstance(size.get("height"), (int, float)) or size["width"] <= 0 or size["height"] <= 0:
            fail(f"screen logicalSize must be positive: {manifest_path}")
        fixture_path = root / str(screen.get("fixturePath", ""))
        validate_fixture(read_json(fixture_path), fixture_path, project_id, screen_id)
    if manifest.get("defaultScreen") not in screen_ids:
        fail(f"defaultScreen must reference a screen: {manifest_path}")
    print(f"validated {manifest_path} ({len(screen_ids)} screen(s))")
    return 0


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__)
    commands = root.add_subparsers(dest="command", required=True)
    init = commands.add_parser("init", help="create a project manifest and fixture")
    init.add_argument("--project-id", required=True)
    init.add_argument("--project-label-key", required=True)
    init.add_argument("--screen-id", required=True)
    init.add_argument("--screen-label-key", required=True)
    init.add_argument("--renderer", default="generic")
    init.add_argument("--width", type=int, default=320)
    init.add_argument("--height", type=int, default=230)
    init.add_argument("--output", required=True)
    init.add_argument("--force", action="store_true")
    validate = commands.add_parser("validate", help="validate a generated project directory")
    validate.add_argument("path")
    return root


def main() -> int:
    args = parser().parse_args()
    try:
        return generate(args) if args.command == "init" else validate_project(Path(args.path))
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
