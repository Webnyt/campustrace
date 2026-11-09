import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['server.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'server.js',
  packages: 'external',
});
