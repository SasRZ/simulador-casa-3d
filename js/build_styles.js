// Muebles con FORMA distinta según el estilo de decoración (F.style).
// Cada constructor dibuja en coordenadas locales: frente = +z, centro de la huella en (0,0), suelo y = 0.
// Las huellas (w × d) son las de furniture_data.js, así siguen valiendo las comprobaciones de choques.
import * as THREE from 'three';
import { STYLE_ALIAS } from './furniture_data.js';

// Estilos que comparten forma con otro (solo cambian colores y algún detalle)
const sty = (F) => STYLE_ALIAS[F.style] || F.style;

export function makeStyled(H) {
  const { bx, cy, sp, legs4, light, books } = H;

  // ---------------------------------------------------------------- utilidades de forma
  // Patas según estilo. w,d = huella; h = alto de pata
  const legs = (g, F, kind, w, d, h, inset = 0.06) => {
    const at = (fn) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) fn(sx * (w / 2 - inset), sz * (d / 2 - inset), sx, sz); };
    if (h <= 0.001) return;
    if (kind === 'taper') at((x, z) => cy(g, 0.022, 0.012, h, x, 0, z, F.oak, 10));
    else if (kind === 'angled') at((x, z, sx, sz) => { const m = cy(g, 0.02, 0.011, h + 0.02, x + sx * 0.02, 0, z + sz * 0.02, F.oak, 10); m.rotation.z = -sx * 0.18; m.rotation.x = sz * 0.18; });
    else if (kind === 'hairpin') at((x, z) => { for (const o of [-0.03, 0.03]) { const m = cy(g, 0.006, 0.006, h, x + o, 0, z, F.dark, 6); m.rotation.z = o * 3; } });
    else if (kind === 'metal') at((x, z) => bx(g, 0.03, h, 0.03, x, 0, z, F.dark));
    else if (kind === 'gold') at((x, z) => cy(g, 0.016, 0.012, h, x, 0, z, F.gold, 10));
    else if (kind === 'chunky') at((x, z) => bx(g, 0.09, h, 0.09, x, 0, z, F.oak));
    else if (kind === 'turned') at((x, z) => { cy(g, 0.03, 0.025, h, x, 0, z, F.oak, 12); sp(g, 0.035, x, h * 0.55, z, F.oak); });
    else if (kind === 'plinth') bx(g, w - 0.12, h, d - 0.12, 0, 0, 0, F.dark);
    else legs4(g, w, d, h, 0.04, F.oak, inset);
  };
  const cushion = (g, w, h, d, x, y, z, mat, tilt = 0) => { const m = bx(g, w, h, d, x, y, z, mat); m.rotation.x = tilt; return m; };
  const pillow = (g, x, y, z, mat, s = 1) => { const m = sp(g, 0.2 * s, x, y, z, mat, 1, 0.75, 0.32); m.rotation.x = -0.25; return m; };

  // Parámetros del sofá por estilo
  const SOFA = {
    minimalista: { seat: 0.38, leg: 'plinth', legH: 0.05, arm: 'track', back: 'flat', pillows: [] },
    nordico: { seat: 0.42, leg: 'taper', legH: 0.16, arm: 'slim', back: 'cushions', pillows: ['sage', 'mustard'], throwOn: 'linen' },
    industrial: { seat: 0.44, leg: 'metal', legH: 0.10, arm: 'roll', back: 'tufted', pillows: [] },
    japandi: { seat: 0.34, leg: 'frame', legH: 0.06, arm: 'woodSlab', back: 'cushions', pillows: ['sage'] },
    mediterraneo: { seat: 0.42, leg: 'masonry', legH: 0.0, arm: 'masonry', back: 'cushions', pillows: ['petrol', 'mustard', 'petrol'] },
    boho: { seat: 0.34, leg: 'none', legH: 0.0, arm: 'curved', back: 'cushions', pillows: ['mustard', 'petrol', 'sage', 'mustard', 'petrol'], throwOn: 'mustard' },
    rustico: { seat: 0.44, leg: 'chunky', legH: 0.10, arm: 'woodBox', back: 'cushions', pillows: ['mustard', 'sage'] },
    eclectico: { seat: 0.42, leg: 'gold', legH: 0.14, arm: 'curved', back: 'curved', pillows: ['mustard', 'sage', 'petrol'] },
    vintage: { seat: 0.42, leg: 'angled', legH: 0.18, arm: 'slim', back: 'tufted', pillows: ['petrol'] },
  };

  // Cuerpo de sofá recto de ancho W y fondo D (respaldo en -z)
  function sofaBody(g, F, st, W, D, { armL = true, armR = true } = {}) {
    const P = SOFA[st] || SOFA.nordico, S = F.sofa, C = F.sofaSoft;
    const lh = P.legH, seatTop = P.seat, baseH = Math.max(0.12, seatTop - lh - 0.14);
    const armW = { track: 0.16, slim: 0.10, roll: 0.20, woodSlab: 0.08, masonry: 0.22, curved: 0.22, woodBox: 0.14 }[P.arm] || 0.15;
    const aL = armL ? armW : 0, aR = armR ? armW : 0;
    // patas / base
    if (P.leg === 'masonry') bx(g, W, seatTop - 0.12, D, 0, 0, 0, F.white);
    else if (P.leg === 'frame') { bx(g, W, 0.06, D, 0, 0, 0, F.oak); bx(g, W - 0.04, 0.04, D - 0.04, 0, 0.06, 0, F.oak); }
    else if (P.leg !== 'none') legs(g, F, P.leg, W, D, lh, 0.08);
    const y0 = P.leg === 'masonry' ? seatTop - 0.12 : P.leg === 'frame' ? 0.10 : lh;
    if (P.leg !== 'masonry') bx(g, W, baseH, D, 0, y0, 0, P.leg === 'frame' ? F.oak : S);
    const yS = P.leg === 'masonry' ? y0 : y0 + baseH;
    // asientos
    const back = 0.18, n = Math.max(1, Math.round((W - aL - aR) / 0.7)), sw = (W - aL - aR) / n;
    for (let i = 0; i < n; i++) cushion(g, sw - 0.01, 0.13, D - back - 0.02, -W / 2 + aL + sw * (i + 0.5), yS, back / 2, C);
    // respaldo
    const bh = P.back === 'flat' ? 0.30 : 0.40;
    if (P.back === 'curved') { const m = new THREE.Mesh(new THREE.CylinderGeometry(D * 0.55, D * 0.55, W - 0.02, 24, 1, false, Math.PI * 0.75, Math.PI * 0.5), S); m.rotation.z = Math.PI / 2; m.position.set(0, yS + 0.05, 0.05); m.castShadow = true; g.add(m); }
    else if (P.leg === 'frame' || P.leg === 'masonry') bx(g, W, bh + 0.05, 0.08, 0, yS, -D / 2 + 0.04, P.leg === 'frame' ? F.oak : F.white);
    else bx(g, W, bh, back, 0, yS, -D / 2 + back / 2, S);
    if (P.back === 'cushions') for (let i = 0; i < n; i++) cushion(g, sw - 0.03, 0.42, 0.16, -W / 2 + aL + sw * (i + 0.5), yS + 0.12, -D / 2 + back + 0.06, C, -0.15);
    if (P.back === 'tufted') for (let i = 0; i < Math.round(W / 0.18); i++) for (let j = 0; j < 2; j++) sp(g, 0.012, -W / 2 + 0.12 + i * 0.18, yS + 0.14 + j * 0.13, -D / 2 + back + 0.002, F.dark);
    // brazos
    for (const [on, s] of [[aL, -1], [aR, 1]]) {
      if (!on) continue;
      const x = s * (W / 2 - on / 2);
      if (P.arm === 'roll') { bx(g, on, 0.24, D, x, yS, 0, S); const r = cy(g, on * 0.7, on * 0.7, D, x, yS + 0.24, 0, S, 16); r.rotation.x = Math.PI / 2; r.position.z = 0; r.position.y = yS + 0.26; }
      else if (P.arm === 'curved') { bx(g, on, 0.20, D - 0.1, x, yS, 0.05, S); const r = sp(g, on * 0.75, x, yS + 0.22, 0.0, S, 1, 0.7, D * 2.1); r.scale.z = (D / 2) / (on * 0.75); }
      else if (P.arm === 'woodSlab' || P.arm === 'woodBox') bx(g, on, P.arm === 'woodBox' ? 0.30 : 0.24, D, x, yS - (P.arm === 'woodBox' ? 0.05 : 0), 0, F.oak);
      else if (P.arm === 'masonry') bx(g, on, 0.26, D, x, yS, 0, F.white);
      else bx(g, on, P.arm === 'track' ? 0.30 : 0.22, D, x, yS, 0, S);
    }
    // cojines sueltos y manta
    P.pillows.forEach((k, i) => { const fr = P.pillows.length === 1 ? 0 : i / (P.pillows.length - 1); pillow(g, -W / 2 + aL + 0.25 + fr * (W - aL - aR - 0.5), yS + 0.33, -D / 2 + back + 0.2, F[k], 0.9); });
    if (P.throwOn) { const t = bx(g, 0.5, 0.02, D - 0.1, W / 2 - aR - 0.3, yS + 0.13, 0.03, F[P.throwOn]); t.rotation.z = 0.05; }
    return yS;
  }

  const B = {
    // ================================================================ SALÓN
    sofa(it, g, F) { sofaBody(g, F, sty(F), it.w, it.d); },
    sofaL(it, g, F) {
      // sofá principal a lo ancho + chaise en el extremo izquierdo (local), mismo estilo
      const W = it.w, D = 0.92, cw = it.chaise || 0.95;
      const main = new THREE.Group(); main.position.set(cw / 2, 0, -it.d / 2 + D / 2); g.add(main);
      sofaBody(main, F, sty(F), W - cw, D, { armL: false });
      const ch = new THREE.Group(); ch.position.set(-W / 2 + cw / 2, 0, 0); g.add(ch);
      const P = SOFA[sty(F)] || SOFA.nordico;
      const yS = P.leg === 'masonry' ? P.seat - 0.12 : P.leg === 'frame' ? 0.10 + Math.max(0.12, P.seat - 0.20) : P.legH + Math.max(0.12, P.seat - P.legH - 0.14);
      if (P.leg === 'masonry') bx(ch, cw, yS, it.d, 0, 0, 0, F.white); else { if (P.leg !== 'none' && P.leg !== 'frame') legs(ch, F, P.leg, cw, it.d, P.legH, 0.08); bx(ch, cw, yS - (P.leg === 'none' ? 0 : P.legH), it.d, 0, P.leg === 'none' ? 0 : P.legH, 0, P.leg === 'frame' ? F.oak : F.sofa); }
      cushion(ch, cw - 0.02, 0.13, it.d - 0.2, 0, yS, 0.09, F.sofaSoft);
      bx(ch, cw, 0.40, 0.18, 0, yS, -it.d / 2 + 0.09, P.leg === 'masonry' ? F.white : F.sofa);
      bx(ch, 0.14, 0.30, it.d - 0.18, -cw / 2 + 0.07, yS, 0.09, P.leg === 'masonry' ? F.white : F.sofa);
    },
    coffeeTable(it, g, F) {
      const { w, d, h } = it, s = F.style;
      if (F.style === 'vintage') {   // mesa de palés reutilizados con cristal
        for (let k = 0; k < 2; k++) { const y = k * 0.15; for (let i = 0; i < 7; i++) bx(g, w / 7 - 0.02, 0.025, d, -w / 2 + (w / 7) * (i + 0.5), y + 0.12, 0, F.oak); for (const z of [-1, 0, 1]) bx(g, w, 0.10, 0.08, 0, y + 0.02, z * (d / 2 - 0.04), F.ash); }
        bx(g, w, 0.01, d, 0, h - 0.01, 0, F.glassF); for (const x of [-1, 1]) for (const z of [-1, 1]) cy(g, 0.03, 0.03, 0.02, x * (w / 2 - 0.05), 0, z * (d / 2 - 0.05), F.dark, 10);
      }
      else if (F.style === 'artdeco') { const r = Math.min(w, d) / 2 + 0.05; cy(g, r, r, 0.03, 0, h - 0.03, 0, F.marble, 6); cy(g, r * 0.6, r * 0.6, h - 0.03, 0, 0, 0, F.gold, 6); }
      else if (F.style === 'kitsch') { cy(g, Math.min(w, d) / 2, Math.min(w, d) / 2, h, 0, 0, 0, F.mustard, 24); sp(g, 0.06, 0, h + 0.06, 0, F.sage); }
      else if (s === 'minimalista') { bx(g, w, 0.05, d, 0, h - 0.05, 0, F.white); bx(g, w - 0.2, h - 0.05, d - 0.2, 0, 0, 0, F.dark); }
      else if (s === 'industrial') { bx(g, w, 0.05, d, 0, h - 0.05, 0, F.oak); bx(g, w - 0.05, 0.03, d - 0.05, 0, 0.10, 0, F.oak); legs(g, F, 'metal', w, d, h - 0.05, 0.03); }
      else if (s === 'japandi') { bx(g, w, 0.06, d, 0, h - 0.16, 0, F.oak); bx(g, 0.12, h - 0.22, d - 0.1, -w / 2 + 0.15, 0, 0, F.oak); bx(g, 0.12, h - 0.22, d - 0.1, w / 2 - 0.15, 0, 0, F.oak); cy(g, 0.05, 0.05, 0.12, 0.2, h - 0.10, 0, F.ceramicSand); sp(g, 0.09, 0.2, h + 0.08, 0, F.leaf1, 1.2, 0.8, 1.2); }
      else if (s === 'mediterraneo' || s === 'boho') { const r = Math.min(w, d) / 2 + 0.05; cy(g, r, r, 0.04, 0, h - 0.04, 0, s === 'boho' ? F.oak : F.white, 32); cy(g, r * 0.8, r * 0.7, h - 0.04, 0, 0, 0, F.rattan, 24); }
      else if (s === 'rustico') { bx(g, w, h - 0.02, d, 0, 0, 0, F.oak); bx(g, w + 0.02, 0.04, d + 0.02, 0, h - 0.04, 0, F.oak); for (const x of [-w / 3, w / 3]) bx(g, 0.04, h - 0.1, d + 0.01, x, 0.04, 0, F.metal); }
      else if (s === 'eclectico') { const r = Math.min(w, d) / 2 + 0.05; cy(g, r, r, 0.03, 0, h - 0.03, 0, F.marble, 32); cy(g, 0.05, 0.12, h - 0.03, 0, 0, 0, F.gold, 16); }
      else if (s === 'vintage') { const m = cy(g, w / 2, w / 2, 0.04, 0, h - 0.04, 0, F.oak, 32); m.scale.z = d / w; legs(g, F, 'angled', w * 0.8, d * 0.8, h - 0.04, 0.05); }
      else { const m = cy(g, w / 2, w / 2, 0.035, 0, h - 0.035, 0, F.oak, 32); m.scale.z = d / w; legs(g, F, 'taper', w * 0.75, d * 0.7, h - 0.035, 0.05); }
      if (s !== 'minimalista' && s !== 'japandi') books(g, F, -0.15, h, 0, 3);
    },
    tvUnit(it, g, F) {
      const { w, d, h } = it, s = F.style;
      const doors = s === 'mediterraneo' || s === 'boho' ? F.rattan : s === 'eclectico' ? F.petrol : s === 'minimalista' ? F.white : F.ash;
      const lh = { minimalista: 0.25, industrial: 0.12, japandi: 0.05, mediterraneo: 0.10, boho: 0.12, rustico: 0.0, eclectico: 0.16, vintage: 0.20, nordico: 0.16 }[s] ?? 0.16;
      const body = s === 'minimalista' ? F.white : F.oak;
      bx(g, w, h - lh, d, 0, lh, 0, body);
      const n = s === 'japandi' ? 1 : 3;
      if (s === 'japandi') for (let i = 0; i < 18; i++) bx(g, 0.02, h - lh - 0.06, 0.02, -w / 2 + 0.1 + i * (w - 0.2) / 17, lh + 0.03, d / 2 + 0.005, F.oak);
      else for (let i = 0; i < n; i++) bx(g, w / n - 0.03, h - lh - 0.06, 0.015, -w / 2 + (w / n) * (i + 0.5), lh + 0.03, d / 2 + 0.004, doors);
      if (s === 'minimalista') { /* volado: sin patas */ }
      else if (s === 'industrial') { legs(g, F, 'metal', w, d, lh, 0.03); bx(g, w, 0.03, d, 0, h - 0.03, 0, F.dark); }
      else if (s === 'vintage') legs(g, F, 'angled', w, d, lh, 0.1);
      else if (s === 'eclectico') legs(g, F, 'gold', w, d, lh, 0.08);
      else if (lh > 0) legs(g, F, s === 'nordico' ? 'taper' : 'chunky', w, d, lh, 0.08);
      if (s !== 'minimalista') cy(g, 0.07, 0.05, 0.22, w / 2 - 0.25, h, 0, s === 'mediterraneo' ? F.ceramicSand : F.ceramic);
      if (s === 'vintage') { bx(g, 0.42, 0.10, 0.34, -w / 2 + 0.35, h, 0, F.oak); cy(g, 0.15, 0.15, 0.01, -w / 2 + 0.35, h + 0.10, 0, F.dark, 24); }   // tocadiscos
      if (s === 'japandi') { cy(g, 0.08, 0.06, 0.08, -w / 2 + 0.3, h, 0, F.ceramicSand); sp(g, 0.13, -w / 2 + 0.3, h + 0.2, 0, F.leaf3, 1.3, 0.6, 1); cy(g, 0.012, 0.015, 0.12, -w / 2 + 0.3, h + 0.06, 0, F.trunk); }   // bonsái
    },
    tv(it, g, F) { bx(g, it.w, it.h, 0.04, 0, 0, 0, F.screen); bx(g, it.w - 0.02, it.h - 0.02, 0.002, 0, 0.01, 0.021, F.dark); },
    diningTable(it, g, F) {
      const { w, d, h } = it, s = F.style, T = 0.04;
      const top = s === 'minimalista' ? F.white : s === 'eclectico' ? F.marble : F.oak;
      if (s === 'vintage' || s === 'nordico') { const L = Math.max(w, d), S = Math.min(w, d); const m = new THREE.Mesh(new THREE.CylinderGeometry(S / 2, S / 2, T, 32), top); m.scale.set(w > d ? L / S : 1, 1, d > w ? L / S : 1); m.position.y = h - T / 2; m.castShadow = m.receiveShadow = true; g.add(m); legs(g, F, s === 'vintage' ? 'angled' : 'taper', w * 0.8, d * 0.8, h - T, 0.05); return; }
      bx(g, w, s === 'rustico' || s === 'industrial' ? 0.07 : T, d, 0, h - (s === 'rustico' || s === 'industrial' ? 0.07 : T), 0, top);
      const along = d > w ? 'z' : 'x', L = Math.max(w, d), S = Math.min(w, d);
      const at = (fn) => [-1, 1].forEach((k) => fn(k * (L / 2 - 0.2)));
      if (s === 'industrial') at((a) => { const p = along === 'z' ? [0, a] : [a, 0]; bx(g, along === 'z' ? S - 0.1 : 0.05, h - 0.07, along === 'z' ? 0.05 : S - 0.1, p[0], 0, p[1], F.dark); });   // patas en U
      else if (s === 'rustico') { at((a) => { const p = along === 'z' ? [0, a] : [a, 0]; bx(g, along === 'z' ? S - 0.2 : 0.10, h - 0.07, along === 'z' ? 0.10 : S - 0.2, p[0], 0, p[1], F.oak); }); bx(g, along === 'z' ? 0.08 : L - 0.4, 0.08, along === 'z' ? L - 0.4 : 0.08, 0, 0.25, 0, F.oak); }   // caballetes
      else if (s === 'eclectico') { at((a) => { const p = along === 'z' ? [0, a] : [a, 0]; cy(g, 0.05, 0.16, h - T, p[0], 0, p[1], F.gold, 20); }); }
      else if (s === 'minimalista') legs(g, F, 'metal', w, d, h - T, 0.05);
      else if (s === 'japandi') at((a) => { const p = along === 'z' ? [0, a] : [a, 0]; bx(g, along === 'z' ? S - 0.15 : 0.08, h - T, along === 'z' ? 0.08 : S - 0.15, p[0], 0, p[1], F.oak); });
      else legs(g, F, s === 'mediterraneo' ? 'turned' : 'chunky', w, d, h - T, 0.07);
      if (s === 'mediterraneo') { cy(g, 0.10, 0.08, 0.22, 0, h, 0, F.petrol); for (let i = 0; i < 3; i++) sp(g, 0.06, 0.02 * i, h + 0.26 + i * 0.03, 0, F.olive); }
      else if (s !== 'minimalista') { cy(g, 0.06, 0.05, 0.22, 0, h, 0.2, F.ceramic); sp(g, 0.09, 0, h + 0.27, 0.2, F.leaf1); }
    },
    chair(it, g, F) {
      const s = sty(F), sh = 0.45;
      const idx = (it.id.charCodeAt(it.id.length - 1) + it.id.length) % 4;
      if (s === 'minimalista') { bx(g, 0.42, 0.03, 0.42, 0, sh - 0.03, 0, F.white); legs(g, F, 'metal', 0.42, 0.42, sh - 0.03, 0.02); bx(g, 0.42, 0.40, 0.025, 0, sh, -0.2, F.white); bx(g, 0.02, 0.40, 0.02, -0.2, sh, -0.2, F.dark); bx(g, 0.02, 0.40, 0.02, 0.2, sh, -0.2, F.dark); }
      else if (s === 'nordico') { bx(g, 0.44, 0.03, 0.42, 0, sh - 0.03, 0.02, F.oak); bx(g, 0.40, 0.02, 0.38, 0, sh, 0.02, F.linen); legs(g, F, 'taper', 0.44, 0.42, sh - 0.03, 0.03); const y = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.015, 8, 24, Math.PI), F.oak); y.rotation.x = Math.PI / 2; y.position.set(0, sh + 0.25, 0.0); g.add(y); bx(g, 0.03, 0.27, 0.03, 0, sh, -0.2, F.oak); }   // tipo Wishbone
      else if (s === 'industrial') { bx(g, 0.42, 0.03, 0.42, 0, sh - 0.03, 0, F.dark); legs(g, F, 'metal', 0.44, 0.44, sh - 0.03, 0.02); for (let i = 0; i < 3; i++) bx(g, 0.40, 0.08, 0.02, 0, sh + 0.05 + i * 0.11, -0.21, F.dark); }   // tipo Tolix
      else if (s === 'japandi') { bx(g, 0.44, 0.04, 0.42, 0, sh - 0.04, 0, F.oak); legs(g, F, 'chunky', 0.44, 0.42, sh - 0.04, 0.04); bx(g, 0.44, 0.12, 0.03, 0, sh + 0.22, -0.2, F.oak); for (const x of [-0.19, 0.19]) bx(g, 0.035, 0.34, 0.035, x, sh, -0.2, F.oak); }
      else if (s === 'mediterraneo') { bx(g, 0.43, 0.04, 0.42, 0, sh - 0.04, 0, F.rattan); legs(g, F, 'turned', 0.44, 0.42, sh - 0.04, 0.03); for (const x of [-0.19, 0.19]) bx(g, 0.03, 0.48, 0.03, x, sh, -0.2, F.oak); for (let i = 0; i < 3; i++) bx(g, 0.38, 0.04, 0.02, 0, sh + 0.12 + i * 0.13, -0.2, F.oak); }   // silla de enea
      else if (s === 'boho') { cy(g, 0.23, 0.18, sh, 0, 0, 0, F.rattan, 20); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.45, 24, 1, true, Math.PI * 0.6, Math.PI * 0.8), F.rattan); b.position.set(0, sh + 0.22, 0); b.rotation.y = Math.PI; g.add(b); cy(g, 0.21, 0.21, 0.05, 0, sh, 0, F.cream, 20); }
      else if (s === 'rustico') { bx(g, 0.46, 0.05, 0.44, 0, sh - 0.05, 0, F.oak); legs(g, F, 'chunky', 0.46, 0.44, sh - 0.05, 0.05); for (const x of [-0.2, 0.2]) bx(g, 0.05, 0.55, 0.05, x, sh, -0.2, F.oak); for (let i = 0; i < 3; i++) bx(g, 0.40, 0.06, 0.03, 0, sh + 0.15 + i * 0.14, -0.2, F.oak); }
      else if (s === 'eclectico') { const mats = [F.sofa, F.mustard, F.sage, F.petrol]; const m = mats[idx]; cy(g, 0.22, 0.22, 0.08, 0, sh - 0.08, 0, m, 20); legs(g, F, 'gold', 0.38, 0.38, sh - 0.08, 0.03); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.32, 20, 1, false, Math.PI * 0.6, Math.PI * 0.8), m); b.position.set(0, sh + 0.16, 0); b.rotation.y = Math.PI; g.add(b); }
      else { const sh2 = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 12, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45), F.white); sh2.scale.set(1, 0.6, 1); sh2.position.set(0, sh + 0.13, 0); g.add(sh2); const bk = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 12, Math.PI * 0.15, Math.PI * 0.7, 0.2, Math.PI * 0.45), F.white); bk.position.set(0, sh + 0.05, 0.05); g.add(bk); legs(g, F, 'angled', 0.40, 0.40, sh - 0.02, 0.04); }   // carcasa tipo Eames
    },
    armchair(it, g, F) {
      const s = sty(F);
      if (s === 'vintage') {   // butaca tipo lounge
        const base = cy(g, 0.03, 0.25, 0.25, 0, 0, 0, F.dark, 5); base.rotation.y = 0.3;
        bx(g, 0.75, 0.12, 0.70, 0, 0.30, 0.02, F.oak); bx(g, 0.66, 0.12, 0.62, 0, 0.40, 0.04, F.sofa);
        const bk = bx(g, 0.75, 0.62, 0.10, 0, 0.42, -0.30, F.oak); bk.rotation.x = -0.35; const bc = bx(g, 0.66, 0.55, 0.10, 0, 0.47, -0.24, F.sofa); bc.rotation.x = -0.35;
        return;
      }
      if (s === 'boho') {   // sillón de ratán tipo pavo real
        cy(g, 0.30, 0.22, 0.38, 0, 0, 0, F.rattan, 20); cy(g, 0.32, 0.32, 0.08, 0, 0.38, 0, F.cream, 20);
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.32, 0.85, 28, 1, true, Math.PI * 0.55, Math.PI * 0.9), F.rattan); b.position.set(0, 0.85, -0.05); b.rotation.y = Math.PI; g.add(b);
        pillow(g, 0, 0.62, -0.12, F.mustard); return;
      }
      if (s === 'rustico') { legs(g, F, 'chunky', it.w, it.d, 0.2, 0.06); bx(g, it.w, 0.1, it.d, 0, 0.2, 0, F.oak); cushion(g, it.w - 0.25, 0.12, it.d - 0.2, 0, 0.30, 0.06, F.sofaSoft); for (const x of [-1, 1]) bx(g, 0.10, 0.32, it.d, x * (it.w / 2 - 0.05), 0.30, 0, F.oak); bx(g, it.w, 0.48, 0.10, 0, 0.30, -it.d / 2 + 0.05, F.oak); cushion(g, it.w - 0.25, 0.36, 0.12, 0, 0.40, -it.d / 2 + 0.16, F.sofaSoft, -0.1); return; }
      const m = s === 'eclectico' ? F.mustard : F.sofa;
      const lg = { minimalista: 'plinth', industrial: 'metal', japandi: 'chunky', mediterraneo: 'turned', eclectico: 'gold' }[s] || 'taper';
      legs(g, F, lg, it.w, it.d, lg === 'plinth' ? 0.05 : 0.16, 0.08);
      const y = lg === 'plinth' ? 0.05 : 0.16;
      bx(g, it.w, 0.2, it.d, 0, y, 0, m); cushion(g, it.w - 0.24, 0.12, it.d - 0.2, 0, y + 0.2, 0.06, s === 'eclectico' ? F.mustard : F.sofaSoft);
      for (const x of [-1, 1]) bx(g, 0.12, 0.25, it.d, x * (it.w / 2 - 0.06), y + 0.2, 0, m);
      bx(g, it.w, 0.45, 0.14, 0, y + 0.2, -it.d / 2 + 0.07, m);
      if (s === 'nordico') { const t = bx(g, 0.5, 0.02, 0.5, 0, y + 0.33, 0.05, F.cream); t.rotation.y = 0.3; }   // piel de oveja
    },
    puff(it, g, F) {
      const s = sty(F);
      if (s === 'boho' || s === 'mediterraneo') { const m = sp(g, it.w / 2, 0, it.h / 2, 0, F.rattan, 1, (it.h / it.w), 1); m.scale.y = it.h / it.w * 1.1; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; bx(g, 0.02, it.h * 0.8, 0.01, Math.cos(a) * it.w / 2.05, it.h * 0.1, Math.sin(a) * it.w / 2.05, F.mustard, -a); } return; }   // puf marroquí
      cy(g, it.w / 2, it.w / 2 - 0.03, it.h, 0, 0, 0, s === 'eclectico' ? F.sage : F.sand, 28);
    },
    floorLamp(it, g, F, ctx) {
      const s = sty(F); let shadeY = 1.50;
      const shade = (rt, rb, h, y, mat = F.lampShade) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 24, 1, true), mat); m.position.y = y; g.add(m); return m; };
      if (s === 'minimalista' || s === 'vintage') {   // lámpara de arco
        // lámpara de arco: sube por detrás y se asoma 0,85 m hacia delante (+z local)
        const a = new THREE.Group(); a.rotation.y = -Math.PI / 2; g.add(a);
        const metal = s === 'vintage' ? F.silver : F.dark, R = 0.85;
        cy(a, 0.18, 0.18, 0.06, 0, 0, 0, s === 'vintage' ? F.marble : F.dark, 20); cy(a, 0.012, 0.012, 0.95, 0, 0.06, 0, metal, 8);
        const arc = new THREE.Mesh(new THREE.TorusGeometry(R, 0.012, 6, 24, Math.PI / 2), metal); arc.position.set(R, 1.0, 0); arc.rotation.z = Math.PI / 2; a.add(arc);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), s === 'vintage' ? F.mustard : F.dark); dome.position.set(R, 1.62, 0); a.add(dome);
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), F.bulb); b.position.set(R, 1.60, 0); a.add(b); ctx.furn.glow.push(F.bulb);
        const L = light(ctx, a, it.light.color, it.light.i, 1.55, 'living'); L.position.x = R; return;
      }
      if (s === 'nordico' || s === 'industrial') {   // trípode
        for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; const m = cy(g, 0.012, 0.012, 1.45, Math.cos(a) * 0.12, 0, Math.sin(a) * 0.12, s === 'industrial' ? F.dark : F.oak, 8); m.rotation.z = Math.cos(a) * -0.12; m.rotation.x = Math.sin(a) * 0.12; }
        if (s === 'industrial') { const c = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), new THREE.MeshStandardMaterial({ color: 0x222222, wireframe: true })); c.position.y = 1.5; g.add(c); }
        else shade(0.17, 0.2, 0.28, 1.55);
      } else if (s === 'japandi') { cy(g, 0.12, 0.12, 0.02, 0, 0, 0, F.oak); const p = shade(0.16, 0.16, 1.2, 0.75, F.lampShade); p.material = F.lampShade; shadeY = 0.8; }   // columna de papel
      else if (s === 'boho' || s === 'mediterraneo') { cy(g, 0.15, 0.15, 0.03, 0, 0, 0, F.oak); cy(g, 0.015, 0.015, 1.4, 0, 0.03, 0, F.oak); shade(0.12, 0.30, 0.34, 1.50, F.rattan); }
      else if (s === 'eclectico') { cy(g, 0.15, 0.15, 0.03, 0, 0, 0, F.gold); cy(g, 0.012, 0.012, 1.4, 0, 0.03, 0, F.gold); shade(0.14, 0.22, 0.28, 1.52, F.mustard); }
      else { cy(g, 0.16, 0.16, 0.04, 0, 0, 0, F.metal); cy(g, 0.04, 0.04, 1.35, 0, 0.04, 0, F.oak); shade(0.18, 0.24, 0.32, 1.55); }   // rústico
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), F.bulb); bulb.position.y = shadeY; g.add(bulb);
      ctx.furn.glow.push(F.lampShade, F.bulb);
      light(ctx, g, it.light.color, it.light.i, shadeY, 'living');
    },
    pendant(it, g, F, ctx) {
      const s = sty(F), top = 2.70 - it.y;
      cy(g, 0.004, 0.004, top - it.h, 0, it.h, 0, F.dark);
      let dome;
      if (s === 'industrial') dome = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), F.dark);
      else if (s === 'vintage') dome = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), F.mustard);
      else if (s === 'eclectico') dome = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 14), F.gold);
      else if (s === 'mediterraneo' || s === 'boho' || s === 'rustico') dome = new THREE.Mesh(new THREE.SphereGeometry(0.28, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.62), F.rattan);
      else dome = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 14), F.lampShade);
      dome.position.y = it.h * 0.9; dome.castShadow = true; g.add(dome);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), F.bulb); bulb.position.y = it.h * 0.55; g.add(bulb); ctx.furn.glow.push(F.bulb);
      light(ctx, g, it.light.color, it.light.i, 0.1, 'living');
    },
    rug(it, g, F) {
      const s = sty(F), { w, d, h } = it;
      if (s === 'boho') {   // yute redonda + kilim superpuestas
        const r = Math.min(w, d) / 2; cy(g, r, r, h, 0, 0, 0, F.rug, 40); for (let i = 1; i < 6; i++) cy(g, r * i / 6 + 0.01, r * i / 6, h + 0.001 * i, 0, 0, 0, i % 2 ? F.rugEdge : F.rug, 40);
        const k = bx(g, w * 0.55, h + 0.008, d * 0.5, w * 0.18, 0, d * 0.15, F.petrol); k.rotation.y = 0.35; return;
      }
      bx(g, w, h, d, 0, 0, 0, F.rugEdge); bx(g, w - 0.10, h + 0.002, d - 0.10, 0, 0, 0, F.rug);
      if (s === 'eclectico' || s === 'vintage' || s === 'mediterraneo') { const cols = s === 'mediterraneo' ? [F.petrol, F.rug] : [F.mustard, F.petrol, F.sage, F.rugEdge]; for (let i = 0; i < 9; i++) bx(g, w - 0.2, h + 0.004, (d - 0.3) / 9 - 0.02, 0, 0, -d / 2 + 0.15 + (d - 0.3) / 9 * (i + 0.5), cols[i % cols.length]); }
      else if (s === 'nordico') for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { const m = bx(g, 0.14, h + 0.004, 0.14, -w / 2 + 0.35 + i * (w - 0.7) / 4, 0, -d / 2 + 0.35 + j * (d - 0.7) / 2, F.rugEdge); m.rotation.y = Math.PI / 4; }   // bereber rombos
      else if (s === 'rustico' || s === 'industrial') for (let i = 0; i < 4; i++) bx(g, w - 0.2, h + 0.003, 0.02, 0, 0, -d / 2 + 0.25 + i * (d - 0.5) / 3, F.rugEdge);
    },
    // ================================================================ DORMITORIOS
    bed(it, g, F) {
      const s = sty(F), { w, d } = it;
      const hb = (hh, mat, th = 0.07) => bx(g, w + 0.06, hh, th, 0, 0, -d / 2 - th / 2 + 0.02, mat);
      let lg = 0.15, frameMat = F.oak;
      if (s === 'japandi') { bx(g, w + 0.30, 0.10, d + 0.25, 0, 0, 0.05, F.oak); lg = 0.10; hb(0.55, F.oak, 0.05); }   // tatami bajo
      else if (s === 'minimalista') { bx(g, w - 0.2, 0.12, d - 0.2, 0, 0, 0, F.dark); lg = 0.12; frameMat = F.white; hb(0.9, F.white, 0.05); }   // cama flotante
      else if (s === 'industrial') { legs(g, F, 'metal', w, d, 0.30, 0.03); lg = 0.30; frameMat = F.dark; for (let i = 0; i < 2; i++) bx(g, w + 0.06, 0.04, 0.04, 0, 0.55 + i * 0.4, -d / 2, F.dark); for (let i = 0; i < 9; i++) bx(g, 0.025, 1.05, 0.025, -w / 2 + i * w / 8, 0, -d / 2, F.dark); }
      else if (s === 'mediterraneo') { legs(g, F, 'turned', w, d, 0.25, 0.04); lg = 0.25; frameMat = F.white; const a = new THREE.Mesh(new THREE.CylinderGeometry(w / 2 + 0.03, w / 2 + 0.03, 0.06, 24, 1, false, -Math.PI / 2, Math.PI), F.petrol); a.rotation.x = Math.PI / 2; a.position.set(0, 0.9, -d / 2); g.add(a); bx(g, w + 0.06, 0.9, 0.06, 0, 0, -d / 2, F.petrol); }
      else if (s === 'boho') { lg = 0.10; bx(g, w + 0.1, 0.12, d + 0.1, 0, 0, 0, F.rattan); const a = new THREE.Mesh(new THREE.CylinderGeometry(w / 2 + 0.08, w / 2 + 0.08, 0.05, 28, 1, false, -Math.PI / 2, Math.PI), F.rattan); a.rotation.x = Math.PI / 2; a.position.set(0, 0.8, -d / 2 - 0.03); g.add(a); bx(g, w + 0.16, 0.8, 0.05, 0, 0, -d / 2 - 0.03, F.rattan); for (let i = 0; i < 7; i++) { const m = bx(g, 0.012, 0.9, 0.012, -w / 2 + i * w / 6, 1.4, -d / 2 + 0.05, F.cream); m.rotation.z = (i % 2 ? 0.05 : -0.05); } bx(g, w + 0.2, 0.04, 0.04, 0, 2.3, -d / 2 + 0.05, F.oak); }   // ratán + macramé
      else if (s === 'rustico') { legs(g, F, 'chunky', w + 0.1, d + 0.1, 0.30, 0.05); lg = 0.30; for (const x of [-1, 1]) bx(g, 0.10, 1.3, 0.10, x * (w / 2 + 0.03), 0, -d / 2, F.oak); for (let i = 0; i < 4; i++) bx(g, w, 0.18, 0.05, 0, 0.45 + i * 0.2, -d / 2, F.oak); bx(g, w + 0.16, 0.30, 0.06, 0, 0, d / 2 + 0.03, F.oak); }
      else if (s === 'eclectico') { legs(g, F, 'gold', w, d, 0.18, 0.06); lg = 0.18; frameMat = F.sofa; bx(g, w + 0.2, 1.35, 0.10, 0, 0, -d / 2 - 0.02, F.sofa); for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) sp(g, 0.015, -w / 2 + 0.1 + i * (w - 0.2) / 4, 0.8 + j * 0.18, -d / 2 + 0.03, F.gold); }   // capitoné de terciopelo
      else if (s === 'vintage') { legs(g, F, 'angled', w, d, 0.22, 0.08); lg = 0.22; bx(g, w + 0.2, 0.9, 0.06, 0, 0.1, -d / 2 - 0.01, F.oak); for (let i = 0; i < 6; i++) bx(g, 0.02, 0.7, 0.01, -w / 2 + 0.05 + i * (w + 0.1) / 6, 0.2, -d / 2 + 0.025, F.ash); }   // cabecero de teca acanalado
      else { legs(g, F, 'taper', w, d, 0.15, 0.06); hb(0.95, F.linen, 0.08); }   // nórdico
      bx(g, w, 0.17, d, 0, lg, 0, frameMat);
      bx(g, w - 0.02, 0.20, d - 0.02, 0, lg + 0.17, 0, F.white);
      bx(g, w, 0.07, d * 0.7, 0, lg + 0.37, d * 0.15, s === 'minimalista' ? F.white : F.cream);
      const th = { boho: F.mustard, mediterraneo: F.petrol, eclectico: F.sage, vintage: F.mustard, rustico: F.sofa, industrial: F.dark, japandi: F.sand, minimalista: F.sand }[s] || (it.bed?.throw === 'mustard' ? F.mustard : F.sage);
      bx(g, w + 0.01, 0.075, 0.35, 0, lg + 0.37, d / 2 - 0.32, th);
      const pw = (w - 0.2) / (w > 1.2 ? 2 : 1);
      for (let i = 0; i < (w > 1.2 ? 2 : 1); i++) bx(g, pw - 0.04, 0.12, 0.32, (w > 1.2 ? (i ? 1 : -1) * pw / 2 : 0), lg + 0.39, -d / 2 + 0.25, F.white);
      if (s === 'boho' || s === 'eclectico') [-1, 0, 1].forEach((k, i) => pillow(g, k * 0.3, lg + 0.6, -d / 2 + 0.45, [F.mustard, F.petrol, F.sage][i], 0.8));
    },
    headboard() {},   // el cabecero ya lo dibuja la cama según el estilo
    nightstand(it, g, F, ctx) {
      const s = sty(F), { w, d, h } = it;
      if (s === 'boho') { cy(g, w / 2, w / 2, h, 0, 0, 0, F.rattan, 20); }
      else if (s === 'minimalista') { bx(g, w, 0.18, d, 0, h - 0.18, 0, F.white); }
      else if (s === 'japandi') { bx(g, w, h - 0.12, d, 0, 0, 0, F.oak); }
      else if (s === 'industrial') { legs(g, F, 'metal', w, d, h, 0.02); bx(g, w, 0.03, d, 0, h - 0.03, 0, F.oak); bx(g, w, 0.03, d, 0, 0.12, 0, F.oak); bx(g, w - 0.04, 0.18, d - 0.04, 0, h - 0.21, 0, F.oak); }
      else if (s === 'eclectico') { cy(g, w / 2, w / 2, 0.03, 0, h - 0.03, 0, F.marble, 24); cy(g, 0.03, 0.12, h - 0.03, 0, 0, 0, F.gold, 16); }
      else { const lh = s === 'rustico' ? 0.06 : 0.18; legs(g, F, s === 'vintage' ? 'angled' : s === 'rustico' ? 'chunky' : s === 'mediterraneo' ? 'turned' : 'taper', w, d, lh, 0.05); bx(g, w, h - lh, d, 0, lh, 0, s === 'mediterraneo' ? F.white : F.oak); bx(g, w - 0.06, 0.12, 0.015, 0, lh + 0.05, d / 2 + 0.005, F.ash); }
      const top = s === 'japandi' ? h - 0.12 : h;
      if (it.lampOn) {
        let shadeMat = F.lampShade;
        if (s === 'industrial') { cy(g, 0.05, 0.05, 0.02, 0, top, 0, F.dark); cy(g, 0.008, 0.008, 0.3, 0, top, 0, F.dark); const c = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshStandardMaterial({ color: 0x222222, wireframe: true })); c.position.y = top + 0.3; g.add(c); }
        else if (s === 'japandi') { const p = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), F.lampShade); p.position.y = top + 0.13; g.add(p); }
        else { cy(g, 0.05, 0.06, 0.18, 0, top, 0, s === 'eclectico' ? F.gold : s === 'vintage' ? F.mustard : F.ceramic); if (s === 'boho' || s === 'mediterraneo') shadeMat = F.rattan; const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.16, 20, 1, true), shadeMat); sh.position.y = top + 0.27; g.add(sh); }
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), F.bulb); b.position.y = top + 0.22; g.add(b);
        ctx.furn.glow.push(F.lampShade, F.bulb); light(ctx, g, 0xffd9a0, 1.2, top + 0.25, 'bedroom', 3.5);
      }
    },
    desk(it, g, F) {
      const s = sty(F), { w, d, h } = it;
      const top = s === 'minimalista' ? F.white : s === 'eclectico' ? F.marble : F.oak;
      bx(g, w, 0.035, d, 0, h - 0.035, 0, top);
      if (s === 'industrial') { for (const x of [-1, 1]) { bx(g, 0.04, h - 0.035, 0.04, x * (w / 2 - 0.03), 0, -d / 2 + 0.03, F.dark); bx(g, 0.04, h - 0.035, 0.04, x * (w / 2 - 0.03), 0, d / 2 - 0.03, F.dark); bx(g, 0.03, 0.03, d, x * (w / 2 - 0.03), 0.1, 0, F.dark); } }
      else if (s === 'vintage') { legs(g, F, 'angled', w, d, h - 0.035, 0.06); bx(g, 0.4, 0.12, d - 0.05, w / 2 - 0.25, h - 0.155, 0, F.oak); }
      else if (s === 'rustico' || s === 'japandi') { for (const x of [-1, 1]) bx(g, 0.06, h - 0.035, d - 0.04, x * (w / 2 - 0.05), 0, 0, F.oak); }
      else if (s === 'eclectico') legs(g, F, 'gold', w, d, h - 0.035, 0.05);
      else if (s === 'minimalista') legs(g, F, 'metal', w, d, h - 0.035, 0.03);
      else legs(g, F, s === 'mediterraneo' ? 'turned' : 'taper', w, d, h - 0.035, 0.05);
      bx(g, 0.5, 0.33, 0.02, 0, h + 0.1, -d / 2 + 0.12, F.screen); bx(g, 0.2, 0.012, 0.14, 0, h, -d / 2 + 0.12, F.silver); bx(g, 0.04, 0.12, 0.012, 0, h, -d / 2 + 0.13, F.silver);
      if (s !== 'minimalista') { cy(g, 0.05, 0.05, 0.1, w / 2 - 0.12, h, -d / 2 + 0.12, F.ceramicSand); sp(g, 0.08, w / 2 - 0.12, h + 0.17, -d / 2 + 0.12, F.leaf2); }
    },
    officeChair(it, g, F) {
      const s = sty(F);
      if (s === 'minimalista' || s === 'industrial' || s === 'nordico' || s === 'japandi') return B.chair({ id: 'x0' }, g, F);
      if (s === 'boho' || s === 'mediterraneo') return B.chair({ id: 'x1' }, g, F);
      cy(g, 0.02, 0.02, 0.3, 0, 0.06, 0, F.metal);
      for (let i = 0; i < 5; i++) { const a = i * 1.2566; const m = bx(g, 0.28, 0.025, 0.04, Math.cos(a) * 0.14, 0.04, Math.sin(a) * 0.14, F.metal); m.rotation.y = -a; }
      bx(g, 0.50, 0.08, 0.48, 0, 0.38, 0, F.sofa); bx(g, 0.46, 0.55, 0.06, 0, 0.50, -0.25, F.sofa);
    },
    openShelf(it, g, F) {
      const s = sty(F), { w, d, h } = it, n = 4, st = (h - 0.06) / n;
      if (s === 'boho') {   // escalera apoyada con mantas
        for (const x of [-1, 1]) { const m = bx(g, 0.04, h, 0.04, x * (w / 2 - 0.05), 0, 0, F.oak); m.rotation.x = -0.12; }
        for (let i = 1; i < 5; i++) { const y = i * h / 5; bx(g, w - 0.1, 0.025, 0.025, 0, y, -y * 0.12, F.oak); }
        for (let i = 0; i < 3; i++) bx(g, w - 0.2, 0.25, 0.02, 0, h / 5 * (i + 1) - 0.22, -(h / 5 * (i + 1)) * 0.12 + 0.03, [F.mustard, F.cream, F.petrol][i]);
        return;
      }
      const side = s === 'industrial' ? F.dark : F.oak, shelf = s === 'minimalista' ? F.white : F.oak;
      if (s === 'industrial') for (const x of [-1, 1]) for (const z of [-1, 1]) bx(g, 0.03, h, 0.03, x * (w / 2 - 0.02), 0, z * (d / 2 - 0.02), F.dark);
      else for (const x of [-1, 1]) bx(g, s === 'rustico' ? 0.06 : 0.03, h, d, x * (w / 2 - 0.02), 0, 0, side);
      for (let i = 0; i <= n; i++) bx(g, w, s === 'rustico' ? 0.05 : 0.025, d, 0, 0.06 + i * st - (i === n ? 0.03 : 0), 0, shelf);
      if (s === 'minimalista') { for (let i = 0; i < 2; i++) bx(g, w - 0.04, st - 0.04, 0.015, 0, 0.08 + i * st, d / 2 - 0.01, F.white); cy(g, 0.06, 0.05, 0.2, 0, 0.06 + 3 * st + 0.025, 0, F.dark); return; }
      const y = (i) => 0.06 + i * st + 0.025;
      books(g, F, -w / 2 + 0.08, y(0), 0, 7); cy(g, 0.07, 0.06, 0.16, 0.18, y(1), 0, s === 'mediterraneo' ? F.petrol : F.ceramic);
      if (s === 'rustico' || s === 'mediterraneo') bx(g, 0.3, 0.2, 0.25, -0.1, y(1), 0, F.rattan);
      sp(g, 0.08, -0.15, y(2) + 0.1, 0, F.leaf1); cy(g, 0.06, 0.05, 0.1, -0.15, y(2), 0, F.ceramicSand); books(g, F, 0.05, y(3), 0, 5);
      if (s === 'industrial') bx(g, 0.25, 0.18, 0.2, 0.15, y(2), 0, F.metal);
      if (s === 'vintage') { const r = cy(g, 0.16, 0.16, 0.005, 0.1, y(2) + 0.17, 0, F.dark, 24); r.rotation.x = Math.PI / 2; }
    },
    sideboard(it, g, F) {
      const s = sty(F), { w, d, h } = it;
      const lh = { minimalista: 0.25, industrial: 0.15, japandi: 0.06, rustico: 0.04, vintage: 0.22, eclectico: 0.18 }[s] ?? 0.16;
      bx(g, w, h - lh, d, 0, lh, 0, s === 'minimalista' || s === 'mediterraneo' ? F.white : F.oak);
      const fr = s === 'boho' || s === 'mediterraneo' ? F.rattan : s === 'eclectico' ? F.sage : F.ash;
      for (let i = 0; i < 3; i++) bx(g, (w - 0.1) / 3 - 0.01, h - lh - 0.08, 0.015, -w / 2 + 0.05 + ((w - 0.1) / 3) * (i + 0.5), lh + 0.04, d / 2 + 0.004, fr);
      if (s === 'minimalista') return;
      if (s === 'industrial') legs(g, F, 'hairpin', w, d, lh, 0.06);
      else legs(g, F, s === 'vintage' ? 'angled' : s === 'eclectico' ? 'gold' : s === 'nordico' ? 'taper' : 'chunky', w, d, lh, 0.08);
      cy(g, 0.08, 0.06, 0.24, w / 2 - 0.2, h, 0, s === 'mediterraneo' ? F.ceramicSand : F.ceramic);
      if (s === 'eclectico' || s === 'vintage') { const m = cy(g, 0.32, 0.32, 0.02, -0.15, h + 0.38, -d / 2 + 0.02, s === 'vintage' ? F.gold : F.gold, 32); m.rotation.x = Math.PI / 2; }   // espejo redondo
    },
    // ================================================================ PIEZAS PROPIAS DE ALGUNOS ESTILOS
    hangingChair(it, g, F) {   // sillón huevo colgante (boho)
      cy(g, 0.3, 0.3, 0.03, 0, 0, 0, F.dark, 24); cy(g, 0.015, 0.015, 1.95, 0, 0.03, -0.25, F.dark);
      const arm = bx(g, 0.03, 0.03, 0.4, 0, 1.95, -0.05, F.dark); arm.rotation.x = 0.4;
      const egg = new THREE.Mesh(new THREE.SphereGeometry(0.45, 24, 16, 0, Math.PI * 2, Math.PI * 0.08, Math.PI * 0.85), F.rattan); egg.scale.set(1, 1.35, 0.95); egg.position.set(0, 0.95, 0.05); egg.rotation.y = Math.PI; g.add(egg);
      const cut = cy(g, 0.36, 0.36, 0.08, 0, 0.55, 0.05, F.cream, 20); cut.scale.z = 0.9; pillow(g, 0, 0.85, -0.12, F.mustard, 0.9);
    },
    floorCushion(it, g, F) { const m = [F.sand, F.sage, F.mustard, F.petrol][it.id.length % 4]; bx(g, it.w, 0.10, it.d, 0, 0, 0, m); sp(g, 0.02, 0, 0.1, 0, F.dark); },
    lowBench(it, g, F) { bx(g, it.w, 0.05, it.d, 0, it.h - 0.05, 0, F.oak); for (const x of [-1, 1]) bx(g, 0.05, it.h - 0.05, it.d - 0.04, x * (it.w / 2 - 0.1), 0, 0, F.oak); for (let i = 0; i < 3; i++) bx(g, 0.3, 0.25, 0.04, -it.w / 2 + 0.3 + i * 0.4, it.h, 0, [F.cream, F.sand, F.sage][i]); },
    trunk(it, g, F) {   // baúl de madera (rústico)
      bx(g, it.w, it.h - 0.08, it.d, 0, 0, 0, F.oak); const lid = new THREE.Mesh(new THREE.CylinderGeometry(it.d / 2, it.d / 2, it.w, 16, 1, false, 0, Math.PI), F.oak); lid.rotation.z = Math.PI / 2; lid.scale.x = 0.3; lid.position.y = it.h - 0.08; g.add(lid);
      for (const x of [-1, 0, 1]) bx(g, 0.04, it.h - 0.06, it.d + 0.01, x * (it.w / 2 - 0.1), 0, 0, F.metal);
    },
    screen(it, g, F) {   // biombo / shoji (japandi)
      const n = 3, pw = it.w / n;
      for (let i = 0; i < n; i++) { const p = new THREE.Group(); p.position.set(-it.w / 2 + pw * (i + 0.5), 0, (i % 2) * 0.12); p.rotation.y = (i % 2 ? -1 : 1) * 0.3; g.add(p);
        for (const x of [-1, 1]) bx(p, 0.03, it.h, 0.03, x * (pw / 2 - 0.015), 0, 0, F.oak); for (let j = 0; j <= 4; j++) bx(p, pw, 0.025, 0.03, 0, 0.05 + j * (it.h - 0.1) / 4, 0, F.oak);
        bx(p, pw - 0.05, it.h - 0.12, 0.004, 0, 0.06, 0, F.lampShade); }
    },
    lantern(it, g, F, ctx) {   // farol de papel en el suelo (japandi)
      const p = new THREE.Mesh(new THREE.SphereGeometry(it.w / 2, 20, 14), F.lampShade); p.scale.y = it.h / it.w; p.position.y = it.h / 2; g.add(p); ctx.furn.glow.push(F.lampShade); light(ctx, g, 0xffd9a0, 1.2, it.h / 2, 'living', 3);
    },
    gallery(it, g, F) {   // pared de cuadros (ecléctico)
      const fr = [[-0.45, 0.25, 0.45, 0.55], [0.12, 0.35, 0.5, 0.38], [0.6, 0.15, 0.3, 0.42], [-0.3, -0.35, 0.35, 0.4], [0.25, -0.3, 0.55, 0.32], [-0.75, -0.2, 0.25, 0.3]];
      const cols = [F.sage, F.mustard, F.petrol, F.sofa, F.rug, F.cream];
      fr.forEach(([x, y, w, h], i) => { bx(g, w, h, 0.025, x, y, 0, i % 2 ? F.gold : F.dark); bx(g, w - 0.05, h - 0.05, 0.004, x, y + 0.025, 0.014, cols[i]); });
    },
    macrame(it, g, F) { bx(g, it.w, 0.03, 0.03, 0, it.h, 0, F.oak); for (let i = 0; i < 12; i++) { const L = it.h * (0.55 + 0.4 * Math.sin((i / 11) * Math.PI)); bx(g, 0.012, L, 0.012, -it.w / 2 + 0.04 + i * (it.w - 0.08) / 11, it.h - L, 0.01, F.cream); } },
    basket(it, g, F) { cy(g, it.w / 2, it.w / 2 - 0.04, it.h, 0, 0, 0, F.rattan, 20); bx(g, it.w * 0.6, 0.12, 0.05, 0, it.h - 0.02, 0, F.cream); },
    locker(it, g, F) { bx(g, it.w, it.h, it.d, 0, 0, 0, F.dark); for (let i = 0; i < 2; i++) { bx(g, it.w / 2 - 0.02, it.h - 0.1, 0.01, -it.w / 4 + i * it.w / 2, 0.05, it.d / 2, F.metal); for (let j = 0; j < 4; j++) bx(g, it.w / 2 - 0.12, 0.012, 0.012, -it.w / 4 + i * it.w / 2, it.h - 0.2 - j * 0.04, it.d / 2 + 0.005, F.dark); } },
  };
  return B;
}
