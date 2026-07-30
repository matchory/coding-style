/**
 * This file is part of matchory/coding-style, a Matchory project.
 *
 * @copyright © 2026 Matchory GmbH
 * @license MIT
 */

import { oxlintBase } from '../oxlint/base.js';
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';
import oxlint from 'eslint-plugin-oxlint';
import globals from 'globals';
import ts from 'typescript-eslint';

/**
 * Rules for plain JavaScript and TypeScript, with no dependency on the Vue toolchain.
 *
 * All code formatting (indentation, quotes, spacing, member delimiters, parens) is owned by oxfmt.
 * ESLint's formatting rules are switched off wholesale by `eslint-config-prettier`, appended last.
 */
export const coreConfigs = [
    js.configs.recommended,
    ...ts.configs.recommended,
    comments.recommended,

    // Oxlint handles many of the above rules natively; disable them in ESLint to avoid duplicate
    // work. Must come after the presets to override them. Reads the shared oxlint config object
    // directly — the same one every `oxlint.config.ts` consumes — rather than a JSON file on disk.
    ...oxlint.buildFromOxlintConfig(oxlintBase),
    {
        linterOptions: {
            reportUnusedDisableDirectives: 'error',
            reportUnusedInlineConfigs: 'error',
        },
        rules: {
            '@eslint-community/eslint-comments/no-unused-disable': 'error',
            '@eslint-community/eslint-comments/require-description': ['error', { ignore: [] }],
        },
    },
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: globals.browser,
            parserOptions: { parser: ts.parser },
        },
    },
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.vue'],
        rules: {
            'spaced-comment': [
                'error',
                'always',
                {
                    line: { exceptions: ['region', 'endregion'] },
                },
            ],
            'id-length': [
                'error',
                {
                    min: 3,
                    exceptions: ['_', 'a', 'b', 'i', 'id', 'to', 'qa', 'ky'],
                    properties: 'always',
                },
            ],
            camelcase: [
                'error',
                {
                    properties: 'never',
                    ignoreImports: true,
                },
            ],
        },
    },
    {
        files: ['**/env.d.ts', '*.config.ts'],
        rules: {
            'id-length': 'off',
        },
    },
];

/**
 * The non-Vue rule set, ready to export from a flat config.
 *
 * `prettier` must stay last so it wins over every preset above it.
 */
export const core = [...coreConfigs, prettier];

/**
 * Compose the non-Vue core with a package's own file-scoped overrides.
 *
 * Use in TypeScript-only packages to skip the Vue rule surface entirely.
 *
 * @param {unknown[]} overrides
 *
 * @returns {unknown[]}
 */
export function withCore(overrides = []) {
    return [...core, ...overrides];
}

export default core;
