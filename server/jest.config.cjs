module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  verbose: true,
  rootDir: '.',
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/node_modules/**',
    '!src/**/index.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
