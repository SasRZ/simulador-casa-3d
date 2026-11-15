import * as THREE from 'three';
import { CFG, ESTIMATES } from './config.js';
import { ROOMS, ROOM_LIGHT_GROUPS } from './plan.js';
import { FURNITURE, VARIANTS, VARIANT_LABELS, STYLES, AVISOS, ROOM_NAMES } from './furniture_data.js';
const GHOST = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: THREE.DoubleSide });
import { FLOOR_OPTIONS } from './materials.js';
import { sunPosition, localToUtc, sunTimes, fmtMin, bearingName } from './sun.js';

const $ = (id) => document.getElementById(id);
const f1 = (n) => n.toFixed(1).replace('.', ',');
const SPOT_INTENSITY = 22;

export class UI {
  constructor(app) {
    this.app = app;
    this.roofUser = false;
    this.measure = false;
    this.playing = false;
    this.labelsOn = true;
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: CFG.site.tz });
    this.date = today; this.minutes = 13 * 60;

    this._modes(); this._time(); this._lights(); this._options(); this._furniture(); this._rooms(); this._tools();
    this.updateHelp(); this.applyRoof();
  }

  // ---------------------------------------------------------------- modos
  _modes() {
    $('mode-seg').addEventListener('click', (e) => { const m = e.target.dataset?.mode; if (m) this.app.nav.setMode(m); });
    $('panel-toggle').onclick = () => this.togglePanel();
  }
  togglePanel(force) { const p = $('panel'); p.classList.toggle('hidden', force); $('panel-toggle').textContent = p.classList.contains('hidden') ? (document.body.classList.contains('touch') ? '☰' : '▶') : (document.body.classList.contains('touch') ? '✕' : '◀'); }
  onMode(m) {
    [...$('mode-seg').children].forEach((b) => b.classList.toggle('on', b.dataset.mode === m));
    $('crosshair').hidden = m !== 'walk';
    this.applyRoof(); this.updateHelp();
    this.app.nav.invalidateTargets();
  }
  updateHelp() {
    const n = this.app.nav, h = $('help');
    let t = '';
    const touch = document.body.classList.contains('touch');
    if (touch) {
      if (n.measureOn) t = '📏 Toca dos puntos para medir';
      else if (n.mode === 'walk') t = 'Joystick para andar · arrastra para mirar · toca puertas y ventanas';
      else if (n.mode === 'orbit') t = 'Un dedo gira · dos dedos zoom y desplazar · toca puertas y ventanas';
      else t = 'Arrastra para desplazar · pellizca para zoom';
      h.textContent = t; return;
    }
    if (n.measureOn) t = '📏 Medir: haz clic en dos puntos · M para salir';
    else if (n.mode === 'walk') t = n.locked ? 'WASD mover · Shift correr · ratón mirar · clic o E abrir/cerrar · Esc soltar ratón' : 'Haz clic en la escena para controlar el ratón · arrastra para mirar · WASD para moverte';
    else if (n.mode === 'orbit') t = 'Arrastra para girar · rueda para zoom · botón derecho para desplazar · clic en una puerta o ventana para abrirla';
    else t = 'Vista de planta: arrastra para desplazar · rueda para zoom · clic en puertas y ventanas para abrirlas';
    h.textContent = t;
  }
  applyRoof() {
    const m = this.app.nav.mode;
    const show = m === 'walk' ? true : m === 'top' ? false : this.roofUser;
    const { G } = this.app.ctx;
    // Techo y plantas superiores nunca dejan pasar el sol: al ocultarlos pasan a ser "fantasmas" (no se ven, pero siguen dando sombra).
    this.roofShown = show;
    const ghost = !show;
    for (const grp of [G.upper, G.tower]) {
      if (!grp) continue;
      grp.visible = true;
      grp.traverse((o) => {
        if (!o.isMesh) return;
        if (ghost && !o.userData.solid) { o.userData.solid = o.material; o.userData.ghost = true; o.material = Array.isArray(o.material) ? o.material.map(() => GHOST) : GHOST; }
        else if (!ghost && o.userData.solid) { o.material = o.userData.solid; o.userData.solid = null; o.userData.ghost = false; }
      });
    }
    $('opt-roof').checked = show;
    $('opt-roof').disabled = m !== 'orbit';
    this.app.nav.invalidateTargets();
  }

  // ---------------------------------------------------------------- hora y sol
  _time() {
    $('date').value = this.date;
    const sync = () => {
      $('time').value = fmtMin(this.minutes);
      $('time-range').value = Math.floor(this.minutes);
      this.applyTime();
    };
    this._syncTime = sync;
    $('date').onchange = () => { this.date = $('date').value || this.date; sync(); };
    $('time').oninput = () => { const [h, m] = ($('time').value || '12:00').split(':').map(Number); this.minutes = h * 60 + m; sync(); };
    $('time-range').oninput = () => { this.minutes = +$('time-range').value; sync(); };
    $('play').onclick = () => { this.playing = !this.playing; $('play').textContent = this.playing ? '⏸ Pausa' : '▶ Animar'; $('play').classList.toggle('active', this.playing); };
    document.querySelectorAll('[data-t]').forEach((b) => b.onclick = () => {
      const t = sunTimes(CFG.site.tz, this.date, CFG.site.lat, CFG.site.lon);
      const k = b.dataset.t;
      if (k === 'sunrise' && t.rise != null) this.minutes = t.rise + 25;
      if (k === 'sunset' && t.set != null) this.minutes = t.set - 20;
      if (k === 'noon' && t.rise != null && t.set != null) this.minutes = Math.round((t.rise + t.set) / 2);
      if (k === 'night') this.minutes = 23 * 60 + 30;
      sync();
    });
    sync();
  }
  tick(dt) {
    if (!this.playing) return;
    const spd = +$('speed').value;     // minutos simulados por segundo
    this.minutes += spd * dt;
    if (this.minutes >= 1440) this.minutes -= 1440;
    $('time').value = fmtMin(this.minutes); $('time-range').value = Math.floor(this.minutes);
    this.applyTime();
  }
  applyTime() {
    const utc = localToUtc(CFG.site.tz, this.date, this.minutes);
    const sp = sunPosition(utc, CFG.site.lat, CFG.site.lon);
    const r = this.app.env.update(sp);
    const t = this._times && this._times.date === this.date ? this._times : (this._times = { date: this.date, ...sunTimes(CFG.site.tz, this.date, CFG.site.lat, CFG.site.lon) });
    const az = sp.az * 180 / Math.PI;
    $('sun-info').textContent =
      `Sol: azimut ${Math.round(az)}º (${bearingName(az)}) · elevación ${f1(r.altDeg)}º\n` +
      `Amanecer ${t.rise != null ? fmtMin(t.rise) : '—'} · Ocaso ${t.set != null ? fmtMin(t.set) : '—'}\n` +
      (r.altDeg < 0 ? 'Es de noche: enciende los focos.' : '');
  }

  // ---------------------------------------------------------------- luces
  _lights() {
    const box = $('lights-rooms');
    this.lightChecks = {};
    ROOM_LIGHT_GROUPS.forEach(([id, name]) => {
      const l = document.createElement('label'); l.className = 'row';
      l.innerHTML = `<input type="checkbox"> ${name}`;
      const c = l.querySelector('input'); this.lightChecks[id] = c;
      c.onchange = () => { this.setRoomLights(id, c.checked); this._syncAll(); };
      box.appendChild(l);
    });
    $('lights-all').onchange = () => { const on = $('lights-all').checked; Object.keys(this.lightChecks).forEach((id) => { this.lightChecks[id].checked = on; this.setRoomLights(id, on); }); };
  }
  setRoomLights(id, on) {
    this.app.ctx.spots.filter((s) => s.room === id).forEach((s) => {
      s.light.visible = on; s.light.intensity = on ? SPOT_INTENSITY : 0;
      s.lens.material.emissiveIntensity = on ? 3 : 0;
    });
    this._refreshFill();
  }
  _refreshFill() {
    const spots = this.app.ctx.spots, n = spots.filter((s) => s.light.visible).length;
    this.app.env.fill = 0.55 * Math.min(1, n / 6);       // rebote de luz difuso al encender focos
    this.applyTime();
  }
  _syncAll() { $('lights-all').checked = Object.values(this.lightChecks).every((c) => c.checked); }

  // ---------------------------------------------------------------- opciones
  _options() {
    const { G } = this.app.ctx;
    $('opt-roof').onchange = () => { this.roofUser = $('opt-roof').checked; this.applyRoof(); };
    $('clip').oninput = () => {
      const v = +$('clip').value;
      this.app.renderer.clippingPlanes = v >= 3.6 ? [] : [new THREE.Plane(new THREE.Vector3(0, -1, 0), v)];
      $('clip-out').textContent = v >= 3.6 ? 'off' : `${f1(v)} m`;
    };
    $('eye').oninput = () => { const v = +$('eye').value; this.app.nav.setEye(v); $('eye-out').textContent = `${v.toFixed(2).replace('.', ',')} m`; };
    $('opt-floor').innerHTML = FLOOR_OPTIONS.map((g) => `<optgroup label="${g.group}">${g.items.map((i) => `<option value="${i.id}">${i.name}</option>`).join('')}</optgroup>`).join('');
    $('opt-floor').value = 'p-plano';
    $('opt-floor').onchange = () => this.app.ctx.setFloor($('opt-floor').value);
    $('opt-hall-door').onchange = () => { this.app.ctx.setHallSlider($('opt-hall-door').value); this.app.nav.invalidateTargets(); };
    this._paint();
    const PRESETS = { plano: [0, 0, 0], oeste: [-0.6, 0, 0], corredera: [-0.55, -1.25, 0], girada: [-0.55, -0.6, 1] };
    const setDining = (k) => { const pr = PRESETS[k]; if (pr) this.app.ctx.furn.moveDining(...pr); this.app.nav.invalidateTargets(); };
    $('opt-tv').onchange = () => { this.app.ctx.furn.setTV(+$('opt-tv').value); this.app.nav.invalidateTargets(); };
    $('opt-dining').onchange = () => setDining($('opt-dining').value);
    $('dining-rot').onclick = () => { const d = this.app.ctx.furn.dining; this.app.ctx.furn.moveDining(undefined, undefined, d.rot + 1); $('opt-dining').value = 'libre'; };
    $('opt-island').onchange = () => {
      const on = $('opt-island').checked; this.app.ctx.setIsland(on);
      if (on && $('opt-dining').value === 'plano') { $('opt-dining').value = 'oeste'; setDining('oeste'); }
      this.app.nav.invalidateTargets();
    };
    this.onDiningDragged = () => { $('opt-dining').value = 'libre'; };
    $('opt-kitchen').onchange = () => { G.kitchen.visible = $('opt-kitchen').checked; this.app.nav.invalidateTargets(); };
    $('opt-porch').onchange = () => { this.app.ctx.setPorch($('opt-porch').value); this.app.nav.invalidateTargets(); };
    $('opt-porch-glass').onchange = () => { this.app.ctx.setPorchGlass($('opt-porch-glass').checked); this.app.nav.invalidateTargets(); };
    const carport = () => { $('row-carport-len').hidden = !$('opt-carport').value; this.app.ctx.setCarport($('opt-carport').value, $('opt-carport-len').value); this.app.nav.invalidateTargets(); };
    $('opt-wallplants').onchange = () => { this.app.ctx.setWallPlants($('opt-wallplants').value); this.app.nav.invalidateTargets(); };
    const carsRows = () => { const n = +$('opt-cars').value; ['row-cars-pos', 'row-cars-rot', 'cars-info'].forEach((id) => { $(id).hidden = !n; }); };
    $('opt-cars').onchange = () => { this.app.ctx.setCars(+$('opt-cars').value); carsRows(); this.app.nav.invalidateTargets(); };
    $('opt-cars-pos').onchange = () => { this.app.ctx.cars.preset($('opt-cars-pos').value); this.app.nav.invalidateTargets(); };
    const rotCar = () => { if (this.app.ctx.cars.rotate()) { $('opt-cars-pos').value = 'libre'; this.app.nav.invalidateTargets(); } };
    $('car-rot').onclick = rotCar;
    addEventListener('keydown', (e) => { if (e.code === 'KeyR' && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName || '')) rotCar(); });
    this.onCarDragged = () => { $('opt-cars-pos').value = 'libre'; };
    $('opt-carport').onchange = carport; $('opt-carport-len').onchange = carport;
    $('opt-solar').onchange = () => {
      const v = $('opt-solar').value; this.app.ctx.setSolar(v);
      if (v && this.app.nav.mode === 'orbit' && !this.roofUser) { this.roofUser = true; this.applyRoof(); }   // las placas van en la cubierta: mostrarla
      this.app.nav.invalidateTargets();
    };
    $('opt-pool-size').onchange = () => { this.app.ctx.setPoolSize($('opt-pool-size').value); this.app.nav.invalidateTargets(); };
    $('opt-coping').onchange = () => this.app.ctx.setCoping($('opt-coping').value);
    $('opt-pool-light').onchange = () => this.app.ctx.setPoolLights($('opt-pool-light').checked);
    $('opt-env').onchange = () => { G.envContext.visible = $('opt-env').checked; };
    $('opt-labels').onchange = () => { this.labelsOn = $('opt-labels').checked; };
    const sh = () => this.app.env.setShadows($('opt-shadows').checked, $('opt-hq').checked);
    $('opt-shadows').onchange = sh; $('opt-hq').onchange = sh;
  }


  // ---------------------------------------------------------------- paleta de paredes y techo
  _paint() {
    const ctx = this.app.ctx, M = ctx.M;
    const COLORS = [
      ['f7f6f2', 'Blanco roto'], ['ffffff', 'Blanco puro'], ['efe9df', 'Lino'], ['e6dccb', 'Beige arena'], ['ddd5c8', 'Greige'],
      ['d9d8d4', 'Gris perla'], ['b9b6b0', 'Gris piedra'], ['8f8a83', 'Topo'], ['4a4f54', 'Gris antracita'],
      ['d4ddcc', 'Verde salvia claro'], ['a9b8a0', 'Verde salvia'], ['6f8068', 'Verde oliva'],
      ['dbe3e8', 'Azul niebla'], ['9fb2c0', 'Azul grisáceo'], ['2f4a63', 'Azul marino'],
      ['f0dccf', 'Terracota suave'], ['c98b6b', 'Terracota'], ['f2e3c2', 'Amarillo vainilla'], ['e9d1d6', 'Rosa empolvado'], ['b85c5c', 'Rojo teja'],
    ];
    // [nombre, paredes, acento, techo]  ('' = según el estilo)
    const PALETTES = [
      ['Según el estilo', '', '', 'ffffff'],
      ['Blanco (memoria)', 'f7f6f2', 'none', 'ffffff'],
      ['Arena y terracota', 'efe9df', 'c98b6b', 'ffffff'],
      ['Greige y topo', 'ddd5c8', '8f8a83', 'f7f6f2'],
      ['Perla y antracita', 'd9d8d4', '4a4f54', 'ffffff'],
      ['Lino y salvia', 'efe9df', 'a9b8a0', 'ffffff'],
      ['Niebla y marino', 'dbe3e8', '2f4a63', 'ffffff'],
      ['Rosa y teja', 'f0dccf', 'b85c5c', 'f7f6f2'],
    ];
    const opts = (extra) => extra + COLORS.map(([v, n]) => `<option value="${v}">${n}</option>`).join('');
    $('opt-wall-color').innerHTML = opts('<option value="">Según el estilo</option>');
    $('opt-accent-color').innerHTML = opts('<option value="">Según el estilo</option><option value="none">Sin acento (como el resto)</option>');
    $('opt-ceil-color').innerHTML = opts('');
    $('opt-ceil-color').value = 'ffffff';
    const hex = (v) => parseInt(v, 16);
    this.applyPaint = () => {
      const w = $('opt-wall-color').value, a = $('opt-accent-color').value, c = $('opt-ceil-color').value;
      ctx.paintWall = w ? hex(w) : null;
      if (ctx.paintWall != null) M.wall.color.setHex(ctx.paintWall);
      else ctx.furn.setStyle(ctx.furn.selection.style);
      const st = STYLES[ctx.furn.selection.style];
      if (a === 'none') M.accent.color.copy(M.wall.color);
      else if (a) M.accent.color.setHex(hex(a));
      else M.accent.color.setHex(st ? st.colors.sage : 0xa9b8a0);
      M.ceiling.color.setHex(hex(c || 'ffffff'));
    };
    const box = $('palettes');
    PALETTES.forEach(([name, wall, accent, ceil], i) => {
      const b = document.createElement('button');
      const sw = (v) => `<i style="background:${v && v !== 'none' ? '#' + v : 'repeating-linear-gradient(45deg,#ccc 0 3px,#999 3px 6px)'}"></i>`;
      b.innerHTML = `<span class="chips3">${sw(wall)}${sw(accent === 'none' ? wall : accent)}${sw(ceil)}</span>${name}`;
      b.onclick = () => {
        $('opt-wall-color').value = wall; $('opt-accent-color').value = accent; $('opt-ceil-color').value = ceil;
        [...box.children].forEach((x) => x.classList.toggle('on', x === b)); this.applyPaint();
      };
      if (i === 0) b.classList.add('on');
      box.appendChild(b);
    });
    const custom = () => { [...box.children].forEach((x) => x.classList.remove('on')); this.applyPaint(); };
    $('opt-wall-color').onchange = custom; $('opt-accent-color').onchange = custom; $('opt-ceil-color').onchange = custom;
    this.applyPaint();
  }

  // ---------------------------------------------------------------- amueblado
  _furniture() {
    const fu = this.app.ctx.furn;
    // estilo
    $('furn-style').innerHTML = Object.entries(STYLES).map(([k, st]) => `<option value="${k}">${st.name}</option>`).join('');
    const styleInfo = () => { $('furn-style-info').textContent = STYLES[$('furn-style').value].note; };
    $('furn-style').onchange = () => { fu.setStyle($('furn-style').value); styleInfo(); this.applyPaint?.(); this.app.nav.invalidateTargets(); };
    styleInfo();
    // uso de cada estancia
    const box = $('furn-uses');
    for (const [room, opts] of Object.entries(VARIANTS)) {
      const l = document.createElement('label'); l.className = 'row';
      l.innerHTML = `<span>${VARIANT_LABELS[room] || room}</span><select>${Object.entries(opts).map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select>`;
      const sel = l.querySelector('select');
      sel.onchange = () => { fu.setOption(room, sel.value); this.app.nav.invalidateTargets(); };
      box.appendChild(l);
    }
    $('opt-furn').onchange = () => { fu.setEnabled($('opt-furn').checked); this.app.nav.invalidateTargets(); };
    $('opt-curtains').onchange = () => fu.setCurtains($('opt-curtains').checked);
    $('opt-lift').onchange = () => fu.setLift($('opt-lift').checked);
    const lamps = () => {
      const lvl = +$('lamp-dim').value / 100; $('lamp-dim-out').textContent = `${$('lamp-dim').value} %`;
      fu.setLamps($('opt-lamps').checked, lvl);
    };
    $('opt-lamps').onchange = lamps; $('lamp-dim').oninput = lamps;
    $('furn-list').onclick = () => { this._furnList(); $('modal-furn').hidden = false; };
    $('modal-furn-close').onclick = () => { $('modal-furn').hidden = true; };
    $('modal-furn').onclick = (e) => { if (e.target.id === 'modal-furn') $('modal-furn').hidden = true; };
  }
  _furnList() {
    const n = (v) => v.toFixed(2).replace('.', ',');
    const byRoom = {};
    this.app.ctx.furn.items.filter(({ obj }) => obj.visible).map(({ it }) => it).forEach((f) => { (byRoom[f.room] ||= []).push(f); });
    let html = `<p class="info">Estilo: <b>${STYLES[this.app.ctx.furn.selection.style].name}</b>. Medidas en metros: ancho × fondo × alto. Todo es propuesta (no sale del plano).</p>`;
    for (const [room, list] of Object.entries(byRoom)) {
      html += `<h3>${ROOM_NAMES[room] || room}</h3><table><tr><th>Pieza</th><th>Ancho × fondo × alto (m)</th><th>Variante</th></tr>`;
      for (const f of list) {
        const ns = true; const w = f.w, d = f.d;
        const dims = f.curtain ? `${n(f.w)} × — × ${n(f.h)}` : `${n(w)} × ${n(d)} × ${n(f.h)}`;
        const v = f.v === 'base' ? '' : (VARIANTS[f.v.split(':')[0]] || {})[f.v.split(':')[1]] || '';
        html += `<tr><td>${f.name}${f.note ? `<br><small>${f.note}</small>` : ''}</td><td class="n">${dims}</td><td>${v}</td></tr>`;
      }
      html += '</table>';
    }
    html += '<h3>Avisos</h3><ul>' + AVISOS.map(([lvl, t]) => `<li class="${lvl}">${t}</li>`).join('') + '</ul>';
    $('furn-body').innerHTML = html;
  }

  // ---------------------------------------------------------------- ir a
  _rooms() {
    const box = $('rooms');
    ROOMS.forEach((r) => {
      const b = document.createElement('button'); b.textContent = r.name; b.onclick = () => this.app.nav.goTo(r.id); box.appendChild(b);
    });
    this.labelEls = ROOMS.map((r) => {
      const d = document.createElement('div'); d.innerHTML = `${r.name}${r.note ? `<small>${r.note}</small>` : ''}`; $('labels').appendChild(d); return { d, r };
    });
  }
  updateLabels() {
    const n = this.app.nav;
    const roofOn = this.roofShown;
    const show = this.labelsOn && n.mode !== 'walk' && (n.mode === 'top' || !roofOn) && (n.mode === 'top' || n.persp.position.distanceTo(new THREE.Vector3(7, 0, 18)) < 60);
    const v = new THREE.Vector3();
    for (const { d, r } of this.labelEls) {
      if (!show) { d.style.display = 'none'; continue; }
      v.set(r.c[0], ['porche', 'jardin', 'patio', 'acceso'].includes(r.id) ? 0.2 : 1.0, r.c[1]).project(n.camera);
      const ok = v.z > -1 && v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
      d.style.display = ok ? '' : 'none';
      d.style.left = `${(v.x * 0.5 + 0.5) * innerWidth}px`; d.style.top = `${(-v.y * 0.5 + 0.5) * innerHeight}px`;
    }
    const m = n.mid();
    const ml = $('measure-label');
    if (m) { m.project(n.camera); ml.hidden = false; ml.style.left = `${(m.x * 0.5 + 0.5) * innerWidth}px`; ml.style.top = `${(-m.y * 0.5 + 0.5) * innerHeight}px`; ml.textContent = `${n.mpts[0].distanceTo(n.mpts[1]).toFixed(2).replace('.', ',')} m`; }
    else ml.hidden = true;
    $('compass-rot').style.transform = `rotate(${n.northAngleDeg()}deg)`;
  }

  // ---------------------------------------------------------------- herramientas
  _tools() {
    $('measure').onclick = () => this.toggleMeasure();
    $('measure-clear').onclick = () => { this.app.nav.clearMeasure(); $('measure-info').textContent = ''; };
    $('shot').onclick = () => {
      const a = this.app; a.renderer.render(a.scene, a.nav.camera);
      a.renderer.domElement.toBlob((b) => { const l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = `villa-04-${this.date}-${fmtMin(this.minutes).replace(':', '')}.png`; l.click(); setTimeout(() => URL.revokeObjectURL(l.href), 5000); });
    };
    $('est').onclick = () => { $('modal').hidden = false; };
    $('modal-close').onclick = () => { $('modal').hidden = true; };
    $('modal').onclick = (e) => { if (e.target.id === 'modal') $('modal').hidden = true; };
    $('est-table').innerHTML = ESTIMATES.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('');
  }
  toggleMeasure() {
    this.measure = !this.measure; this.app.nav.setMeasure(this.measure);
    $('measure').classList.toggle('active', this.measure);
    if (!this.measure) { this.app.nav.clearMeasure(); $('measure-info').textContent = ''; } else $('measure-info').textContent = 'Haz clic en dos puntos de la escena.';
    this.updateHelp();
  }
  setMeasureInfo(t) { $('measure-info').textContent = t; }
  setMeasureLabel() {}
}
