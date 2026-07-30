import type { FlatConfig } from './base.js';

export type VueOptions = {
    /**
     * Absolute path to the stylesheet that imports Tailwind. Required for the Tailwind rules; when
     * omitted they are skipped entirely.
     */
    tailwindEntryPoint?: string | null;
    /** Whether to report Tailwind classes that resolve to nothing. Defaults to `false`. */
    unknownTailwindClasses?: boolean;
    /** Whether to apply the Pinia rules. Defaults to `true`. */
    pinia?: boolean;
};

/** The Vue overlay on its own, without the core base or `eslint-config-prettier`. */
export declare function vueConfigs(options?: VueOptions): FlatConfig[];

/** The full rule set: the core base plus the Vue overlay. */
export declare function vue(options?: VueOptions): FlatConfig[];

/** Compose the full Vue-inclusive base with a package's own file-scoped overrides. */
export declare function withVue(options?: VueOptions, overrides?: FlatConfig[]): FlatConfig[];

export default vue;
