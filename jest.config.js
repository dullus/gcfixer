// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  roots: [
    '<rootDir>/src'
  ],
  setupFilesAfterEnv: [],
  testMatch: [
    '<rootDir>/src/**/*.{spec,test}.{js,ts}'
  ],
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|ts)$': '<rootDir>/node_modules/babel-jest'
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|ts)$'
  ],
  modulePaths: []
};
