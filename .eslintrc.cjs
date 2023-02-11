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
        "header",
    ],
    globals,
    overrides: [
        {
            files: ["*.svelte"],
            processor: "svelte3/svelte3",
            rules: {
                "header/header": "off",
            }
        },
    ],
    settings: {
        "svelte3/typescript": true,
        // Yes.
        "svelte3/ignore-warnings": (
            /** @param {import("svelte/types/compiler/interfaces").Warning} w */
            ({ code, message }) => (
                code === "missing-declaration"
                    && Object.keys(globals).some(g => message.startsWith(`'${g}'`))
                // TETR.IO already handles key events for all elements, so not an issue.
                || code === "a11y-click-events-have-key-events"
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
        "header/header": [
            "error",
            "block", [
                "",
                " * Quartet, a client mod for TETR.IO",
                { pattern: " \\* Copyright \\(c\\) \\d{4}", template: ` * Copyright (c) ${new Date().getFullYear()} Sofia Lima and contributors` },
                " *",
                " * This program is free software: you can redistribute it and/or modify",
                " * it under the terms of the GNU General Public License as published by",
                " * the Free Software Foundation, either version 3 of the License, or",
                " * (at your option) any later version.",
                " *",
                " * This program is distributed in the hope that it will be useful,",
                " * but WITHOUT ANY WARRANTY; without even the implied warranty of",
                " * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the",
                " * GNU General Public License for more details.",
                " *",
                " * You should have received a copy of the GNU General Public License",
                " * along with this program.  If not, see <https://www.gnu.org/licenses/>.",
                " "
            ],
            2
        ],
        "indent": ["error", 4],
        "linebreak-style": ["error", "unix"],
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
