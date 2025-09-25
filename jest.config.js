module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: ['**/*.test.js'],
  verbose: true,
  collectCoverageFrom: [
    '*.js',
    '!jest.config.js',
    '!coverage/**'
  ]
};
