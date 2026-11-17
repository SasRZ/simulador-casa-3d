// Notas ancladas a puntos del modelo: se guardan en este navegador (localStorage) y se pueden
// exportar/importar en un archivo .json para pasarlas a otro dispositivo.
import * as THREE from 'three';

const KEY = 'villa04-notas-v1';
const COLORS = ['#ffcc00', '#ff6b5e', '#5aa9ff', '#3ddc84', '#c38bff'];
const $ = (id) => document.getElementById(id);
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class Notes {
  constructor(app) {
    this.app = app; this.list = []; this.visible = true; this.placing = false; this.editing = null;
    this.layer = $('notes-layer'); this.v = new THREE.Vector3(); this.occT = 0;
    try { this.list = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { this.list = []; }
    try { this.visible = localStorage.getItem(KEY + '-vis') !== '0'; } catch { /* sin almacenamiento */ }
    this._bindUI(); this._render();
  }
  _save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.list)); localStorage.setItem(KEY + '-vis', this.visible ? '1' : '0'); }
    catch { $('notes-info').textContent = 'Este navegador no deja guardar: exporta las notas antes de cerrar.'; }
  }
  _bindUI() {
    $('note-add').onclick = () => this.setPlacing(!this.placing);
    $('note-toggle').onclick = () => this.setVisible(!this.visible);
    $('opt-notes').onchange = () => this.setVisible($('opt-notes').checked);
    $('note-export').onclick = () => {
      const b = new Blob([JSON.stringify({ app: 'villa04', notas: this.list }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `notas-villa04-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    };
    $('note-import').onclick = () => $('note-file').click();
    $('note-file').onchange = async () => {
      const f = $('note-file').files[0]; if (!f) return;
      try {
        const d = JSON.parse(await f.text()), arr = Array.isArray(d) ? d : d.notas;
        const have = new Set(this.list.map((n) => n.id)); let k = 0;
        for (const n of arr || []) if (n && typeof n.text === 'string' && Number.isFinite(n.x) && !have.has(n.id)) { this.list.push({ id: n.id || crypto.randomUUID(), x: n.x, y: n.y, z: n.z, text: n.text, color: n.color || COLORS[0], t: n.t || Date.now() }); k++; }
        this._save(); this._render(); $('notes-info').textContent = `${k} notas importadas.`;
      } catch { $('notes-info').textContent = 'Ese archivo no es de notas.'; }
      $('note-file').value = '';
    };
    let armed = 0;
    $('note-clear').onclick = () => {
      if (!this.list.length) return;
      if (Date.now() - armed > 3000) { armed = Date.now(); $('note-clear').textContent = '¿Seguro? Pulsa otra vez'; setTimeout(() => { $('note-clear').textContent = 'Borrar todas'; }, 3000); return; }
      this.list = []; this._save(); this._render(); $('note-clear').textContent = 'Borrar todas';
    };
    // editor
    $('note-save').onclick = () => this._commit();
    $('note-cancel').onclick = () => this._closeEditor();
    $('note-del').onclick = () => { if (this.editing?.saved) { this.list = this.list.filter((n) => n.id !== this.editing.id); this._save(); } this._closeEditor(); };
    $('note-text').addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) this._commit(); if (e.key === 'Escape') this._closeEditor(); });
    $('note-colors').innerHTML = COLORS.map((c) => `<button data-c="${c}" style="background:${c}" aria-label="color"></button>`).join('');
    $('note-colors').onclick = (e) => { const c = e.target.dataset?.c; if (c && this.editing) { this.editing.color = c; this._paintColors(); } };
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.placing) this.setPlacing(false); });
  }
  setVisible(on) { this.visible = on; this._save(); this._render(); }
  setPlacing(on) {
    this.placing = on;
    if (on && this.app.nav.measureOn) this.app.ui?.toggleMeasure();
    $('note-add').classList.toggle('on', on);
    $('note-add').textContent = on ? 'Toca dónde va la nota… (Esc cancela)' : '📌 Añadir nota';
    document.body.classList.toggle('placing-note', on);
    if (on && document.body.classList.contains('touch')) this.app.ui?.togglePanel(true);
  }
  // llamado por la navegación al hacer clic/tocar en la escena
  place(hit) {
    this.setPlacing(false);
    if (!hit) return;
    this.visible = true;
    this._openEditor({ id: crypto.randomUUID(), x: +hit.x.toFixed(3), y: +hit.y.toFixed(3), z: +hit.z.toFixed(3), text: '', color: COLORS[0], t: Date.now(), saved: false });
  }
  _openEditor(n) {
    if (document.pointerLockElement) document.exitPointerLock();
    this.editing = { ...n }; $('note-editor').hidden = false; $('note-text').value = n.text;
    $('note-del').textContent = n.saved === false ? 'Descartar' : 'Borrar';
    this._paintColors(); setTimeout(() => $('note-text').focus(), 30); this._render();
  }
  _paintColors() { [...$('note-colors').children].forEach((b) => b.classList.toggle('on', b.dataset.c === this.editing.color)); }
  _commit() {
    const e = this.editing; if (!e) return;
    const text = $('note-text').value.trim();
    if (!text) { this._closeEditor(); return; }
    const i = this.list.findIndex((n) => n.id === e.id), n = { id: e.id, x: e.x, y: e.y, z: e.z, text, color: e.color, t: e.t };
    if (i >= 0) this.list[i] = n; else this.list.push(n);
    this._save(); this._closeEditor();
  }
  _closeEditor() { this.editing = null; $('note-editor').hidden = true; this._render(); }
  goTo(n) {
    const nav = this.app.nav, t = new THREE.Vector3(n.x, n.y, n.z);
    if (nav.mode === 'walk') nav.setMode('orbit');
    if (nav.mode === 'orbit') {
      const off = nav.persp.position.clone().sub(nav.orbit.target).setLength(6);
      if (off.y < 2.5) off.y = 2.5;
      nav.orbit.target.copy(t); nav.persp.position.copy(t).add(off);
    } else { nav.topCtl.target.set(n.x, 0, n.z); nav.ortho.position.set(n.x, 100, n.z); nav.ortho.zoom = 3; nav.ortho.updateProjectionMatrix(); }
    if (document.body.classList.contains('touch')) this.app.ui?.togglePanel(true);
  }
  _render() {
    $('note-toggle').textContent = this.visible ? '🙈 Ocultar notas' : '👁 Mostrar notas';
    $('note-count').textContent = this.list.length ? `(${this.list.length})` : '';
    // lista del panel
    $('notes-list').innerHTML = this.list.map((n, i) => `<li data-id="${n.id}"><span class="dot" style="background:${n.color}">${i + 1}</span><span class="tx">${esc(n.text)}</span><button data-a="go" title="Ir">👁</button><button data-a="ed" title="Editar">✎</button></li>`).join('')
      || '<li class="empty">Aún no hay notas. Pulsa «Añadir nota» y luego toca un punto de la casa.</li>';
    $('notes-list').onclick = (e) => {
      const a = e.target.dataset?.a, li = e.target.closest('li'), n = li && this.list.find((q) => q.id === li.dataset.id);
      if (!n) return; if (a === 'ed') this._openEditor(n); else this.goTo(n);
    };
    // marcadores
    this.layer.innerHTML = '';
    this.pins = [];
    const all = this.editing && !this.list.some((n) => n.id === this.editing.id) ? [...this.list, this.editing] : this.list;
    all.forEach((n, i) => {
      const d = document.createElement('div'); d.className = 'pin';
      d.innerHTML = `<b style="background:${n.color}">${i + 1}</b><span>${esc(n.text || 'Nota nueva')}</span>`;
      d.onclick = (e) => { e.stopPropagation(); this._openEditor(n); };
      this.layer.appendChild(d); this.pins.push({ d, n });
    });
    this.layer.hidden = !this.visible; $('opt-notes').checked = this.visible; $('q-notes').checked = this.visible;
  }
  // cada fotograma: proyectar marcadores; cada 0,3 s, atenuar los que quedan detrás de un muro
  update(dt) {
    if (!this.visible || !this.pins?.length) return;
    const cam = this.app.nav.camera, v = this.v;
    this.occT += dt; const occ = this.occT > 0.3; if (occ) this.occT = 0;
    for (const p of this.pins) {
      v.set(p.n.x, p.n.y, p.n.z).project(cam);
      const ok = v.z > -1 && v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
      p.d.style.display = ok ? '' : 'none'; if (!ok) continue;
      p.d.style.left = `${(v.x * 0.5 + 0.5) * innerWidth}px`; p.d.style.top = `${(-v.y * 0.5 + 0.5) * innerHeight}px`;
      if (occ) {
        const hits = this.app.nav._ray(new THREE.Vector2(v.x, v.y));
        const dist = cam.isOrthographicCamera ? null : cam.position.distanceTo(this.v.set(p.n.x, p.n.y, p.n.z));
        p.d.classList.toggle('behind', !!(dist && hits[0] && hits[0].distance < dist - 0.15));
      }
    }
  }
}
