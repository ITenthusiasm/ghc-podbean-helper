module.exports = {
  moduleFileExtensions: ["ts", "vue", "js"],
  moduleNameMapper: {
    "@/(.*)": "<rootDir>/src/$1",
  },
  transform: { "\\.vue$": "vue-jest", "\\.ts$": "ts-jest" },
};
