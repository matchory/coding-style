/**
 * This file is part of matchory/coding-style, a Matchory project.
 *
 * @copyright © 2026 Matchory GmbH
 * @license MIT
 */

import { oxlintBase } from './src/oxlint/base.js';

/**
 * This package lints itself with the preset it ships. There is no Vue here, so the base is correct
 * rather than the Vue variant.
 */
export default {
    ...oxlintBase,
    ignorePatterns: ['generated', 'node_modules', 'dist'],
};
