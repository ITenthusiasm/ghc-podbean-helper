const path = require("path");

/** @type {import("@jest/types").Config.InitialOptions} */
module.exports = {
  rootDir: path.join(__dirname, ".."),
  collectCoverageFrom: ["<rootDir>/server/**/*.ts", "!<rootDir>/**/*.test.ts", "!server/index.ts"],
  coverageDirectory: "<rootDir>/coverage/server-only-run",
  displayName: "server",
  testEnvironment: "node", // default
  testMatch: ["<rootDir>/server/**/__tests__/*.test.ts"],
};
