// Compila con MindAR, en Chromium sin ventana:
//   ar/marcador.mind  → solo la hoja impresa (ar/marcador.png);
//   ar/g<N>_hoja.mind → las fotos de la roca de cada geositio (ar/objetivos.json) y, al final, la hoja.
//                       El modo hoja de ar.html las sigue juntas para calibrarse solo.
//   con --rocas, ar/g<N>.mind → solo las fotos de la roca (lo que usa el modo "sobre la roca").
// Uso: node tools/compilar_marcador.mjs [--rocas] [N ...]   (necesita playwright; en la nube ya viene instalado;
//      en Windows: PLAYWRIGHT=<ruta a playwright-core> CHROMIUM="C:/Program Files/Google/Chrome/Application/chrome.exe")
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
for (const m of [process.env.PLAYWRIGHT, 'playwright', 'playwright-core', '/opt/node22/lib/node_modules/playwright'].filter(Boolean)) {
  try { ({ chromium } = require(m)); break; } catch { /* siguiente */ }
}

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TIPOS = { '.js': 'text/javascript', '.png': 'image/png', '.html': 'text/html', '.jpg': 'image/jpeg' };

const servidor = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (req.method === 'POST' && u === '/guardar') {
    const archivo = new URL(req.url, 'http://x').searchParams.get('archivo');
    if (!/^ar\/[\w]+\.mind$/.test(archivo)) { res.statusCode = 400; return res.end(); }
    const trozos = [];
    req.on('data', c => trozos.push(c));
    req.on('end', () => { fs.writeFileSync(path.join(RAIZ, archivo), Buffer.concat(trozos)); res.end('ok'); });
    return;
  }
  if (u === '/vacio') { res.setHeader('Content-Type', 'text/html'); return res.end('<!doctype html><title>compilar</title>'); }
  const f = path.join(RAIZ, u);
  if (!f.startsWith(RAIZ) || !fs.existsSync(f)) { res.statusCode = 404; return res.end(); }
  res.setHeader('Content-Type', TIPOS[path.extname(f)] || 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
});
await new Promise(ok => servidor.listen(8791, ok));

const nav = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const pag = await nav.newPage();
pag.on('pageerror', e => console.log('err', e.message));
await pag.goto('http://localhost:8791/vacio');
const objetivos = JSON.parse(fs.readFileSync(path.join(RAIZ, 'ar/objetivos.json'), 'utf8'));
const ROCAS = process.argv.includes('--rocas');
const pedidos = process.argv.slice(2).filter(a => a !== '--rocas');
const trabajos = [];
if (!pedidos.length && !ROCAS) trabajos.push({ archivo: 'ar/marcador.mind', imagenes: ['ar/marcador.png'] });
for (const [n, o] of Object.entries(objetivos)) {
  if (pedidos.length && !pedidos.includes(n)) continue;
  if (ROCAS) trabajos.push({ archivo: `ar/g${n}.mind`, imagenes: o.pares.map(p => p.obj) });
  else trabajos.push({ archivo: `ar/g${n}_hoja.mind`, imagenes: [...o.pares.map(p => p.obj), 'ar/marcador.png'] });
}
for (const tr of trabajos) {
  const t0 = Date.now();
  const r = await pag.evaluate(async tr => {
    window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16);
    const { Compiler } = await import('/js/vendor/mindar/mindar-image.prod.js');
    const cargar = src => new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = '/' + src; });
    const imgs = await Promise.all(tr.imagenes.map(cargar));
    const c = new Compiler();
    await c.compileImageTargets(imgs, () => { });
    const datos = c.exportData();
    const resp = await fetch('/guardar?archivo=' + encodeURIComponent(tr.archivo), { method: 'POST', body: datos });
    return { kb: Math.round(datos.byteLength / 1024), ok: resp.ok };
  }, tr);
  console.log(tr.archivo, tr.imagenes.length, 'imágenes', r, Math.round((Date.now() - t0) / 1000) + ' s');
}
await nav.close();
servidor.close();
