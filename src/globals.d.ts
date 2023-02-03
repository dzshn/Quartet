declare global {
    export const QUARTET_VERSION: string;
    export const QUARTET_DEV: boolean;
    export const QUARTET_WEB: boolean;
    export const QUARTET_USERSCRIPT: boolean;

    export const QuartetBeryl: typeof import("QuartetBeryl").default;
}

export {};
