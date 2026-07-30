#!/usr/bin/env node

/**
 * This file is part of matchory/coding-style, a Matchory project.
 *
 * @copyright © 2026 Matchory GmbH
 * @license MIT
 */

/**
 * `sync` copies the configuration files that cannot be imported from a package; `verify` checks
 * that this project is actually wired to the shared presets.
 *
 * ESLint, oxlint and oxfmt configs written in JavaScript or TypeScript import this package directly
 * and need nothing copied. Two things cannot:
 *
 * - `.editorconfig`, which EditorConfig only ever resolves by walking up the directory tree.
 * - `.oxlintrc.json` / `.oxfmtrc.json`, for repositories that configure those tools in JSON.
 *
 * Usage:
 *
 * ```
 * npx matchory-coding-style sync [--vue] [--rc] [--check]
 * npx matchory-coding-style verify [--strict]
 * ```
 */

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const generated = join(packageDirectory, 'generated');
const projectRoot = process.cwd();

const USAGE = [
    'matchory-coding-style <command> [options]',
    '',
    '  sync [--vue] [--rc] [--check]',
    '        Write the configuration files that cannot be imported from a package.',
    '        --vue     Write the Vue variant of .oxlintrc.json.',
    '        --rc      Also write .oxlintrc.json and .oxfmtrc.json. Omit in repositories that',
    '                  configure oxlint and oxfmt in TypeScript; those import the presets instead.',
    '        --check   Exit non-zero if a file is out of date, without writing.',
    '',
    '  verify [--strict]',
    '        Check that this project actually consumes the shared presets, rather than merely',
    '        depending on the package.',
    '        --strict  Treat warnings as failures.',
].join('\n');

/**
 * Reads a file, returning null when it does not exist.
 *
 * @param {string} path
 *
 * @returns {Promise<string | null>}
 */
async function read(path) {
    return readFile(path, 'utf8').catch(() => null);
}

/**
 * @param {string[]} argv
 *
 * @returns {Promise<number>}
 */
async function sync(argv) {
    const check = argv.includes('--check');
    const includeRcFiles = argv.includes('--rc');
    const vue = argv.includes('--vue');

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
        const current = await read(join(projectRoot, target));

        if (current === expected) {
            console.log(`unchanged  ${target}`);
            continue;
        }

        if (check) {
            stale.push(target);
            continue;
        }

        await writeFile(join(projectRoot, target), expected, 'utf8');
        console.log(`${current === null ? 'created' : 'updated'}    ${target}`);
    }

    if (stale.length > 0) {
        console.error(`Out of date: ${stale.join(', ')}\nRun \`npx matchory-coding-style sync\``);

        return 1;
    }

    return 0;
}

/**
 * Checks that this project consumes the shared presets.
 *
 * Depending on the package is not the same as using it: a repository can install it and still lint
 * with its own inlined rule set. Those are the cases that let drift back in, and none of them break
 * a build on their own.
 *
 * @param {string[]} argv
 *
 * @returns {Promise<number>}
 */
async function verify(argv) {
    const strict = argv.includes('--strict');
    const findings = [];

    /**
     * @param {'ok' | 'warn' | 'FAIL'} level
     * @param {string} subject
     * @param {string} detail
     */
    const record = (level, subject, detail) => {
        findings.push({ level, subject, detail });
        console.log(`${level.padEnd(6)} ${subject.padEnd(14)} ${detail}`);
    };

    const editorconfig = await read(join(projectRoot, '.editorconfig'));
    const canonicalEditorconfig = await readFile(join(generated, '.editorconfig'), 'utf8');

    if (editorconfig === null) {
        record('FAIL', '.editorconfig', 'missing; run `npx matchory-coding-style sync`');
    } else if (editorconfig !== canonicalEditorconfig) {
        record(
            'FAIL',
            '.editorconfig',
            'has drifted from the canonical copy; run `npx matchory-coding-style sync`',
        );
    } else {
        record('ok', '.editorconfig', 'matches the canonical copy');
    }

    // Each tool can be wired either by importing the preset from a TypeScript config, or, for
    // repositories still on the JSON format, by a synced rc file. Both are acceptable; having
    // neither means the tool is running on its own rules.
    for (const tool of [
        {
            name: 'oxfmt',
            configs: ['oxfmt.config.ts', 'oxfmt.config.js'],
            rc: '.oxfmtrc.json',
            generated: 'oxfmtrc.json',
        },
        {
            name: 'oxlint',
            configs: ['oxlint.config.ts', 'oxlint.config.js'],
            rc: '.oxlintrc.json',
            generated: 'oxlintrc.json',
        },
    ]) {
        let resolved = false;

        for (const config of tool.configs) {
            const contents = await read(join(projectRoot, config));

            if (contents?.includes('@matchory/coding-style')) {
                record('ok', tool.name, `${config} imports the shared preset`);
                resolved = true;
                break;
            }

            if (contents !== null) {
                record(
                    'FAIL',
                    tool.name,
                    `${config} exists but does not import @matchory/coding-style`,
                );
                resolved = true;
                break;
            }
        }

        if (resolved) {
            continue;
        }

        const rc = await read(join(projectRoot, tool.rc));

        if (rc === null) {
            record(
                'warn',
                tool.name,
                `no ${tool.configs[0]} and no ${tool.rc}; the tool is unconfigured`,
            );
            continue;
        }

        const variants = await Promise.all(
            [tool.generated, tool.generated.replace('rc.json', 'rc.vue.json')].map((name) =>
                read(join(generated, name)),
            ),
        );

        if (variants.includes(rc)) {
            record('ok', tool.name, `${tool.rc} matches a synced preset`);
        } else {
            record(
                'FAIL',
                tool.name,
                `${tool.rc} does not match any synced preset; run \`npx matchory-coding-style sync --rc\``,
            );
        }
    }

    const eslintConfig = await read(join(projectRoot, 'eslint.config.js'));

    if (eslintConfig === null) {
        record('warn', 'eslint', 'no eslint.config.js; only relevant for Vue and Tailwind rules');
    } else if (eslintConfig.includes('@matchory/coding-style/eslint')) {
        record('ok', 'eslint', 'imports the shared preset');
    } else {
        record('FAIL', 'eslint', 'eslint.config.js does not import @matchory/coding-style/eslint');
    }

    const tsconfig = await read(join(projectRoot, 'tsconfig.json'));

    if (tsconfig === null) {
        record('warn', 'tsconfig', 'no tsconfig.json');
    } else if (tsconfig.includes('@matchory/coding-style/tsconfig/')) {
        record('ok', 'tsconfig', 'extends a shared preset');
    } else {
        record(
            'FAIL',
            'tsconfig',
            'tsconfig.json does not extend @matchory/coding-style/tsconfig/*',
        );
    }

    const failures = findings.filter((finding) => finding.level === 'FAIL').length;
    const warnings = findings.filter((finding) => finding.level === 'warn').length;

    console.log(
        `\n${findings.length - failures - warnings} ok, ${warnings} warning(s), ${failures} failure(s)`,
    );

    if (failures > 0) {
        return 1;
    }

    if (strict && warnings > 0) {
        console.error('Warnings are failures under --strict');

        return 1;
    }

    return 0;
}

const argv = process.argv.slice(2);
const command = argv[0] ?? 'help';

if (command === 'help' || command === '--help' || command === '-h') {
    console.log(USAGE);
    process.exit(0);
}

if (command !== 'sync' && command !== 'verify') {
    console.error(`Unknown command '${command}'\n\n${USAGE}`);
    process.exit(1);
}

process.exit(command === 'sync' ? await sync(argv) : await verify(argv));
