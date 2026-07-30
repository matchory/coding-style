/**
 * This file is part of matchory/coding-style, a Matchory project.
 *
 * @copyright © 2026 Matchory GmbH
 * @license MIT
 */

/**
 * Shared oxlint configuration for JavaScript and TypeScript.
 *
 * Each repository ships a thin `oxlint.config.ts` that imports this object, spreads it, and adds
 * its own ignore patterns. oxlint auto-discovers the nearest config per file.
 *
 * This object is also consumed by the shared ESLint base via `eslint-plugin-oxlint`'s
 * `buildFromOxlintConfig(...)`, which reads `rules`, `categories` and `overrides` to switch off the
 * ESLint rules oxlint already covers, so the two linters do not duplicate work.
 *
 * Vue rules live in `./vue.js` instead of here, so a repository with no `.vue` files does not
 * inherit a rule surface it cannot trigger.
 *
 * Authored as `.js` rather than `.ts` on purpose: the generator that emits `.oxlintrc.json` for
 * repositories using the JSON config format has to import it from a plain Node script.
 */
export const oxlintBase = {
    plugins: ['typescript'],

    // Primarily for the ESLint integration: `buildFromOxlintConfig(oxlintBase)` turns these into
    // ESLint `ignores`, so ESLint skips the same build output and declaration files oxlint does.
    // Each `oxlint.config.ts` overrides this key with its own patterns for the oxlint CLI itself.
    ignorePatterns: ['**/dist', '**/test-reports', '*.d.ts', '.cache'],

    categories: {
        correctness: 'off',
    },
    env: {
        builtin: true,
        browser: true,
        mocha: true,
        'shared-node-browser': true,
    },
    rules: {
        'for-direction': 'error',
        'no-async-promise-executor': 'error',
        'no-case-declarations': 'error',
        'no-class-assign': 'error',
        'no-compare-neg-zero': 'error',
        'no-cond-assign': 'error',
        'no-const-assign': 'error',
        'no-constant-binary-expression': 'error',
        'no-constant-condition': 'error',
        'no-control-regex': 'error',
        'no-debugger': 'error',
        'no-delete-var': 'error',
        'no-dupe-class-members': 'error',
        'no-dupe-else-if': 'error',
        'no-dupe-keys': 'error',
        'no-duplicate-case': 'error',
        'no-empty': 'error',
        'no-empty-character-class': 'error',
        'no-empty-pattern': 'error',
        'no-empty-static-block': 'error',
        'no-ex-assign': 'error',
        'no-extra-boolean-cast': 'error',
        'no-fallthrough': 'error',
        'no-func-assign': 'error',
        'no-global-assign': 'error',
        'no-import-assign': 'error',
        'no-invalid-regexp': 'error',
        'no-irregular-whitespace': 'error',
        'no-loss-of-precision': 'error',
        'no-new-native-nonconstructor': 'error',
        'no-nonoctal-decimal-escape': 'error',
        'no-obj-calls': 'error',
        'no-prototype-builtins': 'error',
        'no-redeclare': 'error',
        'no-regex-spaces': 'error',
        'no-self-assign': 'error',
        'no-setter-return': 'error',
        'no-shadow-restricted-names': 'error',
        'no-sparse-arrays': 'error',
        'no-this-before-super': 'error',
        'no-unexpected-multiline': 'error',
        'no-unsafe-finally': 'error',
        'no-unsafe-negation': 'error',
        'no-unsafe-optional-chaining': 'error',
        'no-unused-labels': 'error',
        'no-unused-private-class-members': 'error',
        'no-unused-vars': 'error',
        'no-useless-backreference': 'error',
        'no-useless-catch': 'error',
        'no-useless-escape': 'error',
        'no-with': 'error',
        'require-yield': 'error',
        'use-isnan': 'error',
        'valid-typeof': 'error',
        '@typescript-eslint/ban-ts-comment': 'error',
        'no-array-constructor': 'error',
        '@typescript-eslint/no-duplicate-enum-values': 'error',
        '@typescript-eslint/no-empty-object-type': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-extra-non-null-assertion': 'error',
        '@typescript-eslint/no-misused-new': 'error',
        '@typescript-eslint/no-namespace': 'error',
        '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
        '@typescript-eslint/no-require-imports': 'error',
        '@typescript-eslint/no-this-alias': 'error',
        '@typescript-eslint/no-unnecessary-type-constraint': 'error',
        '@typescript-eslint/no-unsafe-declaration-merging': 'error',
        '@typescript-eslint/no-unsafe-function-type': 'error',
        'no-unused-expressions': 'error',
        '@typescript-eslint/no-wrapper-object-types': 'error',
        '@typescript-eslint/prefer-as-const': 'error',
        '@typescript-eslint/prefer-namespace-keyword': 'error',
        '@typescript-eslint/triple-slash-reference': 'error',
    },
    globals: {
        expect: 'readonly',
        assert: 'readonly',
        chai: 'readonly',
    },
    overrides: [
        {
            files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
            rules: {
                // The TypeScript compiler already rejects these, so oxlint reporting them again is
                // pure duplication.
                'no-class-assign': 'off',
                'no-const-assign': 'off',
                'no-dupe-class-members': 'off',
                'no-dupe-keys': 'off',
                'no-func-assign': 'off',
                'no-import-assign': 'off',
                'no-new-native-nonconstructor': 'off',
                'no-obj-calls': 'off',
                'no-redeclare': 'off',
                'no-setter-return': 'off',
                'no-this-before-super': 'off',
                'no-unsafe-negation': 'off',
                'no-var': 'error',
                'no-with': 'off',
                'prefer-rest-params': 'error',
                'prefer-spread': 'error',
            },
        },
        {
            files: ['**/*.ts', '**/*.tsx'],
            rules: {
                '@typescript-eslint/consistent-type-imports': [
                    'error',
                    {
                        prefer: 'type-imports',
                        fixStyle: 'separate-type-imports',
                    },
                ],
            },
            env: {
                es2026: true,
            },
        },
        {
            files: ['**/*.ts', '**/*.tsx', '**/*.vue'],
            rules: {
                'sort-imports': [
                    'error',
                    {
                        ignoreCase: false,
                        ignoreDeclarationSort: true,
                        ignoreMemberSort: true,
                        allowSeparatedGroups: false,
                    },
                ],
                '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
                '@typescript-eslint/no-this-alias': [
                    'error',
                    {
                        allowDestructuring: false,
                        allowedNames: ['vm'],
                    },
                ],
                '@typescript-eslint/no-non-null-assertion': 'off',
                'no-unused-vars': [
                    'error',
                    {
                        argsIgnorePattern: '^_',
                        varsIgnorePattern: '^_',
                    },
                ],
            },
        },
        {
            files: ['**/env.d.ts', '*.config.ts'],
            rules: {
                'id-length': 'off',
                'no-unused-vars': 'off',
                '@typescript-eslint/consistent-type-definitions': 'off',
                '@typescript-eslint/no-empty-object-type': 'off',
            },
        },
        {
            files: ['**/*.ts', '**/*.tsx'],
            rules: {
                'no-console': [
                    'error',
                    {
                        allow: ['debug', 'info', 'warn', 'error'],
                    },
                ],
            },
        },
    ],
};

export default oxlintBase;
