# matchory/coding-style

One source of truth for code style across every Matchory repository: Pint, PHPStan and Rector for
PHP; oxlint, oxfmt, ESLint and TypeScript for JavaScript; ruff for Python; and the canonical
`.editorconfig` shared by all three.

Edit configuration here. Never in a consumer.

## Why this exists

Configuration was copied between repositories and then drifted. A survey across our repositories in
July 2026 found, for the same organisation and the same conventions:

| Drift              | Detail                                                                          |
|--------------------|---------------------------------------------------------------------------------|
| JS formatting      | Two indentation widths and two quote styles across JavaScript repositories        |
| JS lint coverage   | One repository enforced ~73 oxlint rules; another shipped an empty rule set       |
| JS config format   | Some repositories used `oxlint.config.ts`, others `.oxlintrc.json`                |
| Python line length | Two different limits in active services                                          |
| Python rule sets   | One service selected ~46 ruff rule groups, another 8                             |
| Python coverage    | Several services had no ruff configuration at all                                |

None of this was anyone's fault. Copying a config file is the path of least resistance, and there was
nothing to copy *from* that stayed current.

## Extend or sync

Only half of these tools can read configuration out of a package. That distinction drives the whole
design, so it is worth stating plainly:

| Tool           | Mechanism                                                  | Extends?               |
|----------------|------------------------------------------------------------|------------------------|
| PHPStan        | `includes:` a vendor path, plus auto-discovery             | Yes, natively          |
| Rector         | A PHP call: `Preset::laravel(RectorConfig::configure())`    | Yes, natively          |
| ESLint         | Flat config `import`                                        | Yes, natively          |
| TypeScript     | `extends` a package path                                    | Yes, natively          |
| oxlint / oxfmt | Spread the exported object in a `.config.ts`                | Yes, when config is TS |
| **Pint**       | `--config vendor/…`; accepts `preset` and `rules` only      | **No merge**           |
| **ruff**       | `extend` takes a path, and site-packages paths are unstable | **No, copied**         |
| **EditorConfig** | `root = false` only walks up the directory tree           | **No, copied**         |

For the bottom three the package is a *transport for files*, refreshed by a sync command and
verified in CI. There is no way around it, and pretending otherwise is how configuration goes stale
without anyone noticing.

## Repository layout

Each ecosystem's location is forced by its packaging rules, which is why the tree looks asymmetric:

```
composer.json               PHP package. Composer has no `#subdirectory`, and Repman reads
                            composer.json from the repository root.
pyproject.toml              Python package. `pip install git+…` and pre-commit both expect
src/matchory_coding_style/   project metadata at the root.
.pre-commit-hooks.yaml
js/                         npm package. The only one that can live in a subdirectory, so it does.
php/                        Pint, PHPStan and Rector presets, plus the PSR-4 source.
.editorconfig               Canonical copy. Mirrored into the npm and Python packages by CI-verified
                            generators.
```

One consequence: all three packages share a single version tag. A change touching only oxlint still
bumps the version PHP consumers see. That is deliberate — "every repository is on style v3" is a
useful thing to be able to say — but expect Renovate noise and group the updates.

---

## PHP

```bash
composer require --dev matchory/coding-style
```

Requires PHP 8.5. The package requires Pint, PHPStan, Rector and
`tomasvotruba/cognitive-complexity`, so it owns those versions centrally. Install
`larastan/larastan`, `driftingly/rector-laravel` and `pestphp/pest-plugin-rector` alongside it for the
Laravel and Pest presets.

### Pint

Pint does not merge configuration: `--config` selects exactly one file. Point your `fmt` script at a
preset:

```json
{
    "scripts": {
        "fmt": "pint --config vendor/matchory/coding-style/php/pint/base.json --parallel --cache-file=./.cache/pint.json",
        "fmt:test": "@fmt --test",
        "fmt:pre-commit": "@fmt --dirty --repair"
    }
}
```

| Preset         | Contents                                                                       |
|----------------|--------------------------------------------------------------------------------|
| `base.json`    | 38 rules on top of the `per` preset. The target for every repository.           |
| `relaxed.json` | `base` minus the 14 docblock-rewriting rules. An adoption ramp, not a home.     |

`relaxed` exists because the docblock rules produce by far the largest diff when a repository first
adopts the shared style, and that diff is what stalls adoption. It is generated from `base.json` by
`php php/bin/generate-pint-presets.php`, so the rules have one source.

Because `--config` replaces rather than merges, a repository needing one local deviation has no
escape hatch. If that comes up, merge at invoke time instead of forking the preset:

```json
{
    "scripts": {
        "fmt:config": "@php -r \"file_put_contents('.cache/pint.merged.json', json_encode(array_replace_recursive(json_decode(file_get_contents('vendor/matchory/coding-style/php/pint/base.json'), true), file_exists('pint.json') ? json_decode(file_get_contents('pint.json'), true) : [])));\"",
        "fmt": ["@fmt:config", "pint --config .cache/pint.merged.json --parallel"]
    }
}
```

### PHPStan

`php/phpstan/base.neon` is applied **automatically** to every consumer: the package declares
`type: phpstan-extension` and `extra.phpstan.includes`, which `phpstan/extension-installer` discovers
on install. It carries only settings that are safe in any PHP codebase — editor URLs,
`treatPhpDocTypesAsCertain`, `reportUnmatchedIgnoredErrors`.

It deliberately does **not** set `level`, `paths` or `tmpDir`. A level applied invisibly from vendor
is a debugging trap, and a cache directory a consumer has not gitignored would start committing
analysis caches.

Everything else is opt-in:

```neon
includes:
    - vendor/matchory/coding-style/php/phpstan/laravel.neon
    - vendor/matchory/coding-style/php/phpstan/pest.neon
    - vendor/matchory/coding-style/php/phpstan/complexity.neon

parameters:
    level: 5
    paths:
        - app/
        - tests/

    # Must be declared here; see the merge-order note below.
    cognitive_complexity:
        class: 50
        function: 15
```

| Preset            | Contents                                                                     |
|-------------------|------------------------------------------------------------------------------|
| `base.neon`       | Auto-applied. Universal settings only.                                       |
| `pest.neon`       | The `TestCall`/`Expectation` ignores, `universalObjectCratesClasses`, stubs.  |
| `laravel.neon`    | `disableMigrationScan`/`disableSchemaScan`, the `HasEvents` ignore.           |
| `complexity.neon` | Complexity exemptions for `*/tests/*` and `*/migrations/*`.                   |
| `strict.neon`     | `level: 9` and `treatPhpDocTypesAsCertain: true`.                            |

Three caveats, all verified against a real consumer rather than assumed:

- **A package can only set a parameter that no other auto-discovered extension sets.** PHPStan merges
  extension configs after every `includes:` but before the root config's own `parameters`, so the
  extension that sorts last wins and only your own `phpstan.neon` beats all of them. This is why the
  complexity thresholds are documented rather than shipped: `tomasvotruba/cognitive-complexity`
  declares its own defaults and sorts after `matchory/coding-style`, so any value this package set
  would be silently discarded. Check with `phpstan dump-parameters`.
- `ignoreErrors` from an include is **appended**, never replaced. There is no way to un-ignore
  locally, which is why the shared entries are limited to things that are safe unconditionally. This
  is also why the preset files can carry ignores but not thresholds.
- `level` in `strict.neon` only applies if your own `phpstan.neon` does not set one. A local
  `level: 5` silently wins.

Stays local: your `paths`, `excludePaths`, baseline, complexity thresholds, and any ignore that names
a specific file.

### Rector

```php
<?php

declare(strict_types=1);

use Matchory\CodingStyle\Rector\Preset;
use Rector\Config\RectorConfig;

return Preset::laravel(RectorConfig::configure())
    ->withPaths([__DIR__ . '/app', __DIR__ . '/tests'])
    ->withCache(cacheDirectory: __DIR__ . '/.cache/rector/run')
    ->withSkip([
        // File-specific skips stay here; they do not generalise.
        SomeRector::class => [__DIR__ . '/app/Legacy'],
    ]);
```

| Preset      | Contents                                                              |
|-------------|-----------------------------------------------------------------------|
| `base()`    | PHP version sets (read from your `composer.json`), prepared sets, import handling, universal skips. |
| `library()` | `base()` plus PHPUnit and, when installed, Pest. For composer packages. |
| `laravel()` | `library()` plus the Laravel sets and Laravel-specific skips.           |
| `pest()`    | The Pest rules alone. Applied by the two above.                        |

`withPaths()`, `withSkip()`, `withRules()` and `withSets()` all merge, so anything you call after a
preset adds to it. Framework sets are applied only when the package providing them is installed, so
the same preset works in a Laravel application and a plain script; a missing provider downgrades the
preset rather than failing it.

Applying a preset twice is a no-op. `withPhpSets()` throws on a second call, and because the presets
build on one another, `Preset::laravel(Preset::base($config))` would otherwise reach `base()` twice
and fatal.

The Pest rules come from `pestphp/pest-plugin-rector`. Its `PestSetList::CODING_STYLE` is **not**
imported: the set bundles 59 rules, including chain-manipulating ones (`ChainExpectCallsRector`,
`EnsureTypeChecksFirstRector`) of the kind that corrupted chained expectations under the abandoned
package this replaced, plus one-shot Pest 2 → Pest 3 migration rules that should not run on every
pass. Eight individually vetted rules are enabled instead. Opt into the full set locally if you want
it, and read the diff:

```php
return Preset::laravel(RectorConfig::configure())
    ->withSets([\Pest\Rector\Set\PestSetList::CODING_STYLE]);
```

### `.editorconfig` and wiring checks

```bash
vendor/bin/matchory-coding-style sync            # write .editorconfig
vendor/bin/matchory-coding-style sync --check    # CI
vendor/bin/matchory-coding-style verify          # is this project actually wired up?
vendor/bin/matchory-coding-style verify --strict # treat warnings as failures
```

`verify` exists because depending on the package is not the same as using it. It checks that a
composer script passes a Pint preset via `--config`, that extension-installer really picked up
`base.neon`, that `cognitive_complexity` is declared locally (the one parameter that cannot be
shipped), and that `rector.php` calls a preset. Warnings cover things that legitimately vary per
repository, like not using Rector at all.

---

## JavaScript / TypeScript

```bash
pnpm add -D @matchory/coding-style
```

Published to GitHub Packages. Consumers need `@matchory:registry=https://npm.pkg.github.com` in
`.npmrc`, same as `@matchory/ui`.

ESLint plugins are regular `dependencies` so their versions are pinned centrally — that is the point
of the package. The tools themselves (`eslint`, `oxlint`, `oxfmt`, `typescript`) are optional peer
dependencies, so a repository that only wants formatting is not forced to install ESLint. The
tradeoff is that a non-Vue repository still pulls the Vue plugins; if that becomes a real cost, move
them to optional peers.

```ts
// oxfmt.config.ts
import { oxfmtBase } from '@matchory/coding-style/oxfmt';

export default {
    ...oxfmtBase,
    ignorePatterns: [...oxfmtBase.ignorePatterns, 'storage/**'],
};
```

```ts
// oxlint.config.ts — use /oxlint for TS-only packages
import { oxlintVue } from '@matchory/coding-style/oxlint/vue';

export default { ...oxlintVue, ignorePatterns: ['dist', '.cache'] };
```

```js
// eslint.config.js
import { withVue } from '@matchory/coding-style/eslint/vue';
import { resolve } from 'node:path';

export default withVue(
    { tailwindEntryPoint: resolve(import.meta.dirname, 'src/style.css') },
    [{ files: ['**/*.spec.ts'], rules: { 'id-length': 'off' } }],
);
```

```jsonc
// tsconfig.json
{ "extends": "@matchory/coding-style/tsconfig/vue.json" }
```

| Export                    | Use for                                                        |
|---------------------------|----------------------------------------------------------------|
| `./oxfmt`                 | Everything. Canonical formatting: 4-space, single quotes, 100 columns. |
| `./oxlint`                | TS/JS packages. 73 rules, no Vue plugin.                       |
| `./oxlint/vue`            | Packages containing `.vue` files.                              |
| `./eslint`                | TS/JS packages: `core`, `withCore()`.                          |
| `./eslint/vue`            | Vue packages: `vue()`, `withVue()`, `vueConfigs()`.            |
| `./tsconfig/base.json`    | Plain TypeScript.                                              |
| `./tsconfig/vue.json`     | Vue applications and component libraries.                      |
| `./tsconfig/node.json`    | CLIs, GitHub Actions, build scripts. No DOM libs.              |
| `./tsconfig/strict.json`  | Extra strictness, composed after a base. Opt in per repository. |

Tailwind class ordering is owned by `eslint-plugin-better-tailwindcss`, not oxfmt's sorter: the
plugin is theme-aware through its stylesheet entry point and additionally reports unknown classes.
Pass `tailwindEntryPoint` or the Tailwind rules are skipped entirely.

### Repositories using JSON config files

`.oxlintrc.json` and `.oxfmtrc.json` cannot import a JavaScript object. Rather than making a
config-format migration the price of adopting the shared style, the same source objects are
serialised to `generated/` and copied in:

```bash
npx matchory-coding-style sync --rc --vue
npx matchory-coding-style sync --rc --vue --check   # CI
```

Migrating to `oxlint.config.ts` is still better, and then `--rc` is unnecessary.

### Wiring checks

```bash
npx matchory-coding-style verify           # is this project actually wired up?
npx matchory-coding-style verify --strict  # treat warnings as failures
```

Checks that the oxfmt, oxlint and ESLint configs import the presets (or that the rc files match a
synced preset), and that `tsconfig.json` extends one. A config file that exists but does not import
the preset is reported as a failure, not a pass: that is the case a presence check would miss.

---

## Python

```bash
uv add --dev "matchory-coding-style @ git+ssh://git@github.com/matchory/coding-style@v0.1.0"
matchory-coding-style sync --preset base
```

Then point `pyproject.toml` at what it wrote and commit both:

```toml
[tool.ruff]
extend = ".matchory/ruff.toml"
```

| Preset        | Contents                                                                      |
|---------------|-------------------------------------------------------------------------------|
| `base.toml`   | 10 rule groups. Sized to be adoptable in a repository with no config today.    |
| `strict.toml` | Extends base with 30 more groups. Derived from our strictest existing service.  |

`sync` copies both presets plus a one-line selector, because `strict.toml` extends `base.toml` by
relative path. Select the preset with `--preset`; `--check` verifies without writing.

```bash
matchory-coding-style verify           # is this project actually wired up?
matchory-coding-style verify --strict  # treat warnings as failures
```

`verify` reads the selected preset back out of `.matchory/ruff.toml`, so a repository on `strict` is
not told it has drifted from `base`. A `[tool.ruff]` section that inlines its own rules instead of
extending the copy is a failure rather than a pass.

Prefer wiring it through pre-commit, which pins the version and the ruff binary together:

```yaml
repos:
  - repo: https://github.com/matchory/coding-style
    rev: v0.1.0
    hooks:
      - id: matchory-coding-style   # fails if the copied config has drifted
      - id: matchory-ruff
      - id: matchory-ruff-format
```

---

## Renovate

This repository is also the org-wide Renovate config, extended by name the same way the style presets
are. In a consuming repository's `renovate.json`:

```json
{
  "extends": [
    "github>matchory/coding-style",
    "github>matchory/coding-style//renovate/php",
    "github>matchory/coding-style//renovate/javascript"
  ]
}
```

| Preset                            | Contents                                                     |
|-----------------------------------|--------------------------------------------------------------|
| `default.json` (no path)          | Schedule, dependency dashboard, semantic commits, grouped dev tooling, and a no-automerge rule for linter majors. Includes the consumer preset below. |
| `//renovate/coding-style-consumer` | Collapses this package's three artefacts into one PR.        |
| `//renovate/php`                  | Laravel ecosystem grouping, held-back framework majors, static-analysis minors kept separate. |
| `//renovate/javascript`           | Vue and Vite groupings, ESLint plugins separated, oxlint/oxfmt never automerged. |
| `//renovate/python`               | ruff held back and never automerged, grouped scientific stack. |

The consumer preset is the one that earns its keep. Because all three packages share a version tag, a
polyglot repository would otherwise get three pull requests for one upstream commit.

Requires Renovate 38 or newer, which is when `matchPackageNames` gained glob support.

**Do not also enable Dependabot version updates.** Dependabot *security* updates are fine alongside
this and complement it: they only fire on advisories. A `dependabot.yml` with a `schedule` block,
though, means every bump arrives twice.

---

## Working on this repository

```bash
php php/bin/generate-pint-presets.php --check   # pint/relaxed.json is derived from base.json
cd js && node scripts/generate.mjs --check      # generated/*.json are derived from src/
```

CI runs both with `--check`, plus assertions that every PHPStan preset parses, the Rector presets
load, the ruff presets resolve through a real ruff run, and the three `.editorconfig` copies are
identical. Regenerate and commit rather than editing anything under `js/generated/` or
`src/matchory_coding_style/data/`.

## Adoption

Adoption is tracked in the issue tracker rather than here, so it cannot go stale.

Two notes for anyone migrating a repository:

- A repository formatted at a different indentation or quote style needs a one-time reformat commit.
  Land it separately from the version bump, or review becomes unreadable.
- Vitest configuration deliberately does **not** live here. It is build tooling rather than code
  style, and in practice it is heavily application-specific: route-manifest generation, module
  aliases, dependency inlining. Keep it local.

Run `verify` after wiring a repository up; it will tell you what is still pointing at local config.
