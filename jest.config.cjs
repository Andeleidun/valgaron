/** @type {import('jest').Config} */
const config = {
  clearMocks: true,
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/packages/**/*.test.ts',
    '<rootDir>/mobile/src/**/*.test.ts',
  ],
  moduleNameMapper: {
    '^@valgaron/core$': '<rootDir>/packages/core/src/index.ts',
    '^@valgaron/core/(.*)$': '<rootDir>/packages/core/src/$1.ts',
    '^@valgaron/platform$': '<rootDir>/packages/platform/src/index.ts',
    '^@valgaron/ui-tokens$': '<rootDir>/packages/ui-tokens/src/index.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json',
      },
    ],
  },
};

module.exports = config;
