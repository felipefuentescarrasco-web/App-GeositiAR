// Compila ar/marcador.png en ar/marcador.mind con el compilador de MindAR, en Chromium sin ventana.
// Uso: node tools/compilar_marcador.mjs   (necesita playwright; en la nube ya viene instalado)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TIPOS = { '.js': 'text/javascript', '.png': 'image/png', '.html': 'text/html', '.jpg': 'image/jpeg' };

const servidor = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (req.method === 'POST' && u === '/guardar') {
    const trozos = [];
    req.on('data', c => trozos.push(c));
    req.on('end', () => { fs.writeFileSync(path.join(RAIZ, 'ar/marcador.mind'), Buffer.concat(trozos)); res.end('ok'); });
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
pag.on('console', m => console.log('  ', m.text())); pag.on('framenavigated', f => console.log('nav', f.url())); pag.on('pageerror', e => console.log('err', e.message));
await pag.goto('http://localhost:8791/vacio');
const r = await pag.evaluate(async () => {
  window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16);
  const { Compiler } = await import('/js/vendor/mindar/mindar-image.prod.js');
  const img = await new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = '/ar/marcador.png'; });
  const c = new Compiler();
  await c.compileImageTargets([img], () => { });
  const datos = c.exportData();
  const resp = await fetch('/guardar', { method: 'POST', body: datos });
  return { kb: Math.round(datos.byteLength / 1024), ok: resp.ok };
});
console.log('ar/marcador.mind:', r);
await nav.close();
servidor.close();
