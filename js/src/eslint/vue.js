/**
 * This file is part of matchory/coding-style, a Matchory project.
 *
 * Unauthorized copying of this file, via any medium, is strictly prohibited. Its contents are
 * strictly confidential and proprietary.
 *
 * @copyright © 2026 Matchory GmbH · All rights reserved
 */

import { coreConfigs } from './base.js';
import prettier from 'eslint-config-prettier/flat';
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';
import pinia from 'eslint-plugin-pinia';
import vuePlugin from 'eslint-plugin-vue';
import vueAccessibility from 'eslint-plugin-vuejs-accessibility';
import ts from 'typescript-eslint';
import eslintParserVue from 'vue-eslint-parser';

/**
 * @typedef {object} VueOptions
 * @property {string | null} [tailwindEntryPoint] Absolute path to the stylesheet that imports
 *   Tailwind. Required for the Tailwind rules; when omitted they are skipped entirely, because
 *   `eslint-plugin-better-tailwindcss` cannot resolve the theme without it and would report every
 *   utility as unknown.
 * @property {boolean} [unknownTailwindClasses] Whether to report Tailwind classes that resolve to
 *   nothing. Defaults to `false`: repositories still carrying legacy hand-written classes need to
 *   migrate them first.
 * @property {boolean} [pinia] Whether to apply the Pinia rules. Defaults to `true`.
 */

/**
 * Vue template layout rules (`html-indent`, `first-attribute-linebreak`,
 * `html-closing-bracket-newline`, `max-attributes-per-line`, `html-comment-*`,
 * `padding-line-between-blocks`, …) are intentionally NOT configured: oxfmt owns Vue SFC formatting,
 * and `eslint-config-prettier` disables the rest that ship enabled in `vue/flat/recommended`.
 *
 * @param {VueOptions} options
 * @returns {unknown[]}
 */
export function vueConfigs(options = {}) {
    const { tailwindEntryPoint = null, unknownTailwindClasses = false, pinia: withPinia = true } =
        options;

    const configs = [...vuePlugin.configs['flat/recommended'], ...vueAccessibility.configs['flat/recommended']];

    if (withPinia) {
        configs.push({
            files: ['**/*.vue', '**/*.ts', '**/*.tsx'],
            plugins: { pinia },
            rules: { ...pinia.configs['recommended-flat'].rules },
        });
    }

    configs.push({
        files: ['**/*.vue'],
        languageOptions: {
            parserOptions: {
                parser: ts.parser,
                extraFileExtensions: ['.vue'],
            },
        },
        rules: {
            'vue/multi-word-component-names': ['off', { ignores: [] }],
            'vue/valid-v-slot': ['error', { allowModifiers: true }],
            'vue/attributes-order': [
                'error',
                {
                    order: [
                        'DEFINITION',
                        'LIST_RENDERING',
                        'CONDITIONALS',
                        'RENDER_MODIFIERS',
                        'GLOBAL',
                        'UNIQUE',
                        'SLOT',
                        'TWO_WAY_BINDING',
                        'EVENTS',
                        'OTHER_DIRECTIVES',
                        'OTHER_ATTR',
                        'CONTENT',
                    ],
                    alphabetical: true,
                },
            ],
            'vue/block-lang': [
                'error',
                {
                    script: { lang: 'ts' },
                    style: {
                        lang: 'postcss',
                        allowNoLang: true,
                    },
                },
            ],
            'vue/block-order': [
                'error',
                { order: ['script:not([setup])', 'script[setup]', 'template', 'style'] },
            ],
            'vue/component-api-style': ['error', ['script-setup']],
            'vue/component-name-in-template-casing': [
                'error',
                'PascalCase',
                {
                    registeredComponentsOnly: false,
                    ignores: [],
                    globals: [
                        'RouterView',
                        'RouterLink',
                        'Transition',
                        'TransitionGroup',
                        'KeepAlive',
                        'Suspense',
                        'Teleport',
                        'Portal',
                    ],
                },
            ],
            'vue/custom-event-name-casing': ['error', 'camelCase', { ignores: [] }],
            'vue/define-emits-declaration': ['error', 'type-based'],
            'vue/define-macros-order': [
                'error',
                {
                    order: [
                        'defineOptions',
                        'defineSlots',
                        'defineEmits',
                        'defineModel',
                        'defineProps',
                    ],
                    defineExposeLast: true,
                },
            ],
            'vue/define-props-declaration': ['error', 'type-based'],
            'vue/html-button-has-type': [
                'error',
                { button: true, reset: true, submit: true },
            ],
            'vue/match-component-import-name': ['error'],

            // Superseded by the oxlint base, which reports these as warnings during development.
            'vue/max-props': 'off',
            'vue/max-template-depth': 'off',

            'vue/next-tick-style': ['error', 'promise'],
            'vue/no-boolean-default': ['error', 'default-false'],
            'vue/no-duplicate-attr-inheritance': ['error'],
            'vue/no-empty-component-block': ['error'],
            'vue/no-ref-object-reactivity-loss': ['error'],
            'vue/no-required-prop-with-default': ['error'],
            'vue/no-restricted-html-elements': [
                'error',
                { element: 'b', message: 'Use <strong> instead of <b>' },
                { element: 'i', message: 'Use <em> instead of <i>' },
                { element: 'u', message: 'Use <ins> instead of <u>' },
                { element: 's', message: 'Use <del> instead of <s>' },
            ],
            'vue/no-restricted-props': [
                'warn',
                {
                    name: '/^is[A-Z].*/',
                    message:
                        'Avoid using boolean props that start with "is" and use the adjective form instead.',
                },
                {
                    name: '/^can[A-Z].*/',
                    message:
                        'Avoid using boolean props that start with "can" and use the adjective form instead.',
                },
            ],
            'vue/no-static-inline-styles': ['error', { allowBinding: false }],
            'vue/no-template-target-blank': [
                'error',
                { allowReferrer: true, enforceDynamicLinks: 'always' },
            ],
            'vue/no-unused-emit-declarations': ['error'],
            'vue/no-unused-properties': ['error', { groups: ['props'] }],
            'vue/no-unused-refs': ['error'],
            'vue/no-useless-mustaches': [
                'error',
                { ignoreIncludesComment: false, ignoreStringEscape: false },
            ],
            'vue/no-useless-v-bind': [
                'error',
                { ignoreIncludesComment: false, ignoreStringEscape: false },
            ],
            'vue/prefer-separate-static-class': ['error'],
            'vue/prefer-true-attribute-shorthand': ['error', 'always'],
            'vue/prefer-use-template-ref': ['error'],
            'vue/require-explicit-emits': ['error'],
            'vue/require-macro-variable-name': [
                'error',
                {
                    defineProps: 'props',
                    defineEmits: 'emit',
                    defineSlots: 'slots',
                    useSlots: 'slots',
                    useAttrs: 'attrs',
                },
            ],
            'vue/require-typed-ref': ['error'],
            'vue/slot-name-casing': ['error', 'camelCase'],
            'vue/v-for-delimiter-style': ['error', 'in'],
            'vue/valid-define-options': ['error'],

            'vuejs-accessibility/no-autofocus': 'warn',
            'vuejs-accessibility/mouse-events-have-key-events': 'warn',
        },
    });

    if (tailwindEntryPoint !== null) {
        configs.push({
            extends: [eslintPluginBetterTailwindcss.configs.recommended],
            settings: {
                'better-tailwindcss': { entryPoint: tailwindEntryPoint },
            },
            rules: {
                // oxfmt owns line wrapping.
                'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
                'better-tailwindcss/no-unknown-classes': unknownTailwindClasses ? 'error' : 'off',
            },
            files: ['**/*.vue'],
            languageOptions: { parser: eslintParserVue },
        });
    }

    return configs;
}

/**
 * The full rule set: the core base plus the Vue overlay.
 *
 * @param {VueOptions} options
 * @returns {unknown[]}
 */
export function vue(options = {}) {
    return [...coreConfigs, ...vueConfigs(options), prettier];
}

/**
 * Compose the full Vue-inclusive base with a package's own file-scoped overrides.
 *
 * @param {VueOptions} options
 * @param {unknown[]} overrides
 * @returns {unknown[]}
 */
export function withVue(options = {}, overrides = []) {
    return [...vue(options), ...overrides];
}

export default vue;
