import '@testing-library/jest-dom';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

// basic matchMedia polyfill for components that use it
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: (query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false
	})
});

// ResizeObserver polyfill used by some UI libs
// Minimal implementation sufficient for tests
global.ResizeObserver = global.ResizeObserver || class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// make import.meta.env available as a fallback for code that references it at runtime
if (typeof (global as any).importMetaEnv === 'undefined') {
  // Jest doesn't support import.meta; provide a fallback accessible via import.meta.env in sources
  Object.defineProperty(global, 'importMetaEnv', {
    value: process.env || {},
    writable: false
  });
}
