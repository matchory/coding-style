/**
 * Shape of the shared oxlint configuration.
 *
 * Kept structural rather than importing oxlint's own types: this package declares `oxlint` as an
 * optional peer dependency, so its types are not guaranteed to be present.
 */
export type OxlintConfig = {
    plugins: string[];
    ignorePatterns: string[];
    categories: Record<string, string>;
    env: Record<string, boolean>;
    rules: Record<string, unknown>;
    globals: Record<string, string>;
    overrides: Array<Record<string, unknown>>;
};

export declare const oxlintBase: OxlintConfig;
export default oxlintBase;
