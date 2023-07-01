module.exports = {
  roots: ["<rootDir>/test"],
  setupFiles: ["<rootDir>/src/setup.ts"],
  testEnvironment: "node",
  moduleFileExtensions: ["js", "ts"],
  testMatch: ["**/*.test.ts"],
  testRunner: "jest-circus/runner",
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  clearMocks: true,
  verbose: true,
};
