// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  collectCoverage: true,
  coverageReporters: ['text', 'json-summary', 'html'],
  coverageDirectory: './test/coverage/',
  roots: ['<rootDir>/src'],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!<rootDir>/src/index.ts',
    '!<rootDir>/src/interfaces.ts',
    '!<rootDir>/node_modules/',
    '!src/**/*.d.ts',
    '!**/*.test.ts'
  ],
  setupFilesAfterEnv: [],
  testMatch: ['<rootDir>/src/**/*.{spec,test}.{js,ts}'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|ts)$': '<rootDir>/node_modules/babel-jest'
  },
  transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\].+\\.(js|ts)$']
};
