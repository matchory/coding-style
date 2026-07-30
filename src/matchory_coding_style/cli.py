"""Write the shared style configuration into a consuming repository.

ruff has no way to extend a config that lives inside an installed package. ``extend`` takes a
filesystem path, and the site-packages path for a wheel embeds the Python version, so it does not
survive a recreated virtualenv. EditorConfig is worse: it only ever resolves ``root = false`` by
walking up the directory tree.

So for Python the package is a *transport for files* rather than a config to inherit from. This
command copies the presets into ``.matchory/`` and leaves a one-line selector for ``pyproject.toml``
to point at:

    [tool.ruff]
    extend = ".matchory/ruff.toml"

Commit what it writes. Editors and CI then work without running anything, and the pre-commit hook
re-runs the command with ``--check`` to catch a stale copy.
"""

from __future__ import annotations

import argparse
import sys
from importlib import resources

# Moved out of importlib.abc in 3.12 and removed from it in 3.14; importlib.resources.abc exists
# from 3.11, which is this package's floor.
from importlib.resources.abc import Traversable
from pathlib import Path

PRESETS = ("base", "strict")

#: Files written into the project, as (path relative to the project root, contents).
SELECTOR_TEMPLATE = """\
# Written by `matchory-coding-style sync`. Do not edit.
#
# Edit the presets in github.com/matchory/coding-style and re-run the command. Local deviations
# belong in your own pyproject.toml, which wins over anything extended from here.
extend = "ruff/{preset}.toml"
"""


def _package_files() -> Traversable:
    return resources.files("matchory_coding_style")


def _sources(preset: str) -> dict[str, str]:
    """Map project-relative paths to the contents that should be at them."""
    package = _package_files()
    ruff = package / "ruff"

    sources = {
        ".editorconfig": (package / "data" / "editorconfig").read_text(encoding="utf-8"),
        ".matchory/ruff.toml": SELECTOR_TEMPLATE.format(preset=preset),
    }

    # Both presets are always copied: strict.toml extends base.toml by relative path, so shipping
    # only the selected one would leave a dangling reference.
    for name in PRESETS:
        sources[f".matchory/ruff/{name}.toml"] = (ruff / f"{name}.toml").read_text(
            encoding="utf-8"
        )

    return sources


def main(argv: list[str] | None = None) -> int:
    """Entry point for the ``matchory-coding-style`` console script."""
    parser = argparse.ArgumentParser(
        prog="matchory-coding-style",
        description="Write the shared Matchory style configuration into this repository.",
    )
    parser.add_argument("command", choices=["sync"], nargs="?", default="sync")
    parser.add_argument(
        "--preset",
        choices=PRESETS,
        default="base",
        help="Which ruff preset to select. 'base' is adoptable in an unconfigured repository; "
        "'strict' is the target once it is clean.",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Exit non-zero if a file is missing or out of date, without writing. Use in CI.",
    )
    parser.add_argument(
        "--project-root",
        type=Path,
        default=Path.cwd(),
        help="Directory to write into. Defaults to the current working directory.",
    )
    arguments = parser.parse_args(argv)

    stale: list[str] = []

    for relative, expected in _sources(arguments.preset).items():
        target = arguments.project_root / relative
        current = target.read_text(encoding="utf-8") if target.is_file() else None

        if current == expected:
            print(f"unchanged  {relative}")
            continue

        if arguments.check:
            stale.append(relative)
            continue

        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(expected, encoding="utf-8")
        print(f"{'created' if current is None else 'updated'}    {relative}")

    if stale:
        print(
            f"Out of date: {', '.join(stale)}\nRun `matchory-coding-style sync`",
            file=sys.stderr,
        )
        return 1

    if arguments.check:
        print("Style configuration is up to date")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
