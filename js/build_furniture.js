import * as THREE from 'three';
import { FURNITURE, STYLES, VARIANTS, STYLE_ALIAS } from './furniture_data.js';
import { makeStyled } from './build_styles.js';

// Mobiliario propuesto. Cada pieza se construye en coordenadas locales (frente = +z, centro de la huella en x,z = 0,
// suelo en y = 0) y luego se coloca y gira según `face`. Los colores salen del estilo elegido (STYLES).

const std = (color, roughness = 0.75, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });

function grainTex(base, seed) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'); let s = seed >>> 0;
  const R = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(140,105,60,${0.05 + R() * 0.08})`; g.lineWidth = 0.6 + R() * 1.2; const y = R() * 256; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(80, y + (R() - 0.5) * 8, 170, y + (R() - 0.5) * 8, 256, y + (R() - 0.5) * 4); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

function makeMats() {
  const F = {};
  F.oak = std(0xffffff, 0.6, { map: grainTex('#dcc097', 3) });
  F.ash = std(0xffffff, 0.6, { map: grainTex('#e8d6b4', 9) });
  F.sofa = std(0xb59468, 1); F.sofaSoft = std(0xc4a67c, 1); F.sofaLeg = std(0x1d1d1f, 0.4, { metalness: 0.4 });
  F.sand = std(0xcbb890, 0.95);          // tela arena
  F.cream = std(0xe9dfc9, 0.95);
  F.linen = std(0xe9e2d0, 1, { side: THREE.DoubleSide });
  F.sage = std(0x93a58d, 0.95);
  F.sageDark = std(0x7e9479, 1, { side: THREE.DoubleSide });
  F.petrol = std(0x6d9aa1, 0.95);
  F.mustard = std(0xd8b04c, 0.95);
  F.rug = std(0xe8dfcb, 1);
  F.rugEdge = std(0xd9cdb2, 1);
  F.rattan = std(0xc9a56d, 0.9, { side: THREE.DoubleSide });
  F.ceramic = std(0xf3efe6, 0.35);
  F.ceramicSand = std(0xd3bf9d, 0.5);
  F.white = std(0xf4f2ee, 0.5);
  F.frameMat = std(0x2b2b2b, 0.6);
  F.dark = std(0x1d1d1f, 0.5, { metalness: 0.4 });
  F.gold = std(0xc9a24a, 0.35, { metalness: 0.8 });
  F.marble = std(0xeeece8, 0.25);
  F.glassF = new THREE.MeshPhysicalMaterial({ color: 0xdfeef0, roughness: 0.05, transparent: true, opacity: 0.35 });
  F.metal = std(0xd6d4cd, 0.4, { metalness: 0.5 });
  F.inox = std(0xc9ccce, 0.35, { metalness: 0.55 });
  F.screen = std(0x16181b, 0.2, { metalness: 0.2 });
  F.silver = std(0xdcdcde, 0.35, { metalness: 0.6 });
  F.mirror = std(0xe6eef2, 0.04, { metalness: 0.95 });
  F.leaf1 = std(0x4f7a4a, 0.9); F.leaf2 = std(0x628c58, 0.9); F.leaf3 = std(0x3f6b45, 0.9); F.olive = std(0x8a9a6a, 0.9); F.trunk = std(0x7a5f43, 1);
  F.pink = std(0xd9768a, 0.9); F.soil = std(0x4b3a2b, 1);
  F.lampShade = new THREE.MeshStandardMaterial({ color: 0xf6ead2, roughness: 0.8, emissive: 0xffd9a0, emissiveIntensity: 0, side: THREE.DoubleSide });
  F.bulb = new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffd9a0, emissiveIntensity: 0 });
  return F;
}

// ---------------------------------------------------------------------------------- utilidades
const bx = (g, w, h, d, x, y, z, mat, ry = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y + h / 2, z); m.rotation.y = ry;
  m.castShadow = m.receiveShadow = true; g.add(m); return m;
};
const cy = (g, rt, rb, h, x, y, z, mat, seg = 20) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y + h / 2, z);
  m.castShadow = m.receiveShadow = true; g.add(m); return m;
};
const sp = (g, r, x, y, z, mat, sx = 1, sy = 1, sz = 1) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; g.add(m); return m;
};
const legs4 = (g, w, d, h, t, mat, inset = 0.05) => {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, t, h, t, sx * (w / 2 - inset), 0, sz * (d / 2 - inset), mat);
};
const light = (ctx, g, color, intensity, y, group, dist = 5) => {
  const L = new THREE.PointLight(color, 0, dist, 2); L.position.set(0, y, 0); g.add(L);
  ctx.furn.lights.push({ L, I: intensity, group }); return L;
};
const books = (g, F, x, y, z, n, rot = 0) => {
  const cols = [F.sage, F.sand, F.petrol, F.cream, F.mustard]; let o = 0;
  for (let i = 0; i < n; i++) { const t = 0.025 + (i % 3) * 0.008; bx(g, t, 0.20 + (i % 2) * 0.03, 0.15, x + o, y, z, cols[i % 5], rot); o += t + 0.002; }
};

// ---------------------------------------------------------------------------------- piezas
const B = {
  sofaL(it, g, F, ctx) {
    // Chaise longue terminal (respaldo también en el lado de la chaise). Chaise a la izquierda local = derecha de quien se sienta.
    const lg = it.legs, cw = it.chaise, W = it.w, D = it.d, arm = 0.20, bk = 0.20;
    const xl = -W / 2, xm = xl + cw, xr = W / 2;
    const zb = -D / 2, zf = 0.0, zc = D / 2;
    const S = F.sofa, C = F.sofaSoft;
    bx(g, W - cw, 0.18, zf - zb, (xm + xr) / 2, lg, (zb + zf) / 2, S);                     // base asiento
    bx(g, cw, 0.18, zc - zb, (xl + xm) / 2, lg, (zb + zc) / 2, S);                         // base chaise
    const n = 2, sw = (xr - arm - xm) / n;
    for (let i = 0; i < n; i++) bx(g, sw - 0.01, 0.14, zf - zb - bk, xm + sw * (i + 0.5), lg + 0.18, (zb + bk + zf) / 2, C);   // asientos
    bx(g, cw - bk - 0.01, 0.14, zc - zb - bk, (xl + bk + xm) / 2, lg + 0.18, (zb + bk + zc) / 2, C);                      // asiento chaise
    bx(g, W - 0.02, 0.30, bk, 0, lg + 0.18, zb + bk / 2, S);                               // respaldo (estructura)
    bx(g, bk, 0.30, zc - zb, xl + bk / 2, lg + 0.18, (zb + zc) / 2, S);                    // respaldo lateral de la chaise
    bx(g, arm, 0.44, zf - zb, xr - arm / 2, lg + 0.18, (zb + zf) / 2, S);                  // brazo izquierdo (de quien se sienta)
    // cojines de respaldo, algo reclinados
    const back = (x, w, z, h = 0.46) => { const m = bx(g, w, h, 0.20, x, lg + 0.30, z, C); m.rotation.x = -0.12; return m; };
    back((xl + bk + xm) / 2 + 0.06, cw - bk - 0.02, zb + bk + 0.06);
    for (let i = 0; i < n; i++) back(xm + sw * (i + 0.5), sw - 0.02, zb + bk + 0.06);
    const side = bx(g, 0.20, 0.44, 1.10, xl + bk + 0.06, lg + 0.30, zb + bk + 0.62, C); side.rotation.z = 0.12;   // cojín del lateral
    // almohadón de brazo (reposacabezas) y dos cojines sueltos
    const pil = sp(g, 0.14, xr - arm / 2, lg + 0.18 + 0.44 + 0.05, (zb + zf) / 2 - 0.05, C, 0.85, 0.5, 2.4);
    for (const x of [xm + sw * 0.5, xm + sw * 1.5]) { const c = bx(g, 0.40, 0.28, 0.12, x, lg + 0.32, zb + bk + 0.20, C); c.rotation.x = -0.35; c.rotation.z = (x < 0 ? 0.08 : -0.08); }
    // patas negras abiertas hacia fuera
    for (const [x, z, tx, tz] of [[xl + 0.10, zb + 0.10, -1, -1], [xl + 0.10, zc - 0.10, -1, 1], [xm, zc - 0.10, 1, 1], [xr - 0.10, zb + 0.10, 1, -1], [xr - 0.10, zf - 0.08, 1, 1], [0.1, zb + 0.10, 0, -1]]) {
      const l = bx(g, 0.035, lg + 0.02, 0.07, x + tx * 0.02, 0, z + tz * 0.02, F.sofaLeg); l.rotation.z = -tx * 0.22; l.rotation.x = tz * 0.18;
    }
  },
  sofa(it, g, F) {
    // Sofá recto: frente hacia +z local, respaldo en -z
    const lg = it.legs, W = it.w, D = it.d, arm = 0.18, bk = 0.20, S = F.sofa, C = F.sofaSoft;
    bx(g, W, 0.18, D, 0, lg, 0, S);
    const n = Math.max(2, Math.round((W - 2 * arm) / 0.65)), sw = (W - 2 * arm) / n;
    for (let i = 0; i < n; i++) bx(g, sw - 0.01, 0.14, D - bk, -W / 2 + arm + sw * (i + 0.5), lg + 0.18, bk / 2, C);
    bx(g, W, 0.30, bk, 0, lg + 0.18, -D / 2 + bk / 2, S);
    for (const s of [-1, 1]) bx(g, arm, 0.42, D, s * (W / 2 - arm / 2), lg + 0.18, 0, S);
    for (let i = 0; i < n; i++) { const m = bx(g, sw - 0.02, 0.44, 0.18, -W / 2 + arm + sw * (i + 0.5), lg + 0.30, -D / 2 + bk + 0.06, C); m.rotation.x = -0.12; }
    for (const [x, z] of [[-W / 2 + 0.08, -D / 2 + 0.08], [W / 2 - 0.08, -D / 2 + 0.08], [-W / 2 + 0.08, D / 2 - 0.08], [W / 2 - 0.08, D / 2 - 0.08]]) bx(g, 0.04, lg + 0.01, 0.04, x, 0, z, F.sofaLeg);
  },
  outdoorChair(it, g, F) {
    bx(g, 0.5, 0.04, 0.5, 0, 0.42, 0, F.white); legs4(g, 0.5, 0.5, 0.42, 0.03, F.metal, 0.03);
    bx(g, 0.5, 0.40, 0.04, 0, 0.44, -0.23, F.white);
  },
  frame(it, g, F) {
    // Cuadro en la pared: marco y lámina abstracta con los colores del estilo
    const { w, h } = it;
    bx(g, w, h, 0.03, 0, 0, 0, F.frameMat);
    bx(g, w - 0.08, h - 0.08, 0.004, 0, 0.04, 0.016, F.cream);
    bx(g, (w - 0.2) * 0.55, (h - 0.2) * 0.6, 0.004, -(w - 0.2) * 0.2, 0.14, 0.02, F.sage);
    bx(g, (w - 0.2) * 0.35, (h - 0.2) * 0.35, 0.004, (w - 0.2) * 0.25, 0.10 + (h - 0.2) * 0.5, 0.021, F.mustard);
    cy(g, Math.min(w, h) * 0.12, Math.min(w, h) * 0.12, 0.004, (w - 0.2) * 0.2, 0.12, 0.022, F.petrol).rotation.x = Math.PI / 2;
  },
  tvUnit(it, g, F) {
    const { w, d, h, legs: lg } = it;
    bx(g, w, 0.03, d, 0, h - 0.03, 0, F.oak);
    bx(g, w - 0.06, 0.02, d - 0.04, 0, lg, 0, F.oak);
    bx(g, 0.03, h - lg, d - 0.02, -w / 2 + 0.015, lg, 0, F.oak); bx(g, 0.03, h - lg, d - 0.02, w / 2 - 0.015, lg, 0, F.oak);
    bx(g, 0.03, h - lg, d - 0.02, 0, lg, 0, F.oak);
    bx(g, w - 0.04, h - lg - 0.03, 0.02, 0, lg, -d / 2 + 0.02, F.ash);
    const pw = (w - 0.12) / 2 - 0.08;
    [-1, 1].forEach((s) => bx(g, pw * 0.55, h - lg - 0.06, 0.02, s * (w / 2 - 0.03 - pw * 0.275 - 0.01), lg + 0.02, d / 2 - 0.01, F.ash));
    bx(g, 0.20, 0.10, 0.12, 0, h, 0.0, F.ceramicSand); bx(g, 0.03, 0.2, 0.03, -0.64, h, 0.0, F.sage);
    legs4(g, w, d, lg, 0.045, F.oak, 0.06);
  },
  tv(it, g, F) {
    bx(g, it.w, it.h, it.d, 0, 0, 0, F.screen);
    bx(g, it.w - 0.02, it.h - 0.02, 0.005, 0, 0.01, it.d / 2, std(0x0a0b0d, 0.08));
  },
  coffeeTable(it, g, F) {
    const top = new THREE.Group(); top.position.y = 0;
    bx(top, it.w, 0.04, it.d, 0, 0.34, 0, F.oak); bx(top, it.w - 0.1, 0.02, it.d - 0.1, 0, 0.30, 0, F.ash);
    cy(top, 0.10, 0.10, 0.06, -0.25, 0.38, 0.0, F.ceramic); books(top, F, 0.15, 0.38, 0.0, 4, 0.3);
    g.add(top); g.userData.lift = top;
    legs4(g, it.w, it.d, 0.34, 0.045, F.oak, 0.06);
  },
  rug(it, g, F) {
    if (it.round) { cy(g, it.w / 2, it.w / 2, it.h, 0, 0, 0, F.rug, 40); cy(g, it.w / 2 - 0.05, it.w / 2 - 0.05, it.h + 0.002, 0, 0, 0, F.rugEdge, 40); return; }
    bx(g, it.w, it.h, it.d, 0, 0, 0, F.rugEdge); bx(g, it.w - 0.10, it.h + 0.002, it.d - 0.10, 0, 0, 0, F.rug);
    for (let i = 0; i < 6; i++) bx(g, it.w - 0.2, it.h + 0.003, 0.012, 0, 0, -it.d / 2 + 0.25 + i * (it.d - 0.5) / 5, F.rugEdge);
  },
  floorLamp(it, g, F, ctx) {
    cy(g, 0.15, 0.15, 0.025, 0, 0, 0, F.metal); cy(g, 0.012, 0.012, 1.38, 0, 0.025, 0, F.metal);
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.19, 0.30, 24, 1, true), F.lampShade); sh.position.y = 1.50; g.add(sh);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), F.bulb); bulb.position.y = 1.48; g.add(bulb);
    ctx.furn.glow.push(F.lampShade, F.bulb);
    light(ctx, g, it.light.color, it.light.i, it.light.y, 'living');
  },
  plant(it, g, F) {
    const pot = (r, h, mat = F.ceramicSand) => { cy(g, r, r * 0.8, h, 0, 0, 0, mat); cy(g, r * 0.92, r * 0.92, 0.01, 0, h, 0, F.soil); };
    const k = it.plant;
    if (k === 'ficus') { pot(0.17, 0.32); cy(g, 0.02, 0.025, 0.55, 0, 0.32, 0, F.trunk); [[0, 1.05, 0, 0.30], [0.12, 1.30, 0.06, 0.24], [-0.1, 1.45, -0.04, 0.22], [0.0, 0.85, 0.12, 0.2]].forEach(([x, y, z, r], i) => sp(g, r, x, y, z, [F.leaf1, F.leaf2, F.leaf3][i % 3], 1, 0.95, 1)); }
    else if (k === 'monstera') { pot(0.17, 0.30, F.ceramic); for (let i = 0; i < 7; i++) { const a = i * 0.9; const l = sp(g, 0.17, Math.cos(a) * 0.17, 0.62 + (i % 3) * 0.14, Math.sin(a) * 0.17, [F.leaf1, F.leaf3][i % 2], 1, 0.12, 0.8); l.rotation.y = a; l.rotation.z = 0.3; } cy(g, 0.012, 0.012, 0.5, 0, 0.3, 0, F.leaf3); }
    else if (k === 'palm') { pot(0.17, 0.30, F.ceramic); for (let i = 0; i < 8; i++) { const a = i * 0.8; const l = sp(g, 0.30, Math.cos(a) * 0.22, 1.0 + (i % 3) * 0.14, Math.sin(a) * 0.22, F.leaf2, 0.14, 1, 0.14); l.rotation.z = Math.cos(a) * 0.4; l.rotation.x = Math.sin(a) * 0.4; } cy(g, 0.012, 0.012, 0.9, 0, 0.3, 0, F.trunk); }
    else if (k === 'zz') { pot(0.12, 0.2, F.ceramic); for (let i = 0; i < 6; i++) { const a = i * 1.05; sp(g, 0.14, Math.cos(a) * 0.07, 0.45 + (i % 2) * 0.12, Math.sin(a) * 0.07, F.leaf3, 0.3, 1, 0.3); } }
    else if (k === 'olive') { pot(0.22, 0.38); cy(g, 0.025, 0.04, 0.8, 0, 0.38, 0, F.trunk); [[0, 1.2, 0, 0.30], [0.18, 1.05, 0.05, 0.2], [-0.16, 1.1, -0.06, 0.2]].forEach(([x, y, z, r]) => sp(g, r, x, y, z, F.olive, 1, 0.8, 1)); }
    else { pot(0.18, 0.22, F.ceramicSand); [[0, 0.4, 0, 0.18], [0.12, 0.34, 0.06, 0.12], [-0.1, 0.36, -0.05, 0.12]].forEach(([x, y, z, r]) => sp(g, r, x, y, z, F.leaf2, 1, 0.7, 1)); for (let i = 0; i < 5; i++) sp(g, 0.035, Math.cos(i * 1.3) * 0.12, 0.48, Math.sin(i * 1.3) * 0.1, F.pink); }
  },
  blind(it, g, F) {
    const fab = new THREE.Group(); fab.position.set(0, it.h, 0); g.add(fab);
    bx(fab, it.w, it.h, 0.012, 0, -it.h, 0, F.linen);
    cy(g, 0.03, 0.03, it.w, 0, it.h - 0.03, 0, F.white).rotation.z = Math.PI / 2;
    g.userData.fabric = fab; g.userData.mode = { axis: 'y', open: 0.12, closed: 1 };
  },
  curtain(it, g, F) {
    // dos mitades (D3) o un panel (corredera): cada una con pliegues
    const mat = it.color === 'sageDark' ? F.sageDark : F.linen;
    const halves = it.color === 'sageDark' ? [-1, 1] : [0];
    const hw = it.color === 'sageDark' ? it.w / 2 : it.w;
    g.userData.fabrics = [];
    halves.forEach((side, idx) => {
      const fab = new THREE.Group();
      const anchorX = side === 0 ? (it.anchor || 0) * it.w / 2 : side * it.w / 2;
      fab.position.x = anchorX; g.add(fab);
      const dir = side === 0 ? -(it.anchor || 0) : -side;
      const n = Math.round(hw / 0.1);
      for (let i = 0; i < n; i++) bx(fab, hw / n * 0.95, it.h, 0.03, dir * (hw / n) * (i + 0.5), 0, (i % 2) * 0.035 - 0.0, mat);
      g.userData.fabrics.push(fab);
    });
    cy(g, 0.012, 0.012, it.w + 0.1, 0, it.h - 0.03, 0.0, F.oak).rotation.z = Math.PI / 2;
    g.userData.mode = { axis: 'x', open: it.color === 'sageDark' ? 0.3 : 1, closed: it.color === 'sageDark' ? 1 : 2.3 };
  },
  openShelf(it, g, F) {
    const { w, d, h, legs: lg } = it;
    bx(g, 0.03, h - lg, d, -w / 2 + 0.015, lg, 0, F.oak); bx(g, 0.03, h - lg, d, w / 2 - 0.015, lg, 0, F.oak);
    for (let i = 0; i <= 4; i++) bx(g, w, 0.025, d, 0, lg + i * ((h - lg - 0.025) / 4), 0, F.oak);
    bx(g, w, h - lg, 0.01, 0, lg, -d / 2 + 0.005, F.ash);
    legs4(g, w, d, lg, 0.04, F.oak, 0.04);
    const y = (i) => lg + 0.025 + i * ((h - lg - 0.025) / 4);
    books(g, F, -w / 2 + 0.1, y(0), 0, 8); cy(g, 0.07, 0.06, 0.18, 0.12, y(0), 0, F.ceramic); bx(g, 0.28, 0.2, 0.2, 0.0, y(1), 0, F.rattan);
    sp(g, 0.07, -0.18, y(2) + 0.08, 0, F.leaf1); cy(g, 0.05, 0.04, 0.12, -0.18, y(2), 0, F.ceramicSand); books(g, F, 0.05, y(2), 0, 5); books(g, F, -0.2, y(3), 0, 6);
    bx(g, 0.3, 0.22, 0.22, 0.2, y(3), 0, F.linen);
  },
  sideboard(it, g, F) {
    const { w, d, h, legs: lg } = it;
    bx(g, w, 0.03, d, 0, h - 0.03, 0, F.oak); bx(g, w - 0.04, h - lg - 0.03, d - 0.02, 0, lg, 0, F.oak);
    for (let i = 0; i < 3; i++) bx(g, (w - 0.1) / 3 - 0.01, h - lg - 0.1, 0.02, -w / 2 + 0.05 + ((w - 0.1) / 3) * (i + 0.5), lg + 0.04, d / 2 - 0.005, F.ash);
    legs4(g, w, d, lg, 0.045, F.oak, 0.06);
    cy(g, 0.08, 0.06, 0.2, 0.3, h, 0, F.ceramic); books(g, F, -0.3, h, 0, 5);
  },
  armchair(it, g, F) {
    const lg = it.legs;
    bx(g, it.w, 0.18, it.d, 0, lg, 0, F.sand); bx(g, it.w - 0.2, 0.12, it.d - 0.25, 0, lg + 0.18, 0.08, F.cream);
    bx(g, it.w, 0.40, 0.2, 0, lg + 0.18, -it.d / 2 + 0.1, F.sand); bx(g, 0.14, 0.26, it.d - 0.1, -it.w / 2 + 0.07, lg + 0.18, 0.03, F.sand); bx(g, 0.14, 0.26, it.d - 0.1, it.w / 2 - 0.07, lg + 0.18, 0.03, F.sand);
    legs4(g, it.w, it.d, lg, 0.045, F.oak, 0.07);
  },
  puff(it, g, F) { const m = it.color === 'sage' ? F.sage : F.sand; cy(g, it.w / 2, it.w / 2 - 0.03, it.h, 0, 0, 0, m, 28); cy(g, it.w / 2 - 0.04, it.w / 2 - 0.04, 0.02, 0, it.h, 0, m, 28); },
  sideTable(it, g, F) {
    cy(g, it.w / 2, it.w / 2, 0.025, 0, it.h - 0.025, 0, F.oak, 28);
    for (let i = 0; i < 3; i++) { const a = i * 2.094; bx(g, 0.03, it.h - 0.025, 0.03, Math.cos(a) * (it.w / 2 - 0.06), 0, Math.sin(a) * (it.w / 2 - 0.06), F.oak); }
  },
  diningTable(it, g, F) {
    const { w, d } = it;
    bx(g, w, 0.04, d, 0, 0.71, 0, F.oak); bx(g, w - 0.14, 0.07, d - 0.14, 0, 0.64, 0, F.ash); bx(g, w, 0.002, 0.01, 0, 0.751, 0, F.ash);
    legs4(g, w, d, 0.71, 0.06, F.oak, 0.06);
    cy(g, 0.06, 0.05, 0.22, 0, 0.75, 0.2, F.ceramic); sp(g, 0.09, 0, 1.0, 0.2, F.leaf1);
  },
  chair(it, g, F) {
    bx(g, 0.43, 0.05, 0.42, 0, 0.40, 0.02, F.oak); bx(g, 0.39, 0.04, 0.38, 0, 0.45, 0.02, F.sand);
    legs4(g, 0.43, 0.42, 0.40, 0.035, F.oak, 0.03);
    for (const s of [-1, 1]) bx(g, 0.035, 0.42, 0.035, s * 0.19, 0.43, -0.19, F.oak);
    for (let i = 0; i < 3; i++) bx(g, 0.40, 0.06, 0.02, 0, 0.60 + i * 0.09, -0.20, F.oak);
  },
  pendant(it, g, F, ctx) {
    const top = 2.60 - it.y;
    cy(g, 0.004, 0.004, top - it.h, 0, it.h, 0, F.black || F.metal);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.275, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.62), F.rattan); dome.position.y = it.h * 0.9; dome.castShadow = true; g.add(dome);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), F.bulb); bulb.position.y = it.h * 0.55; g.add(bulb); ctx.furn.glow.push(F.bulb);
    light(ctx, g, it.light.color, it.light.i, 0.1, 'living');
  },
  dryRack(it, g, F) {
    // tendedero plegable de pie: dos bastidores y barras (huella w × d, eje largo = z)
    for (const s of [-1, 1]) { bx(g, 0.02, 0.98, 0.02, s * (it.w / 2 - 0.02), 0, -it.d / 2 + 0.05, F.metal); bx(g, 0.02, 0.98, 0.02, s * (it.w / 2 - 0.02), 0, it.d / 2 - 0.05, F.metal); bx(g, 0.02, 0.02, it.d - 0.06, s * (it.w / 2 - 0.02), 0.98, 0, F.metal); }
    for (let i = 0; i < 9; i++) bx(g, it.w - 0.04, 0.012, 0.012, 0, 0.98, -it.d / 2 + 0.06 + i * ((it.d - 0.12) / 8), F.metal);
    bx(g, 0.5, 0.012, it.d - 0.1, 0, 0.30, 0, F.metal);
    bx(g, 0.40, 0.55, 0.01, 0, 0.42, -0.45, F.linen); bx(g, 0.40, 0.4, 0.01, 0, 0.58, 0.25, F.sage);
  },
  bench(it, g, F) {
    const { w, d, h, legs: lg } = it;
    bx(g, w, 0.03, d, 0, h - 0.07, 0, F.oak); bx(g, w - 0.06, 0.04, d - 0.06, 0, h - 0.04, 0, F.sand);
    bx(g, w - 0.04, h - lg - 0.07, d - 0.04, 0, lg, 0, F.oak);
    [-1, 1].forEach((s) => bx(g, w / 2 - 0.07, h - lg - 0.14, 0.02, s * (w / 4), lg + 0.04, d / 2 - 0.005, F.rattan));
    legs4(g, w, d, lg, 0.045, F.oak, 0.05);
  },
  coatRack(it, g, F) {
    bx(g, it.w, 0.1, 0.02, 0, 0, 0, F.oak);
    for (let i = 0; i < 4; i++) { bx(g, 0.025, 0.025, 0.07, -it.w / 2 + 0.12 + i * ((it.w - 0.24) / 3), 0.04, 0.045, F.oak); sp(g, 0.018, -it.w / 2 + 0.12 + i * ((it.w - 0.24) / 3), 0.052, 0.085, F.oak); }
    bx(g, 0.18, 0.5, 0.05, -0.22, -0.55, 0.03, F.linen);
  },
  shoeCabinet(it, g, F) {
    const { w, d, h, legs: lg } = it;
    bx(g, w, h - lg, d, 0, lg, 0, F.oak);
    for (let i = 0; i < 3; i++) { const m = bx(g, w - 0.04, (h - lg - 0.06) / 3 - 0.01, 0.02, 0, lg + 0.03 + i * ((h - lg - 0.06) / 3), d / 2 + 0.005, F.ash); m.rotation.x = -0.12; }
    legs4(g, w, d, lg, 0.035, F.oak, 0.03);
  },
  mirror(it, g, F) {
    bx(g, it.w, it.h, it.d, 0, 0, 0, F.oak); bx(g, it.w - 0.08, it.h - 0.08, 0.006, 0, 0.04, it.d / 2, F.mirror);
  },
  bed(it, g, F) {
    // cabeza en -z local, pies en +z. Canapé abatible con patas de 15 cm
    const { w, d, legs: lg } = it;
    bx(g, w, 0.17, d, 0, lg, 0, F.oak); bx(g, w - 0.04, 0.02, d - 0.04, 0, lg + 0.17, 0, F.ash);
    bx(g, w - 0.02, 0.20, d - 0.02, 0, lg + 0.19, 0, F.cream);
    bx(g, w, 0.07, d * 0.72, 0, lg + 0.37, d * 0.14, F.white);
    const th = it.bed.throw === 'mustard' ? F.mustard : F.sage; bx(g, w + 0.01, 0.075, 0.32, 0, lg + 0.37, d / 2 - 0.30, th);
    const pw = (w - 0.2) / 2; [-1, 1].forEach((s) => bx(g, pw - 0.02, 0.12, 0.32, s * pw / 2 * 1.05, lg + 0.39, -d / 2 + 0.25, F.white));
    if (w > 1.4) [-1, 1].forEach((s) => bx(g, 0.40, 0.38, 0.09, s * 0.35, lg + 0.45, -d / 2 + 0.55, s > 0 ? F.petrol : F.sage, s * 0.15));
    legs4(g, w, d, lg, 0.05, F.oak, 0.06);
  },
  headboard(it, g, F) {
    bx(g, it.w, it.h, it.d, 0, 0, 0, F.sand); bx(g, it.w - 0.12, it.h - 0.16, 0.01, 0, 0.08, it.d / 2, F.cream);
    for (const s of [-1, 1]) bx(g, 0.05, 0.25, 0.05, s * (it.w / 2 - 0.05), -0.25, 0, F.oak);
  },
  nightstand(it, g, F, ctx) {
    const { w, d, h, legs: lg } = it;
    bx(g, w, 0.03, d, 0, h - 0.03, 0, F.oak); bx(g, w - 0.04, h - lg - 0.03, d - 0.02, 0, lg, 0, F.oak);
    bx(g, w - 0.08, 0.12, 0.02, 0, lg + 0.04, d / 2 + 0.002, F.ash); bx(g, w - 0.08, 0.10, 0.02, 0, lg + 0.17, d / 2 + 0.002, F.ash); bx(g, 0.07, 0.012, 0.016, 0, lg + 0.12, d / 2 + 0.02, F.metal);
    legs4(g, w, d, lg, 0.04, F.oak, 0.04);
    if (it.lampOn) {
      cy(g, 0.06, 0.07, 0.02, 0, h, 0, F.ceramic); cy(g, 0.045, 0.06, 0.16, 0, h + 0.02, 0, F.ceramic);
      const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.17, 20, 1, true), F.lampShade); sh.position.y = h + 0.28; g.add(sh);
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), F.bulb); b.position.y = h + 0.25; g.add(b);
      ctx.furn.glow.push(F.lampShade, F.bulb); light(ctx, g, 0xffd9a0, 1.2, h + 0.25, 'bedroom', 3.5);
    }
  },
  towerFan(it, g, F) {
    cy(g, 0.11, 0.12, 0.03, 0, 0, 0, F.cream); bx(g, 0.14, it.h - 0.05, 0.14, 0, 0.03, 0, F.cream);
    for (let i = 0; i < 14; i++) bx(g, 0.15, 0.012, 0.15, 0, 0.30 + i * 0.05, 0, F.white);
  },
  desk(it, g, F) {
    const { w, d } = it;
    bx(g, w, 0.03, d, 0, 0.71, 0, F.oak); bx(g, w - 0.06, 0.06, 0.02, 0, 0.65, d / 2 - 0.06, F.oak);
    legs4(g, w, d, 0.71, 0.04, F.oak, 0.04);
    // iMac 24" (blanco/plata) al fondo, portátil a la derecha, lámpara a la izquierda
    bx(g, 0.547, 0.46, 0.012, 0.0, 0.32 + 0.74, -d / 2 + 0.22, F.silver); bx(g, 0.53, 0.38, 0.004, 0, 0.40 + 0.74, -d / 2 + 0.2255 + 0.0, std(0x15171a, 0.1));
    bx(g, 0.2, 0.012, 0.14, 0, 0.74, -d / 2 + 0.2, F.silver); bx(g, 0.05, 0.31, 0.012, 0, 0.74, -d / 2 + 0.22, F.silver);
    bx(g, 0.31, 0.012, 0.22, 0.33, 0.74, 0.0, F.silver); bx(g, 0.31, 0.21, 0.01, 0.33, 0.752, -0.12, F.silver);
    cy(g, 0.07, 0.07, 0.015, -0.4, 0.74, -0.15, F.white); bx(g, 0.012, 0.32, 0.012, -0.4, 0.755, -0.15, F.white);
    const h = bx(g, 0.16, 0.05, 0.05, -0.34, 1.05, -0.12, F.white); h.rotation.z = 0.2;
    cy(g, 0.05, 0.05, 0.1, 0.0, 0.74, 0.15, F.ceramicSand);
  },
  officeChair(it, g, F) {
    cy(g, 0.02, 0.02, 0.3, 0, 0.06, 0, F.metal);
    for (let i = 0; i < 5; i++) { const a = i * 1.2566; const m = bx(g, 0.28, 0.025, 0.04, Math.cos(a) * 0.14, 0.04, Math.sin(a) * 0.14, F.metal); m.rotation.y = -a; sp(g, 0.025, Math.cos(a) * 0.28, 0.025, Math.sin(a) * 0.28, F.screen); }
    bx(g, 0.50, 0.08, 0.48, 0, 0.38, 0, F.sand); bx(g, 0.46, 0.55, 0.06, 0, 0.50, -0.25, F.sand);
    bx(g, 0.03, 0.2, 0.2, -0.28, 0.46, 0.0, F.metal); bx(g, 0.03, 0.2, 0.2, 0.28, 0.46, 0.0, F.metal);
  },
  gearShelf(it, g, F) {
    const { w, d, h, legs: lg } = it;
    bx(g, 0.03, h - lg, d, -w / 2 + 0.015, lg, 0, F.oak); bx(g, 0.03, h - lg, d, w / 2 - 0.015, lg, 0, F.oak);
    const n = 5, st = (h - lg - 0.03) / (n - 1);
    for (let i = 0; i < n; i++) bx(g, w, 0.03, d, 0, lg + i * st, 0, F.oak);
    bx(g, w, h - lg, 0.01, 0, lg, -d / 2 + 0.005, F.ash);
    legs4(g, w, d, lg, 0.04, F.oak, 0.04);
    const y = (i) => lg + 0.03 + i * st;
    bx(g, 0.36, 0.26, 0.28, -0.18, y(0), 0.0, F.linen); bx(g, 0.30, 0.26, 0.28, 0.2, y(0), 0, F.sand);
    bx(g, 0.32, 0.22, 0.26, -0.2, y(1), 0, F.sage); bx(g, 0.26, 0.2, 0.24, 0.18, y(1), 0, F.linen);
    bx(g, 0.34, 0.24, 0.28, 0, y(2), 0, F.sand); cy(g, 0.04, 0.04, 0.2, -0.3, y(2), 0.0, F.silver); cy(g, 0.045, 0.045, 0.14, 0.3, y(2), 0, F.silver);
    bx(g, 0.5, 0.2, 0.26, 0, y(3), 0, F.rattan); books(g, F, -0.3, y(3), 0.0, 6);
    bx(g, 0.012, 0.012, 0.012, 0, y(4), 0, F.silver);
  },
  washer(it, g, F) {
    bx(g, it.w, it.h, it.d, 0, 0, 0, F.white);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.02, 10, 30), F.inox); ring.position.set(0, 0.42, it.d / 2); g.add(ring);
    const gl = new THREE.Mesh(new THREE.CircleGeometry(0.17, 28), F.screen); gl.position.set(0, 0.42, it.d / 2 + 0.003); g.add(gl);
    bx(g, 0.3, 0.05, 0.006, -0.1, 0.77, it.d / 2, F.inox);
  },
  dishwasher(it, g, F) {
    bx(g, it.w - 0.01, it.h, it.d, 0, 0, 0, F.cabinetFront || F.white); bx(g, 0.40, 0.012, 0.02, 0, it.h - 0.14, it.d / 2 + 0.004, F.inox);
    bx(g, 0.1, 0.03, 0.004, 0.15, it.h - 0.06, it.d / 2 + 0.002, F.screen);
  },
  coffeeMaker(it, g, F) {
    bx(g, it.w, it.h - 0.05, it.d, 0, 0.05, 0, F.cream); bx(g, it.w, 0.05, it.d, 0, 0, 0, F.white); bx(g, 0.16, 0.12, 0.10, 0, 0.19, it.d / 2 - 0.12, F.silver);
    cy(g, 0.03, 0.03, 0.1, 0.0, 0.05, it.d / 2 - 0.05, F.ceramic);
  },
  airFryer(it, g, F) {
    bx(g, it.w, it.h, it.d, 0, 0, 0, F.white); bx(g, it.w - 0.06, 0.1, 0.01, 0, 0.12, it.d / 2, F.silver); bx(g, it.w - 0.04, 0.03, 0.02, 0, 0.26, it.d / 2 - 0.02, F.silver);
  },
  foldChair(it, g, F) {
    for (let i = 0; i < 5; i++) bx(g, 0.43, 0.015, 0.06, 0, 0.42, -0.19 + i * 0.09, F.oak);
    for (const s of [-1, 1]) { const a = bx(g, 0.025, 0.55, 0.025, s * 0.2, 0.0, 0.2, F.metal); a.rotation.x = 0.2; const b = bx(g, 0.025, 0.55, 0.025, s * 0.2, 0.0, -0.2, F.metal); b.rotation.x = -0.2; }
    for (let i = 0; i < 4; i++) bx(g, 0.43, 0.04, 0.012, 0, 0.5 + i * 0.1, -0.24 - i * 0.02, F.oak);
    for (const s of [-1, 1]) bx(g, 0.025, 0.42, 0.025, s * 0.2, 0.4, -0.23, F.metal);
  },
};

// ---------------------------------------------------------------------------------- montaje
const ROT = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 };
const isSolid = (f) => !f.wall && !f.walk && !f.marker && !f.onTop && f.y < 0.7 && f.h > 0.3 && f.kind !== 'pendant';

export function buildFurniture(ctx) {
  const F = makeMats();
  ctx.furn = { F, lights: [], glow: [], items: [], curtains: [], lift: [], root: new THREE.Group() };
  ctx.furn.root.name = 'furniture'; ctx.scene.add(ctx.furn.root); ctx.G.furniture = ctx.furn.root;
  // opción elegida por estancia (salón, dormitorios 2-4) y estilo
  const sel = { style: Object.keys(STYLES)[0] };
  for (const [room, opts] of Object.entries(VARIANTS)) sel[room] = Object.keys(opts)[0];
  const shown = (it) => {
    if (it.v !== 'base') { const [room, opt] = it.v.split(':'); if (sel[room] !== opt) return false; }
    const st = STYLES[sel.style];
    const ss = [sel.style, STYLE_ALIAS[sel.style]].filter(Boolean);
    if (it.styles && !ss.some((k) => it.styles.includes(k))) return false;
    if (it.notStyles && ss.some((k) => it.notStyles.includes(k))) return false;
    if (it.minPlants && st.plants < it.minPlants) return false;
    return true;
  };

  // Formas según estilo: los constructores de build_styles.js sustituyen a los genéricos
  Object.assign(B, makeStyled({ bx, cy, sp, legs4, light, books }));
  const visibleIds = new Set();
  // colisiones: una por pieza, activas si la pieza se ve
  for (const it of FURNITURE) if (isSolid(it)) {
    const ns = it.face === 'n' || it.face === 's';
    const dx = ns ? it.w : it.d, dz = ns ? it.d : it.w;
    ctx.dynColliders.push({ box: { x0: it.x - dx / 2, z0: it.z - dz / 2, x1: it.x + dx / 2, z1: it.z + dz / 2 }, fn: () => ctx.furn.root.visible && visibleIds.has(it.id) });
  }
  // (Re)construye todas las piezas con el estilo actual
  const buildAll = () => {
    for (const { obj } of ctx.furn.items) { ctx.furn.root.remove(obj); obj.traverse((o) => { if (o.isMesh) o.geometry.dispose(); }); }
    ctx.furn.items = []; ctx.furn.lights = []; ctx.furn.glow = [];
    for (const it of FURNITURE) {
      const build = B[it.kind]; if (!build) { console.warn('Sin constructor para', it.kind); continue; }
      const g = new THREE.Group();
      build(it, g, F, ctx);
      const inner = new THREE.Group(); inner.add(g);
      inner.position.set(it.x, it.y, it.z); inner.rotation.y = ROT[it.face];
      inner.userData.item = it;
      g.traverse((o) => { if (o.isMesh) { o.castShadow = o.castShadow !== false; o.receiveShadow = true; } });
      ctx.furn.root.add(inner);
      ctx.furn.items.push({ it, obj: inner });
    }
  };
  const refresh = () => { visibleIds.clear(); ctx.furn.items.forEach(({ it, obj }) => { obj.visible = shown(it); if (obj.visible) visibleIds.add(it.id); }); };
  ctx.furn.setOption = (room, opt) => { sel[room] = opt; refresh(); };
  ctx.furn.setStyle = (id) => {
    const st = STYLES[id]; if (!st) return; sel.style = id; F.style = id;
    const c = st.colors;
    for (const [k, hex] of Object.entries(c)) if (F[k]) F[k].color.setHex(hex);
    F.frameMat.color.setHex(c.frame ?? c.oak);
    if (ctx.M && st.wall && ctx.paintWall == null) ctx.M.wall.color.setHex(st.wall);
    buildAll(); refresh(); ctx.furn.setLamps?.(lampState.on, lampState.lvl);
    ctx.invalidate?.();
  };
  ctx.furn.selection = sel;
  ctx.furn.setCurtains = (closed) => {
    ctx.furn.curtains.forEach(({ g }) => {
      const m = g.userData.mode, k = closed ? m.closed : m.open;
      if (g.userData.fabric) g.userData.fabric.scale.y = k;
      if (g.userData.fabrics) g.userData.fabrics.forEach((f) => { f.scale.x = k; });
    });
  };
  ctx.furn.setLift = (up) => ctx.furn.lift.forEach((t) => { t.position.y = up ? 0.22 : 0; });
  const lampState = { on: false, lvl: 1 };
  ctx.furn.setLamps = (on, bedroomLevel = 1) => {
    lampState.on = on; lampState.lvl = bedroomLevel;
    ctx.furn.lights.forEach(({ L, I, group }) => { const k = group === 'bedroom' ? bedroomLevel : 1; L.intensity = on ? I * k : 0; L.visible = on && k > 0; });
    ctx.furn.glow.forEach((m) => { m.emissiveIntensity = on ? 1.4 : 0; });
  };
  ctx.furn.setEnabled = (on) => { ctx.furn.root.visible = on; };
  ctx.furn.setStyle(sel.style); ctx.furn.setCurtains(false); ctx.furn.setLamps(false);
}
