#!/usr/bin/env python3
"""Export or verify the checked-in CTE2 stash geometry contract."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


SCHEMA = "forge-ui-inspector.cte2-stash-contract"
LAYOUT_PATH = Path("src/main/java/io/github/laster00/mnsutilities/client/ui/MnsStashLayout.java")
THEME_PATH = Path("src/main/java/io/github/laster00/mnsutilities/client/ui/MnsUiTheme.java")


def read_source(root: Path, relative: Path) -> str:
    path = root / relative
    if not path.is_file():
        raise ValueError(f"production source unavailable: {path}; use the checked-in contract or pass --source-root")
    return path.read_text(encoding="utf-8")


def int_value(name: str, layout: str, theme: str) -> int:
    for source in (layout, theme):
        match = re.search(rf"(?:int|final int)\s+{re.escape(name)}\s*=\s*(\d+)", source)
        if match:
            return int(match.group(1))
    raise ValueError(f"missing production integer constant: {name}")


def coordinate_offset(expression: str, axis: str, slot_size: int) -> int:
    compact = re.sub(r"\s+", "", expression)
    match = re.fullmatch(rf"{axis}(?:\+(SLOT_SIZE|\d+)(?:-(\d+))?)?", compact)
    if not match:
        raise ValueError(f"unsupported production slot() coordinate: {expression.strip()}")
    base = slot_size if match.group(1) == "SLOT_SIZE" else int(match.group(1) or 0)
    return base - int(match.group(2) or 0)


def slot_rendering(theme: str, slot_size: int) -> dict[str, list[int]]:
    method = re.search(
        r"public\s+static\s+void\s+slot\s*\([^)]*\)\s*\{(?P<body>.*?)\n\s*\}",
        theme,
        re.DOTALL,
    )
    if not method:
        raise ValueError("missing production slot() method")
    fills = re.findall(
        r"graphics\.fill\(\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*(SLOT_[A-Z]+)\s*\);",
        method.group("body"),
    )
    expected = [
        ("outer", "SLOT_OUTER"),
        ("inner", "SLOT_INNER"),
        ("highlightTop", "SLOT_HIGHLIGHT"),
        ("highlightLeft", "SLOT_HIGHLIGHT"),
        ("shadowBottom", "SLOT_SHADOW"),
        ("shadowRight", "SLOT_SHADOW"),
    ]
    if len(fills) != len(expected) or [fill[4] for fill in fills] != [color for _, color in expected]:
        raise ValueError("production slot() must contain outer, inner, two highlight, and two shadow fills")
    return {
        name: [
            coordinate_offset(fill[0], "x", slot_size),
            coordinate_offset(fill[1], "y", slot_size),
            coordinate_offset(fill[2], "x", slot_size),
            coordinate_offset(fill[3], "y", slot_size),
        ]
        for (name, _), fill in zip(expected, fills)
    }


def build_contract(source_root: Path) -> dict[str, Any]:
    layout = read_source(source_root, LAYOUT_PATH)
    theme = read_source(source_root, THEME_PATH)
    value = lambda name: int_value(name, layout, theme)
    slot_size = value("SLOT_SIZE")
    rendering = slot_rendering(theme, slot_size)
    columns = value("STASH_COLUMNS")
    rows = value("STASH_ROWS")
    return {
        "schema": SCHEMA,
        "version": 1,
        "sources": {"layout": LAYOUT_PATH.as_posix(), "theme": THEME_PATH.as_posix()},
        "logicalSize": {"width": value("WIDTH"), "height": value("HEIGHT")},
        "geometry": {
            "list": {"x": value("LIST_X"), "y": value("LIST_Y"), "width": value("LIST_WIDTH"), "rowHeight": value("LIST_ROW_HEIGHT"), "rows": value("LIST_ROWS")},
            "stash": {"x": value("STASH_X"), "y": value("STASH_Y"), "columns": columns, "rows": rows, "slot": slot_size},
            "inventory": {"x": value("PLAYER_INVENTORY_X"), "y": value("PLAYER_INVENTORY_Y"), "columns": 9, "rows": 3},
            "hotbar": {"y": value("HOTBAR_Y"), "columns": 9, "rows": 1},
            "page": {"previousX": value("PAGE_PREVIOUS_X"), "nextX": value("PAGE_NEXT_X"), "buttonY": value("PAGE_BUTTON_Y"), "buttonWidth": value("PAGE_BUTTON_WIDTH"), "buttonHeight": value("PAGE_BUTTON_HEIGHT"), "labelX": value("PAGE_LABEL_X"), "labelY": value("PAGE_LABEL_Y")},
            "inventoryLabel": {"x": value("INVENTORY_LABEL_X"), "y": value("INVENTORY_LABEL_Y")},
        },
        "grid": {"columns": columns, "rows": rows, "slots": columns * rows},
        "slotRendering": rendering,
    }


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    default_source = repo_root.parent / "MineAndSlashAddons"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-root", type=Path, default=default_source)
    parser.add_argument("--output", type=Path, default=repo_root / "emulator" / "contracts" / "cte2-stash.json")
    parser.add_argument("--check", action="store_true", help="fail instead of writing when the checked-in export differs")
    args = parser.parse_args()
    try:
        contract = build_contract(args.source_root)
        serialized = json.dumps(contract, ensure_ascii=False, indent=2) + "\n"
        if args.check:
            if not args.output.is_file() or args.output.read_text(encoding="utf-8") != serialized:
                raise ValueError(f"contract export is stale: {args.output}")
            print(f"verified {args.output}")
        else:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(serialized, encoding="utf-8")
            print(f"exported {args.output}")
        return 0
    except (OSError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
