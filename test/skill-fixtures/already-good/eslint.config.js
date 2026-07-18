// ESLint 9 flat config.
export default [
  {
    files: ["src/**/*.ts", "test/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      eqeqeq: "error",
      "no-implicit-coercion": "error",
    },
  },
];
