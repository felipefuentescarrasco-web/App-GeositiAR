// Compila ar/maqueta.mind con los blancos de ar/maqueta.json (tools/maqueta/ra_objetivos.py) y, con
// --probar <carpeta de cuadros>, mide en cuántos cuadros reales MindAR reconoce la maqueta.
// Uso: node tools/maqueta/compilar_ra.mjs [--probar carpeta] [--solo-probar]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const iProbar = args.indexOf('--probar');
const CUADROS = iProbar >= 0 ? path.resolve(args[iProbar + 1]) : null;

const servidor = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (req.method === 'POST' && u === '/guardar') {
    const trozos = [];
    req.on('data', c => trozos.push(c));
    req.on('end', () => { fs.writeFileSync(path.join(RAIZ, 'ar/maqueta.mind'), Buffer.concat(trozos)); res.end('ok'); });
    return;
  }
  if (u === '/vacio') { res.setHeader('Content-Type', 'text/html'); return res.end('<!doctype html><title>maqueta</title>'); }
  const f = u.startsWith('/cuadros/') && CUADROS ? path.join(CUADROS, u.slice(9)) : path.join(RAIZ, u);
  if (!fs.existsSync(f)) { res.statusCode = 404; return res.end(); }
  if (f.endsWith('.js')) res.setHeader('Content-Type', 'text/javascript');
  fs.createReadStream(f).pipe(res);
});
await new Promise(ok => servidor.listen(8794, ok));
const nav = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pag = await nav.newPage();
pag.on('pageerror', e => console.log('err', e.message));
await pag.goto('http://localhost:8794/vacio');
const conf = JSON.parse(fs.readFileSync(path.join(RAIZ, 'ar/maqueta.json'), 'utf8'));

if (!args.includes('--solo-probar')) {
  const t0 = Date.now();
  await pag.evaluate(async imgs => {
    window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16);
    const { Compiler } = await import('/js/vendor/mindar/mindar-image.prod.js');
    const cargar = src => new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = '/' + src; });
    const c = new Compiler();
    await c.compileImageTargets(await Promise.all(imgs.map(cargar)), () => { });
    await fetch('/guardar', { method: 'POST', body: c.exportData() });
  }, conf.objetivos.map(o => o.img));
  console.log('ar/maqueta.mind', Math.round(fs.statSync(path.join(RAIZ, 'ar/maqueta.mind')).size / 1024), 'KB ·', Math.round((Date.now() - t0) / 1000), 's');
}

if (CUADROS) {
  const lista = fs.readdirSync(CUADROS).filter(f => /\.jpe?g$/i.test(f)).sort().filter((_, i) => i % 3 === 0);
  const r = await pag.evaluate(async ({ lista, n }) => {
    window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16);
    const { Controller } = await import('/js/vendor/mindar/mindar-image.prod.js');
    const cargar = src => new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = src; });
    const W = 480, H = 854;
    const lienzo = Object.assign(document.createElement('canvas'), { width: W, height: H });
    const ctx = lienzo.getContext('2d', { willReadFrequently: true });
    const c = new Controller({ inputWidth: W, inputHeight: H, maxTrack: 1 });
    await c.addImageTargets('/ar/maqueta.mind');
    const todos = [...Array(n).keys()];
    let alguno = 0; const porObjetivo = Array(n).fill(0);
    for (const f of lista) {
      const im = await cargar('/cuadros/' + f);
      // los cuadros pueden venir apaisados: se dibujan en vertical, como en el teléfono
      ctx.save();
      if (im.width > im.height) { ctx.translate(W, 0); ctx.rotate(Math.PI / 2); ctx.drawImage(im, 0, 0, H, W); }
      else ctx.drawImage(im, 0, 0, W, H);
      ctx.restore();
      let hallado = -1;
      for (let k = 0; k < 2 && hallado < 0; k++) {
        const t = c.inputLoader.loadInput(lienzo);
        const { featurePoints } = c.cropDetector.detectMoving(t);
        t.dispose();
        const m = await c._workerMatch(featurePoints, todos);
        if (m.targetIndex !== -1 && m.modelViewTransform) hallado = m.targetIndex;
      }
      if (hallado >= 0) { alguno++; porObjetivo[hallado]++; }
    }
    return { total: lista.length, alguno, porObjetivo };
  }, { lista, n: conf.objetivos.length });
  console.log(`reconocida en ${r.alguno}/${r.total} cuadros · por blanco ${JSON.stringify(r.porObjetivo)}`);
}
await nav.close(); servidor.close();
