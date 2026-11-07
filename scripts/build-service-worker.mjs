// Bundles the background service worker next to Angular's `ngsw-worker.js` after `ng build`.
import { build } from 'esbuild';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const outdir = `${root}dist/clima-app/browser`;

if (!existsSync(`${outdir}/ngsw-worker.js`)) {
  console.error(`No se encontró ngsw-worker.js en ${outdir}. Ejecuta "ng build" primero.`);
  process.exit(1);
}

await build({
  entryPoints: [`${root}src/service-worker/background-check.ts`],
  outfile: `${outdir}/sw.js`,
  bundle: true,
  format: 'iife',
  target: 'es2022',
  minify: true,
  tsconfig: `${root}tsconfig.worker.json`,
  banner: { js: "importScripts('./ngsw-worker.js');" },
  logLevel: 'info',
});
