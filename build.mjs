import { build } from 'esbuild';
import { rm } from 'fs/promises';
await rm('dist', { recursive: true, force: true });
await build({
  entryPoints: ['src/index.ts'],
  platform: 'node', bundle: true, format: 'esm',
  outdir: 'dist', outExtension: { '.js': '.mjs' },
  banner: {
    js: `import { createRequire as __cr } from 'node:module';
import __p from 'node:path'; import __u from 'node:url';
globalThis.require = __cr(import.meta.url);
globalThis.__filename = __u.fileURLToPath(import.meta.url);
globalThis.__dirname = __p.dirname(globalThis.__filename);`
  }
});
console.log('Build complete');
