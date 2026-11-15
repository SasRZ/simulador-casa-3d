import * as THREE from 'three';
import { CFG } from './config.js';
import {
  WALLS, WINDOWS, SLIDER, DOORS, WARDROBES, FLOORS, TILED, INTERIOR, CLADDING, CEILINGS, LOW_CEILINGS, FASCIAS,
  SPOTS, LOW_SPOT_ROOMS, GRILLES, ROOFS, ACCENTS,
} from './plan.js';
import { floorMaterial } from './materials.js';
import { box, rectXZ, wallPieces, prism, angleOf, shortAngleDelta } from './helpers.js';

const H = CFG.H;
const inR = (r, x, z) => x > r[0] && x < r[2] && z > r[1] && z < r[3];

// ---------------------------------------------------------------------------
//  Objeto que se abre/cierra con animación suave
// ---------------------------------------------------------------------------
export class Openable {
  constructor(name, apply, collider) {
    this.name = name; this.apply = apply; this.collider = collider || null;
    this.t = 0; this.target = 0; this.speed = 2.2;
  }
  toggle() { this.target = this.target > 0.5 ? 0 : 1; }
  set(open) { this.target = open ? 1 : 0; }
  update(dt) {
    if (this.t === this.target) return;
    const d = this.target - this.t, s = this.speed * dt;
    this.t = Math.abs(d) <= s ? this.target : this.t + Math.sign(d) * s;
    const e = this.t * this.t * (3 - 2 * this.t);
    this.apply(e);
  }
  get blocking() { return this.t < 0.35; }
}

export function addPickable(ctx, root, openable) {
  root.traverse((o) => { if (o.isMesh) { o.userData.openable = openable; ctx.pickables.push(o); } });
}

// Caja con UV en metros (las texturas no se estiran). mats: material o array de 6 (px,nx,py,ny,pz,nz)
export function worldBox(x0, y0, z0, x1, y1, z1, mats, size = 1.2) {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + cx, y = p.getY(i) + cy, z = p.getZ(i) + cz;
    const nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i);
    if (Math.abs(nx) > 0.5) uv.setXY(i, (nx > 0 ? -z : z) / size, y / size);
    else if (Math.abs(nz) > 0.5) uv.setXY(i, (nz > 0 ? x : -x) / size, y / size);
    else uv.setXY(i, x / size, z / size);
  }
  const m = new THREE.Mesh(g, mats);
  m.position.set(cx, cy, cz);
  m.castShadow = m.receiveShadow = true;
  return m;
}

// Material de una cara de muro según lo que hay delante (exterior, baño alicatado, aplacado…)
function faceMat(M, x, z) {
  const inside = INTERIOR.some((r) => inR(r, x, z));
  if (!inside) return CLADDING.some((c) => x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1) ? M.cladding : M.ext;
  const t = TILED.find((q) => inR(q.r, x, z));
  if (t) return M[t.mat];
  return ACCENTS.some((a) => inR(a.r, x, z)) ? M.accent : M.wall;
}

// ---------------------------------------------------------------------------
export function buildDwelling(ctx) {
  const { M, G } = ctx;
  const ceilH = H.ceiling;

  // ---------------- Muros (troceados por estancias para dar a cada cara su acabado) ----------------
  const cuts = new Set();
  [...INTERIOR, ...TILED.map((t) => t.r)].forEach((r) => r.forEach((v) => cuts.add(v)));
  CLADDING.forEach((c) => [c.x0, c.x1, c.z0, c.z1].forEach((v) => cuts.add(v)));
  ACCENTS.forEach((a) => a.r.forEach((v) => cuts.add(v)));
  for (const w of WALLS) {
    const ops = (w.open || []).map((o) => {
      if (o[2] !== 'WIN') return o;
      const t = CFG.win.types[o[3]]; return [o[0], o[1], t.sill, t.sill + t.height];
    });
    for (const p of wallPieces(w, ceilH, ops)) {
      const horiz = (w.x1 - w.x0) >= (w.z1 - w.z0);
      const A0 = horiz ? p.x0 : p.z0, A1 = horiz ? p.x1 : p.z1;
      const marks = [A0, ...[...cuts].filter((v) => v > A0 + 0.02 && v < A1 - 0.02).sort((a, b) => a - b), A1];
      for (let i = 0; i < marks.length - 1; i++) {
        const s = horiz ? { ...p, x0: marks[i], x1: marks[i + 1] } : { ...p, z0: marks[i], z1: marks[i + 1] };
        const xm = (s.x0 + s.x1) / 2, zm = (s.z0 + s.z1) / 2, e = 0.03;
        const mats = [faceMat(M, s.x1 + e, zm), faceMat(M, s.x0 - e, zm), M.wallTop, M.wall, faceMat(M, xm, s.z1 + e), faceMat(M, xm, s.z0 - e)];
        G.structure.add(worldBox(s.x0, s.y0, s.z0, s.x1, s.y1, s.z1, mats));
      }
      if (p.y0 === 0) ctx.colliders.push({ x0: p.x0, z0: p.z0, x1: p.x1, z1: p.z1 });
    }
  }

  // ---------------- Suelos (porcelánico o tarima: se cambia desde el panel) ----------------
  ctx.floors = { main: [], kitchen: [] };
  FLOORS.forEach(({ kind, r }, i) => {
    const y = kind === 'main' ? 0 : 0.002 + i * 0.0002;
    const m = rectXZ(r[0], r[1], r[2], r[3], y, kind === 'wet' ? M.floorWet : M.floorPorcelain, { size: 1.2 });
    G.structure.add(m);
    if (ctx.floors[kind]) ctx.floors[kind].push(m);
  });
  ctx.setFloor = (k) => {
    // k: id del catálogo FLOOR_OPTIONS (o los antiguos 'porcelanico' / 'tarima')
    const id = k === 'tarima' ? 't-natural' : k === 'porcelanico' ? 'p-plano' : k;
    const mat = floorMaterial(id) || M.floorPorcelain;
    const isTile = mat.userData.kind !== 'wood';
    ctx.floors.main.forEach((m) => { m.material = mat; });
    ctx.floors.kitchen.forEach((m) => { m.material = isTile ? mat : M.floorPorcelain; });   // con tarima, la cocina va en porcelánico
  };
  // Solera bajo la casa (canto visible desde fuera)
  ROOFS.forEach((r) => G.structure.add(prism(r.pts, -0.15, -0.005, [M.extWhite, M.extWhite])));

  // ---------------- Techos (grupo "upper": se oculta en la vista desde arriba) ----------------
  const cy = ceilH - 0.002, ly = H.lowCeiling;
  CEILINGS.forEach(({ r }) => G.upper.add(rectXZ(r[0], r[1], r[2], r[3], cy, M.ceiling, { up: false })));
  LOW_CEILINGS.forEach((r) => G.upper.add(rectXZ(r[0], r[1], r[2], r[3], ly, M.ceiling, { up: false })));
  FASCIAS.forEach(([x0, z0, x1, z1]) => G.upper.add(box(x0, ly, z0, x1, ceilH, z1, M.wall)));

  // ---------------- Cubiertas planas de grava con peto ----------------
  for (const rf of ROOFS) {
    const slab = prism(rf.pts, ceilH, ceilH + H.slab, [M.ext, M.ext]); slab.userData.isSlab = true; G.upper.add(slab);
    const top = ceilH + H.slab, pt = 0.15;
    // peto a lo largo de cada lado (hacia dentro del polígono)
    for (let i = 0; i < rf.pts.length; i++) {
      const [ax, az] = rf.pts[i], [bx, bz] = rf.pts[(i + 1) % rf.pts.length];
      let x0 = Math.min(ax, bx), x1 = Math.max(ax, bx), z0 = Math.min(az, bz), z1 = Math.max(az, bz);
      const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
      if (Math.abs(az - bz) < 1e-3) { if (insidePoly(rf.pts, mx, az + 0.1)) z1 = az + pt; else z0 = az - pt; }
      else { if (insidePoly(rf.pts, ax + 0.1, mz)) x1 = ax + pt; else x0 = ax - pt; }
      G.upper.add(box(x0, top, z0, x1, top + H.parapet, z1, M.ext));
      G.upper.add(box(x0 - 0.02, top + H.parapet, z0 - 0.02, x1 + 0.02, top + H.parapet + 0.03, z1 + 0.02, M.parapetCap));
    }
    const gr = new THREE.Mesh(polyGeo(rf.pts, top + 0.03), M.gravel); gr.receiveShadow = true; G.upper.add(gr);
  }

  // ---------------- Ventanas, corredera, puertas, armarios ----------------
  WINDOWS.forEach((w) => buildWindow(ctx, w));
  buildSlider(ctx, SLIDER);
  DOORS.forEach((d) => buildDoor(ctx, d));
  WARDROBES.forEach((w) => buildWardrobe(ctx, w));

  // ---------------- Rejillas de climatización ----------------
  GRILLES.forEach(([x, z, len, ori]) => {
    const w = ori === 'x' ? len : 0.12, d = ori === 'x' ? 0.12 : len;
    const y = LOW_CEILINGS.some((r) => inR(r, x, z)) ? ly : cy;
    const frame = box(x - w / 2, y - 0.012, z - d / 2, x + w / 2, y, z + d / 2, M.vent);
    const slot = box(x - w / 2 + 0.02, y - 0.014, z - d / 2 + 0.02, x + w / 2 - 0.02, y - 0.008, z + d / 2 - 0.02, M.ventSlot);
    frame.castShadow = slot.castShadow = false;
    G.upper.add(frame, slot);
  });

  // ---------------- Focos empotrados ----------------
  SPOTS.forEach(([room, x, z], i) => {
    const y = LOW_SPOT_ROOMS.includes(room) || LOW_CEILINGS.some((r) => inR(r, x, z)) ? ly : cy;
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.012, 20), M.spotRim);
    rim.position.set(x, y - 0.004, z);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.012, 20), M.spotLens.clone());
    lens.position.set(x, y - 0.009, z);
    G.upper.add(rim, lens);
    const light = new THREE.SpotLight(0xffe2b0, 0, 6.5, THREE.MathUtils.degToRad(52), 0.75, 1.6);
    light.position.set(x, y - 0.03, z);
    light.target.position.set(x, 0, z);
    light.visible = false;
    ctx.scene.add(light, light.target);
    ctx.spots.push({ room, light, lens, id: i });
  });
}

function insidePoly(pts, x, z) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}
function polyGeo(pts, y) {
  const s = new THREE.Shape(); pts.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); g.translate(0, y, 0);
  const uv = g.attributes.uv, p = g.attributes.position;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 1.2, p.getZ(i) / 1.2);
  return g;
}

// ---------------------------------------------------------------------------
function framedGlass(w, h, fr, M, { glass = M.glass } = {}) {
  const g = new THREE.Group();
  const bar = (bw, bh, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.05), M.window); m.position.set(x, y, 0); m.castShadow = true; g.add(m); };
  bar(w, fr, w / 2, fr / 2); bar(w, fr, w / 2, h - fr / 2);
  bar(fr, h - 2 * fr, fr / 2, h / 2); bar(fr, h - 2 * fr, w - fr / 2, h / 2);
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(w - 2 * fr, h - 2 * fr), glass);
  pane.position.set(w / 2, h / 2, 0); pane.castShadow = false; g.add(pane);
  return g;
}

// Marco local de un hueco: x local a lo largo del muro, z local hacia el interior
function openingFrame(o) {
  const n = o.in;                       // normal hacia el interior
  const u = [n[1], -n[0]];              // dirección a lo largo del muro (x local)
  const tm = (o.t0 + o.t1) / 2;
  const startA = (o.axis === 'x' ? u[0] : u[1]) > 0 ? o.a : o.b;
  const pos = o.axis === 'x' ? [startA, tm] : [tm, startA];
  return { pos, rot: angleOf(u[0], u[1]), W: o.b - o.a };
}

function buildWindow(ctx, w) {
  const { M, G } = ctx;
  const t = CFG.win.types[w.type], fr = CFG.win.frame;
  const { pos, rot, W } = openingFrame(w);
  const root = new THREE.Group(); root.position.set(pos[0], t.sill, pos[1]); root.rotation.y = rot; G.structure.add(root);
  // marco fijo
  const outer = framedGlass(W, t.height, fr * 0.8, M, { glass: new THREE.MeshBasicMaterial({ visible: false }) });
  root.add(outer);
  // vierteaguas / alféizar
  const sill = new THREE.Mesh(new THREE.BoxGeometry(W + 0.04, 0.03, 0.3), M.parapetCap); sill.position.set(W / 2, -0.015, -0.05); root.add(sill);
  // hojas abatibles hacia dentro (2 si el hueco pasa de 0,9 m)
  const nl = W > 0.9 ? 2 : 1, lw = (W - 2 * fr * 0.8) / nl, lh = t.height - 2 * fr * 0.8;
  for (let i = 0; i < nl; i++) {
    const left = i === 0;
    const pivot = new THREE.Group(); pivot.position.set(left ? fr * 0.8 : W - fr * 0.8, fr * 0.8, 0.0); root.add(pivot);
    const sash = framedGlass(lw, lh, fr * 0.9, M); if (!left) sash.position.x = -lw; pivot.add(sash);
    const hnd = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.11, 0.03), M.chrome); hnd.position.set(left ? lw - 0.03 : -lw + 0.03, lh * 0.5, 0.035); pivot.add(hnd);
    const sign = left ? -1 : 1;
    const op = new Openable(`Ventana ${w.room}`, (e) => { pivot.rotation.y = sign * e * THREE.MathUtils.degToRad(85); });
    addPickable(ctx, pivot, op); ctx.openables.push(op);
  }
  // cajón de persiana (memoria: persianas de aluminio en salón, comedor y dormitorios)
  if (w.type === 'dorm') {
    const cb = new THREE.Mesh(new THREE.BoxGeometry(W, 0.06, 0.06), M.persiana); cb.position.set(W / 2, t.height + 0.03, -0.12); root.add(cb);
  }
  const a = w.axis === 'x' ? { x0: w.a, x1: w.b, z0: w.t0, z1: w.t1 } : { x0: w.t0, x1: w.t1, z0: w.a, z1: w.b };
  ctx.colliders.push(a);
}

function buildSlider(ctx, s) {
  const { M, G } = ctx;
  const h = CFG.win.types.slider.height, fr = 0.06;
  const { pos, rot, W } = openingFrame({ ...s, in: [0, 1] });
  const root = new THREE.Group(); root.position.set(pos[0], 0, pos[1]); root.rotation.y = rot; G.structure.add(root);
  const pw = W / 2 + 0.03;
  const fixed = framedGlass(pw, h, fr, M); fixed.position.set(W - pw, 0, -0.035); root.add(fixed);
  const moving = framedGlass(pw, h, fr, M); moving.position.set(0, 0, 0.035); root.add(moving);
  root.add(box(0, 0, -0.08, W, 0.025, 0.08, M.window));
  root.add(box(0, h, -0.08, W, h + 0.05, 0.08, M.window));
  // persiana motorizada (cajón)
  root.add(box(0, h + 0.05, -0.16, W, h + 0.25, -0.08, M.persiana));
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, 0.014), M.chrome); handle.position.set(pw - 0.06, 1.05, 0.07); root.add(handle);
  const col = { x0: s.a, z0: s.t0, x1: s.b, z1: s.t1 };
  const op = new Openable('Corredera del salón al porche', (e) => {
    moving.position.x = e * (pw - 0.08);
    handle.position.x = pw - 0.06 + e * (pw - 0.08);
  }, col);
  // abierta deja libre la parte izquierda (x a..a+pw)
  addPickable(ctx, root, op); ctx.openables.push(op);
  ctx.dynColliders.push({ box: col, op });
}

function buildDoor(ctx, d) {
  const { M, G } = ctx;
  const [fx0, fz0, fx1, fz1] = d.frame;
  const horiz = (fx1 - fx0) >= (fz1 - fz0);
  const jm = d.glass || d.entry ? M.window : M.white;
  const jt = 0.035;
  if (horiz) {
    G.structure.add(box(fx0, 0, fz0 - 0.01, fx0 + jt, d.h, fz1 + 0.01, jm), box(fx1 - jt, 0, fz0 - 0.01, fx1, d.h, fz1 + 0.01, jm), box(fx0, d.h - jt, fz0 - 0.01, fx1, d.h, fz1 + 0.01, jm));
  } else {
    G.structure.add(box(fx0 - 0.01, 0, fz0, fx1 + 0.01, d.h, fz0 + jt, jm), box(fx0 - 0.01, 0, fz1 - jt, fx1 + 0.01, d.h, fz1, jm), box(fx0 - 0.01, d.h - jt, fz0, fx1 + 0.01, d.h, fz1, jm));
  }
  const a0 = angleOf(d.closed[0], d.closed[1]);
  let a1 = angleOf(d.open[0], d.open[1]);
  a1 = a0 + shortAngleDelta(a0, a1);
  const pivot = new THREE.Group(); pivot.position.set(d.hinge[0], 0, d.hinge[1]); pivot.rotation.y = a0; G.structure.add(pivot);
  if (d.glass) {
    const leaf = framedGlass(d.L, d.h - 0.04, 0.07, M); leaf.position.set(0, 0.02, 0); pivot.add(leaf);
    const hn = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, 0.07), M.chrome); hn.position.set(d.L - 0.08, 1.05, 0); pivot.add(hn);
  } else {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(d.L, d.h - 0.03, d.entry ? 0.06 : CFG.door.thick), d.entry ? M.entryDoor : M.door);
    leaf.position.set(d.L / 2, (d.h - 0.03) / 2 + 0.01, 0); leaf.castShadow = leaf.receiveShadow = true; pivot.add(leaf);
    if (d.entry) {   // tiradores horizontales (render)
      for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.012, 0.075), M.chrome); b.position.set(d.L - 0.18, 0.5 + i * 0.4, 0); pivot.add(b); }
    } else {
      const hndl = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.022, 0.075), M.chrome);
      hndl.position.set(d.L - 0.07, 1.0, 0.0); pivot.add(hndl);
    }
  }
  const col = horiz ? { x0: fx0, z0: fz0 - 0.03, x1: fx1, z1: fz1 + 0.03 } : { x0: fx0 - 0.03, z0: fz0, x1: fx1 + 0.03, z1: fz1 };
  const op = new Openable(d.name, (e) => { pivot.rotation.y = a0 + (a1 - a0) * e; }, col);
  addPickable(ctx, pivot, op); ctx.openables.push(op);
  ctx.dynColliders.push({ box: col, op });
  ctx.doors[d.id] = { op, pivot };
}

function buildWardrobe(ctx, w) {
  const { M, G } = ctx;
  const o = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[w.front];
  const u = [o[1], -o[0]];
  // esquina de inicio del frente y longitudes
  const start = [o[0] > 0 ? w.x1 : o[0] < 0 ? w.x0 : (u[0] > 0 ? w.x0 : w.x1), o[1] > 0 ? w.z1 : o[1] < 0 ? w.z0 : (u[1] > 0 ? w.z0 : w.z1)];
  const len = Math.abs(u[0]) > 0.5 ? w.x1 - w.x0 : w.z1 - w.z0;
  const depth = Math.abs(o[0]) > 0.5 ? w.x1 - w.x0 : w.z1 - w.z0;
  const root = new THREE.Group(); root.position.set(start[0], 0, start[1]); root.rotation.y = angleOf(u[0], u[1]); G.structure.add(root);
  const dh = CFG.wardrobeDoorHeight;
  const add = (x0, y0, z0, x1, y1, z1, m) => { root.add(box(x0, y0, z0, x1, y1, z1, m)); };
  // interior: balda alta, barra, fondo y laterales
  add(0, dh - 0.02, -depth, len, dh, -0.03, M.cabinet);
  add(0, 0, -depth, 0.02, dh, 0, M.cabinet); add(len - 0.02, 0, -depth, len, dh, 0, M.cabinet);
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, len - 0.04, 10), M.chrome);
  rail.rotation.z = Math.PI / 2; rail.position.set(len / 2, 1.85, -depth / 2); root.add(rail);
  // altillo hasta el techo
  add(0, dh, -0.03, len, H.ceiling, 0.0, M.door);
  // hojas
  const nl = Math.max(2, Math.round(len / 0.55)), L = len / nl;
  for (let i = 0; i < nl; i++) {
    const left = i % 2 === 0;
    const hingeX = left ? i * L : (i + 1) * L;
    const a0 = left ? 0 : Math.PI, a1 = left ? -Math.PI / 2 : Math.PI * 1.5;
    const pivot = new THREE.Group(); pivot.position.set(hingeX, 0, 0.012); pivot.rotation.y = a0; root.add(pivot);
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(L - 0.004, dh - 0.02, 0.022), M.door);
    leaf.position.set(L / 2, dh / 2 + 0.005, 0); leaf.castShadow = leaf.receiveShadow = true; pivot.add(leaf);
    const hnd = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.16, 0.016), M.chrome);
    hnd.position.set(L - 0.04, 1.05, left ? 0.016 : -0.016); pivot.add(hnd);
    const op = new Openable(w.name, (e) => { pivot.rotation.y = a0 + (a1 - a0) * e; });
    addPickable(ctx, pivot, op); ctx.openables.push(op);
  }
  ctx.colliders.push({ x0: w.x0, z0: w.z0, x1: w.x1, z1: w.z1 });
}

// ---------------------------------------------------------------------------
//  Opción: puerta corredera entre el vestíbulo y el distribuidor (propuesta, no viene en el plano)
//  Hueco: x 5,326..6,427 en la línea del muro norte del baño 2 (z 21,017..21,115), más un tabique
//  de remate en x 6,326..6,427 (z 21,115..21,715) para cerrar el lado del vestíbulo.
//  La hoja corre por la cara del salón hacia la izquierda, delante del muro del baño 2.
// ---------------------------------------------------------------------------
export function buildHallSlider(ctx) {
  const { M, G } = ctx;
  const grp = new THREE.Group(); grp.name = 'corredera-distribuidor'; grp.visible = false; G.structure.add(grp);
  // Hueco limpio de 1,00 m en la boca del distribuidor, alineado con el muro norte del dormitorio 4
  const x0 = 5.326, x1 = 6.326, z0 = 21.715, z1 = 21.816, hd = 2.10, top = H.lowCeiling;
  grp.add(worldBox(x0, hd, z0, x1, top, z1, M.wall));                 // dintel hasta el falso techo
  // carril y cajón por la cara del vestíbulo; la hoja abierta queda delante del muro del dormitorio 4
  const zl = z0 - 0.035, L = x1 - x0 + 0.08;
  grp.add(box(x0 - 0.04, hd, zl - 0.03, x1 + L, hd + 0.08, zl + 0.03, M.white));
  const leaf = new THREE.Group(); leaf.position.set(x0 - 0.04, 0, zl); grp.add(leaf);
  const solid = box(0, 0.01, -0.02, L, hd - 0.01, 0.02, M.door);
  const glazed = new THREE.Group();
  [[0, 0.01, 0.10, hd - 0.01], [L - 0.10, 0.01, L, hd - 0.01]].forEach(([a, y0, b, y1]) => glazed.add(box(a, y0, -0.02, b, y1, 0.02, M.door)));
  [[0.01, 0.10], [hd - 0.10, hd - 0.01], [0.95, 1.03]].forEach(([y0, y1]) => glazed.add(box(0.10, y0, -0.02, L - 0.10, y1, 0.02, M.door)));
  [[0.10, 0.95], [1.03, hd - 0.10]].forEach(([y0, y1]) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(L - 0.2, y1 - y0), M.glass); p.position.set(L / 2, (y0 + y1) / 2, 0); glazed.add(p); });
  leaf.add(solid, glazed);
  const hnd = box(0.05, 0.95, -0.035, 0.07, 1.20, -0.02, M.chrome); leaf.add(hnd);
  const col = { x0, z0: zl - 0.03, x1, z1 };
  const op = new Openable('Puerta corredera vestíbulo–distribuidor', (e) => { leaf.position.x = x0 - 0.04 + e * (L - 0.12); }, col);
  op.speed = 1.4;
  addPickable(ctx, leaf, op); ctx.openables.push(op);
  ctx.dynColliders.push({ box: col, fn: () => grp.visible && op.blocking });
  ctx.setHallSlider = (k) => {
    grp.visible = !!k;
    solid.visible = k === 'lisa'; glazed.visible = k === 'vidriera';
  };
}
