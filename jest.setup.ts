import '@testing-library/jest-dom';

// Mock import.meta.env for all tests
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_BACKEND_HOST: 'localhost',
        VITE_BACKEND_PORT: '5000',
      }
    }
  },
  configurable: true,
});

// Polyfill TextEncoder for tests
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
} 