const path = require("path");

/** @type {import("@jest/types").Config.InitialOptions} */
module.exports = {
  rootDir: path.join(__dirname, ".."),
  collectCoverageFrom: [
    "<rootDir>/src/**/*.{ts,vue}",
    "!<rootDir>/src/**/*.test.ts",
    "!<rootDir>/src/main.ts",
  ],
  coverageDirectory: "<rootDir>/coverage/src-only-run",
  displayName: "client",
  moduleFileExtensions: ["ts", "vue", "js"],
  moduleNameMapper: {
    "@/(.*)": "<rootDir>/src/$1",
  },
  testEnvironment: "jest-environment-jsdom",
  testMatch: ["<rootDir>/src/**/__tests__/*.test.ts"],
  transform: { "\\.vue$": "vue3-jest", "\\.ts$": "babel-jest" },
};
