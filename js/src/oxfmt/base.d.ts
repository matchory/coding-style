/**
 * Canonical oxfmt configuration.
 *
 * Typed as an open record so it can be spread into `defineConfig()` without this package depending
 * on oxfmt's own option types, which is an optional peer dependency.
 */
export declare const oxfmtBase: Record<string, unknown>;
export default oxfmtBase;
