// Genera tema-XX/contingut.js a partir de tema-XX/manual.md
// Uso: node build.mjs            (todos los temas con manual.md)
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
for (const dir of readdirSync(root).filter(d => /^tema-\d+$/.test(d))) {
  const src = join(root, dir, 'manual.md');
  if (!existsSync(src)) continue;
  const md = readFileSync(src, 'utf8');
  writeFileSync(join(root, dir, 'contingut.js'), `// GENERADO por build.mjs — no editar a mano\nwindow.MANUAL_MD = ${JSON.stringify(md)};\n`);
  console.log(`✓ ${dir}/contingut.js (${md.length} caracteres)`);
}
