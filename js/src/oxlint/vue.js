/**
 * This file is part of matchory/coding-style, a Matchory project.
 *
 * Unauthorized copying of this file, via any medium, is strictly prohibited. Its contents are
 * strictly confidential and proprietary.
 *
 * @copyright © 2026 Matchory GmbH · All rights reserved
 */

import { oxlintBase } from './base.js';

/**
 * The shared oxlint base plus the Vue rule surface.
 *
 * Use in any package containing `.vue` files. Packages without them should import `./base.js`
 * directly rather than enabling a plugin whose rules can never fire.
 */
export const oxlintVue = {
    ...oxlintBase,
    plugins: [...oxlintBase.plugins, 'vue'],
    rules: {
        ...oxlintBase.rules,
        'vue/no-export-in-script-setup': 'error',
        'vue/prefer-import-from-vue': 'error',
        'vue/valid-define-emits': 'error',
        'vue/valid-define-props': 'error',
        'vue/no-multiple-slot-args': 'warn',
        'vue/no-required-prop-with-default': 'warn',
    },
    overrides: [
        ...oxlintBase.overrides,
        {
            files: ['**/*.vue'],
            globals: {
                expect: 'readonly',
                assert: 'readonly',
                chai: 'readonly',
            },
            rules: {
                'no-console': [
                    'error',
                    {
                        allow: ['debug', 'info', 'warn', 'error'],
                    },
                ],
                'vue/define-emits-declaration': ['error', 'type-based'],
                'vue/define-props-declaration': ['error', 'type-based'],
                'vue/max-props': [
                    'warn',
                    {
                        maxProps: 7,
                    },
                ],
                'vue/no-required-prop-with-default': ['error'],
                'vue/require-typed-ref': ['error'],
            },
        },
    ],
};

export default oxlintVue;
