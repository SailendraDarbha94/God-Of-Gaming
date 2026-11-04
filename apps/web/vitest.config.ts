import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // `src/lib/env.ts` parses `process.env` at import; with the default source (`supabase`) and no
    // Supabase variables that import would throw before any test runs. The tests exercise
    // `parseEnv` with their own inputs.
    env: { GOG_DATA_SOURCE: 'fixtures' },
  },
});
