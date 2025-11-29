import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure SharedArrayBuffer exists before Vitest spins up jsdom workers
if (typeof globalThis.SharedArrayBuffer === 'undefined') {
  globalThis.SharedArrayBuffer = ArrayBuffer;
}

// Older Node versions don't expose the resizable/growable ArrayBuffer APIs that
// new jsdom/whatwg-url expect, so we polyfill safe, non-resizable versions.
const abResizable = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'resizable');
if (!abResizable) {
  Object.defineProperty(ArrayBuffer.prototype, 'resizable', { get: () => false });
}
const abMaxByteLength = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'maxByteLength');
if (!abMaxByteLength) {
  Object.defineProperty(ArrayBuffer.prototype, 'maxByteLength', { get() { return this.byteLength; } });
}
if (typeof SharedArrayBuffer !== 'undefined') {
  const sabGrowable = Object.getOwnPropertyDescriptor(SharedArrayBuffer.prototype, 'growable');
  if (!sabGrowable) {
    Object.defineProperty(SharedArrayBuffer.prototype, 'growable', { get: () => false });
  }
  const sabMaxByteLength = Object.getOwnPropertyDescriptor(SharedArrayBuffer.prototype, 'maxByteLength');
  if (!sabMaxByteLength) {
    Object.defineProperty(SharedArrayBuffer.prototype, 'maxByteLength', { get() { return this.byteLength; } });
  }
}

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    testTimeout: 60000,
    hookTimeout: 60000,
    // Use thread pool in single-thread mode to avoid fork failures in constrained environments
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html', 'lcov'],
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'src/test/',
        // 'src/constants/**',
        // 'src/components/Campaign/**',
        // 'src/components/Creator/**',
        // 'src/components/CharCreation/**',
        // 'src/components/EncounterCreation/**',
        // 'src/components/LootCreation/**',
        // 'src/components/NPCCreation/**',
        // 'src/components/Homebrew/**',
        // 'src/components/PC/**',
        // 'src/components/Profile/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.test.{ts,tsx}',
        '**/mockData',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
