// Mock import.meta.env for Jest compatibility - MUST be at the very top
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_MSAL_CLIENT_ID: 'test-client-id',
        VITE_MSAL_AUTHORITY: 'https://login.microsoftonline.com/common',
        VITE_MSAL_REDIRECT_URI: 'http://localhost:5000',
      }
    }
  },
  configurable: true,
});

import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, loginRequest, msalInstance, initializeMsal } from './auth-config';

// Mock @azure/msal-browser
jest.mock('@azure/msal-browser', () => ({
  PublicClientApplication: jest.fn(),
  Configuration: jest.fn(),
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:5000',
  },
  writable: true,
});


// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe('Auth Config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('msalConfig', () => {
    it('should have correct auth configuration', () => {
      expect(msalConfig.auth).toEqual({
        clientId: 'test-client-id',
        authority: 'https://login.microsoftonline.com/common',
        redirectUri: 'http://localhost:5000',
      });
    });

    it('should have correct cache configuration', () => {
      expect(msalConfig.cache).toEqual({
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false,
      });
    });

    it('should have correct system configuration', () => {
      expect(msalConfig.system).toEqual({
        loggerOptions: {
          loggerCallback: expect.any(Function),
          logLevel: 3,
        },
      });
    });
  });

  describe('loginRequest', () => {
    it('should have correct scopes', () => {
      expect(loginRequest.scopes).toEqual(['User.Read']);
    });
  });

  describe('msalInstance', () => {
    it('should be an instance of PublicClientApplication', () => {
      expect(msalInstance).toBeInstanceOf(PublicClientApplication);
    });
  });

  describe('initializeMsal', () => {
    it('should return the msal instance', () => {
      const instance = initializeMsal();
      expect(instance).toBe(msalInstance);
    });
  });
}); 