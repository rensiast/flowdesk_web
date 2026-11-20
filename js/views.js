/* =========================================================
   FlowDesk — Views
   Each view returns an HTML string rendered into <main>.
   ========================================================= */

const esc = (s) => UI.esc(s);
const ic = (n, s) => UI.icon(n, s);

/* ---------- shared helpers ---------- */
function visibleProjects() {
  const u = App.user;
  if (u.role === 'admin') return Store.all('projects');
  if (u.role === 'staff') return Store.where('projects', p => p.staffId === u.id);
  return Store.where('projects', p => p.clientId === u.clientId);
}
function visibleRequests() {
  const u = App.user;
  if (u.role === 'client') return Store.where('requests', r => r.clientId === u.clientId);
  return Store.all('requests');
}
function canSeeProject(p) { return p && visibleProjects().includes(p); }
const byDeadline = (a, b) => new Date(a.deadline) - new Date(b.deadline);
const byNewest = (k) => (a, b) => new Date(b[k]) - new Date(a[k]);

function pageHead(title, sub, actions = '') {
  return `<div class="page-head"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${actions ? `<div class="page-actions">${actions}</div>` : ''}</div>`;
}
function kpi(icon, label, value, sub = '', tone = '') {
  return `<div class="kpi ${tone}"><div class="kpi-ic">${ic(icon, 20)}</div><div class="kpi-body"><span class="kpi-label">${label}</span><b class="kpi-val">${value}</b>${sub ? `<span class="kpi-sub">${sub}</span>` : ''}</div></div>`;
}
function card(title, body, { icon = '', action = '', cls = '' } = {}) {
  return `<section class="card ${cls}"><header class="card-head"><h3>${icon ? ic(icon, 17) : ''}${title}</h3>${action}</header><div class="card-body">${body}</div></section>`;
}
function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }
function firstName(n) { return (n || '').split(' ')[0]; }

function nextAction(p) {
  const openRev = Store.where('revisions', r => r.projectId === p.id && r.status === 'Open')[0];
  switch (p.status) {
    case 'Assigned': return { label: 'Start work', icon: 'play', tone: 'blue' };
    case 'In Progress': return { label: 'Submit deliverable', icon: 'upload', tone: 'blue' };
    case 'Revision': return { label: `Address revision #${openRev ? openRev.number : ''}`, icon: 'repeat', tone: 'red' };
    case 'Client Review': return { label: 'Waiting for client', icon: 'clock', tone: 'amber' };
    case 'Approved': return { label: 'Mark as delivered', icon: 'send', tone: 'green' };
    default: return { label: 'Completed', icon: 'check', tone: 'muted' };
  }
}

function activityFeed(items, limit = 8, showProject = true) {
  if (!items.length) return UI.empty('activity', 'No activity yet', 'Updates will appear here as work progresses.');
  const typeIc = { request: 'inbox', create: 'folder', assign: 'userCheck', progress: 'trending', deliverable: 'upload', revision: 'repeat', approve: 'check', deliver: 'send', rating: 'star', info: 'info' };
  return `<ul class="feed">` + items.sort(byNewest('at')).slice(0, limit).map(a => {
    const u = Store.user(a.userId);
    const p = Store.project(a.projectId);
    return `<li class="feed-item t-${a.type}">
      <span class="feed-ic">${ic(typeIc[a.type] || 'info', 14)}</span>
      <div><p><b>${esc(u ? u.name : 'System')}</b> ${esc(a.text.charAt(0).toLowerCase() + a.text.slice(1))}</p>
      <small>${showProject && p ? `<a href="#/project/${p.id}">${esc(p.code)} · ${esc(p.title)}</a> · ` : ''}${UI.ago(a.at)}</small></div></li>`;
  }).join('') + '</ul>';
}

function projectRow(p, { showClient = true, showStaff = true } = {}) {
  const c = Store.client(p.clientId), s = Store.service(p.serviceId), st = Store.user(p.staffId);
  const revs = Metrics.revisionCount(p);
  return `<tr class="click-row" onclick="location.hash='#/project/${p.id}'">
    <td><div class="cell-title"><b>${esc(p.title)}</b><small>${esc(p.code)} · ${UI.priority(p.priority)}</small></div></td>
    ${showClient ? `<td>${esc(c ? c.company : '—')}</td>` : ''}
    <td>${UI.serviceTag(s)}</td>
    ${showStaff ? `<td><div class="who">${UI.avatar(st, 26)}<span>${esc(st ? st.name : '—')}</span></div></td>` : ''}
    <td><div class="cell-title"><span>${UI.dateShort(p.deadline)}</span>${UI.health(p)}</div></td>
    <td>${UI.badge(p.status)}</td>
    <td class="w-progress">${UI.progress(p.progress, STATUS_COLORS[p.status])}<small>${p.progress}%</small></td>
    <td class="t-center"><span class="rev-count ${revs >= 3 ? 'hot' : ''}">${revs}</span></td>
  </tr>`;
}
function projectTable(list, opts = {}) {
  if (!list.length) return UI.empty('folder', 'No projects found', 'Try adjusting your filters.');
  const { showClient = true, showStaff = true } = opts;
  return `<div class="table-wrap"><table class="table">
    <thead><tr><th>Project</th>${showClient ? '<th>Client</th>' : ''}<th>Service</th>${showStaff ? '<th>Assignee</th>' : ''}<th>Deadline</th><th>Status</th><th>Progress</th><th class="t-center">Revs</th></tr></thead>
    <tbody>${list.map(p => projectRow(p, opts)).join('')}</tbody></table></div>`;
}

/* =========================================================
   LANDING + LOGIN
   ========================================================= */
const Views = {};

Views.landing = function () {
  const steps = LIFECYCLE.map((s, i) => `<div class="flow-step" style="--d:${i * 90}ms"><span>${i + 1}</span>${s}</div>`).join(`<div class="flow-arrow">${ic('chevronRight', 16)}</div>`);
  const features = [
    ['inbox', 'Service Request Intake', 'Clients submit structured briefs with requirements, deadlines and priority — no more scattered emails.'],
    ['userCheck', 'Smart Assignment', 'Assign work to staff with a live workload view and skill-matched recommendations.'],
    ['repeat', 'Versioned Revisions', 'Every deliverable is versioned. Every piece of client feedback is tracked, numbered and resolved.'],
    ['check', 'Client Approval Portal', 'Clients review, approve or request changes on deliverables from their own portal.'],
    ['chart', 'Service Analytics', 'On-time rate, completion time, revision counts, staff workload and satisfaction at a glance.'],
    ['shield', 'Service Health Score', 'A single 0–100 indicator that blends delivery speed, quality and client satisfaction.'],
  ].map(f => `<div class="feature"><div class="feature-ic">${ic(f[0], 22)}</div><h4>${f[1]}</h4><p>${f[2]}</p></div>`).join('');

  return `
  <div class="landing">
    <nav class="land-nav">
      <div class="brand">${Views.logo()}<span>FlowDesk</span></div>
      <div class="land-links"><a href="#features" onclick="event.preventDefault();document.getElementById('features').scrollIntoView({behavior:'smooth'})">Features</a><a href="#workflow" onclick="event.preventDefault();document.getElementById('workflow').scrollIntoView({behavior:'smooth'})">Workflow</a><a href="#roles" onclick="event.preventDefault();document.getElementById('roles').scrollIntoView({behavior:'smooth'})">Roles</a>
      <button class="icon-btn" onclick="App.toggleTheme()" aria-label="Toggle theme">${ic(App.theme === 'dark' ? 'sun' : 'moon')}</button></div>
    </nav>

    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">${ic('zap', 14)} Creative Agency Service Management</span>
        <h1>Every creative service, <em>from brief to delivery.</em></h1>
        <p>FlowDesk centralizes client requests, project assignments, deliverables, revisions and approvals in one platform — so your agency always knows what's on track, what's late, and what's ready to ship.</p>
        <div class="hero-stats">
          <div><b>8</b><span>lifecycle stages</span></div>
          <div><b>3</b><span>user roles</span></div>
          <div><b>100%</b><span>revision traceability</span></div>
        </div>
      </div>

      <div class="login-card" id="login">
        <h2>Sign in to FlowDesk</h2>
        <p class="muted">Enter your email and password to continue.</p>
        <form id="login-form" onsubmit="event.preventDefault();App.login(this.email.value,this.password.value)">
          <label class="field"><span class="field-label">Email</span><input name="email" type="email" placeholder="you@flowdesk.test" autocomplete="username" required></label>
          <label class="field"><span class="field-label">Password</span><input name="password" type="password" placeholder="••••••••" autocomplete="current-password" required></label>
          <div id="login-error" class="form-error" hidden></div>
          <button class="btn btn-primary btn-block" type="submit">Sign in ${ic('arrowRight', 16)}</button>
        </form>
      </div>
    </section>

    <section class="land-section" id="workflow">
      <h2>One structured service lifecycle</h2>
      <p class="section-sub">Not just task tracking — FlowDesk follows each service from the client's first request through review, revision and final approval.</p>
      <div class="flow">${steps}</div>
    </section>

    <section class="land-section" id="features">
      <h2>Built for how creative agencies actually work</h2>
      <div class="features">${features}</div>
    </section>

    <section class="land-section" id="roles">
      <h2>Three roles, one source of truth</h2>
      <div class="roles">
        <div class="role"><div class="role-ic" style="--c:#e85002">${ic('briefcase', 22)}</div><h4>Agency Manager</h4><ul><li>Review & convert service requests</li><li>Assign staff, set deadlines & priorities</li><li>Manage clients and service catalog</li><li>Monitor performance & export reports</li></ul></div>
        <div class="role"><div class="role-ic" style="--c:#9c7653">${ic('pen', 22)}</div><h4>Agency Staff</h4><ul><li>See a prioritized work queue</li><li>Update progress on assigned projects</li><li>Upload versioned deliverables</li><li>Respond to revision requests</li></ul></div>
        <div class="role"><div class="role-ic" style="--c:#646464">${ic('users', 22)}</div><h4>Client</h4><ul><li>Submit new service requests</li><li>Track project progress live</li><li>Approve or request revisions</li><li>Rate the completed service</li></ul></div>
      </div>
    </section>

    <footer class="land-foot">${Views.logo()} FlowDesk — A Web-Based Creative Agency Service Management System · Built with HTML, CSS & JavaScript</footer>
  </div>`;
};

Views.logo = () => `<svg class="logo" viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><defs><linearGradient id="lgo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f16001"/><stop offset="1" stop-color="#c10801"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="url(#lgo)"/><path d="M9 10h14M9 16h10M9 22h6" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="22" cy="22" r="3" fill="#fff"/></svg>`;

/* =========================================================
   ADMIN DASHBOARD
   ========================================================= */
Views.adminDashboard = function () {
  const projects = Store.all('projects');
  const m = Metrics.summary(projects);
  const u = App.user;
  const pendingReqs = Store.where('requests', r => r.status === 'Pending' || r.status === 'Under Review');

  // charts data
  const byStatus = PROJECT_STATUSES.map(s => ({ label: s, value: projects.filter(p => p.status === s).length, color: STATUS_COLORS[s] }));
  const services = Store.all('services');
  const bySvc = services.map(s => ({ label: s.name.replace(' Development', ' Dev').replace(' Content', '').replace(' Design', ''), value: projects.filter(p => p.serviceId === s.id).length, color: s.color }));
  const avgBySvc = services.map(s => {
    const done = projects.filter(p => p.serviceId === s.id && p.completedAt);
    const avg = done.length ? done.reduce((a, p) => a + Metrics.durationDays(p), 0) / done.length : 0;
    return { label: s.name.replace(' Development', ' Dev').replace(' Content', '').replace(' Design', ''), value: avg, color: s.color };
  });
  const staffRows = Store.staff().map(st => {
    const mine = projects.filter(p => p.staffId === st.id);
    return { label: `<div class="who">${UI.avatar(st, 24)}<span>${esc(firstName(st.name))}</span></div>`, segments: PROJECT_STATUSES.map(s => ({ label: s, value: mine.filter(p => p.status === s).length, color: STATUS_COLORS[s] })) };
  });
  const revData = projects.slice().sort((a, b) => Metrics.revisionCount(b) - Metrics.revisionCount(a)).slice(0, 8)
    .map(p => { const n = Metrics.revisionCount(p); return { label: p.code.replace('FD-', '#'), value: n, color: n >= 3 ? 'var(--red)' : n >= 2 ? 'var(--amber)' : 'var(--green)' }; });

  // completions per month (last 6 months)
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    const key = d.getFullYear() + '-' + d.getMonth();
    months.push({ key, label: d.toLocaleDateString('en-US', { month: 'short' }), value: 0 });
  }
  projects.filter(p => p.completedAt).forEach(p => {
    const d = new Date(p.completedAt); const m2 = months.find(x => x.key === d.getFullYear() + '-' + d.getMonth());
    if (m2) m2.value++;
  });

  // service alerts
  const alerts = [];
  projects.filter(p => Metrics.isOverdue(p)).forEach(p => alerts.push({ tone: 'red', icon: 'alert', text: `<b>${esc(p.code)}</b> ${esc(p.title)} is ${Math.abs(Metrics.daysLeft(p))} day(s) overdue`, link: '#/project/' + p.id }));
  projects.filter(p => !Metrics.isDone(p) && !Metrics.isOverdue(p) && Metrics.daysLeft(p) <= 3).forEach(p => alerts.push({ tone: 'amber', icon: 'clock', text: `<b>${esc(p.code)}</b> ${esc(p.title)} is due ${Metrics.daysLeft(p) === 0 ? 'today' : 'in ' + Metrics.daysLeft(p) + ' day(s)'}`, link: '#/project/' + p.id }));
  projects.filter(p => !Metrics.isDone(p) && Metrics.revisionCount(p) >= 2).forEach(p => alerts.push({ tone: 'amber', icon: 'repeat', text: `<b>${esc(p.code)}</b> has ${Metrics.revisionCount(p)} revision cycles — consider a client check-in`, link: '#/project/' + p.id }));
  projects.filter(p => p.status === 'Approved').forEach(p => alerts.push({ tone: 'green', icon: 'send', text: `<b>${esc(p.code)}</b> ${esc(p.title)} is approved and ready for delivery`, link: '#/project/' + p.id }));
  pendingReqs.forEach(r => alerts.push({ tone: 'blue', icon: 'inbox', text: `New request <b>${esc(r.title)}</b> from ${esc(Store.client(r.clientId).company)} awaits review`, link: '#/requests' }));

  const alertHtml = alerts.length ? `<ul class="alerts">${alerts.slice(0, 7).map(a => `<li class="alert-item a-${a.tone}" onclick="location.hash='${a.link}'"><span class="a-ic">${ic(a.icon, 15)}</span><span>${a.text}</span>${ic('chevronRight', 15)}</li>`).join('')}</ul>` : UI.empty('check', 'All clear', 'No service risks detected right now.');

  const healthBreakdown = `<ul class="mini-stats">
    <li><span>On-time delivery</span><b>${Math.round(m.onTimeRate * 100)}%</b></li>
    <li><span>Client satisfaction</span><b>${m.csat.toFixed(1)} / 5</b></li>
    <li><span>Avg. revisions</span><b>${m.avgRevisions.toFixed(1)}</b></li>
    <li><span>Active at risk</span><b>${m.overdue} overdue</b></li></ul>`;

  return pageHead(`${greeting()}, ${esc(firstName(u.name))}`, `Here's how your agency's services are performing — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.`,
    `<a class="btn btn-ghost" href="#/reports">${ic('chart', 16)} Reports</a><button class="btn btn-primary" onclick="Act.newProject()">${ic('plus', 16)} New Project</button>`) +
    `<div class="kpis">
      ${kpi('folder', 'Active projects', m.active, `${projects.filter(p => p.status === 'In Progress').length} in progress`, 'tone-blue')}
      ${kpi('eye', 'Pending client review', m.pendingReview, `${m.inRevision} in revision`, 'tone-amber')}
      ${kpi('alert', 'Overdue', m.overdue, m.overdue ? 'needs attention' : 'none — great!', m.overdue ? 'tone-red' : 'tone-green')}
      ${kpi('check', 'Completed', m.done, `${m.delivered} delivered`, 'tone-green')}
      ${kpi('clock', 'Avg. completion time', m.avgDuration.toFixed(1) + '<small> days</small>', 'request → approval', 'tone-violet')}
      ${kpi('repeat', 'Avg. revisions / project', m.avgRevisions.toFixed(1), `${Store.all('revisions').length} total revisions`, 'tone-pink')}
      ${kpi('trending', 'On-time rate', Math.round(m.onTimeRate * 100) + '%', `${m.onTime} on time · ${m.late} late`, 'tone-teal')}
      ${kpi('star', 'Client satisfaction', m.csat.toFixed(1) + '<small> / 5</small>', `${m.ratedCount} ratings`, 'tone-amber')}
    </div>
    <div class="grid g-3">
      ${card('Service Health Score', `<div class="health-card">${Charts.gauge(m.health)}${healthBreakdown}</div>`, { icon: 'shield', action: `<span class="info-tip" title="Weighted score: on-time delivery 35%, client satisfaction 30%, first-pass quality (few revisions) 20%, active projects not overdue 15%">${ic('info', 15)}</span>` })}
      ${card('Projects by status', Charts.donut(byStatus, { center: projects.length, sub: 'projects' }), { icon: 'activity' })}
      ${card('On-time vs. overdue', Charts.donut([
        { label: 'Delivered on time', value: m.onTime, color: 'var(--green)' },
        { label: 'Delivered late', value: m.late, color: 'var(--amber)' },
        { label: 'Currently overdue', value: m.overdue, color: 'var(--red)' },
        { label: 'Active, on track', value: m.active - m.overdue, color: 'var(--blue)' },
      ], { center: Math.round(m.onTimeRate * 100) + '%', sub: 'on time' }), { icon: 'clock' })}
    </div>
    <div class="grid g-2">
      ${card('Projects by service type', Charts.bars(bySvc), { icon: 'layers' })}
      ${card('Avg. completion time by service', Charts.bars(avgBySvc, { unit: 'd', decimals: 1 }), { icon: 'clock' })}
    </div>
    <div class="grid g-2">
      ${card('Workload & status by staff member', Charts.hbars(staffRows, { legend: PROJECT_STATUSES.map(s => ({ label: s, color: STATUS_COLORS[s] })) }), { icon: 'users', action: '<a href="#/staff" class="card-link">View team</a>' })}
      ${card('Revisions per project (top 8)', Charts.bars(revData, { height: 180 }), { icon: 'repeat' })}
    </div>
    <div class="grid g-2">
      ${card('Service alerts', alertHtml, { icon: 'alert', action: `<span class="pill">${alerts.length}</span>` })}
      ${card('Completed projects — last 6 months', Charts.line(months), { icon: 'trending' })}
    </div>
    ${card('Recent activity', activityFeed(Store.all('activity').slice(), 8), { icon: 'activity' })}`;
};

/* =========================================================
   STAFF DASHBOARD
   ========================================================= */
Views.staffDashboard = function () {
  const u = App.user;
  const mine = visibleProjects();
  const m = Metrics.summary(mine);
  const active = mine.filter(p => !Metrics.isDone(p) || p.status === 'Approved').filter(p => p.status !== 'Delivered');
  const urgency = { Revision: 0, 'In Progress': 1, Assigned: 2, Approved: 3, 'Client Review': 4 };
  const queue = active.slice().sort((a, b) => (Metrics.isOverdue(b) - Metrics.isOverdue(a)) || (urgency[a.status] - urgency[b.status]) || byDeadline(a, b));
  const dueWeek = active.filter(p => !Metrics.isDone(p) && Metrics.daysLeft(p) <= 7).length;
  const openRevs = Store.where('revisions', r => r.status === 'Open' && mine.some(p => p.id === r.projectId));

  const queueHtml = queue.length ? `<ul class="queue">${queue.map(p => {
    const na = nextAction(p), c = Store.client(p.clientId);
    return `<li onclick="location.hash='#/project/${p.id}'">
      <div class="q-main"><b>${esc(p.title)}</b><small>${esc(p.code)} · ${esc(c.company)} · ${UI.priority(p.priority)}</small>${UI.progress(p.progress, STATUS_COLORS[p.status])}</div>
      <div class="q-side">${UI.health(p)}<span class="next n-${na.tone}">${ic(na.icon, 13)}${na.label}</span></div></li>`;
  }).join('')}</ul>` : UI.empty('check', 'Your queue is clear', 'New assignments will show up here.');

  const fbHtml = openRevs.length ? openRevs.map(r => {
    const p = Store.project(r.projectId), by = Store.user(r.requestedBy);
    return `<div class="fb-card" onclick="location.hash='#/project/${p.id}'">
      <div class="fb-head">${UI.avatar(by, 28)}<div><b>${esc(by ? by.name : 'Client')}</b><small>Revision #${r.number} · ${esc(p.title)} · ${UI.ago(r.requestedAt)}</small></div></div>
      <p>“${esc(r.feedback)}”</p>${r.changes.length ? `<ul class="changes">${r.changes.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}</div>`;
  }).join('') : UI.empty('message', 'No open feedback', 'Client revision requests will appear here.');

  return pageHead(`${greeting()}, ${esc(firstName(u.name))}`, `${esc(u.title)} · Here's your work queue for today.`) +
    `<div class="kpis k-6">
      ${kpi('folder', 'Active assignments', active.length, '', 'tone-blue')}
      ${kpi('calendar', 'Due within 7 days', dueWeek, '', dueWeek ? 'tone-amber' : 'tone-green')}
      ${kpi('repeat', 'Revisions to address', openRevs.length, '', openRevs.length ? 'tone-red' : 'tone-green')}
      ${kpi('eye', 'Awaiting client', m.pendingReview, '', 'tone-violet')}
      ${kpi('check', 'Completed', m.done, '', 'tone-green')}
      ${kpi('trending', 'My on-time rate', Math.round(m.onTimeRate * 100) + '%', m.ratedCount ? `CSAT ${m.csat.toFixed(1)}/5` : '', 'tone-teal')}
    </div>
    <div class="grid g-21">
      ${card('My work queue', queueHtml, { icon: 'list', action: '<a href="#/projects" class="card-link">All my projects</a>' })}
      <div class="stack">
        ${card('Client feedback to address', fbHtml, { icon: 'message' })}
        ${card('Recent activity', activityFeed(Store.where('activity', a => mine.some(p => p.id === a.projectId)), 6), { icon: 'activity' })}
      </div>
    </div>`;
};

/* =========================================================
   CLIENT DASHBOARD (Portal)
   ========================================================= */
Views.clientDashboard = function () {
  const u = App.user, c = Store.client(u.clientId);
  const mine = visibleProjects();
  const toReview = mine.filter(p => p.status === 'Client Review');
  const toRate = mine.filter(p => p.status === 'Delivered' && !p.rating);
  const active = mine.filter(p => p.status !== 'Delivered');
  const openReqs = visibleRequests().filter(r => r.status === 'Pending' || r.status === 'Under Review');

  const actionCards = [
    ...toReview.map(p => {
      const d = Store.where('deliverables', d => d.projectId === p.id).sort((a, b) => b.version - a.version)[0];
      return `<div class="action-card amber"><div class="ac-ic">${ic('eye', 20)}</div><div><b>Version ${d ? d.version : ''} of “${esc(p.title)}” is ready for your review</b><small>Submitted ${d ? UI.ago(d.submittedAt) : ''} by ${esc(Store.user(p.staffId).name)}</small></div><a class="btn btn-primary btn-sm" href="#/project/${p.id}">Review now</a></div>`;
    }),
    ...toRate.map(p => `<div class="action-card violet"><div class="ac-ic">${ic('star', 20)}</div><div><b>“${esc(p.title)}” was delivered</b><small>Tell us how we did — your rating helps us improve.</small></div><button class="btn btn-primary btn-sm" onclick="Act.rate('${p.id}')">Rate service</button></div>`),
  ].join('');

  const projCards = active.length ? active.sort(byDeadline).map(p => {
    const s = Store.service(p.serviceId), st = Store.user(p.staffId);
    return `<article class="proj-card" onclick="location.hash='#/project/${p.id}'">
      <header>${UI.serviceTag(s)}${UI.badge(p.status)}</header>
      <h3>${esc(p.title)}</h3><small class="muted">${esc(p.code)} · Due ${UI.date(p.deadline)} · ${UI.health(p)}</small>
      ${UI.stepper(p, true)}
      <div class="pc-foot"><div class="who">${UI.avatar(st, 26)}<span>${esc(st.name)}<small>${esc(st.title)}</small></span></div><div class="pc-prog">${UI.progress(p.progress, STATUS_COLORS[p.status])}<b>${p.progress}%</b></div></div>
    </article>`;
  }).join('') : UI.empty('folder', 'No active projects', 'Submit a service request to get started.', `<button class="btn btn-primary" onclick="Act.newRequest()">${ic('plus', 16)} Request a service</button>`);

  return `<div class="welcome">
      <div><span class="eyebrow light">${ic('briefcase', 14)} Client Portal · ${esc(c.company)}</span><h1>Welcome back, ${esc(firstName(u.name))}</h1><p>Track your projects, review deliverables and approve work — all in one place.</p></div>
      <button class="btn btn-light" onclick="Act.newRequest()">${ic('plus', 16)} Request a new service</button>
    </div>
    ${actionCards ? `<div class="action-list">${actionCards}</div>` : ''}
    <div class="kpis k-4">
      ${kpi('folder', 'Active projects', active.length, '', 'tone-blue')}
      ${kpi('eye', 'Awaiting your review', toReview.length, '', toReview.length ? 'tone-amber' : 'tone-green')}
      ${kpi('check', 'Completed', mine.filter(p => p.status === 'Delivered').length, '', 'tone-green')}
      ${kpi('inbox', 'Open requests', openReqs.length, '', 'tone-violet')}
    </div>
    <div class="section-title"><h2>Your active projects</h2><a href="#/projects" class="card-link">View all</a></div>
    <div class="proj-grid">${projCards}</div>
    ${card('Recent updates', activityFeed(Store.where('activity', a => mine.some(p => p.id === a.projectId)), 6), { icon: 'activity' })}`;
};

/* =========================================================
   SERVICE REQUESTS
   ========================================================= */
Views.requests = function () {
  const u = App.user, isClient = u.role === 'client';
  const all = visibleRequests().slice().sort(byNewest('createdAt'));
  const tab = App.state.reqTab;
  const tabs = ['All', ...REQUEST_STATUSES];
  const list = tab === 'All' ? all : all.filter(r => r.status === tab);

  const tabHtml = `<div class="tabs">${tabs.map(t => {
    const n = t === 'All' ? all.length : all.filter(r => r.status === t).length;
    return `<button class="tab ${t === tab ? 'active' : ''}" onclick="App.state.reqTab='${t}';App.render()">${t}<span>${n}</span></button>`;
  }).join('')}</div>`;

  const items = list.length ? list.map(r => {
    const c = Store.client(r.clientId), s = Store.service(r.serviceId);
    let actions = '';
    if (!isClient) {
      if (r.status === 'Pending') actions = `<button class="btn btn-ghost btn-sm" onclick="Act.reviewRequest('${r.id}')">${ic('eye', 15)} Start review</button>`;
      if (r.status === 'Pending' || r.status === 'Under Review') actions += `<button class="btn btn-danger-ghost btn-sm" onclick="Act.rejectRequest('${r.id}')">${ic('x', 15)} Decline</button><button class="btn btn-primary btn-sm" onclick="Act.acceptRequest('${r.id}')">${ic('check', 15)} Accept & assign</button>`;
    }
    if (r.status === 'Converted' && r.projectId) actions = `<a class="btn btn-ghost btn-sm" href="#/project/${r.projectId}">Open project ${esc(Store.project(r.projectId)?.code || '')} ${ic('arrowRight', 15)}</a>`;
    return `<article class="req-card">
      <div class="req-main">
        <div class="req-top">${UI.serviceTag(s)}${UI.priority(r.priority)}<span class="muted">· submitted ${UI.ago(r.createdAt)}</span></div>
        <h3>${esc(r.title)}</h3>
        ${!isClient ? `<div class="req-client">${ic('briefcase', 14)} ${esc(c.company)} · ${esc(c.contact)}</div>` : ''}
        <p>${esc(r.description)}</p>
        ${r.requirements ? `<div class="req-reqs"><b>Requirements:</b> ${esc(r.requirements)}</div>` : ''}
        ${r.reviewNote && r.status !== 'Pending' ? `<div class="req-note ${r.status === 'Rejected' ? 'red' : ''}">${ic('message', 14)} <span><b>Agency note:</b> ${esc(r.reviewNote)}</span></div>` : ''}
      </div>
      <div class="req-side">
        ${UI.badge(r.status)}
        <div class="req-dl"><small>Requested deadline</small><b>${UI.date(r.deadline)}</b></div>
        <div class="req-actions">${actions}</div>
      </div>
    </article>`;
  }).join('') : UI.empty('inbox', 'No requests here', isClient ? 'Need something new? Submit a service request.' : 'New client requests will appear here.');

  return pageHead(isClient ? 'My service requests' : 'Service requests',
    isClient ? 'Submit new requests and follow their review status.' : 'Review incoming client requests, then accept and convert them into assigned projects.',
    isClient ? `<button class="btn btn-primary" onclick="Act.newRequest()">${ic('plus', 16)} New request</button>` : '') +
    tabHtml + `<div class="req-list">${items}</div>`;
};

/* =========================================================
   PROJECTS (list + board)
   ========================================================= */
Views.projects = function () {
  const u = App.user, f = App.state.filters;
  const title = u.role === 'admin' ? 'Projects' : 'My projects';
  const sub = u.role === 'admin' ? 'Monitor every service project across its lifecycle.' : u.role === 'staff' ? 'Projects assigned to you.' : 'All projects for ' + esc(Store.client(u.clientId).company) + '.';
  const toolbar = `<div class="toolbar">
    <div class="search-input">${ic('search', 16)}<input id="pf-q" placeholder="Search projects, codes, clients…" value="${esc(f.q)}" oninput="App.state.filters.q=this.value;Views.renderProjectResults()"></div>
    ${UI.select('status', [['', 'All statuses'], ...PROJECT_STATUSES, ['overdue', 'Overdue only']], f.status, `onchange="App.state.filters.status=this.value;Views.renderProjectResults()"`)}
    ${UI.select('service', [['', 'All services'], ...Store.all('services').map(s => [s.id, s.name])], f.service, `onchange="App.state.filters.service=this.value;Views.renderProjectResults()"`)}
    ${u.role === 'admin' ? UI.select('staff', [['', 'All staff'], ...Store.staff().map(s => [s.id, s.name])], f.staff, `onchange="App.state.filters.staff=this.value;Views.renderProjectResults()"`) : ''}
    <div class="seg">
      <button class="${App.state.projView === 'list' ? 'active' : ''}" onclick="App.state.projView='list';App.render()">${ic('list', 15)} List</button>
      <button class="${App.state.projView === 'board' ? 'active' : ''}" onclick="App.state.projView='board';App.render()">${ic('columns', 15)} Board</button>
    </div></div>`;
  return pageHead(title, sub, u.role === 'admin' ? `<button class="btn btn-primary" onclick="Act.newProject()">${ic('plus', 16)} New Project</button>` : u.role === 'client' ? `<button class="btn btn-primary" onclick="Act.newRequest()">${ic('plus', 16)} Request a service</button>` : '') +
    toolbar + `<div id="proj-results"></div>`;
};

Views.filteredProjects = function () {
  const f = App.state.filters, q = f.q.trim().toLowerCase();
  return visibleProjects().filter(p => {
    if (f.status === 'overdue' && !Metrics.isOverdue(p)) return false;
    if (f.status && f.status !== 'overdue' && p.status !== f.status) return false;
    if (f.service && p.serviceId !== f.service) return false;
    if (f.staff && p.staffId !== f.staff) return false;
    if (q) {
      const c = Store.client(p.clientId), st = Store.user(p.staffId);
      const hay = [p.title, p.code, c?.company, st?.name].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
};

Views.renderProjectResults = function () {
  const el = document.getElementById('proj-results');
  if (!el) return;
  const list = Views.filteredProjects();
  const u = App.user;
  const order = (a, b) => (Metrics.isDone(a) - Metrics.isDone(b)) || byDeadline(a, b);
  if (App.state.projView === 'board') {
    el.innerHTML = `<div class="board">${PROJECT_STATUSES.map(s => {
      const col = list.filter(p => p.status === s).sort(byDeadline);
      return `<div class="board-col"><header><span class="dot" style="background:${STATUS_COLORS[s]}"></span>${s}<span class="count">${col.length}</span></header>
        <div class="board-cards">${col.map(p => {
          const c = Store.client(p.clientId), st = Store.user(p.staffId), sv = Store.service(p.serviceId);
          const revs = Metrics.revisionCount(p);
          return `<div class="b-card" style="--c:${sv ? sv.color : '#888'}" onclick="location.hash='#/project/${p.id}'">
            <small class="muted">${esc(p.code)} · ${esc(sv ? sv.name : '')}</small><b>${esc(p.title)}</b>
            <span class="muted">${esc(c.company)}</span>
            ${s !== 'Delivered' && s !== 'Assigned' ? UI.progress(p.progress, STATUS_COLORS[s]) : ''}
            <div class="b-foot">${UI.avatar(st, 24)}${revs ? `<span class="rev-mini" title="Revisions">${ic('repeat', 12)}${revs}</span>` : ''}${UI.health(p)}</div></div>`;
        }).join('') || '<div class="board-empty">No projects</div>'}</div></div>`;
    }).join('')}</div>`;
  } else {
    el.innerHTML = `<div class="card flush">${projectTable(list.sort(order), { showClient: u.role !== 'client', showStaff: u.role !== 'staff' })}</div>`;
  }
};

/* =========================================================
   PROJECT DETAIL
   ========================================================= */
Views.project = function (id) {
  const p = Store.project(id);
  if (!canSeeProject(p)) return Views.notFound();
  const u = App.user;
  const c = Store.client(p.clientId), s = Store.service(p.serviceId), st = Store.user(p.staffId);
  const delivs = Store.where('deliverables', d => d.projectId === p.id).sort((a, b) => b.version - a.version);
  const revs = Store.where('revisions', r => r.projectId === p.id).sort((a, b) => a.number - b.number);
  const openRev = revs.find(r => r.status === 'Open');
  const isAgency = u.role === 'admin' || (u.role === 'staff' && p.staffId === u.id);
  const isClient = u.role === 'client';
  const latest = delivs[0];

  /* --- header actions per role --- */
  let actions = '';
  if (u.role === 'admin' && p.status !== 'Delivered') actions += `<button class="btn btn-ghost" onclick="Act.editAssignment('${p.id}')">${ic('edit', 15)} Edit assignment</button>`;
  if (isAgency) {
    if (p.status === 'Assigned') actions += `<button class="btn btn-primary" onclick="Act.startWork('${p.id}')">${ic('play', 15)} Start work</button>`;
    if (p.status === 'In Progress' || p.status === 'Revision') actions += `<button class="btn btn-primary" onclick="Act.submitDeliverable('${p.id}')">${ic('upload', 15)} Submit deliverable</button>`;
    if (p.status === 'Approved') actions += `<button class="btn btn-success" onclick="Act.deliver('${p.id}')">${ic('send', 15)} Mark as delivered</button>`;
  }
  if (isClient && p.status === 'Client Review' && latest) actions += `<button class="btn btn-danger-ghost" onclick="Act.requestRevision('${latest.id}')">${ic('repeat', 15)} Request revision</button><button class="btn btn-success" onclick="Act.approve('${latest.id}')">${ic('check', 15)} Approve v${latest.version}</button>`;
  if (isClient && p.status === 'Delivered' && !p.rating) actions += `<button class="btn btn-primary" onclick="Act.rate('${p.id}')">${ic('star', 15)} Rate this service</button>`;

  /* --- guidance callout: what happens next --- */
  const guide = {
    admin: {
      'Assigned': `Waiting for <b>${esc(st.name)}</b> to start work.`, 'In Progress': `<b>${esc(st.name)}</b> is working on the first/next deliverable.`,
      'Client Review': `Deliverable v${latest?.version} is with the client for review.`, 'Revision': `Client requested changes (revision #${openRev?.number}). ${esc(st.name)} is addressing them.`,
      'Approved': 'The client approved the work. Mark the project as delivered to hand over final files.', 'Delivered': p.rating ? 'Project complete and rated by the client.' : 'Project delivered — waiting for the client\'s rating.',
    },
    staff: {
      'Assigned': 'Click <b>Start work</b> to begin and notify the client.', 'In Progress': 'Update your progress and <b>submit a deliverable</b> when it\'s ready for client review.',
      'Client Review': 'Your deliverable is with the client. You\'ll be notified when they respond.', 'Revision': `The client requested changes — review the feedback below, then <b>submit a new version</b>.`,
      'Approved': 'Approved! <b>Mark as delivered</b> once final files are handed over.', 'Delivered': 'Project complete. Great job!',
    },
    client: {
      'Assigned': `Your project has been assigned to <b>${esc(st.name)}</b>. Work will begin shortly.`, 'In Progress': `<b>${esc(st.name)}</b> is working on your project. You'll be notified when a deliverable is ready.`,
      'Client Review': `<b>Your review is needed.</b> Check version ${latest?.version} below and approve it or request a revision.`, 'Revision': `Your feedback was sent. The team is preparing a revised version.`,
      'Approved': 'You approved the work. The team is preparing the final delivery.', 'Delivered': p.rating ? 'Delivered and rated — thank you for your feedback!' : 'Your project was delivered! Please <b>rate the service</b>.',
    },
  }[u.role === 'staff' && p.staffId !== u.id ? 'admin' : u.role][p.status];

  /* --- deliverables timeline --- */
  const delivHtml = delivs.length ? `<ol class="versions">${delivs.map(d => {
    const by = Store.user(d.submittedBy);
    const rv = revs.find(r => r.deliverableId === d.id);
    const isImg = d.fileData && /^data:image\//.test(d.fileData);
    return `<li class="version ${d.status === 'Pending Review' ? 'pending' : ''}">
      <div class="v-chip">v${d.version}</div>
      <div class="v-body">
        <div class="v-head"><b>${esc(d.title)}</b>${UI.badge(d.status)}</div>
        <small class="muted">Submitted by ${esc(by ? by.name : '—')} · ${UI.dateTime(d.submittedAt)}${d.reviewedAt ? ` · reviewed ${UI.dateTime(d.reviewedAt)}` : ''}</small>
        ${d.notes ? `<p>${esc(d.notes)}</p>` : ''}
        ${isImg ? `<img class="v-thumb" src="${d.fileData}" alt="Preview of ${esc(d.fileName)}" onclick="Act.preview('${d.id}')">` : ''}
        <div class="v-files">
          ${d.fileName ? `<span class="file-pill">${ic('file', 14)} ${esc(d.fileName)} <small>${UI.fileSize(d.fileSize)}</small>${d.fileData ? `<a href="${d.fileData}" download="${esc(d.fileName)}" title="Download" onclick="event.stopPropagation()">${ic('download', 14)}</a>` : ''}</span>` : ''}
          ${d.link ? `<a class="file-pill" href="${esc(d.link)}" target="_blank" rel="noopener">${ic('link', 14)} External link</a>` : ''}
        </div>
        ${rv ? `<div class="v-rev">${ic('repeat', 14)}<span><b>Revision #${rv.number} requested:</b> ${esc(rv.feedback)}</span></div>` : ''}
        ${isClient && d.status === 'Pending Review' ? `<div class="v-actions"><button class="btn btn-danger-ghost btn-sm" onclick="Act.requestRevision('${d.id}')">${ic('repeat', 14)} Request revision</button><button class="btn btn-success btn-sm" onclick="Act.approve('${d.id}')">${ic('check', 14)} Approve</button></div>` : ''}
      </div></li>`;
  }).join('')}</ol>` : UI.empty('upload', 'No deliverables yet', isAgency ? 'Submit the first version when it\'s ready for client review.' : 'The team will upload the first version here.');

  /* --- revision history --- */
  const revHtml = revs.length ? `<div class="table-wrap"><table class="table compact">
    <thead><tr><th>#</th><th>Client feedback & requested changes</th><th>Requested</th><th>Status</th><th>Resolution</th></tr></thead>
    <tbody>${revs.map(r => `<tr>
      <td><span class="rev-num">${r.number}</span></td>
      <td><p class="rev-fb">“${esc(r.feedback)}”</p>${r.changes.length ? `<ul class="changes">${r.changes.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</td>
      <td class="nowrap">${UI.date(r.requestedAt)}<br><small class="muted">on v${Store.get('deliverables', r.deliverableId)?.version || '?'}</small></td>
      <td>${UI.badge(r.status)}</td>
      <td>${r.status === 'Addressed' ? `<small>${esc(r.response)}</small><br><small class="muted">${UI.date(r.resolvedAt)}</small>` : '<small class="muted">In progress</small>'}</td>
    </tr>`).join('')}</tbody></table></div>` : `<p class="muted pad">No revisions requested${p.status === 'Delivered' || p.status === 'Approved' ? ' — approved on the first submission!' : ' so far.'}</p>`;

  /* --- side panel --- */
  const canEditProgress = isAgency && (p.status === 'In Progress' || p.status === 'Revision');
  const progressHtml = `<div class="prog-big"><div class="prog-ring" style="--p:${p.progress};--c:${STATUS_COLORS[p.status]}"><b>${p.progress}%</b></div>
    <div>${canEditProgress ? `<label class="field"><span class="field-label">Update progress</span><input type="range" min="0" max="100" step="5" value="${p.progress}" oninput="this.nextElementSibling.textContent=this.value+'%'" onchange="Act.setProgress('${p.id}', this.value)"><output>${p.progress}%</output></label>` : `<p class="muted">${p.status === 'Delivered' ? 'Completed and delivered.' : 'Progress is updated by the assigned staff.'}</p>`}</div></div>`;

  const dur = Metrics.durationDays(p);
  const details = `<dl class="details">
    <dt>Client</dt><dd>${esc(c.company)}<small>${esc(c.contact)} · ${esc(c.email)}</small></dd>
    <dt>Service</dt><dd>${UI.serviceTag(s)}<small>Standard turnaround: ${s ? s.baseDays : '—'} days</small></dd>
    <dt>Assigned to</dt><dd><div class="who">${UI.avatar(st, 26)}<span>${esc(st.name)}<small>${esc(st.title)}</small></span></div></dd>
    <dt>Priority</dt><dd>${UI.priority(p.priority)}</dd>
    <dt>Deadline</dt><dd>${UI.date(p.deadline)} ${UI.health(p)}</dd>
    <dt>Created</dt><dd>${UI.date(p.createdAt)}</dd>
    ${p.startedAt ? `<dt>Started</dt><dd>${UI.date(p.startedAt)}</dd>` : ''}
    ${p.completedAt ? `<dt>Approved</dt><dd>${UI.date(p.completedAt)} <small>${dur} day(s) total · ${Metrics.wasOnTime(p) ? '<span class="ok">on time</span>' : '<span class="late">late</span>'}</small></dd>` : ''}
    ${p.deliveredAt ? `<dt>Delivered</dt><dd>${UI.date(p.deliveredAt)}</dd>` : ''}
    <dt>Versions / Revisions</dt><dd>${delivs.length} version(s) · ${revs.length} revision(s)</dd>
  </dl>`;

  const ratingHtml = p.rating ? card('Client rating', `<div class="rating-show">${UI.stars(p.rating, 20)}<b>${p.rating}.0</b></div>${p.ratingComment ? `<p class="quote">“${esc(p.ratingComment)}”</p>` : ''}`, { icon: 'star' }) : '';

  return `<a class="back" href="#/projects">${ic('arrowLeft', 15)} Back to projects</a>
    <section class="proj-head card">
      <div class="ph-main">
        <div class="ph-tags"><span class="code">${esc(p.code)}</span>${UI.serviceTag(s)}${UI.priority(p.priority)}${UI.badge(p.status)}</div>
        <h1>${esc(p.title)}</h1>
        <div class="ph-meta"><span>${ic('briefcase', 14)} ${esc(c.company)}</span><span>${ic('userCheck', 14)} ${esc(st.name)}</span><span>${ic('calendar', 14)} Due ${UI.date(p.deadline)}</span>${UI.health(p)}</div>
      </div>
      <div class="ph-actions">${actions}</div>
    </section>
    <section class="card stepper-card">${UI.stepper(p)}<div class="guide">${ic('info', 16)}<span>${guide}</span></div></section>
    <div class="grid g-21">
      <div class="stack">
        ${card('Project brief', `<p>${esc(p.description) || '<span class="muted">No description.</span>'}</p>${p.requirements ? `<div class="req-reqs"><b>Requirements:</b> ${esc(p.requirements)}</div>` : ''}`, { icon: 'file' })}
        ${card('Deliverables & version history', delivHtml, { icon: 'layers', action: `<span class="pill">${delivs.length}</span>` })}
        ${card('Revision history', revHtml, { icon: 'repeat', action: `<span class="pill ${revs.length >= 3 ? 'red' : ''}">${revs.length}</span>` })}
      </div>
      <div class="stack">
        ${card('Progress', progressHtml, { icon: 'trending' })}
        ${ratingHtml}
        ${card('Details', details, { icon: 'info' })}
        ${card('Activity log', activityFeed(Store.where('activity', a => a.projectId === p.id), 12, false), { icon: 'activity' })}
      </div>
    </div>`;
};

/* =========================================================
   CLIENTS
   ========================================================= */
Views.clients = function () {
  const list = Store.all('clients');
  const cards = list.map(c => {
    const ps = Store.where('projects', p => p.clientId === c.id);
    const m = Metrics.summary(ps);
    return `<article class="dir-card" onclick="location.hash='#/client/${c.id}'">
      <header><span class="avatar sq" style="--s:44px;background:${UI.colorFor(c.id)}">${UI.initials(c.company)}</span>
        <div><h3>${esc(c.company)}</h3><small class="muted">${esc(c.industry || 'Client')}</small></div>
        <button class="icon-btn" onclick="event.stopPropagation();Act.clientForm('${c.id}')" title="Edit client">${ic('edit', 16)}</button></header>
      <ul class="contact"><li>${ic('users', 14)} ${esc(c.contact)}</li><li>${ic('mail', 14)} ${esc(c.email)}</li><li>${ic('phone', 14)} ${esc(c.phone || '—')}</li></ul>
      <div class="dir-stats"><div><b>${m.active}</b><span>Active</span></div><div><b>${m.delivered}</b><span>Completed</span></div><div><b>${m.ratedCount ? m.csat.toFixed(1) : '—'}</b><span>CSAT</span></div></div>
    </article>`;
  }).join('');
  return pageHead('Clients', `${list.length} client accounts with portal access.`, `<button class="btn btn-primary" onclick="Act.clientForm()">${ic('plus', 16)} Add client</button>`) +
    `<div class="dir-grid">${cards || UI.empty('users', 'No clients yet', 'Add your first client.')}</div>`;
};

Views.client = function (id) {
  const c = Store.client(id);
  if (!c) return Views.notFound();
  const ps = Store.where('projects', p => p.clientId === c.id);
  const reqs = Store.where('requests', r => r.clientId === c.id).sort(byNewest('createdAt'));
  const m = Metrics.summary(ps);
  return `<a class="back" href="#/clients">${ic('arrowLeft', 15)} Back to clients</a>
    <section class="card client-head">
      <span class="avatar sq" style="--s:64px;background:${UI.colorFor(c.id)}">${UI.initials(c.company)}</span>
      <div><h1>${esc(c.company)}</h1><p class="muted">${esc(c.industry || '')} · Client since ${UI.date(c.createdAt)}</p>
      <div class="ph-meta"><span>${ic('users', 14)} ${esc(c.contact)}</span><span>${ic('mail', 14)} ${esc(c.email)}</span><span>${ic('phone', 14)} ${esc(c.phone || '—')}</span></div></div>
      <button class="btn btn-ghost" onclick="Act.clientForm('${c.id}')">${ic('edit', 15)} Edit</button>
    </section>
    <div class="kpis k-4">
      ${kpi('folder', 'Active projects', m.active, '', 'tone-blue')}
      ${kpi('check', 'Completed', m.done, '', 'tone-green')}
      ${kpi('repeat', 'Avg. revisions', m.avgRevisions.toFixed(1), '', 'tone-pink')}
      ${kpi('star', 'Satisfaction', m.ratedCount ? m.csat.toFixed(1) + '<small> / 5</small>' : '—', '', 'tone-amber')}
    </div>
    ${card('Projects', `<div class="flush-body">${projectTable(ps.slice().sort(byNewest('createdAt')), { showClient: false })}</div>`, { icon: 'folder', cls: 'flush' })}
    ${card('Service requests', reqs.length ? `<ul class="simple-list">${reqs.map(r => `<li><div><b>${esc(r.title)}</b><small>${esc(Store.service(r.serviceId)?.name || '')} · ${UI.date(r.createdAt)}</small></div>${UI.badge(r.status)}</li>`).join('')}</ul>` : UI.empty('inbox', 'No requests', ''), { icon: 'inbox' })}`;
};

/* =========================================================
   SERVICES
   ========================================================= */
Views.services = function () {
  const list = Store.all('services');
  const cards = list.map(s => {
    const ps = Store.where('projects', p => p.serviceId === s.id);
    const m = Metrics.summary(ps);
    return `<article class="svc-card" style="--c:${s.color}">
      <header><div class="svc-ic">${ic(s.icon, 24)}</div>
        <div class="svc-acts"><button class="icon-btn" onclick="Act.serviceForm('${s.id}')" title="Edit">${ic('edit', 16)}</button><button class="icon-btn" onclick="Act.deleteService('${s.id}')" title="Delete">${ic('trash', 16)}</button></div></header>
      <h3>${esc(s.name)}</h3><p>${esc(s.description)}</p>
      <div class="svc-turn">${ic('clock', 14)} Standard turnaround: <b>${s.baseDays} days</b></div>
      <div class="dir-stats"><div><b>${ps.length}</b><span>Projects</span></div><div><b>${m.active}</b><span>Active</span></div><div><b>${m.done ? m.avgDuration.toFixed(0) + 'd' : '—'}</b><span>Avg. time</span></div><div><b>${ps.length ? m.avgRevisions.toFixed(1) : '—'}</b><span>Avg. revs</span></div></div>
    </article>`;
  }).join('');
  return pageHead('Service catalog', 'The creative services your agency offers to clients.', `<button class="btn btn-primary" onclick="Act.serviceForm()">${ic('plus', 16)} Add service</button>`) +
    `<div class="dir-grid">${cards}</div>`;
};

/* =========================================================
   STAFF
   ========================================================= */
Views.staff = function () {
  const capacity = 5;
  const cards = Store.staff().map(st => {
    const ps = Store.where('projects', p => p.staffId === st.id);
    const m = Metrics.summary(ps);
    const load = Math.min(100, Math.round((m.active / capacity) * 100));
    const loadTone = load >= 80 ? 'var(--red)' : load >= 50 ? 'var(--amber)' : 'var(--green)';
    const current = ps.filter(p => p.status !== 'Delivered').sort(byDeadline);
    return `<article class="dir-card staff-card">
      <header>${UI.avatar(st, 48)}<div><h3>${esc(st.name)}</h3><small class="muted">${esc(st.title)}</small></div>
        <button class="icon-btn" onclick="Act.staffForm('${st.id}')" title="Edit">${ic('edit', 16)}</button></header>
      <div class="load"><div class="load-top"><span>Workload</span><b>${m.active} / ${capacity} active</b></div>${UI.progress(load, loadTone)}</div>
      <div class="dir-stats"><div><b>${m.done}</b><span>Completed</span></div><div><b>${m.done ? Math.round(m.onTimeRate * 100) + '%' : '—'}</b><span>On time</span></div><div><b>${ps.length ? m.avgRevisions.toFixed(1) : '—'}</b><span>Avg. revs</span></div><div><b>${m.ratedCount ? m.csat.toFixed(1) : '—'}</b><span>CSAT</span></div></div>
      ${current.length ? `<ul class="mini-projects">${current.map(p => `<li onclick="location.hash='#/project/${p.id}'"><span class="dot" style="background:${STATUS_COLORS[p.status]}"></span><span class="t">${esc(p.title)}</span>${UI.health(p)}</li>`).join('')}</ul>` : '<p class="muted pad-s">No active projects — available for assignment.</p>'}
    </article>`;
  }).join('');
  return pageHead('Team & workload', 'Monitor staff capacity and performance to balance assignments.', `<button class="btn btn-primary" onclick="Act.staffForm()">${ic('plus', 16)} Add staff</button>`) +
    `<div class="dir-grid">${cards}</div>`;
};

/* =========================================================
   REPORTS
   ========================================================= */
Views.reports = function () {
  const projects = Store.all('projects');
  const m = Metrics.summary(projects);
  const pct = (x) => Math.round(x * 100) + '%';

  const svcRows = Store.all('services').map(s => {
    const ps = projects.filter(p => p.serviceId === s.id), sm = Metrics.summary(ps);
    return `<tr><td>${UI.serviceTag(s)}</td><td>${ps.length}</td><td>${sm.active}</td><td>${sm.done}</td><td>${sm.done ? sm.avgDuration.toFixed(1) + ' d' : '—'}</td><td>${ps.length ? sm.avgRevisions.toFixed(1) : '—'}</td><td>${sm.done ? pct(sm.onTimeRate) : '—'}</td><td>${sm.ratedCount ? sm.csat.toFixed(1) : '—'}</td></tr>`;
  }).join('');
  const staffRows = Store.staff().map(st => {
    const ps = projects.filter(p => p.staffId === st.id), sm = Metrics.summary(ps);
    return `<tr><td><div class="who">${UI.avatar(st, 26)}<span>${esc(st.name)}<small>${esc(st.title)}</small></span></div></td><td>${ps.length}</td><td>${sm.active}</td><td>${sm.overdue}</td><td>${sm.done}</td><td>${sm.done ? sm.avgDuration.toFixed(1) + ' d' : '—'}</td><td>${sm.done ? pct(sm.onTimeRate) : '—'}</td><td>${sm.ratedCount ? sm.csat.toFixed(1) : '—'}</td></tr>`;
  }).join('');
  const register = projects.slice().sort(byNewest('createdAt')).map(p => {
    const c = Store.client(p.clientId), s = Store.service(p.serviceId), st = Store.user(p.staffId);
    const ot = Metrics.wasOnTime(p);
    return `<tr class="click-row" onclick="location.hash='#/project/${p.id}'"><td><b>${esc(p.code)}</b></td><td>${esc(p.title)}</td><td>${esc(c.company)}</td><td>${esc(s ? s.name : '—')}</td><td>${esc(st.name)}</td><td>${UI.badge(p.status)}</td><td class="nowrap">${UI.date(p.createdAt)}</td><td class="nowrap">${UI.date(p.deadline)}</td><td>${Metrics.durationDays(p) ?? '—'}</td><td>${Metrics.revisionCount(p)}</td><td>${ot === null ? (Metrics.isOverdue(p) ? '<span class="late">Overdue</span>' : '—') : ot ? '<span class="ok">Yes</span>' : '<span class="late">No</span>'}</td><td>${p.rating ? p.rating + '★' : '—'}</td></tr>`;
  }).join('');

  return pageHead('Performance reports', `Service performance summary generated ${UI.dateTime(now())}.`,
    `<button class="btn btn-ghost" onclick="Act.exportCSV()">${ic('download', 16)} Export CSV</button><button class="btn btn-primary" onclick="window.print()">${ic('printer', 16)} Print report</button>`) +
    `<div class="print-only print-title">${Views.logo()} <b>FlowDesk</b> — Service Performance Report · ${UI.date(now())}</div>
    <div class="kpis">
      ${kpi('folder', 'Total projects', m.total, `${m.active} active`, 'tone-blue')}
      ${kpi('check', 'Completed', m.done, `${m.delivered} delivered`, 'tone-green')}
      ${kpi('clock', 'Avg. completion', m.avgDuration.toFixed(1) + '<small> days</small>', '', 'tone-violet')}
      ${kpi('shield', 'Service Health Score', m.health + '<small> / 100</small>', '', 'tone-teal')}
      ${kpi('trending', 'On-time rate', pct(m.onTimeRate), '', 'tone-teal')}
      ${kpi('repeat', 'Avg. revisions', m.avgRevisions.toFixed(1), '', 'tone-pink')}
      ${kpi('alert', 'Overdue now', m.overdue, '', m.overdue ? 'tone-red' : 'tone-green')}
      ${kpi('star', 'CSAT', m.csat.toFixed(1) + '<small> / 5</small>', '', 'tone-amber')}
    </div>
    ${card('Performance by service type', `<div class="table-wrap"><table class="table"><thead><tr><th>Service</th><th>Projects</th><th>Active</th><th>Completed</th><th>Avg. time</th><th>Avg. revisions</th><th>On-time</th><th>CSAT</th></tr></thead><tbody>${svcRows}</tbody></table></div>`, { icon: 'layers', cls: 'flush' })}
    ${card('Performance by staff member', `<div class="table-wrap"><table class="table"><thead><tr><th>Staff</th><th>Projects</th><th>Active</th><th>Overdue</th><th>Completed</th><th>Avg. time</th><th>On-time</th><th>CSAT</th></tr></thead><tbody>${staffRows}</tbody></table></div>`, { icon: 'users', cls: 'flush' })}
    ${card('Project register', `<div class="table-wrap"><table class="table compact"><thead><tr><th>Code</th><th>Project</th><th>Client</th><th>Service</th><th>Staff</th><th>Status</th><th>Created</th><th>Deadline</th><th>Days</th><th>Revs</th><th>On time</th><th>Rating</th></tr></thead><tbody>${register}</tbody></table></div>`, { icon: 'list', cls: 'flush' })}`;
};

Views.notFound = () => UI.empty('alert', 'Page not found', 'This page doesn\'t exist or you don\'t have access to it.', '<a class="btn btn-primary" href="#/dashboard">Go to dashboard</a>');
