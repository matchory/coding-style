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
 * Copies the configuration files that cannot be imported from a package into the current project.
 *
 * ESLint, oxlint and oxfmt configs written in JavaScript or TypeScript import this package directly
 * and need nothing from this command. Two things cannot:
 *
 * - `.editorconfig`, which EditorConfig only ever resolves by walking up the directory tree.
 * - `.oxlintrc.json` / `.oxfmtrc.json`, for repositories that configure those tools in JSON.
 *
 * Usage:
 *
 * ```
 * npx matchory-coding-style sync [--vue] [--rc] [--check]
 *
 * --vue    Write the Vue variant of .oxlintrc.json.
 * --rc     Also write .oxlintrc.json and .oxfmtrc.json. Omit in repositories that configure
 *          oxlint and oxfmt in TypeScript, which should import the presets instead.
 * --check  Exit non-zero if a file is missing or out of date, without writing. Use in CI.
 * ```
 */

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const generated = join(packageDirectory, 'generated');
const projectRoot = process.cwd();

const argv = process.argv.slice(2);
const command = argv[0] ?? 'sync';
const check = argv.includes('--check');
const includeRcFiles = argv.includes('--rc');
const vue = argv.includes('--vue');

if (command === 'help' || command === '--help' || command === '-h') {
    console.log(
        [
            'matchory-coding-style sync [--vue] [--rc] [--check]',
            '',
            '  Writes the configuration files that cannot be imported from a package.',
            '',
            '  --vue    Write the Vue variant of .oxlintrc.json.',
            '  --rc     Also write .oxlintrc.json and .oxfmtrc.json.',
            '  --check  Exit non-zero if a file is out of date, without writing.',
        ].join('\n'),
    );
    process.exit(0);
}

if (command !== 'sync') {
    console.error(`Unknown command '${command}'`);
    process.exit(1);
}

/**
 * @type {[string, string][]} Target filename in the project, source filename in the package.
 */
const managed = [['.editorconfig', '.editorconfig']];

if (includeRcFiles) {
    managed.push(['.oxlintrc.json', vue ? 'oxlintrc.vue.json' : 'oxlintrc.json']);
    managed.push(['.oxfmtrc.json', 'oxfmtrc.json']);
}

const stale = [];

for (const [target, source] of managed) {
    const expected = await readFile(join(generated, source), 'utf8');
    const path = join(projectRoot, target);
    const current = await readFile(path, 'utf8').catch(() => null);

    if (current === expected) {
        console.log(`unchanged  ${target}`);

        continue;
    }

    if (check) {
        stale.push(target);

        continue;
    }

    await writeFile(path, expected, 'utf8');
    console.log(`${current === null ? 'created' : 'updated'}    ${target}`);
}

if (stale.length > 0) {
    console.error(`Out of date: ${stale.join(', ')}\nRun \`npx matchory-coding-style sync\``);
    process.exit(1);
}
