module.exports = {
  preset: "jest-expo",
  testMatch: ["<rootDir>/tests/**/*.test.ts?(x)"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  moduleNameMapper: { "\\.svg$": "<rootDir>/tests/mocks/svg.cjs" },
  clearMocks: true,
  transform: {
    "\\.[jt]sx?$": ["babel-jest", { presets: ["babel-preset-expo"], plugins: ["dynamic-import-node"] }],
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "html", "lcov", "json", "json-summary"],
  coverageThreshold: {
    global: { statements: 94, branches: 85, functions: 90, lines: 95 },
  },
};
