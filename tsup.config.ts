import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  target: 'node22',
  platform: 'node',
  // Required for decorator metadata
  esbuildOptions(options) {
    options.keepNames = true;
  },
});
