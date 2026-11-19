// publicador — prepara la carpeta publicar/ para el hosting
// Uso: node publicar.mjs
import { readdirSync, readFileSync, writeFileSync, existsSync, rmSync, copyFileSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const publicarDir = join(root, 'publicar');

// ── 1. Borrar y recrear publicar/ ──────────────────────────────────
if (existsSync(publicarDir)) {
  // Comprobación de seguridad: la ruta debe terminar en /publicar
  const end = publicarDir.endsWith('/publicar') || publicarDir.endsWith('\\publicar');
  if (!end) throw new Error('Ruta segura: publicarDir debe terminar en /publicar');
  rmSync(publicarDir, { recursive: true, force: true });
  console.log('🗑 Carpeta publicar/ borrada.');
}
mkdirSync(publicarDir, { recursive: true });

// ── 2. Regenerar contingut.js (misma lógica que build.mjs) ──────
for (const dir of readdirSync(root).filter(d => /^tema-\d+$/.test(d))) {
  const src = join(root, dir, 'manual.md');
  if (!existsSync(src)) continue;
  const md = readFileSync(src, 'utf8');
  writeFileSync(join(root, dir, 'contingut.js'),
    `// GENERADO por publicar.mjs — no editar a mano\nwindow.MANUAL_MD = ${JSON.stringify(md)};\n`
  );
  console.log(`✓ ${dir}/contingut.js (${md.length} caracteres)`);
}

// ── 3. Copiar archivos a publicar/ ─────────────────────────────────
const copiat = [];

function tamany(path) {
  try { return statSync(path).size; } catch { return 0; }
}

function registrar(rel) {
  copiat.push(rel);
}

// Archivos raíz (whitelist)
for (const f of ['index.html', '404.html', '.htaccess', 'manifest.webmanifest', 'sw.js']) {
  const src = join(root, f);
  if (existsSync(src)) {
    copyFileSync(src, join(publicarDir, f));
    registrar(f);
  }
}

// Carpeta assets/ completa (recursiva, solo archivos regulares)
const assetsSrc = join(root, 'assets');
const assetsDst = join(publicarDir, 'assets');
function copiaRecursiva(srcDir, dstDir, relPrefix) {
  mkdirSync(dstDir, { recursive: true });
  for (const f of readdirSync(srcDir)) {
    const src = join(srcDir, f);
    const dst = join(dstDir, f);
    const st = statSync(src);
    if (st.isDirectory()) {
      copiaRecursiva(src, dst, `${relPrefix}/${f}`);
    } else if (st.isFile()) {
      copyFileSync(src, dst);
      registrar(`${relPrefix}/${f}`);
    }
  }
}
if (existsSync(assetsSrc)) {
  copiaRecursiva(assetsSrc, assetsDst, 'assets');
}

// Temas: solo index.html, app.js, dades.js, contingut.js
for (const dir of readdirSync(root).filter(d => /^tema-\d+$/.test(d))) {
  const temaSrc = join(root, dir);
  const temaDst = join(publicarDir, dir);
  mkdirSync(temaDst, { recursive: true });
  for (const f of ['index.html', 'app.js', 'dades.js', 'contingut.js']) {
    const src = join(temaSrc, f);
    if (existsSync(src)) {
      copyFileSync(src, join(temaDst, f));
      registrar(`${dir}/${f}`);
    }
  }
}

// ── 5. Resumen ──────────────────────────────────────────────────────
const total = copiat.reduce((sum, rel) => sum + tamany(join(publicarDir, rel)), 0);
console.log(`\n📦 ${copiat.length} archivos copiados a publicar/`);
console.log(`💾 Tamaño total: ${(total / 1024).toFixed(1)} KB`);
console.log('---');
for (const f of copiat) {
  console.log(`  ${f}  (${tamany(join(publicarDir, f))} B)`);
}
