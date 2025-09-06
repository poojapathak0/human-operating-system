import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import 'jest-axe/extend-expect';
import { vi } from 'vitest';

// Mock the PWA virtual module for tests (not needed in unit env)
vi.mock('virtual:pwa-register', () => ({
	registerSW: () => () => Promise.resolve(),
}));
vi.mock('virtual:pwa-register/react', () => ({
	useRegisterSW: () => ({
		needRefresh: { subscribe: () => () => {} },
		offlineReady: { subscribe: () => () => {} },
		updateServiceWorker: () => Promise.resolve(),
	}),
}));
