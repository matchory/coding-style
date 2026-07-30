/**
 * This file is part of matchory/coding-style, a Matchory project.
 *
 * Unauthorized copying of this file, via any medium, is strictly prohibited. Its contents are
 * strictly confidential and proprietary.
 *
 * @copyright © 2026 Matchory GmbH · All rights reserved
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
