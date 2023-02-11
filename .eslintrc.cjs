/** @type {import("eslint").ESLint.ConfigData & { rules: import("eslint/rules").ESLintRules}} */
module.exports = {
    root: true,
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:svelte/recommended"],
    parser: "@typescript-eslint/parser",
    overrides: [
        {
            files: ["*.svelte"],
            parser: "svelte-eslint-parser",
            parserOptions: {
                parser: "@typescript-eslint/parser",
            },
        },
        {
            files: ["*.svelte", ".eslintrc.*"],
            rules: { "header/header": "off" },
        }
    ],
    plugins: ["svelte", "@typescript-eslint", "header"],
    globals: {
        QUARTET_VERSION: "readonly",
    },
    rules: {
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-var-requires": "off",
        "svelte/valid-compile": ["error", { ignoreWarnings: true }],
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
        "linebreak-style": ["error", "unix"],
        "no-duplicate-imports": "error",
        "no-self-compare": "error",
        "no-trailing-spaces": "error",
        "no-var": "error",
        "prefer-const": "error",
    },
};
