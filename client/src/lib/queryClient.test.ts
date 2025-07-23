import { QueryClient } from '@tanstack/react-query';
import { 
  setAccessTokenProvider, 
  apiRequest, 
  getQueryFn, 
  queryClient 
} from './queryClient';

// Mock fetch globally
global.fetch = jest.fn();

describe('QueryClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the access token provider
    setAccessTokenProvider(() => Promise.resolve(null));
  });

  describe('setAccessTokenProvider', () => {
    it('should set the access token provider', () => {
      const mockProvider = jest.fn().mockResolvedValue('test-token');
      setAccessTokenProvider(mockProvider);
      
      // This is tested indirectly through apiRequest
      expect(mockProvider).not.toHaveBeenCalled();
    });
  });

  describe('apiRequest', () => {
    it('should make a successful request without data', async () => {
      const mockResponse = { ok: true, statusText: 'OK' };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiRequest('GET', '/api/test');

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {},
        body: undefined,
        credentials: 'include',
      });
      expect(result).toBe(mockResponse);
    });

    it('should make a successful request with data', async () => {
      const mockResponse = { ok: true, statusText: 'OK' };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const testData = { test: 'data' };
      const result = await apiRequest('POST', '/api/test', testData);

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
        credentials: 'include',
      });
      expect(result).toBe(mockResponse);
    });

    it('should include authorization header when token is available', async () => {
      const mockResponse = { ok: true, statusText: 'OK' };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const mockProvider = jest.fn().mockResolvedValue('test-token');
      setAccessTokenProvider(mockProvider);

      await apiRequest('GET', '/api/test');

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: { Authorization: 'Bearer test-token' },
        body: undefined,
        credentials: 'include',
      });
    });

    it('should not include authorization header when token is null', async () => {
      const mockResponse = { ok: true, statusText: 'OK' };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const mockProvider = jest.fn().mockResolvedValue(null);
      setAccessTokenProvider(mockProvider);

      await apiRequest('GET', '/api/test');

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {},
        body: undefined,
        credentials: 'include',
      });
    });

    it('should throw error for non-ok response', async () => {
      const mockResponse = { 
        ok: false, 
        status: 404, 
        statusText: 'Not Found',
        text: jest.fn().mockResolvedValue('Not found')
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(apiRequest('GET', '/api/test')).rejects.toThrow('404: Not found');
    });

    it('should throw error with status text when response text is empty', async () => {
      const mockResponse = { 
        ok: false, 
        status: 500, 
        statusText: 'Internal Server Error',
        text: jest.fn().mockResolvedValue('')
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(apiRequest('GET', '/api/test')).rejects.toThrow('500: Internal Server Error');
    });
  });

  describe('getQueryFn', () => {
    it('should return query function that throws on 401 when on401 is throw', async () => {
      const mockResponse = { 
        ok: false, 
        status: 401, 
        statusText: 'Unauthorized',
        text: jest.fn().mockResolvedValue('Unauthorized')
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const queryFn = getQueryFn({ on401: 'throw' });
      
      await expect(queryFn({ queryKey: ['/api/test'] } as any)).rejects.toThrow('401: Unauthorized');
    });

    it('should return query function that returns null on 401 when on401 is returnNull', async () => {
      const mockResponse = { 
        ok: false, 
        status: 401, 
        statusText: 'Unauthorized',
        text: jest.fn().mockResolvedValue('Unauthorized')
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const queryFn = getQueryFn({ on401: 'returnNull' });
      
      const result = await queryFn({ queryKey: ['/api/test'] } as any);
      expect(result).toBeNull();
    });

    it('should make successful request and return JSON', async () => {
      const mockData = { test: 'data' };
      const mockResponse = { 
        ok: true, 
        statusText: 'OK',
        json: jest.fn().mockResolvedValue(mockData)
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const queryFn = getQueryFn({ on401: 'throw' });
      
      const result = await queryFn({ queryKey: ['/api/test'] } as any);
      expect(result).toEqual(mockData);
    });

    it('should include authorization header when token is available', async () => {
      const mockResponse = { 
        ok: true, 
        statusText: 'OK',
        json: jest.fn().mockResolvedValue({})
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const mockProvider = jest.fn().mockResolvedValue('test-token');
      setAccessTokenProvider(mockProvider);

      const queryFn = getQueryFn({ on401: 'throw' });
      await queryFn({ queryKey: ['/api/test'] } as any);

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        headers: { Authorization: 'Bearer test-token' },
        credentials: 'include',
      });
    });

    it('should not include authorization header when token is null', async () => {
      const mockResponse = { 
        ok: true, 
        statusText: 'OK',
        json: jest.fn().mockResolvedValue({})
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const mockProvider = jest.fn().mockResolvedValue(null);
      setAccessTokenProvider(mockProvider);

      const queryFn = getQueryFn({ on401: 'throw' });
      await queryFn({ queryKey: ['/api/test'] } as any);

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        headers: {},
        credentials: 'include',
      });
    });
  });

  describe('queryClient', () => {
    it('should be an instance of QueryClient', () => {
      expect(queryClient).toBeInstanceOf(QueryClient);
    });

    it('should have default options configured', () => {
      const options = queryClient.getDefaultOptions();
      
      expect(options.queries?.refetchInterval).toBe(false);
      expect(options.queries?.refetchOnWindowFocus).toBe(false);
      expect(options.queries?.staleTime).toBe(Infinity);
      expect(options.queries?.retry).toBe(false);
      expect(options.mutations?.retry).toBe(false);
    });
  });
}); 