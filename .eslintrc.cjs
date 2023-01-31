const globals = {
    QUARTET_VERSION: "readonly",
};

/** @type {import("eslint").ESLint.ConfigData & { rules: import("eslint/rules").ESLintRules}} */
module.exports = {
    root: true,
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    parser: "@typescript-eslint/parser",
    plugins: [
        "svelte3",
        "@typescript-eslint",
        "simple-import-sort",
    ],
    globals,
    overrides: [
        {
            files: ["*.svelte"],
            processor: "svelte3/svelte3",
        },
    ],
    settings: {
        "svelte3/typescript": true,
        // Yes.
        "svelte3/ignore-warnings": (
            /** @param {import("svelte/types/compiler/interfaces").Warning} w */
            ({ code, message }) => (
                code === "missing-declaration" && Object.keys(globals).some(g => message.startsWith(`'${g}'`))
            )
        ),
    },
    rules: {
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-var-requires": "off",
        "array-bracket-spacing": "error",
        "arrow-body-style": ["error", "as-needed"],
        "arrow-parens": ["error", "as-needed"],
        "arrow-spacing": "error",
        "comma-dangle": ["error", "only-multiline"],
        "comma-spacing": "error",
        "dot-notation": "error",
        "eol-last": ["error", "always"],
        "eqeqeq": ["error", "always", { null: "ignore" }],
        "indent": ["error", 4],
        "no-duplicate-imports": "error",
        "no-self-compare": "error",
        "no-trailing-spaces": "error",
        "no-var": "error",
        "object-curly-spacing": ["error", "always"],
        "prefer-const": "error",
        "quote-props": ["error", "consistent-as-needed"],
        "quotes": ["error", "double", { avoidEscape: true }],
        "semi": ["error", "always"],
        "simple-import-sort/exports": "error",
        "simple-import-sort/imports": "error",
    },
};
