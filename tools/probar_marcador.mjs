// Pasa los cuadros de tools/_prueba_marcador/ por el detector de MindAR con ar/marcador.mind
// (y, para comparar, con la foto de la roca ar/g1.mind). Uso: node tools/probar_marcador.mjs
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
const servidor = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (u === '/vacio') { res.setHeader('Content-Type', 'text/html'); return res.end('<!doctype html><title>prueba</title>'); }
  const f = path.join(RAIZ, u);
  if (!f.startsWith(RAIZ) || !fs.existsSync(f)) { res.statusCode = 404; return res.end(); }
  if (f.endsWith('.js')) res.setHeader('Content-Type', 'text/javascript');
  fs.createReadStream(f).pipe(res);
});
await new Promise(ok => servidor.listen(8792, ok));
const nav = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pag = await nav.newPage();
await pag.goto('http://localhost:8792/vacio');
const casos = JSON.parse(fs.readFileSync(path.join(RAIZ, 'tools/_prueba_marcador/casos.json')));
const r = await pag.evaluate(async casos => {
  window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16);
  const { Controller } = await import('/js/vendor/mindar/mindar-image.prod.js');
  const cargar = src => new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = src; });
  const W = 480, H = 640, INTENTOS = 6;
  const lienzo = Object.assign(document.createElement('canvas'), { width: W, height: H });
  const ctx = lienzo.getContext('2d', { willReadFrequently: true });
  const c = new Controller({ inputWidth: W, inputHeight: H, maxTrack: 1 });
  await c.addImageTargets('/ar/marcador.mind');
  const out = [];
  for (const caso of casos) {
    ctx.drawImage(await cargar('/tools/_prueba_marcador/' + caso.img), 0, 0, W, H);
    let cuadros = 0;
    for (let k = 0; k < INTENTOS; k++) {
      const t = c.inputLoader.loadInput(lienzo);
      const { featurePoints } = c.cropDetector.detectMoving(t);
      t.dispose();
      const m = await c._workerMatch(featurePoints, [0]);
      if (m.targetIndex !== -1 && m.modelViewTransform) cuadros++;
    }
    out.push(`${caso.img.padEnd(18)} debe=${caso.debe ? 'sí' : 'no'}  reconocido ${cuadros}/${INTENTOS}`);
  }
  return out;
}, casos);
console.log(r.join('\n'));
await nav.close(); servidor.close();
