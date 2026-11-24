/* =========================================================
   FlowDesk — Workflow Engine
   Enforces the service lifecycle:
   Request → Review → Assignment → In Progress → Client Review
           → Revision → Approval → Delivery
   ========================================================= */

const Workflow = {
  /* ---------- Service Requests ---------- */
  submitRequest(user, data) {
    const client = Store.client(user.clientId);
    const req = {
      id: uid('r'),
      clientId: user.clientId,
      serviceId: data.serviceId,
      title: data.title.trim(),
      description: data.description.trim(),
      requirements: (data.requirements || '').trim(),
      deadline: new Date(data.deadline + 'T17:00:00').toISOString(),
      priority: data.priority,
      status: 'Pending',
      createdAt: now(),
      reviewNote: '',
      projectId: null,
    };
    Store.data.requests.push(req);
    Store.notify(
      Store.adminIds(),
      `New service request: "${req.title}" from ${client.company}`,
      '#/requests'
    );
    Store.save();
    return req;
  },

  markUnderReview(reqId, user) {
    const r = Store.get('requests', reqId);
    r.status = 'Under Review';
    r.reviewedBy = user.id;
    Store.notify(
      Store.clientUserIds(r.clientId),
      `Your request "${r.title}" is now under review`,
      '#/requests'
    );
    Store.save();
  },

  rejectRequest(reqId, user, note) {
    const r = Store.get('requests', reqId);
    r.status = 'Rejected';
    r.reviewedBy = user.id;
    r.reviewNote = note;
    Store.notify(
      Store.clientUserIds(r.clientId),
      `Your request "${r.title}" was declined. See note for details.`,
      '#/requests'
    );
    Store.save();
  },

  /** Accept a request and convert it into a project (Assignment stage) */
  convertRequest(reqId, user, { title, staffId, deadline, priority }) {
    const r = Store.get('requests', reqId);
    const p = this._createProject(
      {
        requestId: r.id,
        clientId: r.clientId,
        serviceId: r.serviceId,
        staffId,
        title: title || r.title,
        description: r.description,
        requirements: r.requirements,
        priority,
        deadline,
      },
      user
    );
    r.status = 'Converted';
    r.reviewedBy = user.id;
    r.projectId = p.id;
    r.reviewNote = r.reviewNote || 'Accepted and converted to project.';
    Store.data.activity.push({
      id: uid('a'),
      projectId: p.id,
      userId: Store.clientUserIds(r.clientId)[0],
      text: `Submitted service request "${r.title}"`,
      at: r.createdAt,
      type: 'request',
    });
    Store.notify(
      Store.clientUserIds(r.clientId),
      `Great news! "${r.title}" was accepted and is now project ${p.code}`,
      '#/project/' + p.id
    );
    Store.save();
    return p;
  },

  /** Admin creates a project directly (e.g. walk-in client) */
  createProject(user, data) {
    const p = this._createProject(data, user);
    Store.notify(
      Store.clientUserIds(p.clientId),
      `A new project "${p.title}" (${p.code}) was opened for you`,
      '#/project/' + p.id
    );
    Store.save();
    return p;
  },

  _createProject(d, user) {
    const p = {
      id: uid('p'),
      code: Store.nextCode(),
      requestId: d.requestId || null,
      clientId: d.clientId,
      serviceId: d.serviceId,
      staffId: d.staffId,
      title: d.title.trim(),
      description: d.description || '',
      requirements: d.requirements || '',
      priority: d.priority,
      deadline: new Date(d.deadline + 'T17:00:00').toISOString(),
      status: 'Assigned',
      progress: 0,
      createdAt: now(),
      startedAt: null,
      completedAt: null,
      deliveredAt: null,
      rating: null,
      ratingComment: '',
    };
    Store.data.projects.push(p);
    const staff = Store.user(p.staffId);
    Store.log(p.id, user.id, `Created project ${p.code}`, 'create');
    Store.log(p.id, user.id, `Assigned to ${staff.name}`, 'assign');
    Store.notify(p.staffId, `You were assigned to "${p.title}" (${p.code})`, '#/project/' + p.id);
    return p;
  },

  /* ---------- Assignment management ---------- */
  updateAssignment(projectId, user, { staffId, deadline, priority }) {
    const p = Store.project(projectId);
    if (staffId && staffId !== p.staffId) {
      const prev = Store.user(p.staffId);
      p.staffId = staffId;
      Store.log(
        p.id,
        user.id,
        `Reassigned from ${prev.name} to ${Store.user(staffId).name}`,
        'assign'
      );
      Store.notify(staffId, `You were assigned to "${p.title}" (${p.code})`, '#/project/' + p.id);
    }
    const newDl = new Date(deadline + 'T17:00:00').toISOString();
    if (deadline && newDl.slice(0, 10) !== p.deadline.slice(0, 10)) {
      p.deadline = newDl;
      Store.log(p.id, user.id, `Changed deadline to ${UI.date(newDl)}`, 'info');
      Store.notify(
        [p.staffId, ...Store.clientUserIds(p.clientId)],
        `Deadline for "${p.title}" changed to ${UI.date(newDl)}`,
        '#/project/' + p.id
      );
    }
    if (priority && priority !== p.priority) {
      Store.log(p.id, user.id, `Changed priority from ${p.priority} to ${priority}`, 'info');
      p.priority = priority;
    }
    Store.save();
  },

  /* ---------- Delivery ---------- */
  startWork(projectId, user) {
    const p = Store.project(projectId);
    p.status = 'In Progress';
    p.startedAt = now();
    p.progress = Math.max(p.progress, 10);
    Store.log(p.id, user.id, 'Started work on the project', 'progress');
    Store.notify(
      Store.clientUserIds(p.clientId),
      `Work has started on "${p.title}"`,
      '#/project/' + p.id
    );
    Store.save();
  },

  updateProgress(projectId, user, pct) {
    const p = Store.project(projectId);
    const old = p.progress;
    p.progress = Math.max(0, Math.min(100, pct));
    if (old !== p.progress)
      Store.log(p.id, user.id, `Updated progress to ${p.progress}%`, 'progress');
    Store.save();
  },

  /** Staff submits a new deliverable version → Client Review */
  submitDeliverable(
    projectId,
    user,
    { title, notes, fileName, fileSize, fileType, fileData, link, response }
  ) {
    const p = Store.project(projectId);
    const versions = Store.where('deliverables', d => d.projectId === p.id);
    const version = versions.length + 1;
    const d = {
      id: uid('d'),
      projectId: p.id,
      version,
      title: title || `Version ${version}`,
      notes: notes || '',
      fileName: fileName || '',
      fileSize: fileSize || 0,
      fileType: fileType || '',
      fileData: fileData || null,
      link: link || '',
      submittedBy: user.id,
      submittedAt: now(),
      status: 'Pending Review',
      reviewedAt: null,
    };
    Store.data.deliverables.push(d);
    // close any open revision with the staff response
    Store.where('revisions', r => r.projectId === p.id && r.status === 'Open').forEach(r => {
      r.status = 'Addressed';
      r.resolvedAt = now();
      r.response = response || `Addressed in version ${version}.`;
    });
    p.status = 'Client Review';
    p.progress = Math.max(p.progress, 90);
    Store.log(p.id, user.id, `Submitted deliverable v${version} for client review`, 'deliverable');
    Store.notify(
      Store.clientUserIds(p.clientId),
      `New deliverable v${version} is ready for your review on "${p.title}"`,
      '#/project/' + p.id
    );
    if (!Store.save()) {
      // rollback heavy file if storage failed
      d.fileData = null;
      Store.save();
    }
    return d;
  },

  /** Client approves a deliverable → Approval */
  approveDeliverable(deliverableId, user) {
    const d = Store.get('deliverables', deliverableId);
    const p = Store.project(d.projectId);
    d.status = 'Approved';
    d.reviewedAt = now();
    p.status = 'Approved';
    p.completedAt = now();
    p.progress = 100;
    Store.log(p.id, user.id, `Approved deliverable v${d.version}`, 'approve');
    Store.notify(
      [p.staffId, ...Store.adminIds()],
      `${Store.client(p.clientId).company} approved v${d.version} of "${p.title}"`,
      '#/project/' + p.id
    );
    Store.save();
  },

  /** Client requests changes → Revision */
  requestRevision(deliverableId, user, { feedback, changes }) {
    const d = Store.get('deliverables', deliverableId);
    const p = Store.project(d.projectId);
    const number = Store.where('revisions', r => r.projectId === p.id).length + 1;
    d.status = 'Revision Requested';
    d.reviewedAt = now();
    Store.data.revisions.push({
      id: uid('rv'),
      projectId: p.id,
      deliverableId: d.id,
      number,
      feedback,
      changes,
      requestedBy: user.id,
      requestedAt: now(),
      status: 'Open',
      resolvedAt: null,
      response: '',
    });
    p.status = 'Revision';
    p.progress = Math.min(p.progress, 75);
    Store.log(p.id, user.id, `Requested revision #${number}: "${feedback}"`, 'revision');
    const recipients = [p.staffId];
    if (number >= 3) recipients.push(...Store.adminIds());
    Store.notify(
      recipients,
      `${Store.client(p.clientId).company} requested revision #${number} on "${p.title}"`,
      '#/project/' + p.id
    );
    Store.save();
  },

  /** Final handover → Delivery */
  markDelivered(projectId, user) {
    const p = Store.project(projectId);
    p.status = 'Delivered';
    p.deliveredAt = now();
    Store.log(p.id, user.id, 'Marked project as delivered — final files handed over', 'deliver');
    Store.notify(
      Store.clientUserIds(p.clientId),
      `"${p.title}" has been delivered! Please rate our service.`,
      '#/project/' + p.id
    );
    Store.save();
  },

  rateProject(projectId, user, rating, comment) {
    const p = Store.project(projectId);
    p.rating = rating;
    p.ratingComment = comment;
    Store.log(p.id, user.id, `Rated the service ${rating}/5`, 'rating');
    Store.notify(
      [p.staffId, ...Store.adminIds()],
      `${Store.client(p.clientId).company} rated "${p.title}" ${rating}/5`,
      '#/project/' + p.id
    );
    Store.save();
  },

  /* ---------- Directory management ---------- */
  saveClient(data, id) {
    if (id) {
      const c = Store.client(id);
      Object.assign(c, {
        company: data.company,
        contact: data.contact,
        email: data.email,
        phone: data.phone,
        industry: data.industry,
      });
      const u = Store.where('users', x => x.clientId === id)[0];
      if (u) Object.assign(u, { name: data.contact, email: data.email, title: data.company });
    } else {
      const c = {
        id: uid('c'),
        company: data.company,
        contact: data.contact,
        email: data.email,
        phone: data.phone,
        industry: data.industry,
        createdAt: now(),
        notes: '',
      };
      Store.data.clients.push(c);
      Store.data.users.push({
        id: uid('u'),
        name: data.contact,
        email: data.email,
        password: data.password || 'demo123',
        role: 'client',
        clientId: c.id,
        title: c.company,
        createdAt: now(),
      });
    }
    Store.save();
  },

  saveService(data, id) {
    const fields = {
      name: data.name,
      description: data.description,
      baseDays: +data.baseDays || 7,
      icon: data.icon,
      color: data.color,
    };
    if (id) Object.assign(Store.service(id), fields);
    else Store.data.services.push(Object.assign({ id: uid('s'), active: true }, fields));
    Store.save();
  },

  deleteService(id) {
    Store.data.services = Store.data.services.filter(s => s.id !== id);
    Store.save();
  },

  saveStaff(data, id) {
    if (id)
      Object.assign(Store.user(id), { name: data.name, email: data.email, title: data.title });
    else
      Store.data.users.push({
        id: uid('u'),
        name: data.name,
        email: data.email,
        password: data.password || 'demo123',
        role: 'staff',
        title: data.title,
        skills: [],
        createdAt: now(),
      });
    Store.save();
  },
};
