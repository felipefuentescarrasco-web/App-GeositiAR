// Guion de narración de los geositios que no tienen audio de la app de Carlos Venegas (9 a 12),
// en es/en/pt. Escribe tools/_voces/guiones.json; tools/voces_geositios.py lo sintetiza.
import fs from 'fs';
import vm from 'vm';
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('js/datos.js', 'utf8') + ';this.GEOSITIOS=GEOSITIOS;', ctx);
const es = JSON.parse(fs.readFileSync('tools/i18n/datos_es.json', 'utf8'));
const tr = { en: JSON.parse(fs.readFileSync('tools/i18n/datos_en.json', 'utf8')),
             pt: JSON.parse(fs.readFileSync('tools/i18n/datos_pt.json', 'utf8')) };
const T = (s, l) => { if (l === 'es') return s; const i = es.indexOf(s); return i >= 0 ? tr[l][i] : null; };
const CAB = { es: 'Geositio', en: 'Geosite', pt: 'Geossítio' };
const MIRA = { es: 'Qué observar.', en: 'What to look for.', pt: 'O que observar.' };
const out = {};
for (const g of ctx.GEOSITIOS.filter(g => g.num >= 9)) {
  for (const l of ['es', 'en', 'pt']) {
    const p = [`${CAB[l]} ${g.num}. ${T(g.nombre, l)}.`, T(g.subtitulo, l) && T(g.subtitulo, l) + '.', T(g.gancho, l),
               ...(g.claves || []).map(c => T(c, l)), g.observa ? MIRA[l] + ' ' + T(g.observa, l) : null];
    if (p.some(x => x === null)) console.error('falta traducción', g.id, l, p);
    out[`${l}/g${g.num}`] = p.filter(Boolean).join(' ');
  }
}
fs.mkdirSync('tools/_voces', { recursive: true });
fs.writeFileSync('tools/_voces/guiones.json', JSON.stringify(out, null, 1));
console.log(Object.keys(out).length, 'guiones');
