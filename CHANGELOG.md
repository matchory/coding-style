# Changelog

All three packages share one version number. Composer needs a semver-parseable tag at the repository
root, so prefixed tags like `php/v1.2.0` are not possible, which means a change touching only one
ecosystem still bumps the version the others see.

Each entry is therefore labelled with the ecosystems it affects, so a consumer can tell at a glance
whether a bump is a no-op for them:

- **PHP** — Pint, PHPStan, Rector
- **JS** — oxlint, oxfmt, ESLint, TypeScript
- **PY** — ruff
- **ALL** — the canonical `.editorconfig`, Renovate presets, the sync and verify commands

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versioning is
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) with one clarification: a change that makes
an existing codebase newly fail its linters is **major**, even when the tooling API is unchanged. A
preset that adds a rule reformats or re-flags files, and that is a breaking change for the consumer
even though nothing about the interface moved.

## [Unreleased]

### Added

- **ALL** `verify` command for all three ecosystems. Checks that a repository actually consumes the
  shared presets rather than merely depending on the package: that the Pint preset is passed via
  `--config`, that PHPStan auto-discovery is live, that the complexity thresholds which cannot be
  shipped from a package are declared locally, that Rector calls a preset, that the oxlint/oxfmt/ESLint
  configs import the presets or match a synced rc file, and that `[tool.ruff]` extends the copied
  preset. Findings are advisory unless `--strict`.
- **ALL** Renovate presets, extended by name the same way the style presets are:
  `github>matchory/coding-style`, plus `//renovate/php`, `//renovate/javascript` and
  `//renovate/python`. The org-wide default includes `//renovate/coding-style-consumer`, which
  collapses this package's three artefacts into one pull request instead of three. Requires
  Renovate 38 or newer for glob patterns in `matchPackageNames`.
- **PHP** CI coverage for `laravel.neon` against a real Laravel application with Larastan installed.
  It was previously the only preset verified by parsing alone, because its parameters are registered
  by Larastan and need a bootstrapped app. Both directions are asserted: the parameters reach the
  consumer, and removing the preset makes the suppressed `class.missingExtends` error reappear.
- **PHP** CI assertion that a Pest rule actually fires, since `pest()` degrades to a no-op when its
  provider is missing and would otherwise disable every Pest rule while still exiting 0.

### Changed

- **PHP** Pest rules now come from `pestphp/pest-plugin-rector` instead of the abandoned
  `mrpunyapal/rector-pest`. All eight vetted rules carry over. `PestSetList::CODING_STYLE` is not
  imported: it bundles 59 rules including chain-manipulating ones and one-shot Pest 2 → Pest 3
  migrations. Opt in locally if you want it.
- **PHP** Minimum PHP version raised to 8.5.
- **PHP** The `matchory-coding-style` logic moved from the executable into `php/src/Console/`, so
  PHPStan analyses it.

### Removed

- **PHP** `PEST_LARAVEL` coverage. The replacement package has no equivalent set. This is a real
  coverage loss with no workaround available.

## [0.1.0] — 2026-07-30

Initial release. Presets for Pint, PHPStan, Rector, oxlint, oxfmt, ESLint, TypeScript and ruff, plus
the canonical `.editorconfig` and the `sync` command for the three tools that cannot read
configuration out of a package.

[Unreleased]: https://github.com/matchory/coding-style/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/matchory/coding-style/releases/tag/v0.1.0
