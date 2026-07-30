/**
 * A single entry in an ESLint flat config array.
 *
 * Deliberately loose: ESLint is an optional peer dependency, so `Linter.Config` may not resolve.
 */
export type FlatConfig = Record<string, unknown>;

/**
 * The core rule set without the trailing `eslint-config-prettier` entry.
 */
export declare const coreConfigs: FlatConfig[];

/**
 * The non-Vue rule set, ready to export from a flat config.
 */
export declare const core: FlatConfig[];

/**
 * Compose the non-Vue core with a package's own file-scoped overrides.
 */
export declare function withCore(overrides?: FlatConfig[]): FlatConfig[];

export default core;
