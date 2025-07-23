module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'client/src/**/*.{ts,tsx}',
    '!client/src/**/*.d.ts',
    '!client/src/**/index.tsx',
    '!client/src/**/main.tsx',
    '!client/src/**/theme-provider.tsx',
    '!client/src/**/theme-switcher.tsx',
    '!client/src/**/ui/*',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@azure/msal-browser)/)',
  ],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
}; 