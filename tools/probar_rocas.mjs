// Prueba el reconocimiento de la roca: pasa las fotos de tools/_prueba_rocas/ (no usadas como objetivo)
// por el detector de MindAR con el .mind nuevo y con el anterior.
// Uso: node tools/probar_rocas.mjs ar/g1.mind tools/_prueba_rocas/g1_antes.mind
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
const servidor = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (u === '/vacio') { res.setHeader('Content-Type', 'text/html'); return res.end('<!doctype html><title>prueba</title>'); }
  const f = path.join(RAIZ, u);
  if (!f.startsWith(RAIZ) || !fs.existsSync(f)) { res.statusCode = 404; return res.end(); }
  if (f.endsWith('.js')) res.setHeader('Content-Type', 'text/javascript');
  fs.createReadStream(f).pipe(res);
});
await new Promise(ok => servidor.listen(8793, ok));
const nav = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pag = await nav.newPage();
await pag.goto('http://localhost:8793/vacio');
const casos = JSON.parse(fs.readFileSync(path.join(RAIZ, 'tools/_prueba_rocas/casos.json')));
for (const mind of process.argv.slice(2)) {
  const r = await pag.evaluate(async ({ casos, mind }) => {
    window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16);
    const { Controller } = await import('/js/vendor/mindar/mindar-image.prod.js');
    const cargar = src => new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = src; });
    const W = 480, H = 640;
    const lienzo = Object.assign(document.createElement('canvas'), { width: W, height: H });
    const ctx = lienzo.getContext('2d', { willReadFrequently: true });
    const c = new Controller({ inputWidth: W, inputHeight: H, maxTrack: 1 });
    const { dimensions } = await c.addImageTargets('/' + mind);
    const todos = dimensions.map((_, i) => i);
    const out = [];
    for (const img of casos) {
      ctx.drawImage(await cargar('/tools/_prueba_rocas/' + img), 0, 0, W, H);
      const t = c.inputLoader.loadInput(lienzo);
      const { featurePoints } = c.cropDetector.detect(t);
      t.dispose();
      const m = await c._workerMatch(featurePoints, todos);
      out.push(`${img}: ${m.targetIndex >= 0 ? 'reconocida (objetivo ' + (m.targetIndex + 1) + ')' : 'NO'}`);
    }
    return out;
  }, { casos, mind });
  console.log('==', mind, '\n' + r.join('\n'));
}
await nav.close(); servidor.close();
