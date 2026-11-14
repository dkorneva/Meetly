module.exports = {
  preset: "jest-expo",
  testMatch: ["<rootDir>/tests/**/*.test.ts?(x)"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  moduleNameMapper: { "\\.svg$": "<rootDir>/tests/mocks/svg.cjs" },
  clearMocks: true,
  collectCoverageFrom: [
    "src/**/*.tsx",
    "!src/**/*.styles.ts",
  ],
  coverageDirectory: "coverage",
};
