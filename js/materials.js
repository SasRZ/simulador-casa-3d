// Materiales y texturas procedurales (sin imágenes externas: todo se genera en canvas).
import * as THREE from 'three';

let _aniso = 8;
export function setAnisotropy(n) { _aniso = n; }

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function tex(canvas, repeat = true, srgb = true) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  t.anisotropy = _aniso;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const hex = (r, g, b) => `rgb(${r | 0},${g | 0},${b | 0})`;

// ---- Suelo de la vivienda: tarima/laminado marrón clarito (foto EjemploTonos). 1 tile = 1,2 × 1,2 m
function woodTex(base = [218, 190, 150], seed = 7, rows = 6) {
  const S = 1024, c = canvas(S, S), g = c.getContext('2d'), R = rng(seed);
  const rh = S / rows;
  for (let r = 0; r < rows; r++) {
    let x = -R() * S * 0.8;
    while (x < S) {
      const len = S * (0.6 + R() * 0.4);
      const v = 0.94 + R() * 0.10;
      g.fillStyle = hex(base[0] * v, base[1] * v, base[2] * v);
      g.fillRect(x, r * rh, len, rh);
      // veta
      for (let k = 0; k < 26; k++) {
        g.strokeStyle = `rgba(${base[0] * 0.69 + R() * 40},${base[1] * 0.6 + R() * 30},${base[2] * 0.53 + R() * 20},${0.05 + R() * 0.07})`;
        g.lineWidth = 0.6 + R() * 1.4;
        const yy = r * rh + R() * rh;
        g.beginPath(); g.moveTo(x, yy); g.bezierCurveTo(x + len * 0.3, yy + (R() - 0.5) * 6, x + len * 0.6, yy + (R() - 0.5) * 6, x + len, yy + (R() - 0.5) * 3); g.stroke();
      }
      g.fillStyle = `rgba(${base[0] * 0.44 | 0},${base[1] * 0.37 | 0},${base[2] * 0.3 | 0},0.55)`; g.fillRect(x, r * rh, 1.5, rh);      // junta testa
      x += len;
    }
    g.fillStyle = `rgba(${base[0] * 0.44 | 0},${base[1] * 0.37 | 0},${base[2] * 0.3 | 0},0.45)`; g.fillRect(0, r * rh, S, 1.5);          // junta larga
  }
  // repetir los tramos que cruzan el borde
  const t = tex(c); return t;
}

// ---- Gres de terraza gris, piezas 0,60 m. 1 tile = 1,2 × 1,2 m
function terraceTex() {
  const S = 1024, c = canvas(S, S), g = c.getContext('2d'), R = rng(11);
  g.fillStyle = hex(168, 166, 162); g.fillRect(0, 0, S, S);
  for (let i = 0; i < 9000; i++) {
    const v = 130 + R() * 70; g.fillStyle = `rgba(${v},${v},${v - 2},${0.10 + R() * 0.2})`;
    g.fillRect(R() * S, R() * S, 1 + R() * 2.5, 1 + R() * 2.5);
  }
  for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
    const v = 0.97 + R() * 0.06; g.fillStyle = `rgba(${255 * v},${255 * v},${255 * v},0.05)`; g.fillRect(a * 512, b * 512, 512, 512);
  }
  g.strokeStyle = 'rgba(70,70,68,0.65)'; g.lineWidth = 3;
  for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(i * 512, 0); g.lineTo(i * 512, S); g.stroke(); g.beginPath(); g.moveTo(0, i * 512); g.lineTo(S, i * 512); g.stroke(); }
  return tex(c);
}

// ---- Alicatados. 1 tile = 1,2 × 1,2 m
function plainTileTex(base, vein, tw, th, seed) {
  const S = 1024, c = canvas(S, S), g = c.getContext('2d'), R = rng(seed);
  const nx = Math.round(1.2 / tw), ny = Math.round(1.2 / th), pw = S / nx, ph = S / ny;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const v = 0.96 + R() * 0.08;
    g.fillStyle = hex(base[0] * v, base[1] * v, base[2] * v); g.fillRect(i * pw, j * ph, pw, ph);
    for (let k = 0; k < 40; k++) {
      g.strokeStyle = `rgba(${vein[0]},${vein[1]},${vein[2]},${0.05 + R() * 0.09})`; g.lineWidth = 1 + R() * 3;
      const y0 = j * ph + R() * ph; g.beginPath(); g.moveTo(i * pw, y0); g.bezierCurveTo(i * pw + pw * 0.3, y0 + (R() - 0.5) * 40, i * pw + pw * 0.7, y0 + (R() - 0.5) * 40, i * pw + pw, y0 + (R() - 0.5) * 20); g.stroke();
    }
  }
  g.strokeStyle = 'rgba(120,112,100,0.55)'; g.lineWidth = 2;
  for (let i = 0; i <= nx; i++) { g.beginPath(); g.moveTo(i * pw, 0); g.lineTo(i * pw, S); g.stroke(); }
  for (let j = 0; j <= ny; j++) { g.beginPath(); g.moveTo(0, j * ph); g.lineTo(S, j * ph); g.stroke(); }
  return tex(c);
}
// decor: relieve de líneas finas (horizontal) o diagonal
function decorTex(base, line, diagonal, seed) {
  const S = 1024, c = canvas(S, S), g = c.getContext('2d'), R = rng(seed);
  g.fillStyle = hex(...base); g.fillRect(0, 0, S, S);
  const n = diagonal ? 140 : 120;
  for (let i = 0; i < n; i++) {
    const a = 0.25 + R() * 0.45; g.strokeStyle = `rgba(${line[0]},${line[1]},${line[2]},${a})`; g.lineWidth = 1.4 + R() * 3.4;
    if (diagonal) { const o = i * (S * 2 / n) - S; g.beginPath(); g.moveTo(o, 0); g.lineTo(o + S, S); g.stroke(); }
    else { const y = (i + R() * 0.5) * (S / n); g.beginPath(); g.moveTo(0, y); g.lineTo(S, y + (R() - 0.5) * 3); g.stroke(); }
  }
  for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(255,255,255,${R() * 0.06})`; g.fillRect(R() * S, R() * S, 2, 2); }
  g.strokeStyle = 'rgba(120,112,100,0.5)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(S / 2, 0); g.lineTo(S / 2, S); g.stroke(); g.beginPath(); g.moveTo(0, S / 2); g.lineTo(S, S / 2); g.stroke();
  return tex(c);
}

// ---- Revestimiento del lavadero: lamas verticales marrón oscuro sobre fondo dorado (foto EjemploColumnaLavadero)
function slatsTex() {
  const S = 512, c = canvas(S, S), g = c.getContext('2d'), R = rng(5);
  g.fillStyle = hex(176, 128, 66); g.fillRect(0, 0, S, S);
  const n = 8, pw = S / n;
  for (let i = 0; i < n; i++) {
    const v = 0.9 + R() * 0.2;
    g.fillStyle = hex(62 * v, 40 * v, 26 * v); g.fillRect(i * pw + pw * 0.14, 0, pw * 0.72, S);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(i * pw + pw * 0.14, 0, 2, S);
  }
  return tex(c);
}


// ---- Césped
function grassTex() {
  const S = 512, c = canvas(S, S), g = c.getContext('2d'), R = rng(101);
  g.fillStyle = hex(98, 128, 66); g.fillRect(0, 0, S, S);
  for (let i = 0; i < 14000; i++) { const v = 0.75 + R() * 0.5; g.fillStyle = hex(90 * v, 130 * v, 60 * v); g.fillRect(R() * S, R() * S, 1.5, 3 + R() * 3); }
  return tex(c);
}
// ---- Lamas verticales del aplacado de fachada (gris topo, render de la promotora). 1 tile = 1,2 m
function claddingTex() {
  const S = 512, c = canvas(S, S), g = c.getContext('2d'), R = rng(41);
  g.fillStyle = hex(92, 86, 78); g.fillRect(0, 0, S, S);
  const n = 24, pw = S / n;
  for (let i = 0; i < n; i++) {
    const v = 0.92 + R() * 0.14;
    g.fillStyle = hex(140 * v, 132 * v, 120 * v); g.fillRect(i * pw + 2, 0, pw - 4, S);
    for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(80,72,62,${0.05 + R() * 0.08})`; g.fillRect(i * pw + 2 + R() * (pw - 6), 0, 1, S); }
    g.fillStyle = 'rgba(40,36,30,0.55)'; g.fillRect(i * pw, 0, 2, S);
  }
  return tex(c);
}
// ---- Grava de cubierta
function gravelTex() {
  const S = 512, c = canvas(S, S), g = c.getContext('2d'), R = rng(51);
  g.fillStyle = hex(178, 172, 160); g.fillRect(0, 0, S, S);
  for (let i = 0; i < 9000; i++) { const v = 120 + R() * 110; g.fillStyle = `rgb(${v},${v - 4},${v - 12})`; g.beginPath(); g.arc(R() * S, R() * S, 1 + R() * 2.6, 0, 7); g.fill(); }
  return tex(c);
}
// ---- Hormigón impreso (losas irregulares grises)
function printedConcreteTex() {
  const S = 1024, c = canvas(S, S), g = c.getContext('2d'), R = rng(61);
  g.fillStyle = hex(150, 146, 140); g.fillRect(0, 0, S, S);
  for (let i = 0; i < 12000; i++) { const v = 120 + R() * 60; g.fillStyle = `rgba(${v},${v},${v - 4},0.25)`; g.fillRect(R() * S, R() * S, 2, 2); }
  g.strokeStyle = 'rgba(70,68,64,0.6)'; g.lineWidth = 3;
  const n = 4, st = S / n;
  for (let i = 0; i <= n; i++) for (let j = 0; j < n; j++) {
    g.beginPath(); g.moveTo(i * st + (R() - 0.5) * 30, j * st); g.lineTo(i * st + (R() - 0.5) * 30, (j + 1) * st); g.stroke();
    g.beginPath(); g.moveTo(j * st, i * st + (R() - 0.5) * 30); g.lineTo((j + 1) * st, i * st + (R() - 0.5) * 30); g.stroke();
  }
  return tex(c);
}
// ---- Gresite de piscina
function poolTex() {
  const S = 512, c = canvas(S, S), g = c.getContext('2d'), R = rng(71);
  const n = 24, p = S / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = 0.9 + R() * 0.2; g.fillStyle = hex(150 * v, 205 * v, 225 * v); g.fillRect(i * p, j * p, p - 2, p - 2); }
  return tex(c);
}
// ---- Porcelánico gran formato (gris claro cálido) 0,60 × 1,20
function porcelainTex(base, seed) {
  return plainTileTex(base, [base[0] - 40, base[1] - 40, base[2] - 40], 0.60, 1.20, seed);
}
// ---- Porcelánico imitación madera exterior (tablas 0,20 m)
function woodlookTex() {
  const S = 1024, c = canvas(S, S), g = c.getContext('2d'), R = rng(81);
  const rows = 6, rh = S / rows;
  for (let r = 0; r < rows; r++) {
    let x = -R() * S;
    while (x < S) {
      const len = S * 0.98, v = 0.9 + R() * 0.16;
      g.fillStyle = hex(168 * v, 140 * v, 108 * v); g.fillRect(x, r * rh, len, rh);
      for (let k = 0; k < 20; k++) { g.strokeStyle = `rgba(100,76,52,${0.06 + R() * 0.08})`; g.lineWidth = 1 + R() * 2; const yy = r * rh + R() * rh; g.beginPath(); g.moveTo(x, yy); g.lineTo(x + len, yy + (R() - 0.5) * 4); g.stroke(); }
      g.fillStyle = 'rgba(60,45,30,0.6)'; g.fillRect(x, r * rh, 3, rh); x += len;
    }
    g.fillStyle = 'rgba(60,45,30,0.6)'; g.fillRect(0, r * rh, S, 3);
  }
  return tex(c);
}

// ---- Catálogo de suelos para probar (la memoria permite porcelánico Porcelanosa o tarima AC6;
//      el tono exacto se elige en el catálogo de la promotora: esto son aproximaciones)
export const FLOOR_OPTIONS = [
  { group: 'Tarima AC6 (cocina y baños en porcelánico)', items: [
    { id: 't-natural', name: 'Roble natural', kind: 'wood', base: [218, 190, 150] },
    { id: 't-nordico', name: 'Roble claro nórdico', kind: 'wood', base: [234, 216, 186] },
    { id: 't-arena', name: 'Roble arena', kind: 'wood', base: [226, 204, 168] },
    { id: 't-miel', name: 'Roble miel', kind: 'wood', base: [208, 168, 118] },
    { id: 't-haya', name: 'Haya', kind: 'wood', base: [222, 184, 142] },
    { id: 't-nogal', name: 'Nogal claro', kind: 'wood', base: [172, 132, 96] },
    { id: 't-gris', name: 'Roble grisáceo (recomendado japandi / minimalista)', kind: 'wood', base: [192, 182, 166] },
    { id: 't-blanqueado', name: 'Roble blanqueado (recomendado nórdico / mediterráneo)', kind: 'wood', base: [236, 228, 214] },
  ] },
  { group: 'Porcelánico en toda la casa', items: [
    { id: 'p-plano', name: 'Beige claro (por defecto)', kind: 'tile', base: [214, 208, 198] },
    { id: 'p-marfil', name: 'Marfil (muy luminoso)', kind: 'tile', base: [230, 224, 210] },
    { id: 'p-piedra', name: 'Beige piedra', kind: 'tile', base: [210, 198, 178] },
    { id: 'p-perla', name: 'Gris perla', kind: 'tile', base: [206, 206, 202] },
    { id: 'p-cemento', name: 'Gris cemento (recomendado industrial)', kind: 'tile', base: [168, 168, 164] },
    { id: 'p-madera', name: 'Imitación madera clara (resiste el agua)', kind: 'woodTile', base: [214, 182, 140] },
    { id: 'p-madera-miel', name: 'Imitación madera miel', kind: 'woodTile', base: [196, 156, 110] },
  ] },
];
const _floorCache = {};
export function floorMaterial(id) {
  if (_floorCache[id]) return _floorCache[id];
  const it = FLOOR_OPTIONS.flatMap((g) => g.items).find((q) => q.id === id);
  if (!it) return null;
  const seed = 200 + Object.keys(_floorCache).length * 13;
  const map = it.kind === 'tile' ? porcelainTex(it.base, seed) : woodTex(it.base, seed, it.kind === 'woodTile' ? 5 : 6);
  const m = new THREE.MeshStandardMaterial({ map, roughness: it.kind === 'wood' ? 0.55 : it.kind === 'woodTile' ? 0.4 : 0.35 });
  m.userData.kind = it.kind;
  return (_floorCache[id] = m);
}

export function makeMaterials() {
  const M = {};
  const std = (o) => new THREE.MeshStandardMaterial(o);

  M.wall = std({ color: 0xf2f0ec, roughness: 0.96 });
  M.ceiling = std({ color: 0xffffff, roughness: 0.98 });
  M.ceilingConcrete = std({ color: 0xe9e7e2, roughness: 0.98 });
  M.slabEdge = std({ color: 0xf1efe9, roughness: 0.9 });
  M.ext = std({ color: 0xebe5d8, roughness: 0.92 });       // enfoscado pintado crema (render)
  M.extWhite = std({ color: 0xf0eee8, roughness: 0.9 });

  const wood = woodTex(); M.wood = std({ map: wood, roughness: 0.55 });
  const ter = terraceTex(); M.terrace = std({ map: ter, roughness: 0.85 });

  M.bath1Plain = std({ map: plainTileTex([228, 220, 205], [170, 160, 140], 0.30, 0.60, 21), roughness: 0.35 });
  M.bath1Decor = std({ map: decorTex([225, 218, 203], [160, 150, 128], false, 22), roughness: 0.4 });
  M.bath1Floor = std({ map: plainTileTex([205, 198, 186], [150, 142, 128], 0.60, 0.60, 23), roughness: 0.4 });
  M.bath2Plain = std({ map: plainTileTex([208, 202, 191], [160, 152, 140], 0.60, 0.30, 31), roughness: 0.35 });
  M.bath2Decor = std({ map: decorTex([196, 189, 177], [140, 133, 122], true, 32), roughness: 0.45 });
  M.bath2Floor = std({ map: plainTileTex([178, 172, 162], [130, 124, 114], 0.60, 0.60, 33), roughness: 0.4 });

  M.white = std({ color: 0xf5f4f1, roughness: 0.55 });
  M.door = std({ color: 0xf4f3f0, roughness: 0.6 });
  M.cabinet = std({ color: 0xf3f2ee, roughness: 0.5 });
  M.cabinetDark = std({ color: 0x2b2b2b, roughness: 0.9 });
  M.cabinetBody = std({ color: 0xdcdad4, roughness: 0.6 });
  M.worktop = std({ color: 0xf6f5f2, roughness: 0.35 });
  M.inox = std({ color: 0xc9ccce, roughness: 0.35, metalness: 0.55 });
  M.inoxDark = std({ color: 0xaeb2b6, roughness: 0.42, metalness: 0.45 });
  M.blackGlass = std({ color: 0x0d0e10, roughness: 0.12, metalness: 0.2 });
  M.hob = std({ color: 0x08090a, roughness: 0.1, metalness: 0.1 });
  M.chrome = std({ color: 0xdedede, roughness: 0.14, metalness: 1.0 });
  M.ceramic = std({ color: 0xfbfbfa, roughness: 0.16 });
  M.black = std({ color: 0x1a1a1a, roughness: 0.6 });

  M.window = std({ color: 0x3b3e42, roughness: 0.5, metalness: 0.45 });   // aluminio antracita
  M.glass = new THREE.MeshPhysicalMaterial({ color: 0xcfe6ee, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.2 });
  M.glassTerrace = new THREE.MeshPhysicalMaterial({ color: 0xcfe8ee, roughness: 0.03, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false });

  M.column = std({ color: 0x747370, roughness: 0.85 });
  M.columnBase = std({ color: 0xbab6ad, roughness: 0.95 });
  M.chimney = std({ color: 0x9d9d9b, roughness: 0.88 });
  M.railing = std({ color: 0x5b6261, roughness: 0.55, metalness: 0.5 });
  M.slats = std({ map: slatsTex(), roughness: 0.65 });
  M.slatsBack = std({ color: 0x3a281c, roughness: 0.7 });

  M.vent = std({ color: 0xc6c9cc, roughness: 0.5, metalness: 0.3 });
  M.ventSlot = std({ color: 0x8a8e93, roughness: 0.8 });
  M.spotRim = std({ color: 0xf4f4f2, roughness: 0.4 });
  M.spotLens = new THREE.MeshStandardMaterial({ color: 0xfff6e0, emissive: 0xffdca0, emissiveIntensity: 0, roughness: 0.3 });

  // Exterior
  M.ground = std({ color: 0x9a9279, roughness: 1 });
  M.asphalt = std({ color: 0x3b3c3f, roughness: 0.95 });
  M.sidewalk = std({ color: 0xb4b1a8, roughness: 0.95 });
  M.grass = std({ color: 0x6f8a4c, roughness: 1 });
  M.tree = std({ color: 0x3e6a34, roughness: 1 });
  M.trunk = std({ color: 0x5b4632, roughness: 1 });
  M.neighbor = std({ color: 0xe8e4da, roughness: 0.9 });
  M.neighborBeige = std({ color: 0xccb492, roughness: 0.9 });
  M.neighborGlass = std({ color: 0x4d5a63, roughness: 0.25, metalness: 0.3 });
  M.building = std({ color: 0xd8c6a8, roughness: 0.9 });

  // ---- Villas del Sur ----
  M.accent = std({ color: 0xa9b8a0, roughness: 0.96 });   // pared de acento (paleta de colores)
  M.wallTop = std({ color: 0x6f6e6a, roughness: 0.95 });   // canto superior del muro (se ve en la vista de planta)
  M.floorPorcelain = std({ map: porcelainTex([214, 208, 198], 91), roughness: 0.35 });
  M.floorTarima = M.wood;
  M.floorWet = std({ map: porcelainTex([196, 192, 186], 92), roughness: 0.38 });
  M.tileB1 = std({ map: plainTileTex([236, 234, 229], [190, 186, 178], 0.30, 0.90, 93), roughness: 0.3 });
  M.tileB2 = std({ map: plainTileTex([226, 224, 220], [176, 172, 166], 0.30, 0.60, 94), roughness: 0.3 });
  M.tileKitchen = std({ map: plainTileTex([240, 238, 234], [200, 196, 190], 0.30, 0.30, 95), roughness: 0.3 });
  M.cladding = std({ map: claddingTex(), roughness: 0.75 });
  M.gravel = std({ map: gravelTex(), roughness: 1 });
  M.coping = std({ color: 0xf2efe8, roughness: 0.6 });
  M.parapetCap = std({ color: 0xdedbd2, roughness: 0.7 });
  M.concrete = std({ map: printedConcreteTex(), roughness: 0.9 });
  M.woodlook = std({ map: woodlookTex(), roughness: 0.7 });
  M.paving = M.terrace;
  M.poolTile = std({ map: poolTex(), roughness: 0.3 });
  M.water = new THREE.MeshPhysicalMaterial({ color: 0x3fa9c9, roughness: 0.05, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });
  M.poolLight = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xbfefff, emissiveIntensity: 0 });
  M.fenceWall = std({ color: 0xe6e0d3, roughness: 0.95 });
  M.fenceMetal = std({ color: 0x3b3e42, roughness: 0.5, metalness: 0.5 });
  M.pergola = std({ color: 0xf4f3ef, roughness: 0.6, metalness: 0.2 });
  M.entryDoor = std({ color: 0x3b3e42, roughness: 0.45, metalness: 0.3 });
  M.soil = std({ color: 0x6b5a45, roughness: 1 });
  M.shrub = std({ color: 0x4f7a3a, roughness: 1 });
  M.flower = std({ color: 0xd9762f, roughness: 1 });
  M.persiana = std({ color: 0x3b3e42, roughness: 0.6, metalness: 0.3 });
  M.grass = std({ map: grassTex(), roughness: 1 });
  M.measure = new THREE.MeshBasicMaterial({ color: 0xff3b30, depthTest: false });
  return M;
}
