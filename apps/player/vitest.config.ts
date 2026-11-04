import { defineConfig } from 'vitest/config';

/**
 * Unit tests for the app's pure helpers only (phone normalisation, day and slot layout, booking
 * history): the modules that carry decisions and import nothing from React Native. Screens and
 * components stay covered by typecheck and lint in this iteration (ADR 0010).
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
