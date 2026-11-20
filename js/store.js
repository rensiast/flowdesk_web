/* =========================================================
   FlowDesk — Data Store
   A tiny localStorage-backed "database" with seed data
   and all service-lifecycle business rules.
   ========================================================= */

const DB_KEY = 'flowdesk_db_v1';
const DAY = 86400000;

/* ---------- Lifecycle constants ---------- */
const LIFECYCLE = ['Request', 'Review', 'Assignment', 'In Progress', 'Client Review', 'Revision', 'Approval', 'Delivery'];
const PROJECT_STATUSES = ['Assigned', 'In Progress', 'Client Review', 'Revision', 'Approved', 'Delivered'];
const REQUEST_STATUSES = ['Pending', 'Under Review', 'Converted', 'Rejected'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const STATUS_STAGE = { 'Assigned': 2, 'In Progress': 3, 'Client Review': 4, 'Revision': 5, 'Approved': 6, 'Delivered': 7 };
const DONE_STATUSES = ['Approved', 'Delivered'];

/* ---------- Generic helpers ---------- */
const uid = (p) => p + '_' + Math.random().toString(36).slice(2, 9);
const now = () => new Date().toISOString();
const daysFromNow = (n, hour = 10) => { const d = new Date(); d.setHours(hour, 0, 0, 0); return new Date(d.getTime() + n * DAY).toISOString(); };
const addDays = (iso, n) => new Date(new Date(iso).getTime() + n * DAY).toISOString();
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / DAY);

/* =========================================================
   SEED DATA — dates are relative to "today" so the demo
   always looks current.
   ========================================================= */
function seed() {
  const db = { users: [], clients: [], services: [], requests: [], projects: [], deliverables: [], revisions: [], activity: [], notifications: [], meta: { seq: 1000, seededAt: now() } };

  /* Services */
  const svc = (id, name, description, baseDays, icon, color) => db.services.push({ id, name, description, baseDays, icon, color, active: true });
  svc('s_gd', 'Graphic Design', 'Logos, brand identity, print collateral, packaging and layouts.', 10, 'pen', '#e85002');
  svc('s_web', 'Web Development', 'Websites, landing pages and web apps built responsive-first.', 25, 'code', '#646464');
  svc('s_vid', 'Video Editing', 'Promotional videos, reels, testimonials and motion graphics.', 12, 'film', '#c10801');
  svc('s_pres', 'Presentation Design', 'Pitch decks, reports and keynote presentations.', 6, 'present', '#e89a0c');
  svc('s_soc', 'Social Media Content', 'Campaign visuals, captions and monthly content calendars.', 8, 'share', '#9c7653');

  /* Agency users */
  const user = (id, name, email, role, title, extra = {}) => db.users.push(Object.assign({ id, name, email, password: 'demo123', role, title, createdAt: daysFromNow(-200) }, extra));
  user('u_admin', 'Maria Reyes', 'admin@flowdesk.test', 'admin', 'Agency Manager');
  user('u_carlo', 'Carlo Mendoza', 'carlo@flowdesk.test', 'staff', 'Senior Graphic Designer', { skills: ['s_gd', 's_pres'] });
  user('u_bea', 'Bea Villanueva', 'bea@flowdesk.test', 'staff', 'Web Developer', { skills: ['s_web'] });
  user('u_josh', 'Josh Tan', 'josh@flowdesk.test', 'staff', 'Video Editor', { skills: ['s_vid'] });
  user('u_lia', 'Lia Cruz', 'lia@flowdesk.test', 'staff', 'Content Strategist', { skills: ['s_soc', 's_gd'] });

  /* Clients + their portal accounts */
  const client = (id, company, contact, email, phone, industry, userId) => {
    db.clients.push({ id, company, contact, email, phone, industry, createdAt: daysFromNow(-180), notes: '' });
    db.users.push({ id: userId, name: contact, email, password: 'demo123', role: 'client', clientId: id, title: company, createdAt: daysFromNow(-180) });
  };
  client('c_brew', 'Brewhaus Coffee Co.', 'Daniel Lim', 'client@brewhaus.test', '+63 917 555 0101', 'Food & Beverage', 'u_c_brew');
  client('c_north', 'Northpeak Outdoors', 'Sofia Garcia', 'sofia@northpeak.test', '+63 917 555 0102', 'Retail', 'u_c_north');
  client('c_lumen', 'Lumen Dental Clinic', 'Paolo Rivera', 'paolo@lumendental.test', '+63 917 555 0103', 'Healthcare', 'u_c_lumen');
  client('c_kasa', 'Kasa Home Studio', 'Nina Aquino', 'nina@kasahome.test', '+63 917 555 0104', 'Interior Design', 'u_c_kasa');

  const clientUser = { c_brew: 'u_c_brew', c_north: 'u_c_north', c_lumen: 'u_c_lumen', c_kasa: 'u_c_kasa' };

  const feedbackBank = [
    { fb: 'Looks great overall, but the colors feel too muted for our brand.', ch: ['Use a warmer, more saturated palette', 'Increase contrast of the headline'] },
    { fb: 'Can we try a different layout for the hero section?', ch: ['Move product image to the left', 'Shorten the intro copy'] },
    { fb: 'The pacing in the middle part is a bit slow.', ch: ['Trim the B-roll segment by ~5 seconds', 'Add captions throughout'] },
    { fb: 'Please align the typography with our brand guidelines.', ch: ['Replace font with brand typeface', 'Adjust heading sizes'] },
    { fb: 'Almost there! Just a few small fixes.', ch: ['Fix typo on page 3', 'Update logo to latest version'] },
  ];

  const ext = { s_gd: 'pdf', s_web: 'zip', s_vid: 'mp4', s_pres: 'pptx', s_soc: 'zip' };

  /* Project blueprints */
  const P = [
    // client,   service, staff,   title,                      status,          created, dur/dl, revs, rating, priority, progress
    ['c_brew', 's_gd', 'u_carlo', 'Brand Identity Refresh', 'Delivered', -95, { dur: 18, dl: 21 }, 2, 5, 'High'],
    ['c_north', 's_web', 'u_bea', 'E-commerce Website', 'Delivered', -80, { dur: 40, dl: 35 }, 3, 4, 'High'],
    ['c_lumen', 's_soc', 'u_lia', 'Q3 Social Media Kit', 'Delivered', -60, { dur: 9, dl: 10 }, 1, 5, 'Medium'],
    ['c_kasa', 's_vid', 'u_josh', 'Product Launch Video', 'Delivered', -50, { dur: 14, dl: 12 }, 2, 4, 'High'],
    ['c_brew', 's_pres', 'u_carlo', 'Investor Pitch Deck', 'Delivered', -35, { dur: 6, dl: 7 }, 0, 5, 'Urgent'],
    ['c_brew', 's_vid', 'u_josh', 'Barista Training Reel', 'Delivered', -120, { dur: 11, dl: 14 }, 1, 5, 'Low'],
    ['c_north', 's_gd', 'u_carlo', 'Product Packaging Design', 'Delivered', -140, { dur: 25, dl: 21 }, 4, 3, 'Medium'],
    ['c_north', 's_vid', 'u_josh', 'Trail Series Teaser', 'Approved', -20, { dur: 15, dl: 18 }, 1, null, 'Medium'],
    ['c_lumen', 's_web', 'u_bea', 'Clinic Booking Website', 'Client Review', -25, { dlFromToday: 5 }, 1, null, 'High', 90],
    ['c_kasa', 's_gd', 'u_carlo', 'Catalog Layout 2027', 'Revision', -18, { dlFromToday: 3 }, 2, null, 'Medium', 75],
    ['c_brew', 's_soc', 'u_lia', 'Holiday Campaign Content', 'In Progress', -10, { dlFromToday: -2 }, 0, null, 'Urgent', 65],
    ['c_north', 's_pres', 'u_carlo', 'Annual Report Deck', 'In Progress', -6, { dlFromToday: 6 }, 0, null, 'Medium', 40],
    ['c_lumen', 's_vid', 'u_josh', 'Patient Testimonial Video', 'Assigned', -2, { dlFromToday: 14 }, 0, null, 'Low', 0],
    ['c_kasa', 's_web', 'u_bea', 'Portfolio Microsite', 'Client Review', -15, { dlFromToday: -1 }, 0, null, 'High', 95],
  ];

  const descBank = {
    s_gd: 'Design a cohesive visual system that reflects the brand personality across print and digital touchpoints.',
    s_web: 'Build a fast, responsive website with a clean CMS-friendly structure and mobile-first layouts.',
    s_vid: 'Produce an engaging edited video with color grading, music, captions and branded titles.',
    s_pres: 'Create a polished presentation deck with data visualizations and consistent brand styling.',
    s_soc: 'Produce a set of on-brand social posts, stories and captions for the campaign period.',
  };
  const reqBank = {
    s_gd: 'Vector source files, PNG exports, brand color codes.',
    s_web: 'Responsive design, contact form, SEO basics, Google Analytics.',
    s_vid: '1080p and vertical 9:16 versions, subtitles, licensed music.',
    s_pres: '16:9 format, editable PowerPoint, speaker notes.',
    s_soc: '12 feed posts, 6 stories, captions with hashtags.',
  };

  P.forEach((b, i) => {
    const [clientId, serviceId, staffId, title, status, createdOff, timing, revs, rating, priority, progress] = b;
    const created = daysFromNow(createdOff, 9);
    const pid = 'p_' + (i + 1);
    const code = 'FD-' + (1001 + i);
    const reqId = 'r_' + (i + 1);
    const deadline = timing.dl != null ? addDays(created, timing.dl) : daysFromNow(timing.dlFromToday, 17);
    const startedAt = status === 'Assigned' ? null : addDays(created, 1);
    const completedAt = timing.dur != null ? addDays(created, timing.dur) : null;
    const deliveredAt = status === 'Delivered' ? addDays(completedAt, 1) : null;
    const s = db.services.find(x => x.id === serviceId);

    db.requests.push({
      id: reqId, clientId, serviceId, title, description: descBank[serviceId], requirements: reqBank[serviceId],
      deadline, priority, status: 'Converted', createdAt: addDays(created, -1), reviewedBy: 'u_admin',
      reviewNote: 'Scope is clear and fits our capacity.', projectId: pid,
    });

    const project = {
      id: pid, code, requestId: reqId, clientId, serviceId, staffId, title,
      description: descBank[serviceId], requirements: reqBank[serviceId],
      priority, deadline, status, progress: DONE_STATUSES.includes(status) ? 100 : (progress || 0),
      createdAt: created, startedAt, completedAt, deliveredAt, rating: status === 'Delivered' ? rating : null,
      ratingComment: status === 'Delivered' ? ['Great work, very responsive team!', 'Smooth process from start to finish.', 'Happy with the result — a few delays but worth it.'][i % 3] : '',
    };
    db.projects.push(project);

    const log = (at, userId, text, type = 'info') => db.activity.push({ id: uid('a'), projectId: pid, userId, text, at, type });
    log(addDays(created, -1), clientUser[clientId], `Submitted service request "${title}"`, 'request');
    log(created, 'u_admin', `Accepted request and created project ${code}`, 'create');
    log(addDays(created, 0.05), 'u_admin', `Assigned to ${db.users.find(u => u.id === staffId).name}`, 'assign');
    if (startedAt) log(startedAt, staffId, 'Started work on the project', 'progress');

    // Deliverables & revisions
    let nDeliv = 0;
    if (['Client Review', 'Approved', 'Delivered'].includes(status)) nDeliv = revs + 1;
    else if (status === 'Revision') nDeliv = revs;
    const end = completedAt || daysFromNow(0);
    const span = Math.max(1, (new Date(end) - new Date(startedAt || created)) / DAY);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    for (let v = 1; v <= nDeliv; v++) {
      const at = addDays(startedAt, (span * v) / (nDeliv + 0.5));
      const isLast = v === nDeliv;
      let dStatus = 'Revision Requested';
      if (isLast) dStatus = status === 'Client Review' ? 'Pending Review' : (status === 'Revision' ? 'Revision Requested' : 'Approved');
      const did = uid('d');
      db.deliverables.push({
        id: did, projectId: pid, version: v, title: `${s.name} — Version ${v}`,
        notes: v === 1 ? 'Initial draft based on the approved brief.' : `Updated version addressing revision #${v - 1}.`,
        fileName: `${slug}-v${v}.${ext[serviceId]}`, fileSize: Math.round(800 + Math.random() * 24000) * 1024,
        fileData: null, link: '', submittedBy: staffId, submittedAt: at, status: dStatus,
        reviewedAt: dStatus !== 'Pending Review' ? addDays(at, 1) : null,
      });
      log(at, staffId, `Submitted deliverable v${v} for client review`, 'deliverable');
      if (dStatus === 'Revision Requested') {
        const fb = feedbackBank[(i + v) % feedbackBank.length];
        const open = status === 'Revision' && isLast;
        db.revisions.push({
          id: uid('rv'), projectId: pid, deliverableId: did, number: v, feedback: fb.fb, changes: fb.ch,
          requestedBy: clientUser[clientId], requestedAt: addDays(at, 1), status: open ? 'Open' : 'Addressed',
          resolvedAt: open ? null : addDays(at, 1 + span / (nDeliv + 0.5)), response: open ? '' : 'Changes applied in the next version.',
        });
        log(addDays(at, 1), clientUser[clientId], `Requested revision #${v}: "${fb.fb}"`, 'revision');
      } else if (dStatus === 'Approved') {
        log(completedAt, clientUser[clientId], `Approved deliverable v${v}`, 'approve');
      }
    }
    if (deliveredAt) {
      log(deliveredAt, staffId, 'Marked project as delivered — final files handed over', 'deliver');
      log(addDays(deliveredAt, 0.5), clientUser[clientId], `Rated the service ${rating}/5`, 'rating');
    }
  });

  /* Open requests (not yet projects) */
  db.requests.push(
    { id: 'r_101', clientId: 'c_lumen', serviceId: 's_gd', title: 'Clinic Signage Set', description: 'Wayfinding and reception signage for our new branch, consistent with our existing branding.', requirements: '6 sign designs, print-ready PDFs, material recommendations.', deadline: daysFromNow(20, 17), priority: 'Medium', status: 'Pending', createdAt: daysFromNow(-1, 14), reviewNote: '', projectId: null },
    { id: 'r_102', clientId: 'c_kasa', serviceId: 's_soc', title: 'Instagram Reels Pack', description: 'Short reels showing before/after transformations of our recent interior projects.', requirements: '8 reels, 15–30s each, trending audio suggestions.', deadline: daysFromNow(15, 17), priority: 'High', status: 'Under Review', createdAt: daysFromNow(-3, 11), reviewedBy: 'u_admin', reviewNote: 'Checking video editor availability.', projectId: null },
    { id: 'r_103', clientId: 'c_brew', serviceId: 's_web', title: 'Online Ordering Page', description: 'A simple page where customers can browse our menu and pre-order for pickup.', requirements: 'Menu listing, order form, mobile-friendly.', deadline: daysFromNow(30, 17), priority: 'High', status: 'Pending', createdAt: daysFromNow(0, 8), reviewNote: '', projectId: null },
    { id: 'r_104', clientId: 'c_north', serviceId: 's_gd', title: 'Event Banner', description: 'Banner for a weekend pop-up event.', requirements: 'One 3x6ft banner.', deadline: daysFromNow(-8, 17), priority: 'Urgent', status: 'Rejected', createdAt: daysFromNow(-12, 10), reviewedBy: 'u_admin', reviewNote: 'Requested timeline was too short for print production. Please resubmit with at least 7 days lead time.', projectId: null },
  );

  /* Some starter notifications */
  const note = (userId, text, link, offset, read = false) => db.notifications.push({ id: uid('n'), userId, text, link, at: daysFromNow(offset, 12), read });
  note('u_admin', 'New service request: "Online Ordering Page" from Brewhaus Coffee Co.', '#/requests', 0);
  note('u_admin', 'New service request: "Clinic Signage Set" from Lumen Dental Clinic', '#/requests', -1);
  note('u_admin', 'FD-1011 "Holiday Campaign Content" is overdue', '#/project/p_11', 0);
  note('u_carlo', 'Kasa Home Studio requested revision #2 on "Catalog Layout 2027"', '#/project/p_10', -1);
  note('u_bea', 'Portfolio Microsite deliverable v1 is awaiting client review', '#/project/p_14', -2, true);
  note('u_josh', 'You were assigned to "Patient Testimonial Video"', '#/project/p_13', -2);
  note('u_lia', '"Holiday Campaign Content" passed its deadline', '#/project/p_11', 0);
  note('u_c_lumen', 'New deliverable v2 is ready for your review on "Clinic Booking Website"', '#/project/p_9', -1);
  note('u_c_kasa', 'Deliverable v1 is ready for your review on "Portfolio Microsite"', '#/project/p_14', -3);
  note('u_c_north', '"Trail Series Teaser" was approved — final delivery is being prepared', '#/project/p_8', -1, true);
  note('u_c_brew', 'Your request "Online Ordering Page" was received', '#/requests', 0);

  db.meta.seq = 1001 + P.length;
  return db;
}

/* =========================================================
   STORE
   ========================================================= */
const Store = {
  data: null,

  load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      this.data = raw ? JSON.parse(raw) : seed();
    } catch (e) {
      this.data = seed();
    }
    this.save();
  },
  save() {
    try { localStorage.setItem(DB_KEY, JSON.stringify(this.data)); return true; }
    catch (e) { if (window.UI) UI.toast('Storage is full — try a smaller file.', 'error'); return false; }
  },
  reset() { this.data = seed(); this.save(); },

  all(col) { return this.data[col]; },
  get(col, id) { return this.data[col].find(x => x.id === id); },
  where(col, fn) { return this.data[col].filter(fn); },

  user(id) { return this.get('users', id); },
  client(id) { return this.get('clients', id); },
  service(id) { return this.get('services', id); },
  project(id) { return this.get('projects', id); },
  staff() { return this.where('users', u => u.role === 'staff'); },

  nextCode() { this.data.meta.seq += 1; return 'FD-' + this.data.meta.seq; },

  log(projectId, userId, text, type = 'info') {
    this.data.activity.push({ id: uid('a'), projectId, userId, text, at: now(), type });
  },
  notify(userIds, text, link) {
    [].concat(userIds).filter(Boolean).forEach(userId => {
      this.data.notifications.push({ id: uid('n'), userId, text, link, at: now(), read: false });
    });
  },
  clientUserIds(clientId) { return this.where('users', u => u.role === 'client' && u.clientId === clientId).map(u => u.id); },
  adminIds() { return this.where('users', u => u.role === 'admin').map(u => u.id); },
};

/* =========================================================
   METRICS — computed analytics for dashboards & reports
   ========================================================= */
const Metrics = {
  isDone: (p) => DONE_STATUSES.includes(p.status),
  isOverdue(p) { return !this.isDone(p) && new Date(p.deadline) < new Date(); },
  wasOnTime(p) { return p.completedAt ? new Date(p.completedAt) <= new Date(p.deadline) : null; },
  daysLeft(p) { return daysBetween(new Date(), p.deadline); },
  revisionCount(p) { return Store.where('revisions', r => r.projectId === p.id).length; },
  durationDays(p) { return p.completedAt ? Math.max(1, daysBetween(p.createdAt, p.completedAt)) : null; },

  /** Deadline health label for SLA indicator */
  health(p) {
    if (p.status === 'Delivered') return { key: 'done', label: 'Delivered' };
    if (p.status === 'Approved') return { key: 'done', label: 'Approved' };
    const d = this.daysLeft(p);
    if (d < 0) return { key: 'overdue', label: `${Math.abs(d)}d overdue` };
    if (d === 0) return { key: 'risk', label: 'Due today' };
    if (d <= 3) return { key: 'risk', label: `${d}d left` };
    return { key: 'ok', label: `${d}d left` };
  },

  summary(projects) {
    const done = projects.filter(p => this.isDone(p));
    const durations = done.map(p => this.durationDays(p)).filter(Boolean);
    const onTime = done.filter(p => this.wasOnTime(p)).length;
    const rated = projects.filter(p => p.rating);
    const revs = projects.map(p => this.revisionCount(p));
    const active = projects.filter(p => !this.isDone(p));
    const overdue = active.filter(p => this.isOverdue(p)).length;
    const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const onTimeRate = done.length ? onTime / done.length : 0;
    const csat = avg(rated.map(p => p.rating));
    const avgRev = avg(revs);
    // Service Health Score (0–100): weighted blend of on-time delivery, satisfaction, first-pass quality, and active risk
    const activeRisk = active.length ? overdue / active.length : 0;
    const health = Math.round(
      onTimeRate * 35 +
      (rated.length ? csat / 5 : 0.8) * 30 +
      (1 - Math.min(avgRev / 4, 1)) * 20 +
      (1 - activeRisk) * 15
    );
    return {
      total: projects.length, active: active.length, done: done.length,
      delivered: projects.filter(p => p.status === 'Delivered').length,
      pendingReview: projects.filter(p => p.status === 'Client Review').length,
      inRevision: projects.filter(p => p.status === 'Revision').length,
      overdue, onTime, late: done.length - onTime, onTimeRate,
      avgDuration: avg(durations), avgRevisions: avgRev, csat, ratedCount: rated.length, health,
    };
  },
};
