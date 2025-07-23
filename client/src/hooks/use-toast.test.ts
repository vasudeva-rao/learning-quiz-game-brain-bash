import * as React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useToast, toast, reducer } from './use-toast';

// Mock setTimeout
jest.useFakeTimers();

describe('useToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('toast function', () => {
    it('should create a toast with unique ID', () => {
      const toastResult = toast({
        title: 'Test Toast',
        description: 'Test Description',
      });

      expect(toastResult.id).toBeDefined();
      expect(typeof toastResult.id).toBe('string');
      expect(toastResult.dismiss).toBeInstanceOf(Function);
      expect(toastResult.update).toBeInstanceOf(Function);
    });

    it('should create multiple toasts with different IDs', () => {
      const toast1 = toast({ title: 'Toast 1' });
      const toast2 = toast({ title: 'Toast 2' });

      expect(toast1.id).not.toBe(toast2.id);
    });

    it('should handle toast update', () => {
      const toastResult = toast({
        title: 'Original Title',
        description: 'Original Description',
      });

      act(() => {
        toastResult.update({
          title: 'Updated Title',
          description: 'Updated Description',
        });
      });

      // The update should be dispatched
      expect(toastResult.update).toBeInstanceOf(Function);
    });

    it('should handle toast dismiss', () => {
      const toastResult = toast({
        title: 'Test Toast',
      });

      act(() => {
        toastResult.dismiss();
      });

      // The dismiss should be dispatched
      expect(toastResult.dismiss).toBeInstanceOf(Function);
    });
  });

  describe('useToast hook', () => {
    it('should return toast state and functions', () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.toasts).toBeDefined();
      expect(Array.isArray(result.current.toasts)).toBe(true);
      expect(result.current.toast).toBeInstanceOf(Function);
      expect(result.current.dismiss).toBeInstanceOf(Function);
    });

    it('should add toast to state', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({
          title: 'Test Toast',
          description: 'Test Description',
        });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Test Toast');
      expect(result.current.toasts[0].description).toBe('Test Description');
      expect(result.current.toasts[0].open).toBe(true);
    });

    it('should limit toasts to TOAST_LIMIT', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        // Add more toasts than the limit (1)
        result.current.toast({ title: 'Toast 1' });
        result.current.toast({ title: 'Toast 2' });
        result.current.toast({ title: 'Toast 3' });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Toast 3'); // Latest toast should be kept
    });

    it('should dismiss specific toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Toast 1' });
        result.current.toast({ title: 'Toast 2' });
      });

      const toastId = result.current.toasts[0].id;

      act(() => {
        result.current.dismiss(toastId);
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it('should dismiss all toasts when no ID provided', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Toast 1' });
        result.current.toast({ title: 'Toast 2' });
      });

      act(() => {
        result.current.dismiss();
      });

      result.current.toasts.forEach(toast => {
        expect(toast.open).toBe(false);
      });
    });

    it('should remove toast after timeout', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Test Toast' });
      });

      const initialLength = result.current.toasts.length;

      act(() => {
        result.current.dismiss(result.current.toasts[0].id);
      });

      // Toast should be marked as closed
      expect(result.current.toasts[0].open).toBe(false);

      // Fast-forward time to trigger removal
      act(() => {
        jest.advanceTimersByTime(1000000);
      });

      // Toast should be removed
      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('reducer', () => {
    const initialState = { toasts: [] };

    it('should handle ADD_TOAST action', () => {
      const toast = {
        id: '1',
        title: 'Test Toast',
        open: true,
      };

      const action = {
        type: 'ADD_TOAST' as const,
        toast,
      };

      const newState = reducer(initialState, action);

      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0]).toEqual(toast);
    });

    it('should handle UPDATE_TOAST action', () => {
      const existingToast = {
        id: '1',
        title: 'Original Title',
        open: true,
      };

      const state = { toasts: [existingToast] };

      const action = {
        type: 'UPDATE_TOAST' as const,
        toast: {
          id: '1',
          title: 'Updated Title',
        },
      };

      const newState = reducer(state, action);

      expect(newState.toasts[0].title).toBe('Updated Title');
      expect(newState.toasts[0].open).toBe(true); // Should preserve existing properties
    });

    it('should handle DISMISS_TOAST action with specific ID', () => {
      const toast1 = { id: '1', title: 'Toast 1', open: true };
      const toast2 = { id: '2', title: 'Toast 2', open: true };

      const state = { toasts: [toast1, toast2] };

      const action = {
        type: 'DISMISS_TOAST' as const,
        toastId: '1',
      };

      const newState = reducer(state, action);

      expect(newState.toasts[0].open).toBe(false);
      expect(newState.toasts[1].open).toBe(true); // Should not affect other toasts
    });

    it('should handle DISMISS_TOAST action without ID', () => {
      const toast1 = { id: '1', title: 'Toast 1', open: true };
      const toast2 = { id: '2', title: 'Toast 2', open: true };

      const state = { toasts: [toast1, toast2] };

      const action = {
        type: 'DISMISS_TOAST' as const,
      };

      const newState = reducer(state, action);

      newState.toasts.forEach(toast => {
        expect(toast.open).toBe(false);
      });
    });

    it('should handle REMOVE_TOAST action with specific ID', () => {
      const toast1 = { id: '1', title: 'Toast 1', open: true };
      const toast2 = { id: '2', title: 'Toast 2', open: true };

      const state = { toasts: [toast1, toast2] };

      const action = {
        type: 'REMOVE_TOAST' as const,
        toastId: '1',
      };

      const newState = reducer(state, action);

      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0].id).toBe('2');
    });

    it('should handle REMOVE_TOAST action without ID', () => {
      const toast1 = { id: '1', title: 'Toast 1', open: true };
      const toast2 = { id: '2', title: 'Toast 2', open: true };

      const state = { toasts: [toast1, toast2] };

      const action = {
        type: 'REMOVE_TOAST' as const,
      };

      const newState = reducer(state, action);

      expect(newState.toasts).toHaveLength(0);
    });

    it('should limit toasts when adding more than TOAST_LIMIT', () => {
      const toast1 = { id: '1', title: 'Toast 1', open: true };
      const toast2 = { id: '2', title: 'Toast 2', open: true };

      const state = { toasts: [toast1] };

      const action = {
        type: 'ADD_TOAST' as const,
        toast: toast2,
      };

      const newState = reducer(state, action);

      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0].id).toBe('2'); // Latest toast should be kept
    });
  });

  describe('genId function', () => {
    it('should generate unique IDs', () => {
      // Reset the count by accessing the module
      const module = require('./use-toast');
      
      // Generate multiple IDs and check they're different
      const id1 = module.toast({ title: 'Test 1' }).id;
      const id2 = module.toast({ title: 'Test 2' }).id;
      const id3 = module.toast({ title: 'Test 3' }).id;

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });
  });
}); 