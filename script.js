/* =========================================================
   In-memory data store — mirrors the MySQL schema's tables.
   No backend yet: this is where the CRM's sample data lives.
   ========================================================= */
const db = {
  users: [
    { user_id: 1, name: "G Keerthi", role: "SalesRep", color: "#B54834" },
    { user_id: 2, name: "P Sai Ashwika", role: "SalesRep", color: "#4C6E4C" },
    { user_id: 3, name: "C Thanvi", role: "Manager", color: "#A2761F" },
  ],

  leads: [
    { lead_id: 1, name: "Ravi Teja", email: "ravi.teja@mail.com", phone: "9876543210", source: "Referral", status: "New", assigned_to: 1 },
    { lead_id: 2, name: "Ananya Rao", email: "ananya.rao@mail.com", phone: "9812345670", source: "Website", status: "Contacted", assigned_to: 2 },
    { lead_id: 3, name: "Farhan Sheikh", email: "farhan.s@mail.com", phone: "9765432109", source: "Ad Campaign", status: "Qualified", assigned_to: 3 },
  ],

  customers: [
    { customer_id: 1, lead_id: null, name: "Meera Enterprises", email: "contact@meera.biz", phone: "9900112233", company: "Meera Enterprises", assigned_to: 1 },
    { customer_id: 2, lead_id: null, name: "Kiran Textiles", email: "kiran@textiles.in", phone: "9811223344", company: "Kiran Textiles", assigned_to: 3 },
  ],

  products: [
    { product_id: 1, name: "CRM Starter Plan", price: 4999 },
    { product_id: 2, name: "CRM Pro Plan", price: 9999 },
    { product_id: 3, name: "Onboarding & Setup", price: 2500 },
  ],

  interactions: [
    { interaction_id: 1, customer_id: 1, lead_id: null, logged_by: 1, type: "Call", notes: "Discussed renewal terms.", interaction_date: "2026-09-01 10:30" },
    { interaction_id: 2, customer_id: null, lead_id: 3, logged_by: 3, type: "Email", notes: "Sent pricing sheet.", interaction_date: "2026-09-03 15:10" },
    { interaction_id: 3, customer_id: 2, lead_id: null, logged_by: 3, type: "Meeting", notes: "On-site demo of Pro plan.", interaction_date: "2026-09-05 12:00" },
  ],

  sales: [
    { sale_id: 1, customer_id: 1, handled_by: 1, total_amount: 9999, status: "Completed", sale_date: "2026-08-28" },
    { sale_id: 2, customer_id: 2, handled_by: 3, total_amount: 4999, status: "Pending", sale_date: "2026-09-04" },
  ],

  followups: [
    { followup_id: 1, customer_id: 1, lead_id: null, assigned_to: 1, due_date: "2026-09-10", status: "Pending", remarks: "Confirm renewal invoice." },
    { followup_id: 2, customer_id: null, lead_id: 3, assigned_to: 3, due_date: "2026-09-06", status: "Pending", remarks: "Follow up on pricing sheet." },
    { followup_id: 3, customer_id: 2, lead_id: null, assigned_to: 3, due_date: "2026-08-30", status: "Missed", remarks: "Missed check-in call." },
  ],
};

let nextId = { lead: 4, customer: 3, interaction: 4, sale: 3, followup: 4 };

/* =========================================================
   Helpers
   ========================================================= */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function getUser(id) { return db.users.find(u => u.user_id === id); }
function userName(id) {
  const u = getUser(id);
  return u ? u.name : "—";
}
function initials(name) {
  return name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
}
function avatarHTML(userId) {
  const u = getUser(userId);
  if (!u) return "";
  return `<span class="avatar" style="background:${u.color}">${initials(u.name)}</span>`;
}
function customerName(id) {
  const c = db.customers.find(c => c.customer_id === id);
  return c ? c.name : null;
}
function leadName(id) {
  const l = db.leads.find(l => l.lead_id === id);
  return l ? l.name : null;
}
function contactName(customer_id, lead_id) {
  return customerName(customer_id) || leadName(lead_id) || "—";
}
function fmtMoney(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}
function statusStamp(status) {
  const map = {
    New: "stamp-gold", Contacted: "stamp-gold", Qualified: "stamp-sage", Converted: "stamp-sage", Lost: "stamp-neutral",
    Pending: "stamp-gold", Completed: "stamp-sage", Cancelled: "stamp-neutral", Missed: "stamp-rust",
  };
  return `<span class="stamp ${map[status] || "stamp-neutral"}">${status}</span>`;
}
function showToast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("is-shown");
  setTimeout(() => t.classList.remove("is-shown"), 2200);
}

/* =========================================================
   Navigation
   ========================================================= */
$$(".rail-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    $$(".rail-tab").forEach(t => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    $$(".view").forEach(v => v.classList.remove("is-active"));
    $("#view-" + tab.dataset.view).classList.add("is-active");
  });
});

/* =========================================================
   Renderers
   ========================================================= */
function renderHero() {
  const now = new Date();
  $("#heroDate").textContent = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const thisMonth = now.toISOString().slice(0, 7);
  const revenue = db.sales
    .filter(s => s.status === "Completed" && s.sale_date.slice(0, 7) === thisMonth)
    .reduce((sum, s) => sum + s.total_amount, 0);
  $("#sealRevenue").textContent = fmtMoney(revenue);
}

function renderDashboard() {
  renderHero();

  const totalCustomers = db.customers.length;
  const openLeads = db.leads.filter(l => l.status !== "Converted").length;
  const pendingFollowups = db.followups.filter(f => f.status === "Pending" || f.status === "Missed").length;
  const revenue = db.sales.filter(s => s.status === "Completed").reduce((sum, s) => sum + s.total_amount, 0);

  $("#statRow").innerHTML = [
    { label: "Total customers", value: totalCustomers, color: "var(--sage)" },
    { label: "Open leads", value: openLeads, color: "var(--gold)" },
    { label: "Follow-ups due", value: pendingFollowups, color: "var(--rust)" },
    { label: "Revenue (completed)", value: fmtMoney(revenue), color: "var(--ink)" },
  ].map(s => `
    <div class="stat-ticket" style="--accent-color:${s.color}">
      <div class="stat-num">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>
  `).join("");

  const today = new Date().toISOString().slice(0, 10);
  const overdue = db.followups.filter(f => f.due_date < today && f.status !== "Completed");
  $("#overdueCount").textContent = overdue.length;
  $("#overdueList").innerHTML = overdue.length
    ? overdue.map(f => `<li><span>${contactName(f.customer_id, f.lead_id)} — ${f.remarks}</span><span class="li-meta">${f.due_date}</span></li>`).join("")
    : `<li class="empty-note">Nothing overdue. Good pace.</li>`;

  const recent = [...db.interactions].sort((a, b) => b.interaction_date.localeCompare(a.interaction_date)).slice(0, 5);
  $("#recentInteractionsList").innerHTML = recent.length
    ? recent.map(i => `<li><span>${contactName(i.customer_id, i.lead_id)} — ${i.type}</span><span class="li-meta">${i.interaction_date.slice(0, 10)}</span></li>`).join("")
    : `<li class="empty-note">No interactions logged yet.</li>`;
}

function renderLeads() {
  const grid = $("#leadsGrid");
  if (!db.leads.length) { grid.innerHTML = `<div class="empty-state">No leads yet — add the first one.</div>`; return; }
  grid.innerHTML = db.leads.map(l => `
    <div class="index-card card-lead" data-kind="lead" data-id="${l.lead_id}">
      <div class="card-top">
        ${avatarHTML(l.assigned_to)}
        <div>
          <div class="card-name">${l.name}</div>
          <div class="card-sub">${l.source} · ${userName(l.assigned_to)}</div>
        </div>
      </div>
      <div class="card-row"><span>Email</span><span>${l.email || "—"}</span></div>
      <div class="card-row"><span>Phone</span><span>${l.phone || "—"}</span></div>
      <div class="card-foot">${statusStamp(l.status)}</div>
    </div>
  `).join("");
}

function renderCustomers() {
  const grid = $("#customersGrid");
  if (!db.customers.length) { grid.innerHTML = `<div class="empty-state">No customers yet — convert a lead or add one directly.</div>`; return; }
  grid.innerHTML = db.customers.map(c => `
    <div class="index-card card-customer" data-kind="customer" data-id="${c.customer_id}">
      <div class="card-top">
        ${avatarHTML(c.assigned_to)}
        <div>
          <div class="card-name">${c.name}</div>
          <div class="card-sub">${c.company || "—"} · ${userName(c.assigned_to)}</div>
        </div>
      </div>
      <div class="card-row"><span>Email</span><span>${c.email || "—"}</span></div>
      <div class="card-row"><span>Phone</span><span>${c.phone || "—"}</span></div>
    </div>
  `).join("");
}

function renderInteractions() {
  const tbody = $("#interactionsTable tbody");
  if (!db.interactions.length) { tbody.innerHTML = `<tr><td colspan="5" class="empty-note">No interactions logged yet.</td></tr>`; return; }
  const rows = [...db.interactions].sort((a, b) => b.interaction_date.localeCompare(a.interaction_date));
  tbody.innerHTML = rows.map(i => `
    <tr data-kind="interaction" data-id="${i.interaction_id}">
      <td>${i.interaction_date}</td>
      <td>${contactName(i.customer_id, i.lead_id)}</td>
      <td>${i.type}</td>
      <td>${i.notes || "—"}</td>
      <td><span class="cell-with-avatar">${avatarHTML(i.logged_by)}${userName(i.logged_by)}</span></td>
    </tr>
  `).join("");
}

function renderSales() {
  const tbody = $("#salesTable tbody");
  if (!db.sales.length) { tbody.innerHTML = `<tr><td colspan="5" class="empty-note">No sales recorded yet.</td></tr>`; return; }
  const rows = [...db.sales].sort((a, b) => b.sale_date.localeCompare(a.sale_date));
  tbody.innerHTML = rows.map(s => `
    <tr data-kind="sale" data-id="${s.sale_id}">
      <td>${s.sale_date}</td>
      <td>${customerName(s.customer_id) || "—"}</td>
      <td>${fmtMoney(s.total_amount)}</td>
      <td>${statusStamp(s.status)}</td>
      <td><span class="cell-with-avatar">${avatarHTML(s.handled_by)}${userName(s.handled_by)}</span></td>
    </tr>
  `).join("");
}

function renderFollowups() {
  const grid = $("#followupsGrid");
  if (!db.followups.length) { grid.innerHTML = `<div class="empty-state">No follow-ups scheduled.</div>`; return; }
  const today = new Date().toISOString().slice(0, 10);
  const rows = [...db.followups].sort((a, b) => a.due_date.localeCompare(b.due_date));
  grid.innerHTML = rows.map(f => {
    const overdue = f.due_date < today && f.status === "Pending";
    return `
    <div class="index-card card-followup" data-kind="followup" data-id="${f.followup_id}">
      <div class="card-top">
        ${avatarHTML(f.assigned_to)}
        <div>
          <div class="card-name">${contactName(f.customer_id, f.lead_id)}</div>
          <div class="card-sub">${userName(f.assigned_to)}</div>
        </div>
      </div>
      <div class="card-row"><span>Due</span><span>${f.due_date}${overdue ? " (overdue)" : ""}</span></div>
      <div class="card-row"><span>Remarks</span><span>${f.remarks || "—"}</span></div>
      <div class="card-foot">${statusStamp(f.status)}</div>
    </div>`;
  }).join("");
}

function renderAll() {
  renderDashboard();
  renderLeads();
  renderCustomers();
  renderInteractions();
  renderSales();
  renderFollowups();
}

/* =========================================================
   Modal + forms (add new records)
   ========================================================= */
const backdrop = $("#modalBackdrop");
const modalTitle = $("#modalTitle");
const modalForm = $("#modalForm");

function userOptions(selectedId) {
  return db.users.map(u => `<option value="${u.user_id}" ${u.user_id === selectedId ? "selected" : ""}>${u.name}</option>`).join("");
}
function customerOptions() {
  return `<option value="">— none —</option>` + db.customers.map(c => `<option value="${c.customer_id}">${c.name}</option>`).join("");
}
function leadOptions() {
  return `<option value="">— none —</option>` + db.leads.map(l => `<option value="${l.lead_id}">${l.name}</option>`).join("");
}

const forms = {
  lead: {
    title: "New lead",
    fields: `
      <div class="field"><label>Name</label><input required name="name"></div>
      <div class="field"><label>Email</label><input type="email" name="email"></div>
      <div class="field"><label>Phone</label><input name="phone"></div>
      <div class="field"><label>Source</label><input name="source" placeholder="Referral, Website, Ad..."></div>
      <div class="field"><label>Assigned to</label><select name="assigned_to">${userOptions()}</select></div>
    `,
    submit(data) {
      db.leads.push({ lead_id: nextId.lead++, name: data.name, email: data.email, phone: data.phone, source: data.source, status: "New", assigned_to: Number(data.assigned_to) });
      renderLeads(); renderDashboard();
      showToast("Lead added.");
    },
  },
  customer: {
    title: "New customer",
    fields: `
      <div class="field"><label>Name</label><input required name="name"></div>
      <div class="field"><label>Company</label><input name="company"></div>
      <div class="field"><label>Email</label><input type="email" name="email"></div>
      <div class="field"><label>Phone</label><input name="phone"></div>
      <div class="field"><label>Assigned to</label><select name="assigned_to">${userOptions()}</select></div>
    `,
    submit(data) {
      db.customers.push({ customer_id: nextId.customer++, lead_id: null, name: data.name, email: data.email, phone: data.phone, company: data.company, assigned_to: Number(data.assigned_to) });
      renderCustomers(); renderDashboard();
      showToast("Customer added.");
    },
  },
  interaction: {
    title: "Log interaction",
    fields: `
      <div class="field"><label>With customer</label><select name="customer_id">${customerOptions()}</select></div>
      <div class="field"><label>Or lead</label><select name="lead_id">${leadOptions()}</select></div>
      <div class="field"><label>Type</label>
        <select name="type"><option>Call</option><option>Email</option><option>Meeting</option><option>Other</option></select>
      </div>
      <div class="field"><label>Notes</label><textarea name="notes"></textarea></div>
      <div class="field"><label>Logged by</label><select name="logged_by">${userOptions()}</select></div>
    `,
    submit(data) {
      if (!data.customer_id && !data.lead_id) { showToast("Pick a customer or a lead."); return false; }
      db.interactions.push({
        interaction_id: nextId.interaction++,
        customer_id: data.customer_id ? Number(data.customer_id) : null,
        lead_id: data.lead_id ? Number(data.lead_id) : null,
        logged_by: Number(data.logged_by),
        type: data.type, notes: data.notes,
        interaction_date: new Date().toISOString().slice(0, 16).replace("T", " "),
      });
      renderInteractions(); renderDashboard();
      showToast("Interaction logged.");
    },
  },
  sale: {
    title: "New sale",
    fields: `
      <div class="field"><label>Customer</label><select required name="customer_id">${customerOptions()}</select></div>
      <div class="field"><label>Amount (₹)</label><input required type="number" min="0" name="total_amount"></div>
      <div class="field"><label>Status</label>
        <select name="status"><option>Pending</option><option>Completed</option><option>Cancelled</option></select>
      </div>
      <div class="field"><label>Handled by</label><select name="handled_by">${userOptions()}</select></div>
    `,
    submit(data) {
      if (!data.customer_id) { showToast("Pick a customer."); return false; }
      db.sales.push({
        sale_id: nextId.sale++, customer_id: Number(data.customer_id), handled_by: Number(data.handled_by),
        total_amount: Number(data.total_amount), status: data.status,
        sale_date: new Date().toISOString().slice(0, 10),
      });
      renderSales(); renderDashboard();
      showToast("Sale recorded.");
    },
  },
  followup: {
    title: "New follow-up",
    fields: `
      <div class="field"><label>With customer</label><select name="customer_id">${customerOptions()}</select></div>
      <div class="field"><label>Or lead</label><select name="lead_id">${leadOptions()}</select></div>
      <div class="field"><label>Due date</label><input required type="date" name="due_date"></div>
      <div class="field"><label>Remarks</label><textarea name="remarks"></textarea></div>
      <div class="field"><label>Assigned to</label><select name="assigned_to">${userOptions()}</select></div>
    `,
    submit(data) {
      if (!data.customer_id && !data.lead_id) { showToast("Pick a customer or a lead."); return false; }
      db.followups.push({
        followup_id: nextId.followup++,
        customer_id: data.customer_id ? Number(data.customer_id) : null,
        lead_id: data.lead_id ? Number(data.lead_id) : null,
        assigned_to: Number(data.assigned_to), due_date: data.due_date, status: "Pending", remarks: data.remarks,
      });
      renderFollowups(); renderDashboard();
      showToast("Follow-up scheduled.");
    },
  },
};

function openForm(kind) {
  const cfg = forms[kind];
  modalTitle.textContent = cfg.title;
  modalForm.innerHTML = cfg.fields + `
    <div class="form-actions">
      <button type="button" class="btn btn-ghost" id="modalCancel">Cancel</button>
      <button type="submit" class="btn btn-primary">Save</button>
    </div>`;
  modalForm.dataset.kind = kind;
  backdrop.classList.add("is-open");
  $("#modalCancel").addEventListener("click", closeModal);
}
function closeModal() {
  backdrop.classList.remove("is-open");
  modalForm.innerHTML = "";
}

$$("[data-open-form]").forEach(btn => {
  btn.addEventListener("click", () => openForm(btn.dataset.openForm));
});
$("#modalClose").addEventListener("click", closeModal);
backdrop.addEventListener("click", e => { if (e.target === backdrop) closeModal(); });

modalForm.addEventListener("submit", e => {
  e.preventDefault();
  const kind = modalForm.dataset.kind;
  const data = Object.fromEntries(new FormData(modalForm).entries());
  const result = forms[kind].submit(data);
  if (result !== false) closeModal();
});

/* =========================================================
   Detail view (click a card/row to see everything + actions)
   ========================================================= */
const detailBackdrop = $("#detailBackdrop");
const detailTitle = $("#detailTitle");
const detailBody = $("#detailBody");

function closeDetail() {
  detailBackdrop.classList.remove("is-open");
  detailBody.innerHTML = "";
}
$("#detailClose").addEventListener("click", closeDetail);
detailBackdrop.addEventListener("click", e => { if (e.target === detailBackdrop) closeDetail(); });

function actionBtn(label, handler, opts = {}) {
  const id = "act-" + Math.random().toString(36).slice(2, 9);
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", handler);
  }, 0);
  return `<button type="button" id="${id}" class="btn btn-small ${opts.danger ? "btn-danger" : "btn-ghost"}">${label}</button>`;
}

function deleteRecord(table, idField, id, rerender) {
  const idx = db[table].findIndex(r => r[idField] === id);
  if (idx > -1) db[table].splice(idx, 1);
  rerender();
  renderDashboard();
  closeDetail();
  showToast("Deleted.");
}

function openDetailLead(id) {
  const l = db.leads.find(x => x.lead_id === id);
  if (!l) return;
  detailTitle.textContent = l.name;
  detailBody.innerHTML = `
    <p class="detail-sub">${l.source} · assigned to ${userName(l.assigned_to)}</p>
    <ul class="detail-rows">
      <li><span>Email</span><span>${l.email || "—"}</span></li>
      <li><span>Phone</span><span>${l.phone || "—"}</span></li>
      <li><span>Status</span><span>${statusStamp(l.status)}</span></li>
    </ul>
    <p class="detail-section-label">Actions</p>
    <div class="detail-actions">
      ${actionBtn("Mark Contacted", () => { l.status = "Contacted"; renderLeads(); openDetailLead(id); })}
      ${actionBtn("Mark Qualified", () => { l.status = "Qualified"; renderLeads(); openDetailLead(id); })}
      ${actionBtn("Convert to customer", () => convertLead(id))}
      ${actionBtn("Mark Lost", () => { l.status = "Lost"; renderLeads(); openDetailLead(id); })}
      ${actionBtn("Delete lead", () => deleteRecord("leads", "lead_id", id, renderLeads), { danger: true })}
    </div>
  `;
  detailBackdrop.classList.add("is-open");
}

function convertLead(id) {
  const l = db.leads.find(x => x.lead_id === id);
  if (!l) return;
  db.customers.push({
    customer_id: nextId.customer++, lead_id: l.lead_id, name: l.name,
    email: l.email, phone: l.phone, company: l.name, assigned_to: l.assigned_to,
  });
  l.status = "Converted";
  renderLeads(); renderCustomers(); renderDashboard();
  closeDetail();
  showToast(l.name + " converted to customer.");
}

function openDetailCustomer(id) {
  const c = db.customers.find(x => x.customer_id === id);
  if (!c) return;
  detailTitle.textContent = c.name;
  detailBody.innerHTML = `
    <p class="detail-sub">${c.company || "—"} · assigned to ${userName(c.assigned_to)}</p>
    <ul class="detail-rows">
      <li><span>Email</span><span>${c.email || "—"}</span></li>
      <li><span>Phone</span><span>${c.phone || "—"}</span></li>
    </ul>
    <p class="detail-section-label">Actions</p>
    <div class="detail-actions">
      ${actionBtn("Log interaction", () => { closeDetail(); openForm("interaction"); })}
      ${actionBtn("New sale", () => { closeDetail(); openForm("sale"); })}
      ${actionBtn("New follow-up", () => { closeDetail(); openForm("followup"); })}
      ${actionBtn("Delete customer", () => deleteRecord("customers", "customer_id", id, renderCustomers), { danger: true })}
    </div>
  `;
  detailBackdrop.classList.add("is-open");
}

function openDetailInteraction(id) {
  const i = db.interactions.find(x => x.interaction_id === id);
  if (!i) return;
  detailTitle.textContent = i.type + " — " + contactName(i.customer_id, i.lead_id);
  detailBody.innerHTML = `
    <p class="detail-sub">${i.interaction_date} · logged by ${userName(i.logged_by)}</p>
    <ul class="detail-rows">
      <li><span>Notes</span><span>${i.notes || "—"}</span></li>
    </ul>
    <p class="detail-section-label">Actions</p>
    <div class="detail-actions">
      ${actionBtn("Delete interaction", () => deleteRecord("interactions", "interaction_id", id, renderInteractions), { danger: true })}
    </div>
  `;
  detailBackdrop.classList.add("is-open");
}

function openDetailSale(id) {
  const s = db.sales.find(x => x.sale_id === id);
  if (!s) return;
  detailTitle.textContent = customerName(s.customer_id) + " — " + fmtMoney(s.total_amount);
  detailBody.innerHTML = `
    <p class="detail-sub">${s.sale_date} · handled by ${userName(s.handled_by)}</p>
    <ul class="detail-rows">
      <li><span>Amount</span><span>${fmtMoney(s.total_amount)}</span></li>
      <li><span>Status</span><span>${statusStamp(s.status)}</span></li>
    </ul>
    <p class="detail-section-label">Actions</p>
    <div class="detail-actions">
      ${actionBtn("Mark Completed", () => { s.status = "Completed"; renderSales(); renderDashboard(); openDetailSale(id); })}
      ${actionBtn("Mark Cancelled", () => { s.status = "Cancelled"; renderSales(); renderDashboard(); openDetailSale(id); })}
      ${actionBtn("Delete sale", () => deleteRecord("sales", "sale_id", id, renderSales), { danger: true })}
    </div>
  `;
  detailBackdrop.classList.add("is-open");
}

function openDetailFollowup(id) {
  const f = db.followups.find(x => x.followup_id === id);
  if (!f) return;
  detailTitle.textContent = contactName(f.customer_id, f.lead_id);
  detailBody.innerHTML = `
    <p class="detail-sub">Assigned to ${userName(f.assigned_to)} · due ${f.due_date}</p>
    <ul class="detail-rows">
      <li><span>Remarks</span><span>${f.remarks || "—"}</span></li>
      <li><span>Status</span><span>${statusStamp(f.status)}</span></li>
    </ul>
    <p class="detail-section-label">Actions</p>
    <div class="detail-actions">
      ${actionBtn("Mark Completed", () => { f.status = "Completed"; renderFollowups(); renderDashboard(); openDetailFollowup(id); })}
      ${actionBtn("Mark Missed", () => { f.status = "Missed"; renderFollowups(); renderDashboard(); openDetailFollowup(id); })}
      ${actionBtn("Delete follow-up", () => deleteRecord("followups", "followup_id", id, renderFollowups), { danger: true })}
    </div>
  `;
  detailBackdrop.classList.add("is-open");
}

const detailOpeners = {
  lead: openDetailLead,
  customer: openDetailCustomer,
  interaction: openDetailInteraction,
  sale: openDetailSale,
  followup: openDetailFollowup,
};

// Event delegation: any element carrying data-kind/data-id opens its detail view.
// Clicks on buttons (like "+ New lead") are excluded since those don't carry data-kind.
document.querySelector(".stage").addEventListener("click", e => {
  const el = e.target.closest("[data-kind][data-id]");
  if (!el) return;
  const kind = el.dataset.kind;
  const id = Number(el.dataset.id);
  if (detailOpeners[kind]) detailOpeners[kind](id);
});

/* =========================================================
   Boot
   ========================================================= */
renderAll();
