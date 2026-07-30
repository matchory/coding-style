/**
 * This file is part of matchory/coding-style, a Matchory project.
 *
 * Unauthorized copying of this file, via any medium, is strictly prohibited. Its contents are
 * strictly confidential and proprietary.
 *
 * @copyright © 2026 Matchory GmbH · All rights reserved
 */

/**
 * Canonical oxfmt configuration for every Matchory JavaScript and TypeScript project.
 *
 * Four-space indentation and single quotes are the organisation-wide choice. Repositories formatted
 * the other way round need a one-time reformat commit when adopting this; there is no per-repository
 * variant, because two formatting standards is the problem this package exists to remove.
 *
 * Returned as a plain object rather than through oxfmt's `defineConfig()` so that the generator
 * emitting `.oxfmtrc.json` can import it without oxfmt installed. Consuming configs are free to
 * wrap it: `export default defineConfig({ ...oxfmtBase })`.
 */
export const oxfmtBase = {
    arrowParens: 'always',
    bracketSameLine: false,
    bracketSpacing: true,
    endOfLine: 'lf',
    htmlWhitespaceSensitivity: 'ignore',

    // Markdown and YAML are owned by other tooling; composer.json follows the four-space Composer
    // convention rather than the two-space rule below. Repositories append their own patterns.
    ignorePatterns: ['**/*.md', '**/*.yaml', '**/*.yml', '**/composer.json'],
    insertFinalNewline: true,
    jsdoc: {
        capitalizeDescriptions: true,
        commentLineStrategy: 'multiline',
        descriptionTag: false,
        descriptionWithDot: true,
        lineWrappingStyle: 'greedy',
        preferCodeFences: true,
        separateReturnsFromParam: true,
        separateTagGroups: true,
    },
    objectWrap: 'preserve',
    overrides: [
        {
            files: ['**/*.json', '**/*.jsonc', '**/*.json5'],
            options: { tabWidth: 2 },
        },
    ],
    printWidth: 100,
    proseWrap: 'always',
    quoteProps: 'as-needed',
    semi: true,
    singleQuote: true,
    sortImports: {
        groups: [],
        ignoreCase: true,
        newlinesBetween: false,
        order: 'asc',
        partitionByComment: true,
        partitionByNewline: false,
        sortSideEffects: false,
    },
    sortPackageJson: {
        sortScripts: true,
    },

    // Tailwind class ordering is owned by eslint-plugin-better-tailwindcss
    // (enforce-consistent-class-order), which is theme-aware via its configured stylesheet entry
    // point and additionally reports unknown classes. oxfmt's own sorter produces a different order
    // and would fight the linter in pre-commit, so it stays off.
    tabWidth: 4,
    trailingComma: 'all',
    useTabs: false,
    vueIndentScriptAndStyle: false,
};

export default oxfmtBase;
