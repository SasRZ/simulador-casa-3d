import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CFG } from './config.js';
import { ROOMS } from './plan.js';
import { enuVecToWorld } from './build_exterior.js';

const chainVisible = (o) => { while (o) { if (!o.visible) return false; o = o.parent; } return true; };
const DEG = Math.PI / 180;

export class Navigation {
  constructor(app) {
    this.app = app;
    const dom = this.dom = app.renderer.domElement;
    this.persp = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.05, 150000);
    this.ortho = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 400);
    this.camera = this.persp;
    this.mode = 'orbit';

    // --- Órbita ---
    this.persp.position.set(22, 16, 40);
    this.orbit = new OrbitControls(this.persp, dom);
    this.orbit.target.set(6, 0.8, 20);
    this.orbit.enableDamping = true; this.orbit.dampingFactor = 0.08;
    this.orbit.minDistance = 0.3; this.orbit.maxDistance = 400; this.orbit.maxPolarAngle = Math.PI * 0.499;
    this.orbit.screenSpacePanning = true;
    this.orbit.update();

    // --- Planta (ortográfica cenital, arriba del plano = arriba de la pantalla) ---
    this.ortho.up.set(0, 0, -1);
    this.ortho.position.set(7, 100, 18); this.ortho.lookAt(7, 0, 18);
    this.topCtl = new OrbitControls(this.ortho, dom);
    this.topCtl.target.set(7, 0, 18);
    this.topCtl.enableRotate = false; this.topCtl.screenSpacePanning = true;
    this.topCtl.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    this.topCtl.enabled = false; this.topCtl.zoomToCursor = true;
    this.topCtl.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
    this.topZoom = 1; this.ortho.zoom = 1;

    // --- Caminar ---
    this.eye = CFG.H.eye;
    this.pos = new THREE.Vector3(9.4, 0, 20.95);
    this.yaw = 90 * DEG; this.pitch = 0;   // empieza en el vestíbulo mirando hacia dentro (antes miraba a la pared)
    this.keys = {};
    this.locked = false;
    this.radius = 0.23;
    this.saved = { pos: new THREE.Vector3(), target: new THREE.Vector3() };

    this.raycaster = new THREE.Raycaster();
    this.targets = null;
    this.measureOn = false; this.mpts = [];
    this.mgroup = new THREE.Group(); app.scene.add(this.mgroup);
    this.mline = null;

    this.joy = { x: 0, y: 0 };
    this._bind();
    this._bindJoystick();
    this.resize();
  }

  // ------------------------------------------------------------------ eventos
  _bind() {
    const dom = this.dom;
    addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
      const k = e.code; this.keys[k] = true;
      if (k === 'KeyE' && this.mode === 'walk') this.interact();
      if (k === 'KeyM') this.app.ui?.toggleMeasure();
      if (k === 'KeyH') this.app.ui?.togglePanel();
    });
    addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    addEventListener('blur', () => { this.keys = {}; });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === dom;
      this.app.ui?.updateHelp();
    });
    document.addEventListener('mousemove', (e) => {
      if (this.mode === 'walk' && this.locked) this._look(e.movementX, e.movementY);
    });
    // Mirar arrastrando (ratón sin bloquear o dedo): deltas calculados a mano porque en táctil movementX no es fiable
    addEventListener('pointermove', (e) => {
      const d = this._drag;
      if (this.mode !== 'walk' || this.locked || !d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.lx, dy = e.clientY - d.ly; d.lx = e.clientX; d.ly = e.clientY;
      if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 6) d.moved = true;
      const k = e.pointerType === 'touch' ? 1.9 : 1;
      this._look(dx * k, dy * k);
    });
    dom.addEventListener('pointerdown', (e) => {
      this._down = { x: e.clientX, y: e.clientY };
      if (this.mode !== 'walk' && !this.measureOn && e.button === 0 && this._startDiningDrag(e)) return;
      if (this.mode === 'walk' && !this.locked) this._drag = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moved: false };
    });
    addEventListener('pointercancel', (e) => { if (this._drag && this._drag.id === e.pointerId) this._drag = null; });
    addEventListener('pointermove', (e) => { if (this._dd && e.pointerId === this._dd.id) this._dragDining(e); });
    addEventListener('pointerup', (e) => {
      if (this._dd && e.pointerId === this._dd.id) { this._endDiningDrag(); this._down = null; return; }
      const was = this._drag;
      if (was && was.id !== e.pointerId) return;
      this._drag = null;
      if (e.target !== dom) return;
      const click = this._down && Math.hypot(e.clientX - this._down.x, e.clientY - this._down.y) < (e.pointerType === 'touch' ? 10 : 5);
      if (!click) return;
      if (this.measureOn) { this._measureClick(e); return; }
      if (this.app.notes?.placing) {
        const ndc = this.mode === 'walk' && this.locked ? new THREE.Vector2(0, 0) : this._ndcFromEvent(e);
        const h = this._ray(ndc)[0];
        this.app.notes.place(h ? h.point : (this._floorPoint(e) || null)); return;
      }
      if (this.mode === 'walk') {
        if (!this.locked) { if (e.pointerType === 'mouse') dom.requestPointerLock?.(); if (!was?.moved) this.interact(e); } else this.interact();
      } else this.interact(e);
    });
    addEventListener('resize', () => this.resize());
    dom.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  _bindJoystick() {
    const base = document.getElementById('joy'), knob = document.getElementById('joy-knob');
    if (!base) return;
    let id = null, cx = 0, cy = 0;
    const R = 46;
    const move = (e) => {
      let dx = e.clientX - cx, dy = e.clientY - cy; const l = Math.hypot(dx, dy);
      if (l > R) { dx = dx / l * R; dy = dy / l * R; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.joy.x = dx / R; this.joy.y = dy / R;
    };
    base.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation(); id = e.pointerId; base.setPointerCapture(id);
      const r = base.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; move(e);
    });
    base.addEventListener('pointermove', (e) => { if (e.pointerId === id) move(e); });
    const end = (e) => { if (e.pointerId !== id) return; id = null; this.joy.x = this.joy.y = 0; knob.style.transform = ''; };
    base.addEventListener('pointerup', end); base.addEventListener('pointercancel', end);
  }
  // ---------- arrastrar la mesa del comedor (vistas Órbita y Planta) ----------
  _floorPoint(e) {
    this.raycaster.setFromCamera(this._ndcFromEvent(e), this.camera);
    const p = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p) ? p : null;
  }
  _startDiningDrag(e) {
    const f = this.app.ctx.furn, cars = this.app.ctx.cars;
    const hits = this._ray(this._ndcFromEvent(e)); if (!hits.length) return false;
    const car = cars ? cars.index(hits[0].object) : -1;
    if (car < 0 && !(f && f.root.visible && f.isDining(hits[0].object))) return false;
    const p = this._floorPoint(e); if (!p) return false;
    this._dd = car >= 0 ? { id: e.pointerId, start: p, car, x: cars.state[car].x, z: cars.state[car].z }
      : { id: e.pointerId, start: p, dx: f.dining.dx, dz: f.dining.dz };
    if (car >= 0) { cars.last = car; this.app.ui?.onCarPicked?.(car); }
    this.orbit.enabled = false; this.topCtl.enabled = false;
    this.dom.style.cursor = 'grabbing';
    return true;
  }
  _dragDining(e) {
    const p = this._floorPoint(e); if (!p) return;
    const d = this._dd, f = this.app.ctx.furn;
    if (d.car !== undefined) { this.app.ctx.cars.move(d.car, d.x + (p.x - d.start.x), d.z + (p.z - d.start.z)); this.app.ui?.onCarDragged?.(); return; }
    f.moveDining(d.dx + (p.x - d.start.x), d.dz + (p.z - d.start.z));
    this.app.ui?.onDiningDragged?.();
  }
  _endDiningDrag() {
    this._dd = null; this.dom.style.cursor = '';
    this.orbit.enabled = this.mode === 'orbit'; this.topCtl.enabled = this.mode === 'top';
    this.invalidateTargets();
  }
  _look(dx, dy) {
    this.yaw -= dx * 0.0022; this.pitch -= dy * 0.0022;
    this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
  }

  resize() {
    const w = innerWidth, h = innerHeight, a = w / h;
    this.persp.aspect = a; this.persp.updateProjectionMatrix();
    const hh = 19;
    this.ortho.left = -hh * a; this.ortho.right = hh * a; this.ortho.top = hh; this.ortho.bottom = -hh;
    this.ortho.updateProjectionMatrix();
    this.app.renderer.setSize(w, h);
  }

  // ------------------------------------------------------------------ modos
  setMode(m) {
    const prev = this.mode;
    if (m === prev) return;
    if (prev === 'walk') { document.exitPointerLock?.(); this._exitWalk(); }
    if (prev === 'orbit') { this.saved.pos.copy(this.persp.position); this.saved.target.copy(this.orbit.target); }
    this.mode = m;
    this.orbit.enabled = m === 'orbit'; this.topCtl.enabled = m === 'top';
    this.camera = m === 'top' ? this.ortho : this.persp;
    if (m === 'orbit') { this.persp.position.copy(this.saved.pos); this.orbit.target.copy(this.saved.target); this.orbit.update(); }
    if (m === 'walk') this._enterWalk();
    const joy = document.getElementById('joy'); if (joy) joy.hidden = !(m === 'walk' && document.body.classList.contains('touch'));
    this.app.ui?.onMode(m);
  }
  _enterWalk() {
    this.persp.fov = 72; this.persp.updateProjectionMatrix();
    this.persp.rotation.order = 'YXZ';
    this._applyWalkCamera();
  }
  _exitWalk() {
    this.persp.fov = 62; this.persp.updateProjectionMatrix(); this.persp.rotation.order = 'XYZ';
    this.persp.up.set(0, 1, 0);
  }
  _applyWalkCamera() {
    this.persp.position.set(this.pos.x, this.eye, this.pos.z);
    this.persp.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
  setEye(v) { this.eye = v; }

  goTo(roomId) {
    const r = ROOMS.find((q) => q.id === roomId); if (!r) return;
    if (this.mode === 'walk') {
      if (!r.spawn) return;
      this.pos.set(r.spawn[0], 0, r.spawn[1]); this.yaw = r.spawn[2] * DEG; this.pitch = 0; this._applyWalkCamera();
    } else if (this.mode === 'orbit') {
      const t = new THREE.Vector3(r.c[0], 1.0, r.c[1]);
      const off = this.persp.position.clone().sub(this.orbit.target).setLength(Math.min(16, Math.max(7, this.persp.position.distanceTo(this.orbit.target))));
      this.orbit.target.copy(t); this.persp.position.copy(t).add(off);
    } else {
      this.topCtl.target.set(r.c[0], 0, r.c[1]); this.ortho.position.set(r.c[0], 100, r.c[1]); this.ortho.zoom = 2.2; this.ortho.updateProjectionMatrix();
    }
  }

  // ------------------------------------------------------------------ colisiones
  _blocked(x, z) {
    const r = this.radius, c = this.app.ctx;
    const hit = (b) => { const cx = Math.max(b.x0, Math.min(x, b.x1)), cz = Math.max(b.z0, Math.min(z, b.z1)); return (x - cx) ** 2 + (z - cz) ** 2 < r * r; };
    for (const b of c.colliders) if (hit(b)) return true;
    for (const d of c.dynColliders) {
      const active = d.op ? d.op.blocking : d.fn ? d.fn() : true;
      if (active && hit(d.box)) return true;
    }
    return false;
  }
  _step(dx, dz) {
    if (!this._blocked(this.pos.x + dx, this.pos.z)) this.pos.x += dx;
    if (!this._blocked(this.pos.x, this.pos.z + dz)) this.pos.z += dz;
  }

  // ------------------------------------------------------------------ interacción
  _targets() {
    // meshes visibles de la vivienda y del entorno cercano para el trazado de rayos
    if (this._tcache && performance.now() - this._tcache.t < 400) return this._tcache.list;
    const list = [];
    const { G } = this.app.ctx;
    for (const grp of [G.structure, G.kitchen, G.baths, G.site, G.upper, G.exterior, G.furniture]) {
      if (!grp) continue;
      grp.traverse((o) => {
        if (!o.isMesh || o.userData.ghost || !chainVisible(o)) return;
        const m = o.material;
        if (m && !Array.isArray(m) && (m.visible === false || (m.transparent && m.opacity < 0.3 && !o.userData.openable))) return;
        list.push(o);
      });
    }
    this._tcache = { t: performance.now(), list };
    return list;
  }
  invalidateTargets() { this._tcache = null; }

  _ray(ndc, far = 1e5) {
    this.raycaster.setFromCamera(ndc, this.camera);
    this.raycaster.far = far;
    return this.raycaster.intersectObjects(this._targets(), false).filter((h) => chainVisible(h.object));
  }
  _ndcFromEvent(e) { const r = this.dom.getBoundingClientRect(); return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); }

  interact(e) {
    const ndc = this.mode === 'walk' && this.locked || !e ? new THREE.Vector2(0, 0) : this._ndcFromEvent(e);
    const hits = this._ray(ndc, this.mode === 'walk' ? 2.6 : 1e5);
    const h = hits.find((x) => x.object.userData.openable) ;
    const first = hits[0];
    if (h && first && (first === h || first.object.userData.openable)) h.object.userData.openable.toggle();
  }

  hover() {
    if (this.mode !== 'walk') return null;
    const hits = this._ray(new THREE.Vector2(0, 0), 2.6);
    const f = hits[0];
    return f && f.object.userData.openable ? f.object.userData.openable : null;
  }

  // ------------------------------------------------------------------ medición
  setMeasure(on) { this.measureOn = on; if (!on) return; this.app.ui?.updateHelp(); }
  clearMeasure() {
    this.mpts = []; while (this.mgroup.children.length) { const c = this.mgroup.children.pop(); c.geometry?.dispose(); }
    this.mline = null; this.app.ui?.setMeasureLabel(null);
  }
  _measureClick(e) {
    const ndc = this.mode === 'walk' && this.locked ? new THREE.Vector2(0, 0) : this._ndcFromEvent(e);
    const hits = this._ray(ndc);
    if (!hits.length) return;
    if (this.mpts.length >= 2) this.clearMeasure();
    const p = hits[0].point.clone(); this.mpts.push(p);
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), this.app.ctx.M.measure); s.position.copy(p); s.renderOrder = 999; this.mgroup.add(s);
    if (this.mpts.length === 2) {
      const g = new THREE.BufferGeometry().setFromPoints(this.mpts);
      this.mline = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xff3b30, depthTest: false })); this.mline.renderOrder = 998; this.mgroup.add(this.mline);
      const d = this.mpts[0].distanceTo(this.mpts[1]);
      const dh = Math.hypot(this.mpts[1].x - this.mpts[0].x, this.mpts[1].z - this.mpts[0].z);
      this.app.ui?.setMeasureInfo(`Distancia: ${d.toFixed(2).replace('.', ',')} m  ·  en planta: ${dh.toFixed(2).replace('.', ',')} m  ·  desnivel: ${Math.abs(this.mpts[1].y - this.mpts[0].y).toFixed(2).replace('.', ',')} m`);
    } else this.app.ui?.setMeasureInfo('Primer punto marcado. Haz clic en el segundo punto.');
  }
  mid() { return this.mpts.length === 2 ? this.mpts[0].clone().add(this.mpts[1]).multiplyScalar(0.5) : null; }

  // ------------------------------------------------------------------ bucle
  update(dt) {
    if (this.mode === 'walk') {
      const k = this.keys;
      const rot = ((k.ArrowLeft ? 1 : 0) - (k.ArrowRight ? 1 : 0)) * 1.8 * dt; this.yaw += rot;
      let f = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0), s = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
      const jm = Math.hypot(this.joy.x, this.joy.y);
      if (jm > 0.12) { f -= this.joy.y; s += this.joy.x; }
      if (f || s) {
        const sp = (k.ShiftLeft || k.ShiftRight ? 3.2 : 1.5) * (jm > 0.12 ? Math.min(1, jm) * 1.6 : 1) * dt;
        let dx = -Math.sin(this.yaw) * f + Math.cos(this.yaw) * s, dz = -Math.cos(this.yaw) * f - Math.sin(this.yaw) * s;
        const l = Math.hypot(dx, dz); dx = dx / l * sp; dz = dz / l * sp;
        // subpasos para no atravesar paredes finas
        const n = Math.ceil(Math.hypot(dx, dz) / 0.05);
        for (let i = 0; i < n; i++) this._step(dx / n, dz / n);
      }
      this._applyWalkCamera();
    } else if (this.mode === 'orbit') this.orbit.update();
    else this.topCtl.update();
  }

  northAngleDeg() {
    const n = enuVecToWorld(0, 1, 0); const nx = n.x, nz = n.z;
    let fx, fz;
    if (this.mode === 'top') { fx = 0; fz = -1; }
    else { const d = new THREE.Vector3(); this.camera.getWorldDirection(d); fx = d.x; fz = d.z; const l = Math.hypot(fx, fz) || 1; fx /= l; fz /= l; }
    return Math.atan2(fx * nz - fz * nx, fx * nx + fz * nz) / DEG;
  }
}
