import * as React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './use-auth';
import { msalInstance, loginRequest } from '@/lib/auth-config';
import { setAccessTokenProvider } from '@/lib/queryClient';

// Mock @azure/msal-browser
jest.mock('@azure/msal-browser', () => ({
  InteractionRequiredAuthError: class extends Error {
    constructor() {
      super('Interaction required');
      this.name = 'InteractionRequiredAuthError';
    }
  },
}));

// Mock auth-config
jest.mock('@/lib/auth-config', () => ({
  msalInstance: {
    initialize: jest.fn(),
    handleRedirectPromise: jest.fn(),
    getAllAccounts: jest.fn(),
    loginRedirect: jest.fn(),
    logoutRedirect: jest.fn(),
    acquireTokenSilent: jest.fn(),
    acquireTokenRedirect: jest.fn(),
  },
  loginRequest: {
    scopes: ['openid', 'profile', 'email', 'User.Read'],
  },
}));

// Mock queryClient
jest.mock('@/lib/queryClient', () => ({
  setAccessTokenProvider: jest.fn(),
}));

// Mock useToast
const mockToast = jest.fn();
jest.mock('./use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AuthProvider', () => {
    it('should provide auth context', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBeDefined();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(typeof result.current.isLoading).toBe('boolean');
      expect(result.current.login).toBeInstanceOf(Function);
      expect(result.current.logout).toBeInstanceOf(Function);
      expect(result.current.getAccessToken).toBeInstanceOf(Function);
    });

    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
    });
  });

  describe('initialization', () => {
    it.skip('should initialize MSAL and set up access token provider', async () => {
      const mockInitialize = msalInstance.initialize as jest.Mock;
      const mockHandleRedirectPromise = msalInstance.handleRedirectPromise as jest.Mock;
      const mockGetAllAccounts = msalInstance.getAllAccounts as jest.Mock;

      mockInitialize.mockResolvedValue(undefined);
      mockHandleRedirectPromise.mockResolvedValue(null);
      mockGetAllAccounts.mockReturnValue([]);

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      // Wait for initialization to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockInitialize).toHaveBeenCalled();
      expect(mockHandleRedirectPromise).toHaveBeenCalled();
      expect(mockGetAllAccounts).toHaveBeenCalled();
      expect(setAccessTokenProvider).toHaveBeenCalledWith(result.current.getAccessToken);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle redirect response and set user', async () => {
      const mockAccount = {
        name: 'Test User',
        username: 'test@example.com',
        homeAccountId: 'test-id',
      };

      const mockRedirectResponse = {
        account: mockAccount,
        accessToken: 'test-token',
      };

      const mockInitialize = msalInstance.initialize as jest.Mock;
      const mockHandleRedirectPromise = msalInstance.handleRedirectPromise as jest.Mock;
      const mockGetAllAccounts = msalInstance.getAllAccounts as jest.Mock;

      mockInitialize.mockResolvedValue(undefined);
      mockHandleRedirectPromise.mockResolvedValue(mockRedirectResponse);
      mockGetAllAccounts.mockReturnValue([]);

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.user).toEqual(mockAccount);
      expect(result.current.isAuthenticated).toBe(true);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Login Successful',
        description: 'Welcome, Test User!',
      });
    });

    it('should set user from existing accounts when no redirect response', async () => {
      const mockAccount = {
        name: 'Existing User',
        username: 'existing@example.com',
        homeAccountId: 'existing-id',
      };

      const mockInitialize = msalInstance.initialize as jest.Mock;
      const mockHandleRedirectPromise = msalInstance.handleRedirectPromise as jest.Mock;
      const mockGetAllAccounts = msalInstance.getAllAccounts as jest.Mock;

      mockInitialize.mockResolvedValue(undefined);
      mockHandleRedirectPromise.mockResolvedValue(null);
      mockGetAllAccounts.mockReturnValue([mockAccount]);

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.user).toEqual(mockAccount);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle initialization error', async () => {
      const mockInitialize = msalInstance.initialize as jest.Mock;
      mockInitialize.mockRejectedValue(new Error('Initialization failed'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Authentication Error',
        description: 'Failed to initialize authentication',
        variant: 'destructive',
      });
    });
  });

  describe('login', () => {
    it('should initiate login redirect', async () => {
      const mockLoginRedirect = msalInstance.loginRedirect as jest.Mock;
      mockLoginRedirect.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0)); // Wait for initialization
        await result.current.login();
      });

      expect(mockLoginRedirect).toHaveBeenCalledWith(loginRequest);
    });

    it('should handle login error', async () => {
      const mockLoginRedirect = msalInstance.loginRedirect as jest.Mock;
      mockLoginRedirect.mockRejectedValue(new Error('Login failed'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0)); // Wait for initialization
        await result.current.login();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Login Failed',
        description: 'Failed to sign in. Please try again.',
        variant: 'destructive',
      });
    });
  });

  describe('logout', () => {
    it('should initiate logout redirect and clear user state', async () => {
      const mockLogoutRedirect = msalInstance.logoutRedirect as jest.Mock;
      mockLogoutRedirect.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      // Set initial user state
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0)); // Wait for initialization
        result.current.user = { name: 'Test User' } as any;
        result.current.isAuthenticated = true;
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockLogoutRedirect).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle logout error', async () => {
      const mockLogoutRedirect = msalInstance.logoutRedirect as jest.Mock;
      mockLogoutRedirect.mockRejectedValue(new Error('Logout failed'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0)); // Wait for initialization
        await result.current.logout();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Logout Error',
        description: 'Failed to log out. Please try again.',
        variant: 'destructive',
      });
    });
  });

  describe('getAccessToken', () => {
    it('should return access token when user is authenticated', async () => {
      const mockAccount = {
        name: 'Test User',
        username: 'test@example.com',
        homeAccountId: 'test-id',
      };

      const mockGetAllAccounts = msalInstance.getAllAccounts as jest.Mock;
      const mockAcquireTokenSilent = msalInstance.acquireTokenSilent as jest.Mock;

      mockGetAllAccounts.mockReturnValue([mockAccount]);
      mockAcquireTokenSilent.mockResolvedValue({
        accessToken: 'test-access-token',
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0)); // Wait for initialization
      });

      const token = await result.current.getAccessToken();

      expect(token).toBe('test-access-token');
      expect(mockAcquireTokenSilent).toHaveBeenCalledWith({
        scopes: loginRequest.scopes,
        account: mockAccount,
      });
    });

    it('should return null when no user is authenticated', async () => {
      const mockGetAllAccounts = msalInstance.getAllAccounts as jest.Mock;
      mockGetAllAccounts.mockReturnValue([]);

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0)); // Wait for initialization
      });

      const token = await result.current.getAccessToken();

      expect(token).toBeNull();
    });

    it('should handle InteractionRequiredAuthError by redirecting', async () => {
      const { InteractionRequiredAuthError } = require('@azure/msal-browser');
      const mockAccount = {
        name: 'Test User',
        username: 'test@example.com',
        homeAccountId: 'test-id',
      };

      const mockGetAllAccounts = msalInstance.getAllAccounts as jest.Mock;
      const mockAcquireTokenSilent = msalInstance.acquireTokenSilent as jest.Mock;
      const mockAcquireTokenRedirect = msalInstance.acquireTokenRedirect as jest.Mock;

      mockGetAllAccounts.mockReturnValue([mockAccount]);
      mockAcquireTokenSilent.mockRejectedValue(new InteractionRequiredAuthError());
      mockAcquireTokenRedirect.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0)); // Wait for initialization
      });

      const token = await result.current.getAccessToken();

      expect(token).toBeNull();
      expect(mockAcquireTokenRedirect).toHaveBeenCalledWith(loginRequest);
    });

    it('should handle other token acquisition errors', async () => {
      const mockAccount = {
        name: 'Test User',
        username: 'test@example.com',
        homeAccountId: 'test-id',
      };

      const mockGetAllAccounts = msalInstance.getAllAccounts as jest.Mock;
      const mockAcquireTokenSilent = msalInstance.acquireTokenSilent as jest.Mock;

      mockGetAllAccounts.mockReturnValue([mockAccount]);
      mockAcquireTokenSilent.mockRejectedValue(new Error('Token acquisition failed'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0)); // Wait for initialization
      });

      const token = await result.current.getAccessToken();

      expect(token).toBeNull();
    });
  });

  describe('access token provider setup', () => {
    it.skip('should update access token provider when user changes', async () => {
      const mockInitialize = msalInstance.initialize as jest.Mock;
      const mockHandleRedirectPromise = msalInstance.handleRedirectPromise as jest.Mock;
      const mockGetAllAccounts = msalInstance.getAllAccounts as jest.Mock;

      mockInitialize.mockResolvedValue(undefined);
      mockHandleRedirectPromise.mockResolvedValue(null);
      mockGetAllAccounts.mockReturnValue([]);

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should be called initially
      expect(setAccessTokenProvider).toHaveBeenCalledWith(result.current.getAccessToken);

      // Simulate user change
      await act(async () => {
        result.current.user = { name: 'New User' } as any;
      });

      // Should be called again when user changes
      expect(setAccessTokenProvider).toHaveBeenCalledTimes(2);
    });
  });
}); 