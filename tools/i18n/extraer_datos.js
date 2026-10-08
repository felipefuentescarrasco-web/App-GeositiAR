const fs = require('fs'), vm = require('vm');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(require('path').join(__dirname, '../../js/datos.js'), 'utf8') + ';this.D={UNIDADES,GEOSITIOS,PUNTOS,RUTAS,GLOSARIO,TITULOS_GLOSARIO,HISTORIA,PARADAS}', ctx);
const out = new Set();
// claves que no son texto para mostrar
const NO = new Set(['id','codigo','ruta','unidad','base','interp','archivo','color','tipo','despues','sigla','geositios','glosario','t_','ra','fichas']);
function walk(v, k) {
  if (typeof v === 'string') { if (!NO.has(k) && /[a-záéíóúñ]{2}/i.test(v) && !/\.(jpg|glb|png)$/.test(v)) out.add(v); return; }
  if (Array.isArray(v)) { v.forEach(x => walk(x, k)); return; }
  if (v && typeof v === 'object') for (const kk in v) walk(v[kk], kk);
}
walk(ctx.D, '');
fs.writeFileSync(process.argv[2], JSON.stringify([...out], null, 1));
console.log(out.size, [...out].join(' ').length, 'chars');
