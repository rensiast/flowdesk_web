/* =========================================================
   FlowDesk — App Controller
   Auth, hash routing, layout shell, notifications, search.
   ========================================================= */

const NAV = {
  admin: [
    ['dashboard', 'Dashboard', 'grid'],
    ['requests', 'Requests', 'inbox'],
    ['projects', 'Projects', 'folder'],
    ['clients', 'Clients', 'users'],
    ['services', 'Services', 'layers'],
    ['staff', 'Team', 'userCheck'],
    ['reports', 'Reports', 'chart'],
  ],
  staff: [
    ['dashboard', 'My Dashboard', 'grid'],
    ['projects', 'My Projects', 'folder'],
  ],
  client: [
    ['dashboard', 'Overview', 'grid'],
    ['projects', 'My Projects', 'folder'],
    ['requests', 'Requests', 'inbox'],
  ],
};
const ROLE_LABEL = { admin: 'Agency Manager', staff: 'Agency Staff', client: 'Client' };
const ROUTE_ACCESS = {
  dashboard: ['admin', 'staff', 'client'],
  projects: ['admin', 'staff', 'client'],
  project: ['admin', 'staff', 'client'],
  requests: ['admin', 'client'],
  clients: ['admin'],
  client: ['admin'],
  services: ['admin'],
  staff: ['admin'],
  reports: ['admin'],
};

const App = {
  user: null,
  theme: 'light',
  route: { page: 'dashboard', id: null },
  state: {
    reqTab: 'All',
    projView: 'list',
    filters: { q: '', status: '', service: '', staff: '' },
  },

  init() {
    Store.load();
    try {
      this.theme =
        localStorage.getItem('flowdesk_theme') ||
        (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } catch (e) {}
    document.documentElement.dataset.theme = this.theme;
    let uidSaved = null;
    try {
      uidSaved = sessionStorage.getItem('flowdesk_session');
    } catch (e) {}
    this.user = uidSaved ? Store.user(uidSaved) : null;

    window.addEventListener('hashchange', () => this.render());
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        UI.closeModal();
        this.closePanels();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && this.user) {
        e.preventDefault();
        this.openSearch();
      }
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.dropdown') && !e.target.closest('[data-dd]')) this.closePanels();
    });
    this.render();
  },

  /* ---------- Auth ---------- */
  login(email, password) {
    const u = Store.all('users').find(
      x => x.email.toLowerCase() === String(email).trim().toLowerCase() && x.password === password
    );
    const err = document.getElementById('login-error');
    if (!u) {
      if (err) {
        err.hidden = false;
        err.textContent = 'Invalid email or password.';
      }
      return;
    }
    this.setUser(u);
  },
  setUser(u) {
    this.user = u;
    try {
      sessionStorage.setItem('flowdesk_session', u.id);
    } catch (e) {}
    this.state.filters = { q: '', status: '', service: '', staff: '' };
    this.state.reqTab = 'All';
    if (location.hash === '#/dashboard') this.render();
    else location.hash = '#/dashboard';
    UI.toast(`Signed in as ${u.name} (${ROLE_LABEL[u.role]})`, 'info');
  },
  logout() {
    this.user = null;
    try {
      sessionStorage.removeItem('flowdesk_session');
    } catch (e) {}
    location.hash = '';
    this.render();
  },

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = this.theme;
    try {
      localStorage.setItem('flowdesk_theme', this.theme);
    } catch (e) {}
    this.render();
  },

  /* ---------- Routing + render ---------- */
  parseHash() {
    const [page, id] = location.hash.replace(/^#\/?/, '').split('/');
    return { page: page || 'dashboard', id: id || null };
  },

  render() {
    const root = document.getElementById('app');
    if (!this.user) {
      root.innerHTML = Views.landing();
      root.className = 'is-landing';
      window.scrollTo(0, 0);
      return;
    }
    this.user = Store.user(this.user.id) || this.user;
    const prevPage = this.route.page + this.route.id;
    this.route = this.parseHash();
    const { page, id } = this.route;

    if (!document.getElementById('shell')) root.innerHTML = this.shell();
    root.className = '';
    this.updateShell();

    let html;
    if (!ROUTE_ACCESS[page] || !ROUTE_ACCESS[page].includes(this.user.role))
      html = Views.notFound();
    else if (page === 'dashboard')
      html = {
        admin: Views.adminDashboard,
        staff: Views.staffDashboard,
        client: Views.clientDashboard,
      }[this.user.role]();
    else if (page === 'project') html = Views.project(id);
    else if (page === 'client') html = Views.client(id);
    else html = Views[page]();

    const main = document.getElementById('view');
    main.innerHTML = `<div class="view-inner">${html}</div>`;
    if (page === 'projects') Views.renderProjectResults();
    if (prevPage !== page + id) {
      main.scrollTop = 0;
      window.scrollTo(0, 0);
    }
    document.body.classList.remove('nav-open');
    const titles = {
      dashboard: 'Dashboard',
      requests: 'Requests',
      projects: 'Projects',
      project: 'Project',
      clients: 'Clients',
      client: 'Client',
      services: 'Services',
      staff: 'Team',
      reports: 'Reports',
    };
    document.title = `${titles[page] || 'FlowDesk'} · FlowDesk`;
  },

  shell() {
    return `<div id="shell" class="shell">
      <aside class="sidebar">
        <div class="brand">${Views.logo()}<span>FlowDesk</span></div>
        <div class="role-chip" id="role-chip"></div>
        <nav id="nav"></nav>
        <div class="side-foot">
          <div class="side-tip">${UI.icon('zap', 14)}<span>Press <kbd>Ctrl</kbd> + <kbd>K</kbd> to search anything</span></div>
        </div>
      </aside>
      <div class="nav-scrim" onclick="document.body.classList.remove('nav-open')"></div>
      <div class="main-col">
        <header class="topbar">
          <button class="icon-btn only-mobile" onclick="document.body.classList.toggle('nav-open')" aria-label="Menu">${UI.icon('menu')}</button>
          <button class="search-trigger" onclick="App.openSearch()">${UI.icon('search', 16)}<span>Search projects, clients, requests…</span><kbd>Ctrl K</kbd></button>
          <div class="top-actions">
            <button class="icon-btn" id="theme-btn" onclick="App.toggleTheme()" aria-label="Toggle dark mode"></button>
            <div class="dd-wrap"><button class="icon-btn" data-dd onclick="App.togglePanel('notif')" aria-label="Notifications" id="bell"></button><div class="dropdown notif-panel" id="notif-panel"></div></div>
            <div class="dd-wrap"><button class="user-btn" data-dd onclick="App.togglePanel('user')" id="user-btn"></button><div class="dropdown user-panel" id="user-panel"></div></div>
          </div>
        </header>
        <main id="view" class="view"></main>
      </div>
    </div>`;
  },

  updateShell() {
    const u = this.user;
    const pendingReqs = Store.where('requests', r => r.status === 'Pending').length;
    const clientReview = Store.where(
      'projects',
      p => p.clientId === u.clientId && p.status === 'Client Review'
    ).length;
    const staffRevs = Store.where(
      'projects',
      p => p.staffId === u.id && p.status === 'Revision'
    ).length;
    const badge =
      {
        admin: { requests: pendingReqs },
        client: { projects: clientReview },
        staff: { projects: staffRevs },
      }[u.role] || {};
    const active =
      this.route.page === 'project'
        ? 'projects'
        : this.route.page === 'client'
          ? 'clients'
          : this.route.page;

    document.getElementById('nav').innerHTML = NAV[u.role]
      .map(
        ([key, label, icn]) =>
          `<a href="#/${key}" class="nav-link ${active === key ? 'active' : ''}">${UI.icon(icn, 18)}<span>${label}</span>${badge[key] ? `<em>${badge[key]}</em>` : ''}</a>`
      )
      .join('');
    document.getElementById('role-chip').innerHTML =
      `<span class="rc-dot r-${u.role}"></span>${ROLE_LABEL[u.role]}${u.role === 'client' ? ' Portal' : ''}`;
    document.getElementById('theme-btn').innerHTML = UI.icon(
      this.theme === 'dark' ? 'sun' : 'moon'
    );

    const notes = this.myNotifications();
    const unread = notes.filter(n => !n.read).length;
    document.getElementById('bell').innerHTML =
      UI.icon('bell') +
      (unread ? `<span class="bell-dot">${unread > 9 ? '9+' : unread}</span>` : '');
    document.getElementById('notif-panel').innerHTML =
      `<header><b>Notifications</b>${unread ? `<button class="link" onclick="App.markAllRead()">Mark all read</button>` : ''}</header>
      <ul>${
        notes.length
          ? notes
              .slice(0, 12)
              .map(
                n =>
                  `<li class="${n.read ? '' : 'unread'}" onclick="App.openNotification('${n.id}')"><span class="n-dot"></span><div><p>${UI.esc(n.text)}</p><small>${UI.ago(n.at)}</small></div></li>`
              )
              .join('')
          : '<li class="none">You\'re all caught up!</li>'
      }</ul>`;

    document.getElementById('user-btn').innerHTML =
      `${UI.avatar(u, 32)}<span class="ub-text"><b>${UI.esc(u.name)}</b><small>${UI.esc(u.title)}</small></span>${UI.icon('chevronDown', 16)}`;
    document.getElementById('user-panel').innerHTML =
      `<div class="up-head">${UI.avatar(u, 40)}<div><b>${UI.esc(u.name)}</b><small>${UI.esc(u.email)}</small></div></div>
      <button onclick="App.resetDemo()">${UI.icon('refresh', 16)} Reset demo data</button>
      <button onclick="App.logout()" class="danger">${UI.icon('logout', 16)} Sign out</button>`;
  },

  /** Re-render after a data change */
  refresh() {
    this.render();
  },

  /* ---------- Panels ---------- */
  togglePanel(which) {
    const el = document.getElementById(which === 'notif' ? 'notif-panel' : 'user-panel');
    const open = el.classList.contains('open');
    this.closePanels();
    if (!open) el.classList.add('open');
  },
  closePanels() {
    document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
  },

  myNotifications() {
    return Store.where('notifications', n => n.userId === this.user.id).sort(
      (a, b) => new Date(b.at) - new Date(a.at)
    );
  },
  markAllRead() {
    this.myNotifications().forEach(n => (n.read = true));
    Store.save();
    this.updateShell();
    document.getElementById('notif-panel').classList.add('open');
  },
  openNotification(id) {
    const n = Store.get('notifications', id);
    n.read = true;
    Store.save();
    this.closePanels();
    if (location.hash === n.link) this.render();
    else location.hash = n.link;
  },

  resetDemo() {
    UI.confirm({
      title: 'Reset demo data?',
      message:
        'This restores the original sample clients, projects, deliverables and revisions. Any changes you made will be lost.',
      confirm: 'Reset data',
      danger: true,
      onConfirm: () => {
        Store.reset();
        this.user = Store.user(this.user.id);
        if (!this.user) return this.logout();
        this.render();
        UI.toast('Demo data restored.');
      },
    });
  },

  /* ---------- Global search (Ctrl+K) ---------- */
  openSearch() {
    UI.modal({
      title: 'Search',
      body: `<div class="search-input big">${UI.icon('search', 18)}<input id="gsearch" placeholder="Type a project, code, client or request…" autocomplete="off"></div><div id="gresults" class="gresults"></div>`,
      hideFooter: true,
      size: 'md',
      onOpen: form => {
        const input = form.querySelector('#gsearch');
        const run = () => this.runSearch(input.value);
        input.addEventListener('input', run);
        form.addEventListener(
          'submit',
          e => {
            e.preventDefault();
            const first = form.querySelector('.gr-item');
            if (first) first.click();
          },
          true
        );
        run();
      },
    });
  },
  runSearch(q) {
    q = q.trim().toLowerCase();
    const out = document.getElementById('gresults');
    const match = (...xs) => !q || xs.join(' ').toLowerCase().includes(q);
    const projects = visibleProjects()
      .filter(p =>
        match(p.title, p.code, Store.client(p.clientId)?.company, Store.user(p.staffId)?.name)
      )
      .slice(0, 6);
    const clients =
      this.user.role === 'admin'
        ? Store.all('clients')
            .filter(c => match(c.company, c.contact, c.email))
            .slice(0, 4)
        : [];
    const reqs =
      this.user.role !== 'staff'
        ? visibleRequests()
            .filter(
              r => r.status !== 'Converted' && match(r.title, Store.client(r.clientId)?.company)
            )
            .slice(0, 4)
        : [];
    const go = h => `onclick="UI.closeModal();location.hash='${h}'"`;
    let html = '';
    if (projects.length)
      html +=
        `<h5>Projects</h5>` +
        projects
          .map(
            p =>
              `<button type="button" class="gr-item" ${go('#/project/' + p.id)}>${UI.icon('folder', 16)}<span><b>${UI.esc(p.title)}</b><small>${p.code} · ${UI.esc(Store.client(p.clientId).company)}</small></span>${UI.badge(p.status)}</button>`
          )
          .join('');
    if (clients.length)
      html +=
        `<h5>Clients</h5>` +
        clients
          .map(
            c =>
              `<button type="button" class="gr-item" ${go('#/client/' + c.id)}>${UI.icon('briefcase', 16)}<span><b>${UI.esc(c.company)}</b><small>${UI.esc(c.contact)}</small></span></button>`
          )
          .join('');
    if (reqs.length)
      html +=
        `<h5>Requests</h5>` +
        reqs
          .map(
            r =>
              `<button type="button" class="gr-item" ${go('#/requests')}>${UI.icon('inbox', 16)}<span><b>${UI.esc(r.title)}</b><small>${UI.esc(Store.client(r.clientId).company)}</small></span>${UI.badge(r.status)}</button>`
          )
          .join('');
    out.innerHTML = html || `<p class="muted pad">No results for “${UI.esc(q)}”.</p>`;
  },
};

/* =========================================================
   ACTIONS — UI handlers that open forms and call Workflow
   ========================================================= */
const Act = {
  done(msg) {
    UI.toast(msg);
    App.refresh();
  },

  /* ----- Requests ----- */
  newRequest() {
    const services = Store.all('services');
    UI.modal({
      title: 'Request a new service',
      subtitle: 'Tell us what you need — our team will review it within one business day.',
      submit: `${UI.icon('send', 15)} Submit request`,
      size: 'lg',
      body: `
        <div class="svc-pick">${services.map((s, i) => `<label class="svc-opt" style="--c:${s.color}"><input type="radio" name="serviceId" value="${s.id}" ${i === 0 ? 'checked' : ''} onchange="Act._suggestDeadline(this.form)"><span>${UI.icon(s.icon, 20)}<b>${UI.esc(s.name)}</b><small>~${s.baseDays} days</small></span></label>`).join('')}</div>
        ${UI.field('Project title', '<input name="title" required placeholder="e.g. Summer menu poster series">')}
        ${UI.field('Description', '<textarea name="description" rows="3" required placeholder="What is the goal of this project? Who is the audience?"></textarea>')}
        ${UI.field('Requirements', '<textarea name="requirements" rows="2" placeholder="Formats, sizes, quantities, references…"></textarea>', 'Optional — the more detail, the fewer revisions.')}
        <div class="row-2">
          ${UI.field('Preferred deadline', `<input type="date" name="deadline" required min="${UI.inputDate()}" value="${UI.inputDate(daysFromNow(services[0].baseDays + 3))}">`, '', 'dl-field')}
          ${UI.field('Priority', UI.select('priority', PRIORITIES, 'Medium'))}
        </div>
        <p class="hint-box" id="dl-hint">${UI.icon('info', 14)} <span>Typical turnaround for ${UI.esc(services[0].name)} is ${services[0].baseDays} days.</span></p>`,
      onSubmit: d => {
        if (new Date(d.deadline) < startOfDay(new Date())) {
          UI.toast('Deadline cannot be in the past.', 'error');
          return false;
        }
        const r = Workflow.submitRequest(App.user, d);
        App.state.reqTab = 'All';
        if (location.hash !== '#/requests') location.hash = '#/requests';
        this.done(`Request “${r.title}” submitted! The agency will review it shortly.`);
      },
    });
  },
  _suggestDeadline(form) {
    const s = Store.service(form.serviceId.value);
    form.deadline.value = UI.inputDate(daysFromNow(s.baseDays + 3));
    form.querySelector('#dl-hint span').textContent =
      `Typical turnaround for ${s.name} is ${s.baseDays} days.`;
  },

  reviewRequest(id) {
    Workflow.markUnderReview(id, App.user);
    this.done('Request marked as under review. The client has been notified.');
  },

  rejectRequest(id) {
    const r = Store.get('requests', id);
    UI.modal({
      title: 'Decline request',
      subtitle: `“${UI.esc(r.title)}” from ${UI.esc(Store.client(r.clientId).company)}`,
      submit: 'Decline request',
      submitClass: 'btn-danger',
      size: 'sm',
      body: UI.field(
        'Reason (shared with the client)',
        '<textarea name="note" rows="3" required placeholder="e.g. Timeline too short — please resubmit with at least 7 days lead time."></textarea>'
      ),
      onSubmit: d => {
        Workflow.rejectRequest(id, App.user, d.note.trim());
        this.done('Request declined and client notified.');
      },
    });
  },

  /** Staff picker with workload + skill-based recommendation */
  _staffPicker(serviceId, selected) {
    const staff = Store.staff()
      .map(st => {
        const active = Store.where(
          'projects',
          p => p.staffId === st.id && !Metrics.isDone(p)
        ).length;
        const skill = (st.skills || []).includes(serviceId);
        return { st, active, skill, score: (skill ? 0 : 10) + active };
      })
      .sort((a, b) => a.score - b.score);
    const rec = staff[0];
    const sel = selected || rec.st.id;
    return `<div class="staff-pick">${staff
      .map(
        x => `<label class="staff-opt">
      <input type="radio" name="staffId" value="${x.st.id}" ${x.st.id === sel ? 'checked' : ''}>
      <span>${UI.avatar(x.st, 34)}<span class="so-txt"><b>${UI.esc(x.st.name)}</b><small>${UI.esc(x.st.title)}</small></span>
      <span class="so-load">${UI.progress(Math.min(100, x.active * 20), x.active >= 4 ? 'var(--red)' : x.active >= 2 ? 'var(--amber)' : 'var(--green)')}<small>${x.active} active</small></span>
      ${x === rec ? '<em class="rec">Recommended</em>' : x.skill ? '<em class="skill">Skill match</em>' : ''}</span></label>`
      )
      .join('')}</div>
      <p class="hint-box">${UI.icon('zap', 14)} <span>Recommendation is based on skill match with the service and current active workload.</span></p>`;
  },

  acceptRequest(id) {
    const r = Store.get('requests', id),
      c = Store.client(r.clientId),
      s = Store.service(r.serviceId);
    UI.modal({
      title: 'Accept & convert to project',
      subtitle: `${UI.esc(c.company)} · ${UI.esc(s ? s.name : '')}`,
      submit: `${UI.icon('check', 15)} Create project`,
      size: 'lg',
      body: `
        ${UI.field('Project title', `<input name="title" required value="${UI.esc(r.title)}">`)}
        <div class="row-2">
          ${UI.field('Deadline', `<input type="date" name="deadline" required value="${UI.inputDate(r.deadline)}">`, `Client requested ${UI.date(r.deadline)} · standard turnaround ${s ? s.baseDays : '?'} days`)}
          ${UI.field('Priority', UI.select('priority', PRIORITIES, r.priority))}
        </div>
        <span class="field-label">Assign to</span>
        ${this._staffPicker(r.serviceId)}`,
      onSubmit: d => {
        const p = Workflow.convertRequest(id, App.user, d);
        UI.toast(`Project ${p.code} created and assigned to ${Store.user(p.staffId).name}.`);
        location.hash = '#/project/' + p.id;
      },
    });
  },

  newProject() {
    const clients = Store.all('clients'),
      services = Store.all('services');
    UI.modal({
      title: 'New project',
      subtitle: 'Create a project directly (e.g. for requests received offline).',
      submit: 'Create project',
      size: 'lg',
      body: `
        <div class="row-2">${UI.field(
          'Client',
          UI.select(
            'clientId',
            clients.map(c => [c.id, c.company]),
            clients[0]?.id
          )
        )}
        ${UI.field(
          'Service',
          UI.select(
            'serviceId',
            services.map(s => [s.id, s.name]),
            services[0]?.id,
            'onchange="Act._refreshPicker(this.form)"'
          )
        )}</div>
        ${UI.field('Project title', '<input name="title" required placeholder="e.g. Website Redesign">')}
        ${UI.field('Description', '<textarea name="description" rows="2" placeholder="Short summary of the brief"></textarea>')}
        ${UI.field('Requirements', '<input name="requirements" placeholder="Formats, deliverables…">')}
        <div class="row-2">
          ${UI.field('Deadline', `<input type="date" name="deadline" required value="${UI.inputDate(daysFromNow(services[0]?.baseDays || 7))}">`)}
          ${UI.field('Priority', UI.select('priority', PRIORITIES, 'Medium'))}
        </div>
        <span class="field-label">Assign to</span><div id="picker">${this._staffPicker(services[0]?.id)}</div>`,
      onSubmit: d => {
        if (!d.staffId) {
          UI.toast('Please choose a staff member.', 'error');
          return false;
        }
        const p = Workflow.createProject(App.user, d);
        UI.toast(`Project ${p.code} created.`);
        location.hash = '#/project/' + p.id;
      },
    });
  },
  _refreshPicker(form) {
    const s = Store.service(form.serviceId.value);
    form.querySelector('#picker').innerHTML = this._staffPicker(s.id);
    form.deadline.value = UI.inputDate(daysFromNow(s.baseDays));
  },

  editAssignment(pid) {
    const p = Store.project(pid);
    UI.modal({
      title: 'Edit assignment',
      subtitle: `${p.code} · ${UI.esc(p.title)}`,
      size: 'lg',
      body: `<div class="row-2">
          ${UI.field('Deadline', `<input type="date" name="deadline" required value="${UI.inputDate(p.deadline)}">`)}
          ${UI.field('Priority', UI.select('priority', PRIORITIES, p.priority))}</div>
        <span class="field-label">Assigned staff</span>${this._staffPicker(p.serviceId, p.staffId)}`,
      onSubmit: d => {
        Workflow.updateAssignment(pid, App.user, d);
        this.done('Assignment updated.');
      },
    });
  },

  /* ----- Delivery ----- */
  startWork(pid) {
    Workflow.startWork(pid, App.user);
    this.done('Work started — the client has been notified.');
  },
  setProgress(pid, v) {
    Workflow.updateProgress(pid, App.user, +v);
    this.done(`Progress updated to ${v}%.`);
  },

  submitDeliverable(pid) {
    const p = Store.project(pid);
    const version = Store.where('deliverables', d => d.projectId === pid).length + 1;
    const openRev = Store.where('revisions', r => r.projectId === pid && r.status === 'Open')[0];
    UI.modal({
      title: `Submit deliverable — v${version}`,
      subtitle: `${p.code} · ${UI.esc(p.title)}`,
      submit: `${UI.icon('send', 15)} Submit for client review`,
      size: 'lg',
      body: `
        ${openRev ? `<div class="rev-callout">${UI.icon('repeat', 16)}<div><b>Addressing revision #${openRev.number}</b><p>“${UI.esc(openRev.feedback)}”</p>${openRev.changes.length ? `<ul class="changes">${openRev.changes.map(c => `<li>${UI.esc(c)}</li>`).join('')}</ul>` : ''}</div></div>` : ''}
        ${UI.field('Title', `<input name="title" required value="${UI.esc(Store.service(p.serviceId)?.name || 'Deliverable')} — Version ${version}">`)}
        ${UI.field('Notes for the client', `<textarea name="notes" rows="3" placeholder="What's included in this version?">${version === 1 ? 'Initial draft based on the approved brief.' : ''}</textarea>`)}
        ${openRev ? UI.field('Response to feedback', '<textarea name="response" rows="2" required placeholder="Describe how each requested change was addressed."></textarea>') : ''}
        <label class="dropzone" id="dz">
          <input type="file" name="file" onchange="Act._fileChosen(this)">
          ${UI.icon('upload', 26)}<b>Click to upload or drag a file here</b><small>Images up to 2 MB are stored for preview. Other files are recorded by name & size.</small>
          <span class="dz-file" id="dz-file"></span>
        </label>
        ${UI.field('Or share a link', '<input name="link" type="url" placeholder="https://drive.google.com/… or Figma / Vimeo link">', 'Optional')}`,
      onOpen: form => {
        const dz = form.querySelector('#dz');
        ['dragenter', 'dragover'].forEach(ev =>
          dz.addEventListener(ev, e => {
            e.preventDefault();
            dz.classList.add('over');
          })
        );
        ['dragleave', 'drop'].forEach(ev =>
          dz.addEventListener(ev, e => {
            e.preventDefault();
            dz.classList.remove('over');
          })
        );
        dz.addEventListener('drop', e => {
          if (e.dataTransfer.files.length) {
            dz.querySelector('input').files = e.dataTransfer.files;
            this._fileChosen(dz.querySelector('input'));
          }
        });
      },
      onSubmit: async d => {
        const file = d.file instanceof File && d.file.size ? d.file : null;
        if (!file && !d.link) {
          UI.toast('Please attach a file or share a link.', 'error');
          return false;
        }
        let fileData = null;
        if (file && file.size <= 2 * 1024 * 1024 && file.type.startsWith('image/')) {
          fileData = await new Promise(res => {
            const fr = new FileReader();
            fr.onload = () => res(fr.result);
            fr.onerror = () => res(null);
            fr.readAsDataURL(file);
          });
        }
        Workflow.submitDeliverable(pid, App.user, {
          title: d.title,
          notes: d.notes,
          link: d.link,
          response: d.response,
          fileName: file ? file.name : '',
          fileSize: file ? file.size : 0,
          fileType: file ? file.type : '',
          fileData,
        });
        this.done(`Version ${version} submitted — the client has been notified to review it.`);
      },
    });
  },
  _fileChosen(input) {
    const f = input.files[0];
    document.getElementById('dz-file').innerHTML = f
      ? `${UI.icon('file', 14)} ${UI.esc(f.name)} · ${UI.fileSize(f.size)}`
      : '';
    input.closest('.dropzone').classList.toggle('has-file', !!f);
  },

  approve(did) {
    const d = Store.get('deliverables', did),
      p = Store.project(d.projectId);
    UI.modal({
      title: `Approve version ${d.version}?`,
      subtitle: UI.esc(p.title),
      submit: `${UI.icon('check', 15)} Approve deliverable`,
      submitClass: 'btn-success',
      size: 'sm',
      body: `<p class="confirm-msg">Approving confirms this deliverable meets your requirements. The agency will then prepare the final delivery.</p>
        <label class="check"><input type="checkbox" name="confirm" required value="yes"><span>I confirm version ${d.version} is approved as final.</span></label>`,
      onSubmit: data => {
        if (!data.confirm) {
          UI.toast('Please tick the confirmation box.', 'error');
          return false;
        }
        Workflow.approveDeliverable(did, App.user);
        this.done('Deliverable approved — thank you! The team has been notified.');
      },
    });
  },

  requestRevision(did) {
    const d = Store.get('deliverables', did),
      p = Store.project(d.projectId);
    const n = Store.where('revisions', r => r.projectId === p.id).length + 1;
    UI.modal({
      title: `Request revision #${n}`,
      subtitle: `On version ${d.version} of “${UI.esc(p.title)}”`,
      submit: `${UI.icon('send', 15)} Send revision request`,
      size: 'md',
      body: `
        ${n >= 3 ? `<p class="hint-box warn">${UI.icon('alert', 14)} <span>This will be revision #${n}. The agency manager will also be notified so they can schedule a quick call if needed.</span></p>` : ''}
        ${UI.field('Overall feedback', '<textarea name="feedback" rows="3" required placeholder="What would you like to change, and why?"></textarea>')}
        ${UI.field('Specific changes (one per line)', '<textarea name="changes" rows="4" placeholder="Make the logo larger\nUse our brand blue for the header\nFix typo in the second paragraph"></textarea>', 'Clear, itemized changes help the team get it right in the next version.')}`,
      onSubmit: data => {
        const changes = (data.changes || '')
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean);
        Workflow.requestRevision(did, App.user, { feedback: data.feedback.trim(), changes });
        this.done(`Revision #${n} sent to ${Store.user(p.staffId).name}.`);
      },
    });
  },

  deliver(pid) {
    const p = Store.project(pid);
    UI.confirm({
      title: 'Mark as delivered?',
      message: `This completes <b>${UI.esc(p.title)}</b>, hands over the final files and asks the client to rate the service. The full service history is preserved.`,
      confirm: 'Mark delivered',
      onConfirm: () => {
        Workflow.markDelivered(pid, App.user);
        this.done('Project delivered! The client has been asked for a rating.');
      },
    });
  },

  rate(pid) {
    const p = Store.project(pid);
    UI.modal({
      title: 'Rate this service',
      subtitle: UI.esc(p.title),
      submit: 'Submit rating',
      size: 'sm',
      body: `<div class="star-input">${[5, 4, 3, 2, 1].map(n => `<input type="radio" name="rating" id="st${n}" value="${n}" ${n === 5 ? 'checked' : ''}><label for="st${n}" title="${n} star${n > 1 ? 's' : ''}">${UI.icon('star', 30)}</label>`).join('')}</div>
        ${UI.field('Comments', '<textarea name="comment" rows="3" placeholder="What went well? What could be better?"></textarea>', 'Optional')}`,
      onSubmit: d => {
        Workflow.rateProject(pid, App.user, +d.rating, d.comment.trim());
        this.done('Thank you for your feedback!');
      },
    });
  },

  preview(did) {
    const d = Store.get('deliverables', did);
    UI.modal({
      title: UI.esc(d.fileName),
      subtitle: `Version ${d.version}`,
      body: `<img class="preview-img" src="${d.fileData}" alt="">`,
      hideFooter: true,
      size: 'lg',
    });
  },

  /* ----- Directory ----- */
  clientForm(id) {
    const c = id ? Store.client(id) : {};
    UI.modal({
      title: id ? 'Edit client' : 'Add client',
      subtitle: id ? '' : 'A client portal account will be created automatically.',
      size: 'md',
      body: `${UI.field('Company name', `<input name="company" required value="${UI.esc(c.company || '')}">`)}
        <div class="row-2">${UI.field('Contact person', `<input name="contact" required value="${UI.esc(c.contact || '')}">`)}
        ${UI.field('Industry', `<input name="industry" value="${UI.esc(c.industry || '')}" placeholder="e.g. Retail">`)}</div>
        <div class="row-2">${UI.field('Email (portal login)', `<input name="email" type="email" required value="${UI.esc(c.email || '')}">`)}
        ${UI.field('Phone', `<input name="phone" value="${UI.esc(c.phone || '')}">`)}</div>
        ${id ? '' : UI.field('Portal password', '<input name="password" value="demo123">', 'Share this with the client.')}`,
      onSubmit: d => {
        if (
          Store.all('users').some(
            u => u.email.toLowerCase() === d.email.toLowerCase() && u.clientId !== id
          )
        ) {
          UI.toast('That email is already in use.', 'error');
          return false;
        }
        Workflow.saveClient(d, id);
        this.done(id ? 'Client updated.' : `Client “${d.company}” added with portal access.`);
      },
    });
  },

  serviceForm(id) {
    const s = id ? Store.service(id) : { color: '#1f7fa8', icon: 'pen', baseDays: 7 };
    const icons = ['pen', 'code', 'film', 'present', 'share', 'box', 'layers', 'zap'];
    UI.modal({
      title: id ? 'Edit service' : 'Add service',
      size: 'md',
      body: `${UI.field('Service name', `<input name="name" required value="${UI.esc(s.name || '')}">`)}
        ${UI.field('Description', `<textarea name="description" rows="2" required>${UI.esc(s.description || '')}</textarea>`)}
        <div class="row-2">${UI.field('Standard turnaround (days)', `<input name="baseDays" type="number" min="1" max="120" required value="${s.baseDays}">`)}
        ${UI.field('Color', `<input name="color" type="color" value="${s.color}">`)}</div>
        <span class="field-label">Icon</span><div class="icon-pick">${icons.map(i => `<label><input type="radio" name="icon" value="${i}" ${i === s.icon ? 'checked' : ''}><span>${UI.icon(i, 20)}</span></label>`).join('')}</div>`,
      onSubmit: d => {
        Workflow.saveService(d, id);
        this.done(id ? 'Service updated.' : 'Service added to catalog.');
      },
    });
  },

  deleteService(id) {
    const s = Store.service(id);
    const used =
      Store.where('projects', p => p.serviceId === id).length +
      Store.where('requests', r => r.serviceId === id).length;
    if (used) {
      UI.toast(
        `“${s.name}” is used by ${used} project(s)/request(s) and can't be deleted.`,
        'error'
      );
      return;
    }
    UI.confirm({
      title: 'Delete service?',
      message: `Remove <b>${UI.esc(s.name)}</b> from the catalog?`,
      confirm: 'Delete',
      danger: true,
      onConfirm: () => {
        Workflow.deleteService(id);
        this.done('Service deleted.');
      },
    });
  },

  staffForm(id) {
    const st = id ? Store.user(id) : {};
    UI.modal({
      title: id ? 'Edit staff member' : 'Add staff member',
      size: 'md',
      body: `${UI.field('Full name', `<input name="name" required value="${UI.esc(st.name || '')}">`)}
        ${UI.field('Job title', `<input name="title" required value="${UI.esc(st.title || '')}" placeholder="e.g. Motion Designer">`)}
        ${UI.field('Email (login)', `<input name="email" type="email" required value="${UI.esc(st.email || '')}">`)}
        ${id ? '' : UI.field('Password', '<input name="password" value="demo123">')}`,
      onSubmit: d => {
        if (
          Store.all('users').some(
            u => u.email.toLowerCase() === d.email.toLowerCase() && u.id !== id
          )
        ) {
          UI.toast('That email is already in use.', 'error');
          return false;
        }
        Workflow.saveStaff(d, id);
        this.done(id ? 'Staff updated.' : `${d.name} added to the team.`);
      },
    });
  },

  /* ----- Reports ----- */
  exportCSV() {
    const rows = [
      [
        'Code',
        'Project',
        'Client',
        'Service',
        'Staff',
        'Status',
        'Priority',
        'Created',
        'Deadline',
        'Completed',
        'Delivered',
        'Duration (days)',
        'Revisions',
        'On time',
        'Rating',
      ],
    ];
    Store.all('projects').forEach(p => {
      const ot = Metrics.wasOnTime(p);
      rows.push([
        p.code,
        p.title,
        Store.client(p.clientId)?.company,
        Store.service(p.serviceId)?.name,
        Store.user(p.staffId)?.name,
        p.status,
        p.priority,
        UI.inputDate(p.createdAt),
        UI.inputDate(p.deadline),
        p.completedAt ? UI.inputDate(p.completedAt) : '',
        p.deliveredAt ? UI.inputDate(p.deliveredAt) : '',
        Metrics.durationDays(p) ?? '',
        Metrics.revisionCount(p),
        ot === null ? '' : ot ? 'Yes' : 'No',
        p.rating || '',
      ]);
    });
    const csv = rows
      .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `flowdesk-report-${UI.inputDate()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    UI.toast('Report exported as CSV.');
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
