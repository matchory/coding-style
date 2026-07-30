# Changelog

All three packages share one version number. Composer needs a semver-parseable tag at the repository
root, so prefixed tags like `php/v1.2.0` are not possible, which means a change touching only one
ecosystem still bumps the version the others see.

Each entry is labelled with the ecosystems it affects, so a consumer can tell at a glance whether a
bump is a no-op for them:

- **PHP** — Pint, PHPStan, Rector
- **JS** — oxlint, oxfmt, ESLint, TypeScript
- **PY** — ruff
- **ALL** — the canonical `.editorconfig`, Renovate presets, the `sync` and `verify` commands

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versioning is
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) with one clarification: a change that makes
an existing codebase newly fail its linters is **major**, even when the tooling API is unchanged. A
preset that adds a rule reformats or re-flags files, and that is a breaking change for the consumer
even though nothing about the interface moved.

## [Unreleased]

Nothing yet.

## [0.1.0] — 2026-07-30

First release. Presets for Pint, PHPStan, Rector, oxlint, oxfmt, ESLint, TypeScript and ruff, plus the
canonical `.editorconfig`.

### Added

- **PHP** Pint presets: `base` (38 rules on the `per` preset) and `relaxed` (`base` minus the fourteen
  docblock-rewriting rules, as an adoption ramp). `relaxed` is generated from `base`, so the rules have
  one source.
- **PHP** PHPStan presets: `base` (applied automatically via `phpstan/extension-installer`), plus
  opt-in `pest`, `laravel`, `complexity` and `strict`.
- **PHP** Rector presets: `base`, `library`, `laravel` and `pest`, composable and idempotent. Framework
  rule sets apply only when their provider package is installed, so one preset works across Laravel
  applications, composer packages and plain scripts.
- **JS** oxlint presets: `base` (73 rules) and `vue`. Vue rules are split out so a repository without
  `.vue` files does not inherit a rule surface it cannot trigger.
- **JS** One canonical oxfmt configuration: four-space indentation, single quotes, 100 columns.
- **JS** ESLint presets `core` and `vue`, with the Tailwind stylesheet entry point as a parameter.
- **JS** TypeScript presets: `base`, `vue`, `node` and a composable `strict`.
- **PY** ruff presets: `base` (ten rule groups, sized to be adoptable in a repository with no
  configuration today) and `strict` (thirty more groups).
- **ALL** `sync`, for the three tools that cannot read configuration out of a package: Pint has no
  merge, ruff's `extend` needs a stable path, and EditorConfig only walks up the directory tree.
- **ALL** `verify`, which checks that a repository actually consumes the presets rather than merely
  depending on the package: that Pint is invoked with `--config`, that PHPStan auto-discovery is live,
  that the complexity thresholds which cannot be shipped are declared locally, that Rector calls a
  preset, that the JavaScript configs import the presets or match a synced rc file, and that
  `[tool.ruff]` extends the copied preset.
- **ALL** Renovate presets, extended by name like the style presets: `github>matchory/coding-style`
  plus `//renovate/php`, `//renovate/javascript` and `//renovate/python`. The base includes
  `//renovate/coding-style-consumer`, which collapses this package's three artefacts into one pull
  request instead of three. Requires Renovate 38 or newer.
- **ALL** A `.pre-commit-hooks.yaml` for Python consumers, pinning the sync check and the ruff binary
  together.

### Security

Publishing is hardened deliberately: this package is a dependency of every repository in three
ecosystems, so a malicious version would run in our CI and on developer machines.

- OIDC **trusted publishing** on both npm and PyPI. No long-lived registry credential exists in this
  repository.
- The npm package is published to **npmjs and GitHub Packages** from the same attested tarball. npm
  resolves registries per scope with no per-package override, and `@matchory/ui` is on GitHub Packages,
  so a repository consuming both has to point the whole scope at one registry. npmjs is canonical and
  carries the provenance statement.
- npm artefacts carry [provenance](https://docs.npmjs.com/generating-provenance-statements); PyPI
  artefacts carry [PEP 740](https://peps.python.org/pep-0740/) attestations. Both also get GitHub
  artefact attestations, verifiable with `gh attestation verify <file> --repo matchory/coding-style`.
- The publish path is gated on a `release` environment requiring human approval and restricted to `v*`
  tags, so an OIDC token cannot be minted from a branch or a pull request.
- A release requires a signed, annotated tag that is an ancestor of `main`, whose commit has a passing
  CI run, and whose version agrees with all three manifests.
- Artefacts are built once, attested, then verified by SHA-256 before upload, so a publish step cannot
  substitute different content for what was attested.
- Every GitHub Action is pinned to a full commit SHA, enforced by a job that fails on any unpinned
  `uses:`. Workflow permissions default to none, checkouts do not persist credentials, and release
  builds install with `--ignore-scripts`.
- CodeQL (JavaScript, Python, Actions), dependency review with a copyleft denylist, and a weekly
  OpenSSF Scorecard run.
- The Renovate base sets a five-day `minimumReleaseAge` cooldown. Most malicious releases are detected
  and yanked within hours, so a cooldown neutralises that class of attack without anyone needing to be
  watching at the right moment.

`SECURITY.md` documents the controls, the verification commands, and the known gaps — including that
Composer has no artefact provenance mechanism, so the PHP package's integrity rests on repository
protection and signed tags instead.

[Unreleased]: https://github.com/matchory/coding-style/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/matchory/coding-style/releases/tag/v0.1.0
