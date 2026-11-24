/* =========================================================
   FlowDesk — UI Toolkit
   Icons, formatting, components, modal, toast and SVG charts
   (no external libraries).
   ========================================================= */

/* Icon shapes from Feather (https://feathericons.com), some lightly modified.
   Feather is Copyright (c) 2013-2023 Cole Bemis, released under the MIT License:
   https://github.com/feathericons/feather/blob/main/LICENSE */
const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
  inbox:
    '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  users:
    '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  layers:
    '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  userCheck:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>',
  chart:
    '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  logout:
    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  upload:
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  download:
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  alert:
    '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  arrowRight: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  arrowLeft: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  trash:
    '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  columns:
    '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>',
  list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
  printer:
    '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  refresh:
    '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l5.64 5.36A9 9 0 0 0 20.49 15"/>',
  send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  play: '<polygon points="5 3 19 12 5 21 5 3"/>',
  pen: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  film: '<rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/>',
  present:
    '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  share:
    '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
  box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>',
  menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  calendar:
    '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  briefcase:
    '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
  repeat:
    '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  trending: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  chevronDown: '<polyline points="6 9 12 15 18 9"/>',
  chevronRight: '<polyline points="9 18 15 12 9 6"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  phone:
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
};

const STATUS_COLORS = {
  Assigned: '#7d8a90',
  'In Progress': '#1f7fa8',
  'Client Review': '#e0a020',
  Revision: '#e0484e',
  Approved: '#14a37a',
  Delivered: '#6f9fb3',
  Pending: '#e0a020',
  'Under Review': '#1f7fa8',
  Converted: '#14a37a',
  Rejected: '#e0484e',
  'Pending Review': '#e0a020',
  'Revision Requested': '#e0484e',
  Open: '#e0484e',
  Addressed: '#14a37a',
};
const PRIORITY_COLORS = { Low: '#7d8a90', Medium: '#6f9fb3', High: '#1f7fa8', Urgent: '#e0484e' };
const AVATAR_COLORS = [
  '#00638e',
  '#004a6b',
  '#2b2b2b',
  '#1f7fa8',
  '#6f9fb3',
  '#4f7d92',
  '#14a37a',
  '#7d8a90',
];

const UI = {
  icon(name, size = 18, cls = '') {
    return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  },

  esc(s) {
    return String(s == null ? '' : s).replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  },

  /* ---------- Formatting ---------- */
  date(iso) {
    return iso
      ? new Date(iso).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '—';
  },
  dateShort(iso) {
    return iso
      ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '—';
  },
  dateTime(iso) {
    return iso
      ? new Date(iso).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : '—';
  },
  inputDate(iso) {
    const d = iso ? new Date(iso) : new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  },
  ago(iso) {
    const s = Math.round((Date.now() - new Date(iso)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    if (s < 86400 * 30) return Math.floor(s / 86400) + 'd ago';
    return this.dateShort(iso);
  },
  fileSize(b) {
    if (!b) return '';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(0) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  },
  initials(name) {
    return (name || '?')
      .split(/\s+/)
      .filter(w => /^[A-Za-z]/.test(w))
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  },
  colorFor(str) {
    let h = 0;
    for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
  },

  /* ---------- Small components ---------- */
  avatar(user, size = 32) {
    if (!user) return '';
    return `<span class="avatar" style="--s:${size}px;background:${this.colorFor(user.id)}" title="${this.esc(user.name)}">${this.initials(user.name)}</span>`;
  },
  badge(status) {
    const c = STATUS_COLORS[status] || '#7d8a90';
    return `<span class="badge" style="--c:${c}"><i></i>${this.esc(status)}</span>`;
  },
  priority(p) {
    return `<span class="prio" style="--c:${PRIORITY_COLORS[p]}">${this.icon('flag', 12)}${p}</span>`;
  },
  health(p) {
    const h = Metrics.health(p);
    const ic = { overdue: 'alert', risk: 'clock', ok: 'calendar', done: 'check' }[h.key];
    return `<span class="health h-${h.key}">${this.icon(ic, 13)}${h.label}</span>`;
  },
  progress(pct, color) {
    return `<div class="progress"><span style="width:${pct}%;${color ? 'background:' + color : ''}"></span></div>`;
  },
  serviceTag(s) {
    if (!s) return '<span class="muted">Removed service</span>';
    return `<span class="svc-tag" style="--c:${s.color}">${this.icon(s.icon, 13)}${this.esc(s.name)}</span>`;
  },
  stars(n, size = 14) {
    let out = '<span class="stars">';
    for (let i = 1; i <= 5; i++)
      out += `<span class="${i <= Math.round(n) ? 'on' : ''}">${this.icon('star', size)}</span>`;
    return out + '</span>';
  },
  empty(icon, title, text, action = '') {
    return `<div class="empty"><div class="empty-ic">${this.icon(icon, 28)}</div><h4>${title}</h4><p>${text}</p>${action}</div>`;
  },

  /** Lifecycle stepper showing where the project is in the service flow */
  stepper(p, compact = false) {
    const cur = STATUS_STAGE[p.status];
    const hadRevision = Store.where('revisions', r => r.projectId === p.id).length > 0;
    return (
      `<ol class="stepper ${compact ? 'compact' : ''}">` +
      LIFECYCLE.map((label, i) => {
        let state = i < cur ? 'done' : i === cur ? 'current' : 'todo';
        if (p.status === 'Delivered' && i === cur) state = 'done';
        if (label === 'Revision' && i < cur && !hadRevision) state = 'skipped';
        return `<li class="step ${state}" title="${label}"><span class="dot">${state === 'done' ? this.icon('check', 12) : state === 'skipped' ? '–' : i + 1}</span><span class="lbl">${label}</span></li>`;
      }).join('') +
      '</ol>'
    );
  },

  /* ---------- Toast ---------- */
  toast(msg, type = 'success') {
    const wrap = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = 'toast t-' + type;
    el.innerHTML =
      this.icon(type === 'error' ? 'alert' : type === 'info' ? 'info' : 'check', 18) +
      `<span>${this.esc(msg)}</span>`;
    wrap.appendChild(el);
    setTimeout(() => el.classList.add('out'), 3200);
    setTimeout(() => el.remove(), 3600);
  },

  /* ---------- Modal ---------- */
  modal({
    title,
    subtitle = '',
    body,
    submit = 'Save',
    submitClass = 'btn-primary',
    onSubmit,
    size = '',
    hideFooter = false,
    onOpen,
  }) {
    this.closeModal();
    const root = document.getElementById('modal-root');
    root.innerHTML = `
      <div class="modal-backdrop" data-close></div>
      <div class="modal ${size}" role="dialog" aria-modal="true" aria-label="${this.esc(title)}">
        <form id="modal-form" novalidate>
          <header class="modal-head">
            <div><h3>${title}</h3>${subtitle ? `<p>${subtitle}</p>` : ''}</div>
            <button type="button" class="icon-btn" data-close aria-label="Close">${this.icon('x')}</button>
          </header>
          <div class="modal-body">${body}</div>
          ${
            hideFooter
              ? ''
              : `<footer class="modal-foot">
            <button type="button" class="btn btn-ghost" data-close>Cancel</button>
            <button type="submit" class="btn ${submitClass}">${submit}</button>
          </footer>`
          }
        </form>
      </div>`;
    root.classList.add('open');
    root
      .querySelectorAll('[data-close]')
      .forEach(el => el.addEventListener('click', () => this.closeModal()));
    const form = root.querySelector('#modal-form');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      // simple required-field validation with inline messages
      let ok = true;
      form.querySelectorAll('[required]').forEach(f => {
        const bad = !String(f.value).trim();
        f.closest('.field')?.classList.toggle('invalid', bad);
        if (bad) ok = false;
      });
      if (!ok) {
        this.toast('Please fill in the required fields.', 'error');
        return;
      }
      const data = Object.fromEntries(new FormData(form).entries());
      if (onSubmit) {
        const res = await onSubmit(data, form);
        if (res !== false) this.closeModal();
      } else this.closeModal();
    });
    const first = form.querySelector(
      'input:not([type=hidden]):not([type=radio]), textarea, select'
    );
    if (first) setTimeout(() => first.focus(), 60);
    if (onOpen) onOpen(form);
  },
  closeModal() {
    const root = document.getElementById('modal-root');
    if (root) {
      root.classList.remove('open');
      root.innerHTML = '';
    }
  },
  confirm({ title, message, confirm = 'Confirm', danger = false, onConfirm }) {
    this.modal({
      title,
      body: `<p class="confirm-msg">${message}</p>`,
      submit: confirm,
      submitClass: danger ? 'btn-danger' : 'btn-primary',
      onSubmit: onConfirm,
      size: 'sm',
    });
  },

  /* ---------- Form field builders ---------- */
  field(label, input, hint = '', cls = '') {
    return `<label class="field ${cls}"><span class="field-label">${label}</span>${input}${hint ? `<small class="hint">${hint}</small>` : ''}<small class="err">This field is required</small></label>`;
  },
  select(name, options, value, attrs = '') {
    return (
      `<select name="${name}" ${attrs}>` +
      options
        .map(o => {
          const [v, l] = Array.isArray(o) ? o : [o, o];
          return `<option value="${this.esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${this.esc(l)}</option>`;
        })
        .join('') +
      '</select>'
    );
  },
};

/* =========================================================
   CHARTS — lightweight responsive SVG charts
   ========================================================= */
const Charts = {
  donut(data, { center = '', sub = '', size = 168, thickness = 22 } = {}) {
    const total = data.reduce((a, d) => a + d.value, 0) || 1;
    const r = (size - thickness) / 2,
      c = 2 * Math.PI * r;
    let offset = 0;
    const arcs = data
      .filter(d => d.value > 0)
      .map(d => {
        const len = (d.value / total) * c;
        const seg = `<circle r="${r}" cx="${size / 2}" cy="${size / 2}" fill="none" stroke="${d.color}" stroke-width="${thickness}"
        stroke-dasharray="${Math.max(len - 2, 0.1)} ${c}" stroke-dashoffset="${-offset}" class="arc"><title>${UI.esc(d.label)}: ${d.value}</title></circle>`;
        offset += len;
        return seg;
      })
      .join('');
    const legend = data
      .map(
        d =>
          `<li><i style="background:${d.color}"></i><span>${UI.esc(d.label)}</span><b>${d.value}</b></li>`
      )
      .join('');
    return `<div class="donut-wrap">
      <div class="donut" style="width:${size}px;height:${size}px">
        <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><g transform="rotate(-90 ${size / 2} ${size / 2})">
          <circle r="${r}" cx="${size / 2}" cy="${size / 2}" fill="none" stroke="var(--track)" stroke-width="${thickness}"/>${arcs}</g></svg>
        <div class="donut-center"><b>${center}</b><span>${sub}</span></div>
      </div>
      <ul class="legend">${legend}</ul></div>`;
  },

  bars(data, { unit = '', max, height = 200, decimals = 0 } = {}) {
    const m = max || Math.max(1, ...data.map(d => d.value));
    return (
      `<div class="vbars" style="--h:${height}px">` +
      data
        .map(
          (d, i) => `
      <div class="vbar" title="${UI.esc(d.label)}: ${d.value.toFixed(decimals)}${unit}">
        <span class="vbar-val">${d.value.toFixed(decimals)}${unit}</span>
        <div class="vbar-track"><div class="vbar-fill" style="height:${(d.value / m) * 100}%;background:${d.color || 'var(--primary)'};animation-delay:${i * 60}ms"></div></div>
        <span class="vbar-lbl">${UI.esc(d.label)}</span>
      </div>`
        )
        .join('') +
      '</div>'
    );
  },

  hbars(rows, { legend = [] } = {}) {
    const max = Math.max(1, ...rows.map(r => r.segments.reduce((a, s) => a + s.value, 0)));
    return (
      `<div class="hbars">` +
      rows
        .map(r => {
          const total = r.segments.reduce((a, s) => a + s.value, 0);
          return `<div class="hbar-row">
        <div class="hbar-lbl">${r.label}</div>
        <div class="hbar-track">${r.segments
          .filter(s => s.value)
          .map(
            s =>
              `<span style="width:${(s.value / max) * 100}%;background:${s.color}" title="${UI.esc(s.label)}: ${s.value}"></span>`
          )
          .join('')}</div>
        <div class="hbar-total">${total}</div></div>`;
        })
        .join('') +
      `</div>` +
      (legend.length
        ? `<ul class="legend inline">${legend.map(l => `<li><i style="background:${l.color}"></i><span>${l.label}</span></li>`).join('')}</ul>`
        : '')
    );
  },

  line(points, { color = 'var(--primary)', height = 180 } = {}) {
    const w = 560,
      h = height,
      pad = 28;
    const max = Math.max(1, ...points.map(p => p.value));
    const step = (w - pad * 2) / Math.max(1, points.length - 1);
    const xy = points.map((p, i) => [pad + i * step, h - pad - (p.value / max) * (h - pad * 2)]);
    const path = xy
      .map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1))
      .join(' ');
    const area = path + ` L ${xy[xy.length - 1][0]} ${h - pad} L ${xy[0][0]} ${h - pad} Z`;
    const grid = [0, 0.5, 1]
      .map(
        f =>
          `<line x1="${pad}" x2="${w - pad}" y1="${h - pad - f * (h - pad * 2)}" y2="${h - pad - f * (h - pad * 2)}" class="grid"/>`
      )
      .join('');
    return `<svg class="line-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="height:${h}px">
      <defs><linearGradient id="lg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      ${grid}<path d="${area}" fill="url(#lg)"/><path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" class="line-path"/>
      ${xy
        .map(
          (
            p,
            i
          ) => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="var(--surface)" stroke="${color}" stroke-width="2"><title>${points[i].label}: ${points[i].value}</title></circle>
      <text x="${p[0]}" y="${h - 8}" text-anchor="middle" class="axis">${points[i].label}</text>
      <text x="${p[0]}" y="${p[1] - 10}" text-anchor="middle" class="val">${points[i].value}</text>`
        )
        .join('')}
    </svg>`;
  },

  gauge(value, { label = '' } = {}) {
    const r = 70,
      c = Math.PI * r,
      v = Math.max(0, Math.min(100, value));
    const color = v >= 80 ? 'var(--green)' : v >= 60 ? 'var(--amber)' : 'var(--red)';
    const grade = v >= 85 ? 'Excellent' : v >= 70 ? 'Good' : v >= 55 ? 'Fair' : 'Needs attention';
    return `<div class="gauge">
      <svg viewBox="0 0 180 104" width="100%"><path d="M20 94 A70 70 0 0 1 160 94" fill="none" stroke="var(--track)" stroke-width="16" stroke-linecap="round"/>
      <path d="M20 94 A70 70 0 0 1 160 94" fill="none" stroke="${color}" stroke-width="16" stroke-linecap="round" stroke-dasharray="${(v / 100) * c} ${c}" class="gauge-arc"/></svg>
      <div class="gauge-val"><b>${v}</b><span>${label || grade}</span></div></div>`;
  },
};
