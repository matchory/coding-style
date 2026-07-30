/**
 * This file is part of matchory/coding-style, a Matchory project.
 *
 * Unauthorized copying of this file, via any medium, is strictly prohibited. Its contents are
 * strictly confidential and proprietary.
 *
 * @copyright © 2026 Matchory GmbH · All rights reserved
 */

import { oxfmtBase } from './src/oxfmt/base.js';

/**
 * This package formats itself with the preset it ships.
 *
 * Imported by relative path rather than by package name: a self-reference through `exports` would
 * work in Node, but it makes the config depend on the package being installed into its own
 * node_modules, which is one more thing to go wrong in CI.
 */
export default {
    ...oxfmtBase,
    ignorePatterns: [...oxfmtBase.ignorePatterns, 'generated/**', 'node_modules/**'],
};
