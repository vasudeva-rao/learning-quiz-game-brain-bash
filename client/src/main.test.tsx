import { createRoot } from 'react-dom/client';
import App from './App';

// Mock react-dom/client
jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn(),
  })),
}));

// Mock App component
jest.mock('./App', () => {
  return function MockApp() {
    return <div data-testid="app">Mock App</div>;
  };
});

// Mock index.css
jest.mock('./index.css', () => ({}));

describe('main.tsx', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock document.getElementById
    document.getElementById = jest.fn(() => document.createElement('div'));
  });

  it('should create root and render App', () => {
    // Import main.tsx to trigger the execution
    require('./main.tsx');

    expect(createRoot).toHaveBeenCalled();
    expect(document.getElementById).toHaveBeenCalledWith('root');
  });

  it('should handle missing root element gracefully', () => {
    // Mock getElementById to return null
    document.getElementById = jest.fn(() => null);

    // This should not throw an error
    expect(() => {
      require('./main.tsx');
    }).not.toThrow();
  });
}); 