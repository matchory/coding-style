# @matchory/coding-style

Shared oxlint, oxfmt, ESLint and TypeScript configuration for Matchory projects.

This is the JavaScript half of [matchory/coding-style](https://github.com/matchory/coding-style), a
polyglot style package that also ships Pint, PHPStan and Rector presets for PHP (via Composer) and
ruff presets for Python. All three share one version number.

```bash
pnpm add -D @matchory/coding-style
```

Published to both npmjs and GitHub Packages as identical bytes, so it resolves whichever registry your
`.npmrc` maps the `@matchory` scope to. npmjs is canonical and carries provenance.

```ts
// oxfmt.config.ts
import { oxfmtBase } from '@matchory/coding-style/oxfmt';

export default { ...oxfmtBase, ignorePatterns: [...oxfmtBase.ignorePatterns, 'storage/**'] };
```

```ts
// oxlint.config.ts — use /oxlint for packages without .vue files
import { oxlintVue } from '@matchory/coding-style/oxlint/vue';

export default { ...oxlintVue, ignorePatterns: ['dist', '.cache'] };
```

```js
// eslint.config.js
import { withVue } from '@matchory/coding-style/eslint/vue';
import { resolve } from 'node:path';

export default withVue({ tailwindEntryPoint: resolve(import.meta.dirname, 'src/style.css') });
```

```jsonc
// tsconfig.json
{ "extends": "@matchory/coding-style/tsconfig/vue.json" }
```

| Export                   | Use for                                                          |
|--------------------------|------------------------------------------------------------------|
| `./oxfmt`                | Everything. 4-space indentation, single quotes, 100 columns.      |
| `./oxlint`               | TypeScript and JavaScript packages. 73 rules, no Vue plugin.      |
| `./oxlint/vue`           | Packages containing `.vue` files.                                 |
| `./eslint`               | `core`, `withCore()` — the non-Vue rule set.                       |
| `./eslint/vue`           | `vue()`, `withVue()`, `vueConfigs()`.                              |
| `./tsconfig/base.json`   | Plain TypeScript.                                                 |
| `./tsconfig/vue.json`    | Vue applications and component libraries.                         |
| `./tsconfig/node.json`   | CLIs, GitHub Actions, build scripts. No DOM libs.                 |
| `./tsconfig/strict.json` | Extra strictness, composed after a base.                          |

Two commands ship with the package:

```bash
npx matchory-coding-style sync --rc    # write .editorconfig, and the rc files if you use them
npx matchory-coding-style verify       # check this project actually consumes the presets
```

ESLint is present only for rules oxlint cannot yet express: the `eslint-plugin-vue` surface, Tailwind
class ordering, and Vue accessibility. Tracked for removal in the
[Drop ESLint](https://github.com/matchory/coding-style/milestone/1) milestone.

See the [main README](https://github.com/matchory/coding-style#javascript--typescript) for the full
rationale, including why some tools can extend a package and others must copy files.

## License

MIT
