#!/usr/bin/env node

/**
 * This file is part of matchory/coding-style, a Matchory project.
 *
 * Unauthorized copying of this file, via any medium, is strictly prohibited. Its contents are
 * strictly confidential and proprietary.
 *
 * @copyright © 2026 Matchory GmbH · All rights reserved
 */

/**
 * Emits the JSON artefacts that repositories using oxlint's and oxfmt's rc-file format consume.
 *
 * Not every repository configures these tools in TypeScript. `matchory/ui`, for example, carries
 * `.oxlintrc.json` and `.oxfmtrc.json`, which cannot spread a JavaScript object. Rather than
 * forcing a config-format migration as the price of adopting the shared style, the same source
 * objects are serialised here and copied in by `matchory-coding-style sync`.
 *
 * The output is committed so that `sync` is a plain file copy with no dependency on this package's
 * own toolchain, and CI runs `--check` to prove the committed files still match the source.
 *
 * Usage:
 *
 * ```
 * node scripts/generate.mjs
 * node scripts/generate.mjs --check
 * ```
 */

import { oxfmtBase } from '../src/oxfmt/base.js';
import { oxlintBase } from '../src/oxlint/base.js';
import { oxlintVue } from '../src/oxlint/vue.js';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const packageDirectory = resolve(scriptDirectory, '..');
const repositoryRoot = resolve(packageDirectory, '..');
const outputDirectory = join(packageDirectory, 'generated');

const check = process.argv.includes('--check');

/**
 * Serialises a config object the way the rc files in this organisation are formatted: two-space
 * JSON, schema reference first, trailing newline.
 *
 * @param {string} schema
 * @param {object} config
 *
 * @returns {string}
 */
function render(schema, config) {
    return `${JSON.stringify({ $schema: schema, ...config }, null, 2)}\n`;
}

const oxlintSchema = './node_modules/oxlint/configuration_schema.json';
const oxfmtSchema = './node_modules/oxfmt/configuration_schema.json';

const artefacts = [
    ['oxlintrc.json', render(oxlintSchema, oxlintBase)],
    ['oxlintrc.vue.json', render(oxlintSchema, oxlintVue)],
    ['oxfmtrc.json', render(oxfmtSchema, oxfmtBase)],

    // The canonical .editorconfig lives at the repository root and is shipped inside the npm
    // package so `sync` can write it without reaching outside the installed files.
    ['.editorconfig', await readFile(join(repositoryRoot, '.editorconfig'), 'utf8')],
];

const stale = [];

for (const [name, expected] of artefacts) {
    const path = join(outputDirectory, name);
    const current = await readFile(path, 'utf8').catch(() => null);

    if (current === expected) {
        console.log(`unchanged  generated/${name}`);

        continue;
    }

    if (check) {
        stale.push(name);

        continue;
    }

    await writeFile(path, expected, 'utf8');
    console.log(`${current === null ? 'created' : 'updated'}    generated/${name}`);
}

if (stale.length > 0) {
    console.error(
        `Stale generated files: ${stale.join(', ')}\nRun \`pnpm --filter @matchory/coding-style generate\``,
    );
    process.exit(1);
}

if (check) {
    console.log('Generated files are up to date');
}
