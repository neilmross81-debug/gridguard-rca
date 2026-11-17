/* ==========================================================================
   GridGuard RCA — application
   Storage schema is unchanged from the Flutter build (gridguard_rca_store_v1)
   so existing investigations carry over untouched.
   ========================================================================== */

const STORE_KEY = 'gridguard_rca_store_v1';

/* ---------- vocabularies ---------- */

const SEVERITY = {
  negligible:  { label: 'Negligible',  tone: 'slate' },
  minor:       { label: 'Minor',       tone: 'cyan'  },
  major:       { label: 'Major',       tone: 'amber' },
  critical:    { label: 'Critical',    tone: 'red'   },
  catastrophic:{ label: 'Catastrophic',tone: 'red'   },
};

const STATUS = {
  draft:      { label: 'Draft',       tone: 'slate' },
  inProgress: { label: 'In Progress', tone: 'cyan'  },
  inReview:   { label: 'In Review',   tone: 'amber' },
  closed:     { label: 'Closed',      tone: 'green' },
};

const FAULT = {
  electrical:  'Electrical',
  mechanical:  'Mechanical',
  instrument:  'Instrumentation',
  control:     'Control & Automation',
  process:     'Process',
  human:       'Human Factors',
  structural:  'Structural',
  environmental:'Environmental',
  other:       'Other',
};

const ASSET = {
  substationOsp:   'Offshore Substation (OSP)',
  substationOnshore:'Onshore Substation',
  windTurbine:     'Wind Turbine Generator',
  arrayCable:      'Array Cable',
  exportCable:     'Export Cable',
  hvSwitchgear:    'HV Switchgear',
  transformer:     'Transformer',
  protection:      'Protection & Control',
  other:           'Other',
};

const VECTOR = {
  man:         'Man — Personnel',
  machine:     'Machine — Equipment',
  material:    'Material',
  method:      'Method',
  measurement: 'Measurement',
  milieu:      'Milieu — Environment',
};

const CAPA_TYPE = { corrective: 'Corrective', preventive: 'Preventive' };
const CAPA_STATUS = {
  open:       { label: 'Open',        tone: 'slate' },
  inProgress: { label: 'In Progress', tone: 'cyan'  },
  verified:   { label: 'Verified',    tone: 'green' },
  overdue:    { label: 'Overdue',     tone: 'red'   },
  closed:     { label: 'Closed',      tone: 'green' },
};

const TAB_LABELS = [
  ['overview',  'Overview'],
  ['whys',      '5 Whys'],
  ['ishikawa',  'Ishikawa 6M'],
  ['fmea',      'FMEA'],
  ['capa',      'CAPA Plan'],
  ['report',    'Report'],
];

/* ---------- helpers ---------- */

/* Every value interpolated into a view template below is passed through esc() first
   (and attribute values are additionally quoted), so the innerHTML assignments in the
   view functions only ever receive markup this file generated, never raw user input. */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const uid = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const icon = (name) => ICONS[name] || '';

const ICONS = {
  clipboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v0a2 2 0 0 1 2-2Z"/><path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const fmtDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' UTC';
};
const toDateInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toISOString().slice(0, 10);
};
const fromDateInput = (v) => (v ? new Date(v + 'T00:00:00.000').toISOString() : null);
const chip = (label, tone = 'slate') => `<span class="chip chip-${tone}">${esc(label)}</span>`;
const sevChip = (s) => { const m = SEVERITY[s]; return m ? chip(m.label, m.tone) : chip(s || '—'); };
const statusChip = (s) => { const m = STATUS[s]; return m ? chip(m.label, m.tone) : chip(s || '—'); };
const capaChip = (s) => { const m = CAPA_STATUS[s]; return m ? chip(m.label, m.tone) : chip(s || '—'); };

const rpnOf = (f) => Number(f.severity || 0) * Number(f.occurrence || 0) * Number(f.detection || 0);
const riskBand = (rpn) => rpn >= 200 ? ['Critical', 'red'] : rpn >= 100 ? ['High', 'amber'] : rpn >= 50 ? ['Medium', 'cyan'] : ['Low', 'green'];

/* ---------- store ---------- */

function seed() {
  const INV = 'rca-osp1-220kv-gis-001';
  return {
    investigations: [{
      id: INV,
      document_code: 'RCA-2026-OSP1-004',
      title: '220kV GIS Bay 04 SF6 Low-Pressure Trip & SCADA Telemetry Loss',
      facility_name: 'North Sea Offshore Substation OSP-01',
      asset_category: 'substationOsp',
      equipment_tag: 'OSP1-220KV-GIS-BAY04',
      voltage_class: '220 kV / IEC 61850',
      severity: 'catastrophic',
      fault_category: 'electrical',
      status: 'inReview',
      incident_date: '2026-11-14T03:42:00.000',
      investigator_name: 'Henrik Lindqvist',
      investigator_role: 'Lead HV Operations Engineer',
      executive_summary: 'At 03:42 UTC on 14 Nov 2026, 220kV Gas-Insulated Switchgear (GIS) Bay 04 experienced a Stage-2 SF6 density lockout trip, isolating Export Transformer TX-02 (240 MW curtailment). Concurrently, the primary SCADA RTU gateway dropped IEC 61850 MMS telemetry for 18 minutes due to an unbuffered DC auxiliary bus sag during breaker trip coil actuation.',
      root_cause_conclusion: 'Primary Root Cause: Accelerated galvanic corrosion on the Bay 04 SF6 density sensor flange seal caused by marine salt-mist ingress through a degraded IP66 gland, compounded by an undersized 110V DC auxiliary battery bank that sagged below RTU brownout threshold during simultaneous trip-coil energization.',
      drive_share_url: null,
      updated_at: '2026-11-16T14:20:00.000',
    }],
    five_whys_nodes: [
      { id: 'w-1', investigation_id: INV, parent_id: null, level: 1, question: 'Why did 220kV GIS Bay 04 trip offline and curtail 240 MW?', answer: 'Protection relay P543 executed a Stage-2 SF6 low-density lockout trip on CB-04.', evidence: 'COMTRADE fault record #4419 & SOE log 03:42:11.204 UTC.', is_root_cause: 0, sort_order: 1 },
      { id: 'w-2', investigation_id: INV, parent_id: 'w-1', level: 2, question: 'Why did SF6 compartment pressure drop below the 0.52 MPa lockout threshold?', answer: 'SF6 gas leaked past the density monitor manifold O-ring flange on Phase B.', evidence: 'Ultrasonic leak detector & SF6 sniffer confirmed 1,400 ppm at flange.', is_root_cause: 0, sort_order: 2 },
      { id: 'w-3', investigation_id: INV, parent_id: 'w-2', level: 3, question: 'Why did the Phase B manifold O-ring flange lose sealing integrity?', answer: 'Pitting corrosion deformed the aluminium sealing groove beneath the EPDM O-ring.', evidence: 'Borescope inspection photo IMG_0412 showing white oxide pitting.', is_root_cause: 0, sort_order: 3 },
      { id: 'w-4', investigation_id: INV, parent_id: 'w-3', level: 4, question: 'Why did pitting corrosion occur on an IP66-rated offshore GIS manifold?', answer: 'Moisture and salt-mist condensed inside the sensor junction box due to a cracked cable gland boot.', evidence: 'Maintenance log shows non-UV-stabilised rubber boot installed in 2023.', is_root_cause: 0, sort_order: 4 },
      { id: 'w-5', investigation_id: INV, parent_id: 'w-4', level: 5, question: 'Why was a non-marine-grade boot installed and not caught during inspection?', answer: 'Spare parts BOM lacked offshore C5-M marine specification, and annual PM checklist omitted gland boot UV-cracking checks.', evidence: 'SAP Material Master #88214 & PM-OSP-220-02 rev 3.', is_root_cause: 1, sort_order: 5 },
      { id: 'w-6', investigation_id: INV, parent_id: 'w-1', level: 2, question: 'Why did SCADA RTU Gateway lose IEC 61850 telemetry for 18 minutes?', answer: 'RTU CPU rebooted repeatedly due to 110V DC bus voltage dropping to 84V DC.', evidence: 'PQ analyser log on Aux DC Bus A: 84.2V DC dip for 380 ms.', is_root_cause: 0, sort_order: 6 },
      { id: 'w-7', investigation_id: INV, parent_id: 'w-6', level: 3, question: 'Why did the 110V DC bus sag to 84V DC during breaker tripping?', answer: 'Aux Battery Bank B had 3 failed NiCd cells (high internal resistance) while Charger A was in float mode.', evidence: 'Cell impedance test: Cells #14, #15, #16 measured >18 mOhm.', is_root_cause: 0, sort_order: 7 },
      { id: 'w-8', investigation_id: INV, parent_id: 'w-7', level: 4, question: 'Why were failed battery cells not alarmed in SCADA prior to the trip?', answer: 'The battery monitoring unit (BMU) alarm contact was wired as a common minor fault masked by an existing charger fan alarm.', evidence: 'RTU DI mapping table & alarm suppression log.', is_root_cause: 0, sort_order: 8 },
      { id: 'w-9', investigation_id: INV, parent_id: 'w-8', level: 5, question: 'Why was the BMU critical cell-impedance alarm grouped into a masked common DI?', answer: 'Commissioning FAT/SAT did not enforce individual SCADA point segregation for DC auxiliary health alarms.', evidence: 'SAT-OSP1-AUX-009 punchlist sign-off.', is_root_cause: 1, sort_order: 9 },
    ],
    ishikawa_causes: [
      { id: 'ish-1', investigation_id: INV, vector: 'machine', cause: 'Corroded SF6 density flange groove', detail: 'Galvanic pitting on aluminium manifold under Phase B sensor.', is_primary: 1 },
      { id: 'ish-2', investigation_id: INV, vector: 'machine', cause: 'Degraded 110V DC NiCd cells (#14-16)', detail: 'High internal impedance caused 26V bus sag under trip coil load.', is_primary: 1 },
      { id: 'ish-3', investigation_id: INV, vector: 'material', cause: 'Non-marine-grade EPDM cable boot', detail: 'Cracked under UV/salt exposure; BOM lacked C5-M spec.', is_primary: 1 },
      { id: 'ish-4', investigation_id: INV, vector: 'man', cause: 'Alarm fatigue during offshore campaign', detail: 'Common minor Aux alarm acknowledged without field verification.', is_primary: 0 },
      { id: 'ish-5', investigation_id: INV, vector: 'method', cause: 'PM checklist omitted gland integrity', detail: 'PM-OSP-220-02 checked SF6 pressure only, not enclosure seals.', is_primary: 0 },
      { id: 'ish-6', investigation_id: INV, vector: 'measurement', cause: 'Masked BMU common alarm in SCADA', detail: 'Battery fault masked by persistent charger fan minor alarm.', is_primary: 1 },
      { id: 'ish-7', investigation_id: INV, vector: 'milieu', cause: 'High-salinity North Sea condensation', detail: '94% RH & 18 m/s salt spray accelerated flange crevice corrosion.', is_primary: 0 },
    ],
    fmea_items: [
      { id: 'fmea-1', investigation_id: INV, component: '220kV GIS SF6 Manifold Seal', failure_mode: 'Crevice corrosion & micro-leakage', potential_effect: 'Stage-2 lockout trip & 240 MW export loss', potential_cause: 'Salt-mist ingress via cracked non-marine gland boot', current_controls: 'Annual SF6 pressure log & Stage-1 SCADA alarm', severity: 9, occurrence: 5, detection: 6 },
      { id: 'fmea-2', investigation_id: INV, component: '110V DC Aux Battery Bank B', failure_mode: 'High internal cell resistance / voltage sag', potential_effect: 'SCADA RTU brownout & loss of substation visibility', potential_cause: 'NiCd cell ageing beyond design impedance', current_controls: 'Annual impedance test only', severity: 8, occurrence: 6, detection: 7 },
      { id: 'fmea-3', investigation_id: INV, component: 'SCADA RTU Gateway (IEC 61850)', failure_mode: 'Unbuffered reboot on DC dip < 88V', potential_effect: '18-minute telemetry & SOE blind spot', potential_cause: 'No DC hold-up capacitance on RTU supply', current_controls: 'UPS on comms rack (not RTU direct)', severity: 7, occurrence: 4, detection: 5 },
      { id: 'fmea-4', investigation_id: INV, component: 'SAP Spare Parts BOM', failure_mode: 'Incorrect elastomer specification', potential_effect: 'Premature boot cracking in C5-M offshore environment', potential_cause: 'BOM not reviewed against offshore corrosion class', current_controls: 'Manual parts selection', severity: 6, occurrence: 5, detection: 4 },
    ],
    capa_actions: [
      { id: 'capa-1', investigation_id: INV, type: 'corrective', description: 'Resurface Bay 04 Phase B manifold, install Viton O-ring & 316L stainless IP68 cable gland; top-up SF6 to 0.64 MPa.', owner: 'M. Sorensen (Offshore HV Tech)', target_date: '2026-11-16T00:00:00.000', status: 'verified', verification_notes: 'Helium/SF6 sniffer < 5 ppm; Bay 04 re-energized 15 Nov 18:10 UTC.' },
      { id: 'capa-2', investigation_id: INV, type: 'corrective', description: 'Replace failed NiCd cells #14-16 on Aux Battery Bank B and perform 4-hour capacity discharge test.', owner: 'K. Lindholm (DC Systems Lead)', target_date: '2026-11-18T00:00:00.000', status: 'inProgress', verification_notes: 'Replacement cells mobilized on SOV vessel; load bank scheduled.' },
      { id: 'capa-3', investigation_id: INV, type: 'preventive', description: 'Segregate BMU critical cell-impedance & DC-bus under-voltage alarms to dedicated Priority-1 SCADA DIs across all OSPs.', owner: 'A. Patel (SCADA Architect)', target_date: '2026-12-05T00:00:00.000', status: 'open', verification_notes: 'IEC 61850 ICD/CID update drafted for review.' },
      { id: 'capa-4', investigation_id: INV, type: 'preventive', description: 'Update PM-OSP-220-02 to mandate semi-annual UV/salt-ingress inspection on all GIS sensor glands & update SAP BOM to C5-M.', owner: 'H. Lindqvist (Lead HV Ops Eng)', target_date: '2026-12-15T00:00:00.000', status: 'open', verification_notes: 'Pending Change Control Board approval.' },
    ],
    app_settings: {},
  };
}

let DB = null;

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) { DB = seed(); save(); return DB; }
    const parsed = JSON.parse(raw);
    DB = Object.assign(seed(), parsed);
    ['investigations','five_whys_nodes','ishikawa_causes','fmea_items','capa_actions'].forEach(k => {
      if (!Array.isArray(DB[k])) DB[k] = [];
    });
    if (!DB.app_settings || typeof DB.app_settings !== 'object') DB.app_settings = {};
    return DB;
  } catch (e) {
    DB = seed();
    return DB;
  }
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); } catch (e) { toast('Could not save locally — storage may be full'); }
  pushWebhook();
}
const invById = (id) => DB.investigations.find(i => i.id === id);
const byInv = (coll, id) => DB[coll].filter(r => r.investigation_id === id);
const capasByStatus = (s) => DB.capa_actions.filter(c => c.status === s);

/* ---------- optional Apps Script webhook ---------- */

let webhookTimer = null;
function pushWebhook() {
  const url = DB.app_settings?.webhook_url;
  if (!url || !/^https:\/\/script\.google\.com\//.test(url)) return;
  clearTimeout(webhookTimer);
  webhookTimer = setTimeout(async () => {
    try {
      await fetch(url, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ event: 'sync', at: new Date().toISOString(), store: DB }),
      });
    } catch (e) { /* offline is fine — data is local-first */ }
  }, 1200);
}

/* ---------- routing ---------- */

function parseRoute() {
  const h = (location.hash || '#/').replace(/^#\/?/, '');
  const parts = h.split('/').filter(Boolean);
  if (!parts.length) return { page: 'dashboard' };
  if (parts[0] === 'investigations') return { page: parts[1] ? 'rca' : 'investigations', id: parts[1], tab: parts[2] || 'overview' };
  if (parts[0] === 'capas') return { page: 'capas' };
  return { page: 'dashboard' };
}
const go = (hash) => { location.hash = hash; };

/* ---------- shell ---------- */

function render() {
  const r = parseRoute();
  const v = document.getElementById('view');
  if (r.page === 'dashboard')      v.innerHTML = viewDashboard();
  else if (r.page === 'investigations') v.innerHTML = viewInvestigations();
  else if (r.page === 'rca')       v.innerHTML = viewRca(r.id, r.tab);
  else if (r.page === 'capas')     v.innerHTML = viewCapas();

  document.querySelectorAll('.nav-link').forEach(b => {
    const t = b.dataset.route;
    b.classList.toggle('active',
      (t === '#/' && r.page === 'dashboard') ||
      (t === '#/investigations' && (r.page === 'investigations' || r.page === 'rca')) ||
      (t === '#/capas' && r.page === 'capas'));
  });
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

/* ---------- view: dashboard ---------- */

function viewDashboard() {
  const openCapas = DB.capa_actions.filter(c => c.status === 'open' || c.status === 'inProgress');
  const highRpn = DB.fmea_items.filter(f => rpnOf(f) >= 100);
  const critical = DB.investigations.filter(i => i.severity === 'critical' || i.severity === 'catastrophic');

  const stat = (tone, ic, value, label, foot) => `
    <div class="stat tone-${tone}">
      <div class="stat-top"><span class="stat-icon">${icon(ic)}</span><span class="stat-label">${label}</span></div>
      <div class="stat-value">${value}</div>
      <div class="stat-foot">${foot}</div>
    </div>`;

  const rows = DB.investigations
    .slice().sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
    .map(i => rcaRow(i)).join('') || `<div class="empty"><strong>No investigations yet</strong>Create your first RCA to begin tracking root causes and corrective actions.</div>`;

  const capaRows = DB.capa_actions
    .filter(c => c.status === 'open' || c.status === 'inProgress')
    .slice().sort((a, b) => new Date(a.target_date || 0) - new Date(b.target_date || 0))
    .map(c => {
      const inv = invById(c.investigation_id);
      const overdue = c.target_date && new Date(c.target_date) < new Date() && c.status !== 'verified';
      return `<div class="rca-row" style="grid-template-columns:1fr auto;cursor:default" data-goto="#/investigations/${c.investigation_id}/capa">
        <div>
          <div class="rca-title" style="font-size:14px">${esc(c.description).slice(0, 118)}${c.description.length > 118 ? '…' : ''}</div>
          <div class="rca-meta"><span>${esc(c.owner || 'Unassigned')}</span><span>${esc(inv ? inv.document_code : '')}</span><span>Due ${fmtDate(c.target_date)}</span></div>
        </div>
        <div class="chip-row">${chip(CAPA_TYPE[c.type] || c.type, c.type === 'preventive' ? 'cyan' : 'accent')}${overdue ? chip('Overdue', 'red') : capaChip(c.status)}</div>
      </div>`;
    }).join('') || `<div class="empty"><strong>No open actions</strong>Every corrective and preventive action is closed out.</div>`;

  return `
  <div class="page-head">
    <div>
      <div class="eyebrow">Operations Overview</div>
      <h1 class="display">Root cause intelligence<br>for HV &amp; renewable assets.</h1>
      <p class="lede">Structured 5 Whys, Ishikawa 6M and FMEA analysis with a tracked corrective action plan — one register covering every investigation on the network.</p>
    </div>
    <div class="page-actions">
      <button class="btn" data-route="#/investigations">Open register</button>
      <button class="btn" data-action="print-dashboard">${icon('print')} Export</button>
    </div>
  </div>

  <div class="stats">
    ${stat('cyan',  'clipboard', DB.investigations.length, 'Total RCAs', `${DB.investigations.filter(i => i.status === 'inReview').length} awaiting review`)}
    ${stat('red',   'alert',     critical.length, 'Active Critical', `${critical.filter(i => i.status !== 'closed').length} still open`)}
    ${stat('amber', 'clock',     openCapas.length, 'Open CAPAs', `${DB.capa_actions.length} actions tracked`)}
    ${stat('slate', 'chart',     highRpn.length, 'High RPN (≥100)', `Assessed across ${DB.fmea_items.length} failure modes`)}
  </div>

  <div class="grid-2">
    <section class="section" style="margin-bottom:0">
      <div class="section-head">
        <div><h2 class="h3">Investigations</h2><p>Most recently updated first</p></div>
        <button class="btn btn-ghost btn-sm" data-route="#/investigations">View all</button>
      </div>
      <div class="card"><div class="rca-list">${rows}</div></div>
    </section>

    <section class="section" style="margin-bottom:0">
      <div class="section-head">
        <div><h2 class="h3">Open CAPA actions</h2><p>Ordered by target date</p></div>
        <button class="btn btn-ghost btn-sm" data-route="#/capas">View all</button>
      </div>
      <div class="card"><div class="rca-list">${capaRows}</div></div>
    </section>
  </div>`;
}

function rcaRow(i) {
  return `<div class="rca-row" data-goto="#/investigations/${i.id}/overview">
    <div>${sevChip(i.severity)}</div>
    <div>
      <div class="rca-title">${esc(i.title)}</div>
      <div class="rca-meta">
        <span class="mono">${esc(i.document_code)}</span>
        <span>${esc(i.facility_name)}</span>
        <span>${esc(i.equipment_tag || '—')}</span>
        <span>Updated ${fmtDate(i.updated_at)}</span>
      </div>
    </div>
    <div class="chip-row">${statusChip(i.status)}</div>
  </div>`;
}

/* ---------- view: investigations ---------- */

let invFilter = { q: '', sev: 'all' };

function viewInvestigations() {
  let list = DB.investigations.slice();
  if (invFilter.sev !== 'all') list = list.filter(i => i.severity === invFilter.sev);
  const q = invFilter.q.toLowerCase().trim();
  if (q) list = list.filter(i => [i.title, i.document_code, i.facility_name, i.equipment_tag, i.investigator_name]
    .some(f => String(f || '').toLowerCase().includes(q)));
  list.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

  const seg = ['all', ...Object.keys(SEVERITY)].map(s =>
    `<button class="${invFilter.sev === s ? 'on' : ''}" data-sev="${s}">${s === 'all' ? 'All' : SEVERITY[s].label}</button>`).join('');

  const rows = list.map(i => rcaRow(i)).join('') ||
    `<div class="empty"><strong>Nothing matches</strong>Adjust the filter or create a new investigation.</div>`;

  return `
  <div class="page-head">
    <div>
      <div class="eyebrow">Register</div>
      <h1 class="display">Investigations</h1>
      <p class="lede">${DB.investigations.length} record${DB.investigations.length === 1 ? '' : 's'} in the register.</p>
    </div>
    <div class="page-actions">
      <button class="btn btn-primary" data-action="new-rca">${icon('plus')} New RCA</button>
    </div>
  </div>

  <div class="toolbar">
    <div class="search">${icon('search')}<input class="input" id="invSearch" placeholder="Search title, document code, tag or investigator…" value="${esc(invFilter.q)}"></div>
    <div class="seg" id="sevSeg">${seg}</div>
  </div>

  <div class="card"><div class="rca-list">${rows}</div></div>`;
}

/* ---------- view: single RCA ---------- */

function viewRca(id, tab) {
  const i = invById(id);
  if (!i) return `<div class="empty"><strong>Investigation not found</strong>It may have been deleted. <button class="btn btn-sm" data-route="#/investigations">Back to register</button></div>`;

  const tabs = TAB_LABELS.map(([k, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('');

  return `
  <div class="breadcrumb">
    <button data-route="#/investigations">Investigations</button> <span>/</span> <span class="mono">${esc(i.document_code)}</span>
  </div>

  <div class="page-head">
    <div>
      <div class="eyebrow">${esc(FAULT[i.fault_category] || i.fault_category || 'Unclassified')} · ${esc(ASSET[i.asset_category] || i.asset_category || '')}</div>
      <h1 class="display" style="font-size:clamp(24px,2.6vw,34px)">${esc(i.title)}</h1>
      <div class="chip-row" style="margin-top:16px">
        ${sevChip(i.severity)} ${statusChip(i.status)}
        ${chip(i.voltage_class || '—', 'slate')}
      </div>
    </div>
    <div class="page-actions">
      <button class="btn" data-action="edit-rca" data-id="${i.id}">${icon('edit')} Edit</button>
      <button class="btn" data-action="print">${icon('print')} Report</button>
      <button class="icon-btn" data-action="del-rca" data-id="${i.id}" title="Delete investigation" aria-label="Delete investigation">${icon('trash')}</button>
    </div>
  </div>

  <div class="tabs" id="tabs">${tabs}</div>
  <div id="tabBody">${tabBody(i, tab)}</div>`;
}

function tabBody(i, tab) {
  if (tab === 'whys')     return tabWhys(i);
  if (tab === 'ishikawa') return tabIshikawa(i);
  if (tab === 'fmea')     return tabFmea(i);
  if (tab === 'capa')     return tabCapa(i);
  if (tab === 'report')   return tabReport(i);
  return tabOverview(i);
}

function tabOverview(i) {
  return `
  <div class="grid-2">
    <div>
      <section class="section">
        <div class="section-head"><div><h2 class="h3">Executive summary</h2><p>What happened, and what it cost</p></div></div>
        <div class="card card-pad"><p class="muted" style="margin:0">${esc(i.executive_summary || 'No summary recorded yet.')}</p></div>
      </section>
      <section class="section" style="margin-bottom:0">
        <div class="section-head"><div><h2 class="h3">Root cause conclusion</h2><p>Verified primary cause</p></div></div>
        <div class="card card-pad" style="border-left:3px solid var(--accent)">
          <p class="muted" style="margin:0">${esc(i.root_cause_conclusion || 'Not yet concluded.')}</p>
        </div>
      </section>
    </div>
    <section class="section" style="margin-bottom:0">
      <div class="section-head"><div><h2 class="h3">Record details</h2></div></div>
      <div class="card card-pad">
        <dl class="kv">
          <dt>Document ID</dt><dd class="mono">${esc(i.document_code)}</dd>
          <dt>Facility / Site</dt><dd>${esc(i.facility_name)}</dd>
          <dt>Asset category</dt><dd>${esc(ASSET[i.asset_category] || i.asset_category || '—')}</dd>
          <dt>Equipment tag</dt><dd class="mono">${esc(i.equipment_tag || '—')}</dd>
          <dt>System / voltage</dt><dd>${esc(i.voltage_class || '—')}</dd>
          <dt>Incident date</dt><dd>${fmtDateTime(i.incident_date)}</dd>
          <dt>Investigator</dt><dd>${esc(i.investigator_name || '—')}${i.investigator_role ? `<div class="dim" style="font-size:12.5px">${esc(i.investigator_role)}</div>` : ''}</dd>
          <dt>Last updated</dt><dd>${fmtDateTime(i.updated_at)}</dd>
        </dl>
        <div class="divider"></div>
        <div class="chip-row">
          ${chip(byInv('five_whys_nodes', i.id).length + ' why levels', 'slate')}
          ${chip(byInv('ishikawa_causes', i.id).length + ' 6M causes', 'slate')}
          ${chip(byInv('fmea_items', i.id).length + ' failure modes', 'slate')}
          ${chip(byInv('capa_actions', i.id).length + ' actions', 'slate')}
        </div>
      </div>
    </section>
  </div>`;
}

function tabWhys(i) {
  const nodes = byInv('five_whys_nodes', i.id).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const roots = nodes.filter(n => !n.parent_id);
  const chainOne = (n, isBranch) => whyCard(n, isBranch) + nodes.filter(x => x.parent_id === n.id).map(g => chainOne(g, true)).join('');

  const body = roots.map(r => whyCard(r, false) + nodes.filter(n => n.parent_id === r.id).map(c => chainOne(c, true)).join('')).join('')
    || `<div class="empty"><strong>No 5 Whys chain yet</strong>Start with the first "why" and drill down.</div>`;

  return `
  <div class="section-head">
    <div><h2 class="h3">5 Whys interrogative chain</h2><p>Each branch is interrogated until the root cause is verified</p></div>
    <button class="btn btn-sm" data-action="add-why" data-id="${i.id}">${icon('plus')} Add why</button>
  </div>
  ${body}`;
}

function whyCard(n, isBranch) {
  const levelLabel = `Why L${n.level}`;
  const kids = DB.five_whys_nodes.filter(x => x.parent_id === n.id).length;
  return `<div class="why ${n.is_root_cause ? 'root' : ''} ${isBranch ? 'branch' : ''}">
    <div class="why-head">
      <span class="why-level">${levelLabel}</span>
      ${n.is_root_cause ? chip('Verified root cause', 'green') : ''}
      ${isBranch ? chip('Contributing branch', 'amber') : ''}
      <div style="margin-left:auto" class="chip-row no-print">
        <button class="btn btn-ghost btn-sm" data-action="add-why" data-id="${n.investigation_id}" data-parent="${n.id}" data-level="${(n.level || 1) + 1}">${icon('plus')} Branch</button>
        <button class="btn btn-ghost btn-sm" data-action="edit-why" data-why="${n.id}">${icon('edit')}</button>
        <button class="btn btn-ghost btn-sm" data-action="del-why" data-why="${n.id}">${icon('trash')}</button>
      </div>
    </div>
    <div class="why-q">${esc(n.question)}</div>
    ${n.answer ? `<div class="why-a">${esc(n.answer)}</div>` : ''}
    ${n.evidence ? `<div class="why-e"><strong class="dim">Evidence:</strong> ${esc(n.evidence)}</div>` : ''}
  </div>`;
}

function tabIshikawa(i) {
  const causes = byInv('ishikawa_causes', i.id);
  const groups = Object.keys(VECTOR).map(v => {
    const items = causes.filter(c => c.vector === v);
    return `<div class="ish">
      <h4>${esc(VECTOR[v])}</h4>
      <ul>${items.map(c => `<li>
        <strong>${c.is_primary ? '<span style="color:var(--accent)">◆ </span>' : ''}${esc(c.cause)}</strong>
        ${esc(c.detail || '')}
        <div class="chip-row no-print" style="margin-top:7px">
          <button class="btn btn-ghost btn-sm" data-action="edit-ish" data-ish="${c.id}">${icon('edit')}</button>
          <button class="btn btn-ghost btn-sm" data-action="del-ish" data-ish="${c.id}">${icon('trash')}</button>
        </div>
      </li>`).join('') || '<li class="dim">No causes recorded.</li>'}</ul>
    </div>`;
  }).join('');

  return `
  <div class="section-head">
    <div><h2 class="h3">Ishikawa 6M breakdown</h2><p>◆ marks a primary contributor to the failure</p></div>
    <button class="btn btn-sm" data-action="add-ish" data-id="${i.id}">${icon('plus')} Add cause</button>
  </div>
  <div class="ish-grid">${groups}</div>`;
}

function tabFmea(i) {
  const items = byInv('fmea_items', i.id).slice().sort((a, b) => rpnOf(b) - rpnOf(a));
  const rows = items.map(f => {
    const rpn = rpnOf(f);
    const [band, tone] = riskBand(rpn);
    const pct = Math.min(100, (rpn / 1000) * 100);
    return `<tr>
      <td><strong>${esc(f.component)}</strong><div class="dim" style="font-size:12.5px;margin-top:3px">${esc(f.failure_mode)}</div></td>
      <td class="muted">${esc(f.potential_effect)}</td>
      <td class="muted">${esc(f.current_controls || '—')}</td>
      <td class="num">${f.severity}</td>
      <td class="num">${f.occurrence}</td>
      <td class="num">${f.detection}</td>
      <td class="num" style="font-size:15px;color:var(--${tone === 'red' ? 'red' : tone === 'amber' ? 'amber' : tone === 'cyan' ? 'cyan' : 'green'})">${rpn}</td>
      <td>
        <div class="risk-bar">
          <span class="chip chip-${tone}">${band}</span>
          <span class="risk-track"><span class="risk-fill" style="width:${pct}%;background:var(--${tone})"></span></span>
        </div>
      </td>
      <td class="no-print"><div class="chip-row">
        <button class="btn btn-ghost btn-sm" data-action="edit-fmea" data-fmea="${f.id}">${icon('edit')}</button>
        <button class="btn btn-ghost btn-sm" data-action="del-fmea" data-fmea="${f.id}">${icon('trash')}</button>
      </div></td>
    </tr>`;
  }).join('') || `<tr><td colspan="9"><div class="empty"><strong>No failure modes assessed</strong>Add FMEA rows to score severity, occurrence and detection.</div></td></tr>`;

  return `
  <div class="section-head">
    <div><h2 class="h3">Failure mode &amp; effects analysis</h2><p>RPN = Severity × Occurrence × Detection · ≥100 triggers a corrective action</p></div>
    <button class="btn btn-sm" data-action="add-fmea" data-id="${i.id}">${icon('plus')} Add failure mode</button>
  </div>
  <div class="card table-scroll">
    <table class="table table-wide">
      <thead><tr>
        <th>Component / Mode</th><th>Potential effect</th><th>Current controls</th>
        <th class="num">S</th><th class="num">O</th><th class="num">D</th><th class="num">RPN</th><th>Risk</th><th class="no-print"></th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function tabCapa(i) {
  const items = byInv('capa_actions', i.id).slice().sort((a, b) => new Date(a.target_date || 0) - new Date(b.target_date || 0));
  const rows = items.map(c => {
    const overdue = c.target_date && new Date(c.target_date) < new Date() && !['verified', 'closed'].includes(c.status);
    return `<tr>
      <td>${chip(CAPA_TYPE[c.type] || c.type, c.type === 'preventive' ? 'cyan' : 'accent')}</td>
      <td><strong>${esc(c.description)}</strong>${c.verification_notes ? `<div class="dim" style="font-size:12.5px;margin-top:5px">Verification: ${esc(c.verification_notes)}</div>` : ''}</td>
      <td class="muted">${esc(c.owner || '—')}</td>
      <td class="muted">${fmtDate(c.target_date)}</td>
      <td>${overdue ? chip('Overdue', 'red') : capaChip(c.status)}</td>
      <td class="no-print"><div class="chip-row">
        <button class="btn btn-ghost btn-sm" data-action="edit-capa" data-capa="${c.id}">${icon('edit')}</button>
        <button class="btn btn-ghost btn-sm" data-action="del-capa" data-capa="${c.id}">${icon('trash')}</button>
      </div></td>
    </tr>`;
  }).join('') || `<tr><td colspan="6"><div class="empty"><strong>No actions raised</strong>Add corrective and preventive actions with owners and target dates.</div></td></tr>`;

  const open = items.filter(c => ['open', 'inProgress'].includes(c.status)).length;
  const done = items.filter(c => ['verified', 'closed'].includes(c.status)).length;

  return `
  <div class="section-head">
    <div><h2 class="h3">Corrective &amp; preventive action plan</h2><p>${open} open · ${done} closed out of ${items.length}</p></div>
    <button class="btn btn-sm" data-action="add-capa" data-id="${i.id}">${icon('plus')} Add action</button>
  </div>
  <div class="card table-scroll">
    <table class="table table-wide">
      <thead><tr><th>Type</th><th>Action &amp; verification</th><th>Owner</th><th>Due</th><th>Status</th><th class="no-print"></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function tabReport(i) {
  const whys = byInv('five_whys_nodes', i.id).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const ish = byInv('ishikawa_causes', i.id);
  const fmea = byInv('fmea_items', i.id).slice().sort((a, b) => rpnOf(b) - rpnOf(a));
  const capas = byInv('capa_actions', i.id).slice().sort((a, b) => new Date(a.target_date || 0) - new Date(b.target_date || 0));

  return `
  <div class="report" id="reportBody">
    <div class="section-head no-print">
      <div><h2 class="h3">Generated report</h2><p>Print or save as PDF from the browser dialog</p></div>
      <button class="btn btn-primary btn-sm" data-action="print">${icon('print')} Print / Save PDF</button>
    </div>

    <div class="card card-pad" style="margin-bottom:26px">
      <div class="eyebrow">Industrial Root Cause Analysis Report</div>
      <h1 class="h2" style="margin-bottom:12px">${esc(i.title)}</h1>
      <div class="chip-row" style="margin-bottom:20px">${sevChip(i.severity)} ${statusChip(i.status)}${chip(FAULT[i.fault_category] || '—', 'slate')}</div>
      <dl class="kv">
        <dt>Document ID</dt><dd class="mono">${esc(i.document_code)}</dd>
        <dt>Facility / Site</dt><dd>${esc(i.facility_name)}</dd>
        <dt>Asset hierarchy</dt><dd>${esc(ASSET[i.asset_category] || '—')}</dd>
        <dt>Equipment tag</dt><dd class="mono">${esc(i.equipment_tag || '—')}</dd>
        <dt>System / voltage</dt><dd>${esc(i.voltage_class || '—')}</dd>
        <dt>Incident date</dt><dd>${fmtDateTime(i.incident_date)}</dd>
        <dt>Investigator</dt><dd>${esc(i.investigator_name || '—')}${i.investigator_role ? ' — ' + esc(i.investigator_role) : ''}</dd>
      </dl>
    </div>

    <h2>1. Executive summary</h2>
    <p>${esc(i.executive_summary || '—')}</p>

    <h2>2. 5 Whys interrogative chain</h2>
    ${whys.map(n => `<p><strong>Why L${n.level}${n.is_root_cause ? ' — verified root cause' : ''}:</strong> ${esc(n.question)}<br>
      <span class="muted">Finding: ${esc(n.answer || '—')}</span><br>
      <span class="dim">Evidence: ${esc(n.evidence || '—')}</span></p>`).join('') || '<p class="dim">No chain recorded.</p>'}

    <h2>3. Ishikawa 6M breakdown</h2>
    <table class="table"><thead><tr><th>6M vector</th><th>Identified causes</th></tr></thead><tbody>
      ${Object.keys(VECTOR).map(v => {
        const items = ish.filter(c => c.vector === v);
        if (!items.length) return '';
        return `<tr><td><strong>${esc(VECTOR[v])}</strong></td><td>${items.map(c => `${c.is_primary ? '<strong>[PRIMARY]</strong> ' : ''}${esc(c.cause)}${c.detail ? ' — ' + esc(c.detail) : ''}`).join('<br>')}</td></tr>`;
      }).join('') || '<tr><td colspan="2" class="dim">No causes recorded.</td></tr>'}
    </tbody></table>

    <h2>4. FMEA matrix</h2>
    <table class="table"><thead><tr><th>Component</th><th>Failure mode</th><th>Potential effect</th><th class="num">S</th><th class="num">O</th><th class="num">D</th><th class="num">RPN</th><th>Risk</th></tr></thead><tbody>
      ${fmea.map(f => { const [band, tone] = riskBand(rpnOf(f)); return `<tr>
        <td><strong>${esc(f.component)}</strong></td><td class="muted">${esc(f.failure_mode)}</td><td class="muted">${esc(f.potential_effect)}</td>
        <td class="num">${f.severity}</td><td class="num">${f.occurrence}</td><td class="num">${f.detection}</td>
        <td class="num"><strong>${rpnOf(f)}</strong></td><td>${band}</td></tr>`; }).join('') || '<tr><td colspan="8" class="dim">No failure modes assessed.</td></tr>'}
    </tbody></table>

    <h2>5. Root cause conclusion</h2>
    <p><strong>${esc(i.root_cause_conclusion || 'Not yet concluded.')}</strong></p>

    <h2>6. Corrective &amp; preventive action plan</h2>
    <table class="table"><thead><tr><th>Type</th><th>Action &amp; verification</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead><tbody>
      ${capas.map(c => `<tr>
        <td>${esc(CAPA_TYPE[c.type] || c.type)}</td>
        <td>${esc(c.description)}${c.verification_notes ? `<br><span class="dim">Verification: ${esc(c.verification_notes)}</span>` : ''}</td>
        <td class="muted">${esc(c.owner || '—')}</td><td class="muted">${fmtDate(c.target_date)}</td>
        <td>${(CAPA_STATUS[c.status] || {}).label || esc(c.status)}</td></tr>`).join('') || '<tr><td colspan="5" class="dim">No actions raised.</td></tr>'}
    </tbody></table>

    <div class="divider"></div>
    <p class="dim" style="font-size:12.5px">
      GridGuard RCA Engineering Report · Generated ${fmtDateTime(new Date().toISOString())} ·
      Investigator sign-off <strong>${esc(i.investigator_name || '—')}</strong>, ${esc(i.investigator_role || '')}
    </p>
  </div>`;
}

/* ---------- view: CAPA ---------- */

let capaFilter = 'open';

function viewCapas() {
  let list = DB.capa_actions.slice();
  if (capaFilter === 'open') list = list.filter(c => ['open', 'inProgress'].includes(c.status));
  else if (capaFilter !== 'all') list = list.filter(c => c.status === capaFilter);
  list.sort((a, b) => new Date(a.target_date || 0) - new Date(b.target_date || 0));

  const rows = list.map(c => {
    const inv = invById(c.investigation_id);
    const overdue = c.target_date && new Date(c.target_date) < new Date() && !['verified', 'closed'].includes(c.status);
    return `<tr>
      <td>${chip(CAPA_TYPE[c.type] || c.type, c.type === 'preventive' ? 'cyan' : 'accent')}</td>
      <td><strong>${esc(c.description)}</strong>${c.verification_notes ? `<div class="dim" style="font-size:12.5px;margin-top:5px">${esc(c.verification_notes)}</div>` : ''}</td>
      <td class="muted">${esc(c.owner || '—')}</td>
      <td class="muted">${inv ? `<button class="btn btn-ghost btn-sm" data-goto="#/investigations/${inv.id}/capa"><span class="mono">${esc(inv.document_code)}</span></button>` : '—'}</td>
      <td class="muted">${fmtDate(c.target_date)}</td>
      <td>${overdue ? chip('Overdue', 'red') : capaChip(c.status)}</td>
      <td><div class="chip-row">
        <button class="btn btn-ghost btn-sm" data-action="edit-capa" data-capa="${c.id}">${icon('edit')}</button>
        <button class="btn btn-ghost btn-sm" data-action="del-capa" data-capa="${c.id}">${icon('trash')}</button>
      </div></td>
    </tr>`;
  }).join('') || `<tr><td colspan="7"><div class="empty"><strong>Nothing here</strong>No actions match this filter.</div></td></tr>`;

  const counts = { open: DB.capa_actions.filter(c => ['open', 'inProgress'].includes(c.status)).length, all: DB.capa_actions.length };
  const seg = [['open', `Open (${counts.open})`], ['verified', 'Verified'], ['all', `All (${counts.all})`]]
    .map(([k, l]) => `<button class="${capaFilter === k ? 'on' : ''}" data-capa-filter="${k}">${l}</button>`).join('');

  return `
  <div class="page-head">
    <div>
      <div class="eyebrow">Action Tracking</div>
      <h1 class="display">CAPA Actions</h1>
      <p class="lede">Every corrective and preventive action across all investigations, with owner accountability and verification evidence.</p>
    </div>
  </div>
  <div class="toolbar"><div class="seg" id="capaSeg">${seg}</div></div>
  <div class="card table-scroll">
    <table class="table table-wide">
      <thead><tr><th>Type</th><th>Action &amp; verification</th><th>Owner</th><th>RCA</th><th>Due</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

/* ---------- modal plumbing ---------- */

function openModal({ eyebrow = '', title = '', body = '', foot = '', width = '' }) {
  const host = document.getElementById('modalHost');
  const tpl = document.getElementById('modalTpl').content.cloneNode(true);
  const overlay = tpl.querySelector('[data-overlay]');
  const modal = tpl.querySelector('.modal');
  if (width) modal.classList.add(width);
  tpl.querySelector('[data-eyebrow]').innerHTML = eyebrow;
  tpl.querySelector('[data-title]').textContent = title;
  tpl.querySelector('[data-body]').innerHTML = body;
  tpl.querySelector('[data-foot]').innerHTML = foot;
  host.innerHTML = '';
  host.appendChild(tpl);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  overlay.querySelector('[data-close]').addEventListener('click', closeModal);
  document.addEventListener('keydown', escClose);
}
function closeModal() {
  document.getElementById('modalHost').innerHTML = '';
  document.removeEventListener('keydown', escClose);
}
function escClose(e) { if (e.key === 'Escape') closeModal(); }

function field(label, inner, hint) {
  return `<div class="field"><label>${label}</label>${inner}${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
}
function select(name, options, value) {
  return `<select class="select" name="${name}">${options.map(([v, l]) =>
    `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
}
const optsFrom = (obj) => Object.entries(obj).map(([v, m]) => [v, m.label || m]);

/* ---------- forms ---------- */

function rcaForm(i) {
  const isNew = !i;
  const d = i || {
    document_code: `RCA-${new Date().getFullYear()}-OSP1-${String(DB.investigations.length + 2).padStart(3, '0')}`,
    title: '', facility_name: 'North Sea Offshore Substation OSP-01', asset_category: 'substationOsp',
    equipment_tag: '', voltage_class: '', severity: 'major', fault_category: 'electrical', status: 'inProgress',
    incident_date: new Date().toISOString(), investigator_name: '', investigator_role: '', executive_summary: '',
    root_cause_conclusion: '',
  };

  return {
    eyebrow: isNew ? 'New record' : 'Editing record',
    title: isNew ? 'Create RCA' : 'Edit RCA',
    width: 'wide',
    body: `
      <div class="form-grid">
        ${field('Document ID', `<input class="input" name="document_code" value="${esc(d.document_code)}" required>`)}
        ${field('Severity', select('severity', optsFrom(SEVERITY), d.severity))}
      </div>
      <div class="form-grid">
        <div class="field col-span-2">
          <label>Title</label>
          <input class="input" name="title" value="${esc(d.title)}" placeholder="220kV GIS Bay 04 SF6 Low-Pressure Trip" required>
        </div>
      </div>
      <div class="form-grid">
        ${field('Facility / Site', `<input class="input" name="facility_name" value="${esc(d.facility_name)}">`)}
        ${field('Equipment tag', `<input class="input" name="equipment_tag" value="${esc(d.equipment_tag)}" placeholder="OSP1-220KV-GIS-BAY04">`)}
      </div>
      <div class="form-grid">
        ${field('Asset category', select('asset_category', Object.entries(ASSET), d.asset_category))}
        ${field('Fault category', select('fault_category', Object.entries(FAULT), d.fault_category))}
      </div>
      <div class="form-grid">
        ${field('Status', select('status', optsFrom(STATUS), d.status))}
        ${field('System / voltage class', `<input class="input" name="voltage_class" value="${esc(d.voltage_class)}" placeholder="220 kV / IEC 61850">`)}
      </div>
      <div class="form-grid">
        ${field('Incident date', `<input class="input" type="date" name="incident_date" value="${toDateInput(d.incident_date)}">`)}
        ${field('Investigator name', `<input class="input" name="investigator_name" value="${esc(d.investigator_name)}" placeholder="Henrik Lindqvist">`)}
      </div>
      <div class="form-grid">
        <div class="field col-span-2">
          <label>Investigator role</label>
          <input class="input" name="investigator_role" value="${esc(d.investigator_role)}" placeholder="Lead HV Operations Engineer">
        </div>
      </div>
      <div class="form-grid">
        <div class="field col-span-2">
          <label>Executive summary</label>
          <textarea class="textarea" name="executive_summary" placeholder="What happened, what it cost, what was curtailed…">${esc(d.executive_summary)}</textarea>
        </div>
      </div>
      <div class="form-grid">
        <div class="field col-span-2">
          <label>Root cause conclusion</label>
          <textarea class="textarea" name="root_cause_conclusion" placeholder="Verified primary root cause…">${esc(d.root_cause_conclusion)}</textarea>
        </div>
      </div>`,
    foot: `<button class="btn" data-action="close-modal">Cancel</button>
           <button class="btn btn-primary" data-action="save-rca" data-id="${i ? i.id : ''}">${icon('check')} ${isNew ? 'Create RCA' : 'Save changes'}</button>`,
  };
}

function whyForm(invId, node, parentId, level) {
  const d = node || { question: '', answer: '', evidence: '', level: level || 1, is_root_cause: 0 };
  return {
    eyebrow: '5 Whys', title: node ? 'Edit why level' : 'Add why level',
    body: `
      <div class="form-grid">
        ${field('Why level', `<input class="input" type="number" min="1" max="9" name="level" value="${d.level}">`)}
        ${field('Root cause?', select('is_root_cause', [[0, 'No — keep drilling'], [1, 'Yes — verified root cause']], d.is_root_cause))}
      </div>
      ${field('Question', `<input class="input" name="question" value="${esc(d.question)}" placeholder="Why did…" required>`)}
      ${field('Finding', `<textarea class="textarea" name="answer">${esc(d.answer)}</textarea>`)}
      ${field('Evidence', `<input class="input" name="evidence" value="${esc(d.evidence)}" placeholder="COMTRADE record, SOE log, photo ID…">`)}`,
    foot: `<button class="btn" data-action="close-modal">Cancel</button>
           <button class="btn btn-primary" data-action="save-why" data-id="${invId}" data-why="${node ? node.id : ''}" data-parent="${parentId || ''}">${icon('check')} Save</button>`,
  };
}

function ishForm(invId, cause) {
  const d = cause || { vector: 'machine', cause: '', detail: '', is_primary: 0 };
  return {
    eyebrow: 'Ishikawa 6M', title: cause ? 'Edit cause' : 'Add cause',
    body: `
      <div class="form-grid">
        ${field('6M vector', select('vector', Object.entries(VECTOR), d.vector))}
        ${field('Primary contributor?', select('is_primary', [[0, 'Contributing'], [1, 'Primary']], d.is_primary))}
      </div>
      ${field('Cause', `<input class="input" name="cause" value="${esc(d.cause)}" required>`)}
      ${field('Technical detail', `<textarea class="textarea" name="detail">${esc(d.detail)}</textarea>`)}`,
    foot: `<button class="btn" data-action="close-modal">Cancel</button>
           <button class="btn btn-primary" data-action="save-ish" data-id="${invId}" data-ish="${cause ? cause.id : ''}">${icon('check')} Save</button>`,
  };
}

function fmeaForm(invId, item) {
  const d = item || { component: '', failure_mode: '', potential_effect: '', potential_cause: '', current_controls: '', severity: 5, occurrence: 5, detection: 5 };
  const score = (n, v) => `<select class="select" name="${n}">${Array.from({ length: 10 }, (_, k) => k + 1).map(x => `<option ${x == v ? 'selected' : ''}>${x}</option>`).join('')}</select>`;
  return {
    eyebrow: 'FMEA', title: item ? 'Edit failure mode' : 'Add failure mode', width: 'wide',
    body: `
      <div class="form-grid">
        ${field('Component', `<input class="input" name="component" value="${esc(d.component)}" required>`)}
        ${field('Failure mode', `<input class="input" name="failure_mode" value="${esc(d.failure_mode)}">`)}
      </div>
      ${field('Potential effect', `<input class="input" name="potential_effect" value="${esc(d.potential_effect)}">`)}
      ${field('Potential cause', `<input class="input" name="potential_cause" value="${esc(d.potential_cause)}">`)}
      ${field('Current controls', `<input class="input" name="current_controls" value="${esc(d.current_controls)}">`)}
      <div class="form-grid three">
        ${field('Severity (1–10)', score('severity', d.severity))}
        ${field('Occurrence (1–10)', score('occurrence', d.occurrence))}
        ${field('Detection (1–10)', score('detection', d.detection))}
      </div>
      <div class="hint dim">Risk priority number is calculated as S × O × D. 100 or above requires a corrective action.</div>`,
    foot: `<button class="btn" data-action="close-modal">Cancel</button>
           <button class="btn btn-primary" data-action="save-fmea" data-id="${invId}" data-fmea="${item ? item.id : ''}">${icon('check')} Save</button>`,
  };
}

function capaForm(invId, item) {
  const d = item || { type: 'corrective', description: '', owner: '', target_date: null, status: 'open', verification_notes: '' };
  return {
    eyebrow: 'CAPA plan', title: item ? 'Edit action' : 'Add action', width: 'wide',
    body: `
      <div class="form-grid">
        ${field('Action type', select('type', Object.entries(CAPA_TYPE), d.type))}
        ${field('Status', select('status', optsFrom(CAPA_STATUS), d.status))}
      </div>
      ${field('Action', `<textarea class="textarea" name="description" required>${esc(d.description)}</textarea>`)}
      <div class="form-grid">
        ${field('Owner', `<input class="input" name="owner" value="${esc(d.owner)}" placeholder="M. Sorensen (Offshore HV Tech)">`)}
        ${field('Target date', `<input class="input" type="date" name="target_date" value="${toDateInput(d.target_date)}">`)}
      </div>
      ${field('Verification notes', `<textarea class="textarea" name="verification_notes">${esc(d.verification_notes)}</textarea>`)}`,
    foot: `<button class="btn" data-action="close-modal">Cancel</button>
           <button class="btn btn-primary" data-action="save-capa" data-id="${invId}" data-capa="${item ? item.id : ''}">${icon('check')} Save</button>`,
  };
}

function settingsModal() {
  const s = DB.app_settings || {};
  return {
    eyebrow: 'Configuration', title: 'Settings',
    body: `
      <section style="margin-bottom:8px">
        <h3 class="h3" style="margin-bottom:6px">Sync &amp; backup</h3>
        <p class="muted" style="font-size:13.5px;margin:0 0 18px">Data is stored in this browser first and works offline. Add an Apps Script web app URL to mirror every change to your own Google Drive.</p>
        ${field('Apps Script webhook URL',
          `<input class="input" name="webhook_url" value="${esc(s.webhook_url || '')}" placeholder="https://script.google.com/macros/s/AKfy…/exec">`,
          'Leave blank to stay local-only. Must be a script.google.com web app URL.')}
      </section>
      <div class="divider"></div>
      <section>
        <h3 class="h3" style="margin-bottom:6px">Data</h3>
        <p class="muted" style="font-size:13.5px;margin:0 0 16px">
          ${DB.investigations.length} investigations · ${DB.five_whys_nodes.length} why levels ·
          ${DB.ishikawa_causes.length} 6M causes · ${DB.fmea_items.length} failure modes ·
          ${DB.capa_actions.length} actions
        </p>
        <div class="chip-row">
          <button class="btn btn-sm" data-action="export-json">Export JSON</button>
          <button class="btn btn-sm" data-action="import-json">Import JSON</button>
          <button class="btn btn-sm btn-danger" data-action="reset-demo">Reset to sample data</button>
        </div>
        <input type="file" id="importFile" accept="application/json" style="display:none">
      </section>`,
    foot: `<button class="btn" data-action="close-modal">Close</button>
           <button class="btn btn-primary" data-action="save-settings">${icon('check')} Save settings</button>`,
  };
}

/* ---------- form collection ---------- */

function collect(names) {
  const out = {};
  names.forEach(n => {
    const el = document.querySelector(`[name="${n}"]`);
    if (el) out[n] = el.value.trim();
  });
  return out;
}

/* ---------- actions ---------- */

const ACTIONS = {
  'close-modal': closeModal,

  'new-rca': () => { const f = rcaForm(null); openModal(f); },
  'edit-rca': (el) => { const i = invById(el.dataset.id); if (i) openModal(rcaForm(i)); },
  'del-rca': (el) => {
    const i = invById(el.dataset.id);
    if (!i) return;
    confirmDo(`Delete ${i.document_code} and all of its why levels, causes, failure modes and actions?`, () => {
      ['five_whys_nodes', 'ishikawa_causes', 'fmea_items', 'capa_actions'].forEach(c => {
        DB[c] = DB[c].filter(r => r.investigation_id !== i.id);
      });
      DB.investigations = DB.investigations.filter(x => x.id !== i.id);
      save(); go('#/investigations'); render(); toast('Investigation deleted');
    });
  },

  'save-rca': (el) => {
    const id = el.dataset.id;
    const v = collect(['document_code','title','facility_name','equipment_tag','asset_category','fault_category','voltage_class','severity','status','investigator_name','investigator_role','executive_summary','root_cause_conclusion']);
    if (!v.title) { toast('A title is required'); return; }
    v.incident_date = fromDateInput(document.querySelector('[name="incident_date"]').value);
    if (id) {
      const i = invById(id);
      Object.assign(i, v, { updated_at: new Date().toISOString() });
      save(); closeModal(); render(); toast('Investigation updated');
    } else {
      const nid = uid('rca');
      DB.investigations.push(Object.assign({ id: nid, drive_share_url: null }, v, { updated_at: new Date().toISOString() }));
      save(); closeModal(); go(`#/investigations/${nid}/overview`); toast('Investigation created');
    }
  },

  'add-why': (el) => openModal(whyForm(el.dataset.id, null, el.dataset.parent || null, el.dataset.level || 1)),
  'edit-why': (el) => {
    const n = DB.five_whys_nodes.find(x => x.id === el.dataset.why);
    if (n) openModal(whyForm(n.investigation_id, n, n.parent_id, n.level));
  },
  'save-why': (el) => {
    const v = collect(['question','answer','evidence','level','is_root_cause']);
    if (!v.question) { toast('A question is required'); return; }
    const node = { level: Number(v.level) || 1, question: v.question, answer: v.answer, evidence: v.evidence, is_root_cause: Number(v.is_root_cause) || 0 };
    if (el.dataset.why) Object.assign(DB.five_whys_nodes.find(x => x.id === el.dataset.why), node);
    else {
      DB.five_whys_nodes.push(Object.assign({ id: uid('w'), investigation_id: el.dataset.id, parent_id: el.dataset.parent || null, sort_order: DB.five_whys_nodes.length + 1 }, node));
    }
    touchInv(el.dataset.id); save(); closeModal(); render(); toast('Why level saved');
  },
  'del-why': (el) => {
    const ids = [el.dataset.why];
    for (let k = 0; k < ids.length; k++) DB.five_whys_nodes.filter(n => n.parent_id === ids[k]).forEach(c => ids.push(c.id));
    confirmDo(`Delete this why level and ${ids.length - 1} nested branch(es)?`, () => {
      DB.five_whys_nodes = DB.five_whys_nodes.filter(n => !ids.includes(n.id));
      save(); render(); toast('Deleted');
    });
  },

  'add-ish': (el) => openModal(ishForm(el.dataset.id, null)),
  'edit-ish': (el) => { const c = DB.ishikawa_causes.find(x => x.id === el.dataset.ish); if (c) openModal(ishForm(c.investigation_id, c)); },
  'save-ish': (el) => {
    const v = collect(['vector','cause','detail','is_primary']);
    if (!v.cause) { toast('A cause is required'); return; }
    v.is_primary = Number(v.is_primary) || 0;
    if (el.dataset.ish) Object.assign(DB.ishikawa_causes.find(x => x.id === el.dataset.ish), v);
    else DB.ishikawa_causes.push(Object.assign({ id: uid('ish'), investigation_id: el.dataset.id }, v));
    touchInv(el.dataset.id); save(); closeModal(); render(); toast('Cause saved');
  },
  'del-ish': (el) => confirmDo('Delete this cause?', () => {
    const c = DB.ishikawa_causes.find(x => x.id === el.dataset.ish);
    DB.ishikawa_causes = DB.ishikawa_causes.filter(x => x.id !== el.dataset.ish);
    if (c) touchInv(c.investigation_id);
    save(); render(); toast('Deleted');
  }),

  'add-fmea': (el) => openModal(fmeaForm(el.dataset.id, null)),
  'edit-fmea': (el) => { const f = DB.fmea_items.find(x => x.id === el.dataset.fmea); if (f) openModal(fmeaForm(f.investigation_id, f)); },
  'save-fmea': (el) => {
    const v = collect(['component','failure_mode','potential_effect','potential_cause','current_controls','severity','occurrence','detection']);
    if (!v.component) { toast('A component is required'); return; }
    ['severity','occurrence','detection'].forEach(k => v[k] = Number(v[k]) || 1);
    if (el.dataset.fmea) Object.assign(DB.fmea_items.find(x => x.id === el.dataset.fmea), v);
    else DB.fmea_items.push(Object.assign({ id: uid('fmea'), investigation_id: el.dataset.id }, v));
    touchInv(el.dataset.id); save(); closeModal(); render(); toast('Failure mode saved');
  },
  'del-fmea': (el) => confirmDo('Delete this failure mode?', () => {
    const f = DB.fmea_items.find(x => x.id === el.dataset.fmea);
    DB.fmea_items = DB.fmea_items.filter(x => x.id !== el.dataset.fmea);
    if (f) touchInv(f.investigation_id);
    save(); render(); toast('Deleted');
  }),

  'add-capa': (el) => openModal(capaForm(el.dataset.id, null)),
  'edit-capa': (el) => { const c = DB.capa_actions.find(x => x.id === el.dataset.capa); if (c) openModal(capaForm(c.investigation_id, c)); },
  'save-capa': (el) => {
    const v = collect(['type','description','owner','status','verification_notes']);
    if (!v.description) { toast('An action description is required'); return; }
    v.target_date = fromDateInput(document.querySelector('[name="target_date"]').value);
    if (el.dataset.capa) Object.assign(DB.capa_actions.find(x => x.id === el.dataset.capa), v);
    else DB.capa_actions.push(Object.assign({ id: uid('capa'), investigation_id: el.dataset.id }, v));
    touchInv(el.dataset.id); save(); closeModal(); render(); toast('Action saved');
  },
  'del-capa': (el) => confirmDo('Delete this action?', () => {
    const c = DB.capa_actions.find(x => x.id === el.dataset.capa);
    DB.capa_actions = DB.capa_actions.filter(x => x.id !== el.dataset.capa);
    if (c) touchInv(c.investigation_id);
    save(); render(); toast('Deleted');
  }),

  'print': () => window.print(),
  'print-dashboard': () => window.print(),

  'settings': () => openModal(settingsModal()),
  'save-settings': () => {
    DB.app_settings = Object.assign({}, DB.app_settings, collect(['webhook_url']));
    save(); closeModal(); toast('Settings saved');
  },
  'export-json': () => {
    const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gridguard-rca-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Exported');
  },
  'import-json': () => document.getElementById('importFile').click(),
  'reset-demo': () => confirmDo('Replace all data with the original sample record?', () => {
    DB = seed(); save(); closeModal(); render(); toast('Sample data restored');
  }),
};

function touchInv(id) {
  const i = invById(id);
  if (i) i.updated_at = new Date().toISOString();
}

function confirmDo(msg, fn) {
  openModal({
    eyebrow: 'Confirm', title: 'Are you sure?',
    body: `<p class="muted" style="margin:0">${esc(msg)}</p>`,
    foot: `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-danger" id="confirmYes">Delete</button>`,
  });
  document.getElementById('confirmYes').addEventListener('click', () => { closeModal(); fn(); });
}

let toastTimer = null;
function toast(msg) {
  const host = document.getElementById('toastHost');
  host.innerHTML = `<div class="toast">${esc(msg)}</div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { host.innerHTML = ''; }, 2600);
}

/* ---------- events ---------- */

document.addEventListener('click', (e) => {
  const actionEl = e.target.closest('[data-action]');
  if (actionEl) {
    const fn = ACTIONS[actionEl.dataset.action];
    if (fn) { e.preventDefault(); fn(actionEl); return; }
  }
  const gotoEl = e.target.closest('[data-goto]');
  if (gotoEl) { e.preventDefault(); go(gotoEl.dataset.goto); return; }

  const routeEl = e.target.closest('[data-route]');
  if (routeEl) { e.preventDefault(); go(routeEl.dataset.route); return; }

  const tabEl = e.target.closest('[data-tab]');
  if (tabEl) {
    const r = parseRoute();
    if (r.page === 'rca') go(`#/investigations/${r.id}/${tabEl.dataset.tab}`);
    return;
  }
  const sevEl = e.target.closest('[data-sev]');
  if (sevEl) { invFilter.sev = sevEl.dataset.sev; render(); return; }

  const capaEl = e.target.closest('[data-capa-filter]');
  if (capaEl) { capaFilter = capaEl.dataset.capaFilter; render(); return; }
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'invSearch') {
    invFilter.q = e.target.value;
    const pos = e.target.selectionStart;
    render();
    const el = document.getElementById('invSearch');
    if (el) { el.focus(); el.setSelectionRange(pos, pos); }
  }
});

document.addEventListener('change', (e) => {
  if (e.target.id === 'importFile' && e.target.files[0]) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || !Array.isArray(data.investigations)) throw new Error('not a GridGuard store');
        DB = Object.assign(seed(), data);
        save(); closeModal(); render(); toast('Data imported');
      } catch (err) { toast('That file is not a GridGuard export'); }
    };
    reader.readAsText(file);
  }
});

document.getElementById('newRcaBtn').addEventListener('click', () => ACTIONS['new-rca']());
document.getElementById('settingsBtn').addEventListener('click', () => ACTIONS['settings']());
document.getElementById('navLinks').addEventListener('click', (e) => { /* handled by delegation */ });
window.addEventListener('hashchange', render);

/* ---------- boot ---------- */

load();
render();
