/* ==========================================================================
   TotalRCA — application
   Local-first Root Cause Analysis & CAPA tracking (Web, iOS, Android).
   Storage key kept compatible with gridguard_rca_store_v1.
   ========================================================================== */

const STORE_KEY = 'gridguard_rca_store_v1';
const DEMO_INV_ID = 'rca-pump-p104a-001';
const FREE_CUSTOM_RCA_LIMIT = 1;
const FREE_CAPA_PER_CUSTOM_RCA_LIMIT = 3;

const isPro = () => !window.TotalRCANative || !window.TotalRCANative.isNative() || !!window.TotalRCANative.isPro();
const customRcas = () => (DB?.investigations || []).filter(i => i.id !== DEMO_INV_ID);

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
  mechanical:  'Mechanical',
  electrical:  'Electrical',
  instrument:  'Instrumentation & Sensors',
  control:     'Control & Software',
  process:     'Process & Operations',
  human:       'Human Factors',
  structural:  'Structural / Civil',
  environmental:'Environmental',
  other:       'Other',
};

const ASSET = {
  pumpCompressor:       'Pump / Compressor',
  motorDrive:           'Motor / Gearbox / Drive',
  conveyorMechanical:   'Conveyor / Production Line',
  hvacFacility:         'HVAC / Facility Utility',
  electricalSwitchgear: 'Switchgear / Distribution',
  transformerPower:     'Transformer / UPS / Generator',
  plcControl:           'PLC / SCADA / Automation',
  itServerNetwork:      'IT Server / Network / Cloud',
  pipelineValve:        'Pipeline / Valve / Vessel',
  substationOsp:        'Substation (HV / Offshore)',
  windTurbine:          'Wind Turbine / Solar / BESS',
  other:                'Other Asset / System',
};

const INDUSTRY_TEMPLATES = {
  none: { label: 'Blank RCA (Custom)', asset_category: 'other', fault_category: 'mechanical', voltage_class: '', problem_statement: '' },
  mechanical: {
    label: 'General Mechanical (Pump / Motor / Bearing)',
    asset_category: 'pumpCompressor',
    fault_category: 'mechanical',
    voltage_class: '400V 3-Phase / Mechanical',
    problem_statement: 'Equipment experienced an unplanned trip / mechanical failure during normal operation, resulting in production downtime and maintenance intervention.',
  },
  electrical: {
    label: 'Electrical & Power Systems',
    asset_category: 'electricalSwitchgear',
    fault_category: 'electrical',
    voltage_class: '11 kV / 400V Distribution',
    problem_statement: 'Electrical protection operated unexpectedly or power quality degraded, causing loss of supply to downstream equipment.',
  },
  manufacturing: {
    label: 'Manufacturing & Production Line',
    asset_category: 'conveyorMechanical',
    fault_category: 'process',
    voltage_class: 'Line / Shift Operations',
    problem_statement: 'Production line stoppage or quality defect exceeded tolerance limits, halting throughput and requiring containment.',
  },
  itops: {
    label: 'IT / Software & Network Incident',
    asset_category: 'itServerNetwork',
    fault_category: 'control',
    voltage_class: 'Production / Cloud',
    problem_statement: 'Service degradation or outage impacted users or telemetry systems, requiring failover and root cause remediation.',
  },
  hvRenewables: {
    label: 'HV & Renewables Operations',
    asset_category: 'substationOsp',
    fault_category: 'electrical',
    voltage_class: '220 kV / IEC 61850',
    problem_statement: 'HV asset or renewable generation unit tripped offline, causing unplanned export curtailment.',
  },
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

const TIMELINE_CAT = {
  trigger:   { label: 'Trip / Failure',    tone: 'red'   },
  telemetry: { label: 'Alarm / Telemetry', tone: 'amber' },
  action:    { label: 'Operator / Tech',   tone: 'cyan'  },
  recovery:  { label: 'Restoration',       tone: 'green' },
  note:      { label: 'Observation',       tone: 'slate' },
};

const TAB_LABELS = [
  ['overview',  'Overview'],
  ['timeline',  'Timeline'],
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
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  paperclip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>',
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
const fmtDateTimeSec = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' }) + ' UTC';
};
const toDateInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toISOString().slice(0, 10);
};
const toTimeInput = (iso) => {
  if (!iso) return '00:00:00';
  const d = new Date(iso);
  return isNaN(d) ? '00:00:00' : d.toISOString().slice(11, 19);
};
const fromDateInput = (v) => (v ? new Date(v + 'T00:00:00.000Z').toISOString() : null);
const fromDateTimeInput = (dv, tv) => {
  if (!dv) return new Date().toISOString();
  const cleanTime = /^\d{2}:\d{2}(:\d{2})?$/.test(tv || '') ? (tv.length === 5 ? `${tv}:00` : tv) : '00:00:00';
  const d = new Date(`${dv}T${cleanTime}.000Z`);
  return isNaN(d) ? new Date().toISOString() : d.toISOString();
};
const chip = (label, tone = 'slate') => `<span class="chip chip-${tone}">${esc(label)}</span>`;
const sevChip = (s) => { const m = SEVERITY[s]; return m ? chip(m.label, m.tone) : chip(s || '—'); };
const statusChip = (s) => { const m = STATUS[s]; return m ? chip(m.label, m.tone) : chip(s || '—'); };
const capaChip = (s) => { const m = CAPA_STATUS[s]; return m ? chip(m.label, m.tone) : chip(s || '—'); };
const timelineChip = (s) => { const m = TIMELINE_CAT[s]; return m ? chip(m.label, m.tone) : chip(s || '—'); };

const rpnOf = (f) => Number(f.severity || 0) * Number(f.occurrence || 0) * Number(f.detection || 0);
const riskBand = (rpn) => rpn >= 200 ? ['Critical', 'red'] : rpn >= 100 ? ['High', 'amber'] : rpn >= 50 ? ['Medium', 'cyan'] : ['Low', 'green'];

/* ---------- store ---------- */

function seed() {
  const INV = DEMO_INV_ID;
  return {
    sites: [
      { id: 'site-main', name: 'Main Operations Facility', code: 'FAC-01', region: 'Primary Site', voltage_class: '400V / Mechanical' },
      { id: 'site-plant2', name: 'Processing Plant B', code: 'PLT-02', region: 'Secondary Site', voltage_class: '11 kV / 400V' },
    ],
    app_users: [
      {
        id: 'usr-demo',
        username: 'demo',
        password: 'demo',
        full_name: 'Local Engineer',
        role_title: 'Reliability & Maintenance Engineer',
        is_global_admin: 1,
        site_roles: { 'site-main': 'admin', 'site-plant2': 'admin' },
        assigned_rcas: [],
      },
      {
        id: 'usr-admin',
        username: 'admin',
        password: 'demo',
        full_name: 'Team Administrator',
        role_title: 'Operations & Reliability Admin',
        is_global_admin: 1,
        site_roles: { 'site-main': 'admin', 'site-plant2': 'admin' },
        assigned_rcas: [],
      },
      {
        id: 'usr-viewer',
        username: 'viewer',
        password: 'demo',
        full_name: 'Compliance Auditor',
        role_title: 'HSE & Quality Viewer',
        is_global_admin: 0,
        site_roles: { 'site-main': 'viewer' },
        assigned_rcas: [],
      },
    ],
    investigations: [{
      id: INV,
      site_id: 'site-main',
      document_code: 'RCA-2026-IND-001',
      title: 'Centrifugal Pump P-104A Mechanical Seal Failure & Bearing Overheat (Sample)',
      facility_name: 'Main Operations Facility',
      asset_category: 'pumpCompressor',
      equipment_tag: 'PUMP-P104A-COOLING',
      voltage_class: '400V 3-Phase / 45 kW',
      severity: 'major',
      fault_category: 'mechanical',
      status: 'inReview',
      incident_date: '2026-11-14T08:15:00.000',
      investigator_name: 'Alex Morgan',
      investigator_role: 'Reliability Engineer',
      problem_statement: 'Primary cooling water pump P-104A tripped on motor drive over-temperature and high vibration (9.4 mm/s) after 4 hours of operation, causing a 3.5-hour line stoppage.',
      executive_summary: 'At 08:15 UTC on 14 Nov 2026, Centrifugal Pump P-104A tripped offline due to drive-end bearing overheating (108 °C) and mechanical seal leakage. Standby pump P-104B took over after manual valve changeover, resulting in 3.5 hours of reduced production throughput.',
      root_cause_conclusion: 'Primary Root Cause: Seal flush line strainer clogged with scale debris, starving the mechanical seal of cooling flow and causing dry-running thermal distortion; compounded by shaft misalignment introduced during the last coupling replacement.',
      drive_share_url: null,
      updated_at: '2026-11-16T14:20:00.000',
    }],
    five_whys_nodes: [
      { id: 'w-1', investigation_id: INV, parent_id: null, level: 1, question: 'Why did Centrifugal Pump P-104A trip offline with high vibration?', answer: 'Drive-end bearing temperature exceeded 105 °C and VFD tripped on over-current.', evidence: 'PLC alarm log #1142 & handheld IR reading 108 °C.', is_root_cause: 0, sort_order: 1 },
      { id: 'w-2', investigation_id: INV, parent_id: 'w-1', level: 2, question: 'Why did the drive-end bearing overheat and vibrate?', answer: 'Hot process fluid leaked past the failed mechanical seal into the bearing housing, washing out grease.', evidence: 'Disassembly inspection showed emulsified grease and scored silicon-carbide seal faces.', is_root_cause: 0, sort_order: 2 },
      { id: 'w-3', investigation_id: INV, parent_id: 'w-2', level: 3, question: 'Why did the mechanical seal faces score and crack?', answer: 'The seal ran dry due to loss of API Plan 11 flush cooling flow.', evidence: 'Seal flush line gauge read 0.1 bar (normal 3.2 bar); flush pipe was cold to the touch.', is_root_cause: 0, sort_order: 3 },
      { id: 'w-4', investigation_id: INV, parent_id: 'w-3', level: 4, question: 'Why was the seal flush cooling flow blocked?', answer: 'The inline Y-strainer on the flush line was 95% blocked with rust and pipe scale.', evidence: 'Strainer basket photo & scale sample collected during strip-down.', is_root_cause: 0, sort_order: 4 },
      { id: 'w-5', investigation_id: INV, parent_id: 'w-4', level: 5, question: 'Why was the flush strainer allowed to clog without warning?', answer: 'The Y-strainer had no differential-pressure indicator and was omitted from the 6-month PM checklist.', evidence: 'CMMS PM-PUMP-04 rev 2 lacks flush strainer inspection step.', is_root_cause: 1, sort_order: 5 },
    ],
    ishikawa_causes: [
      { id: 'ish-1', investigation_id: INV, vector: 'machine', cause: 'Blocked seal flush Y-strainer', detail: '95% flow restriction starved mechanical seal of cooling.', is_primary: 1 },
      { id: 'ish-2', investigation_id: INV, vector: 'machine', cause: 'Coupling angular misalignment (0.18 mm)', detail: 'Exceeded 0.05 mm tolerance after October motor swap.', is_primary: 1 },
      { id: 'ish-3', investigation_id: INV, vector: 'material', cause: 'Carbon-steel header scale debris', detail: 'Upstream pipework corrosion shed flakes after shutdown.', is_primary: 0 },
      { id: 'ish-4', investigation_id: INV, vector: 'method', cause: 'PM checklist omitted flush strainer', detail: 'PM-PUMP-04 checked oil level only, not flush line flow.', is_primary: 1 },
      { id: 'ish-5', investigation_id: INV, vector: 'measurement', cause: 'No flush flow or DP alarm', detail: 'Operator had no visibility of gradual flush blockage.', is_primary: 0 },
      { id: 'ish-6', investigation_id: INV, vector: 'man', cause: 'Laser alignment skipped during night shift', detail: 'Straight-edge alignment used instead of laser tool.', is_primary: 0 },
    ],
    fmea_items: [
      { id: 'fmea-1', investigation_id: INV, component: 'Mechanical Seal (API Plan 11)', failure_mode: 'Dry running / thermal cracking', potential_effect: 'Fluid leak, bearing washout & unplanned pump trip', potential_cause: 'Flush strainer blockage from upstream scale', current_controls: 'None on flush line; VFD over-current trip', severity: 8, occurrence: 5, detection: 7 },
      { id: 'fmea-2', investigation_id: INV, component: 'Drive-End Ball Bearing', failure_mode: 'Lubrication loss & overheating', potential_effect: 'Seized shaft & 3.5 hr line downtime', potential_cause: 'Seal leakage + coupling misalignment load', current_controls: 'Monthly handheld vibration check', severity: 8, occurrence: 4, detection: 5 },
      { id: 'fmea-3', investigation_id: INV, component: 'Pump-Motor Coupling', failure_mode: 'Excessive angular misalignment', potential_effect: 'Elevated radial vibration (9.4 mm/s)', potential_cause: 'Straight-edge alignment used after motor change', current_controls: 'Post-maintenance sign-off sheet', severity: 6, occurrence: 5, detection: 4 },
    ],
    capa_actions: [
      { id: 'capa-1', investigation_id: INV, type: 'corrective', description: 'Install new cartridge mechanical seal, replace DE/NDE bearings, clean flush Y-strainer, and laser-align coupling to < 0.04 mm.', owner: 'J. Vance (Maintenance Lead)', target_date: '2026-11-16T00:00:00.000', status: 'verified', verification_notes: '4-hour run test passed: bearing temp 58 °C, vibration 1.4 mm/s.' },
      { id: 'capa-2', investigation_id: INV, type: 'preventive', description: 'Fit sight-flow indicator with low-flow switch on P-104A/B seal flush lines.', owner: 'R. Chen (Controls Eng)', target_date: '2026-12-05T00:00:00.000', status: 'inProgress', verification_notes: 'Flow switches ordered; scheduled for next planned outage.' },
      { id: 'capa-3', investigation_id: INV, type: 'preventive', description: 'Update PM-PUMP-04 to mandate 6-monthly flush strainer cleaning and laser alignment sign-off after any coupling work.', owner: 'A. Morgan (Reliability Eng)', target_date: '2026-12-12T00:00:00.000', status: 'open', verification_notes: 'Draft SOP submitted for maintenance review.' },
    ],
    timeline_events: [
      { id: 'tl-1', investigation_id: INV, timestamp: '2026-11-14T06:40:00.000Z', category: 'telemetry', source: 'PLC / Vibration Sensor', title: 'P-104A vibration trended above 5.5 mm/s warning', detail: 'Early bearing distress & seal chatter began as flush flow dropped.' },
      { id: 'tl-2', investigation_id: INV, timestamp: '2026-11-14T08:15:12.000Z', category: 'trigger', source: 'VFD Drive / PLC Alarm #1142', title: 'P-104A tripped on over-current & high bearing temp (108 °C)', detail: 'Pump isolated automatically; standby pump P-104B required manual suction valve changeover.' },
      { id: 'tl-3', investigation_id: INV, timestamp: '2026-11-14T08:32:00.000Z', category: 'action', source: 'Shift Operator', title: 'Standby pump P-104B started; P-104A locked out (LOTO)', detail: 'Area isolated for mechanical inspection; seal weeping observed.' },
      { id: 'tl-4', investigation_id: INV, timestamp: '2026-11-15T14:20:00.000Z', category: 'recovery', source: 'Maintenance Team', title: 'Seal & bearings replaced, flush strainer cleared, laser aligned', detail: 'P-104A returned to standby readiness with 1.4 mm/s vibration.' },
    ],
    attachments: [],
    app_settings: {},
  };
}

let DB = null;

function ensureSitesAndUsers(pushToCloud = false) {
  const defaults = seed();
  if (!Array.isArray(DB.sites) || DB.sites.length === 0) {
    DB.sites = defaults.sites.map(s => Object.assign({}, s));
    if (pushToCloud) sbUpsert('sites', DB.sites);
  }
  if (!Array.isArray(DB.app_users) || DB.app_users.length === 0) {
    DB.app_users = defaults.app_users.map(u => Object.assign({}, u));
    if (pushToCloud) sbUpsert('app_users', DB.app_users);
  }
  DB.app_users.forEach(u => {
    if (typeof u.site_roles === 'string') {
      try { u.site_roles = JSON.parse(u.site_roles); } catch (e) { u.site_roles = {}; }
    }
    if (!u.site_roles || typeof u.site_roles !== 'object') u.site_roles = {};
    if (typeof u.assigned_rcas === 'string') {
      try { u.assigned_rcas = JSON.parse(u.assigned_rcas); } catch (e) { u.assigned_rcas = []; }
    }
    if (!Array.isArray(u.assigned_rcas)) u.assigned_rcas = [];
  });

  const updatedInvs = [];
  (DB.investigations || []).forEach(inv => {
    if (!inv.site_id || !DB.sites.some(s => s.id === inv.site_id)) {
      const fn = String(inv.facility_name || '').toLowerCase();
      const matched = DB.sites.find(s =>
        (fn && (s.name.toLowerCase().includes(fn) || fn.includes(s.name.toLowerCase()) || fn.includes(s.code.toLowerCase()))) ||
        (fn.includes('rampion') && s.id === 'site-rampion') ||
        (fn.includes('thames') && s.id === 'site-thames')
      ) || DB.sites[0];
      if (matched) {
        inv.site_id = matched.id;
        updatedInvs.push(inv);
      }
    }
  });
  if (pushToCloud && updatedInvs.length) sbUpsert('investigations', updatedInvs);
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) { DB = seed(); ensureSitesAndUsers(false); save(); return DB; }
    const parsed = JSON.parse(raw);
    DB = Object.assign(seed(), parsed);
    ['sites','app_users','investigations','five_whys_nodes','ishikawa_causes','fmea_items','capa_actions','timeline_events','attachments'].forEach(k => {
      if (!Array.isArray(DB[k])) DB[k] = [];
    });
    if (!DB.app_settings || typeof DB.app_settings !== 'object') DB.app_settings = {};
    ensureSitesAndUsers(false);
    return DB;
  } catch (e) {
    DB = seed();
    ensureSitesAndUsers(false);
    return DB;
  }
}
function save() {
  const jsonStr = JSON.stringify(DB);
  try {
    localStorage.setItem(STORE_KEY, jsonStr);
  } catch (e) {
    try {
      const slim = Object.assign({}, DB, {
        attachments: (DB.attachments || []).map(a => Object.assign({}, a, { data_url: '' })),
      });
      const slimStr = JSON.stringify(slim);
      localStorage.setItem(STORE_KEY, slimStr);
      if (window.TotalRCANative) window.TotalRCANative.mirrorSave(STORE_KEY, slimStr);
    } catch (e2) {
      toast('Local storage full — consider exporting or connecting your own database');
    }
  }
  if (window.TotalRCANative) window.TotalRCANative.mirrorSave(STORE_KEY, jsonStr);
  pushWebhook();
}
const invById = (id) => DB.investigations.find(i => i.id === id);
const siteById = (id) => (DB.sites || []).find(s => s.id === id);
const byInv = (coll, id) => DB[coll].filter(r => r.investigation_id === id);
const capasByStatus = (s) => DB.capa_actions.filter(c => c.status === s);

/* ---------- auth & multi-site RBAC ---------- */

const SESSION_KEY = 'gridguard_session_v1';
let activeSiteId = 'all';
let activeRegion = 'all';

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function setSession(userId) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify({ userId })); } catch (e) {}
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
}
function currentUser() {
  const s = getSession();
  if (s && s.userId) {
    const found = (DB.app_users || []).find(u => u.id === s.userId);
    if (found) return found;
  }
  // Local-first default on mobile apps when no external team DB is active
  const onNative = !!(window.TotalRCANative && window.TotalRCANative.isNative());
  const sbCfg = typeof getSupabaseCfg === 'function' ? getSupabaseCfg() : null;
  if (onNative && (!sbCfg || !sbCfg.url || !sbCfg.key)) {
    return (DB.app_users || [])[0] || { id: 'usr-demo', username: 'local', full_name: 'Local Engineer', role_title: 'Owner', is_global_admin: 1, site_roles: {}, assigned_rcas: [] };
  }
  return null;
}
function userRoleForSite(user, siteId) {
  if (!user) return null;
  if (user.is_global_admin) return 'admin';
  return (user.site_roles && siteId && user.site_roles[siteId]) || null;
}
function roleForInv(user, inv) {
  if (!user || !inv) return null;
  if (user.is_global_admin) return 'admin';
  const sr = userRoleForSite(user, inv.site_id);
  const assigned = Array.isArray(user.assigned_rcas) && user.assigned_rcas.includes(inv.id);
  if (sr === 'admin' || sr === 'editor') return sr;
  if (assigned) return sr || 'editor';
  if (sr === 'viewer') return 'viewer';
  return null;
}
function canAccessInv(user, inv) {
  return Boolean(roleForInv(user, inv));
}
function canEditInv(inv) {
  const r = roleForInv(currentUser(), inv);
  return r === 'admin' || r === 'editor';
}
function canAdminSite(user, siteId) {
  return Boolean(user && (user.is_global_admin || userRoleForSite(user, siteId) === 'admin'));
}
function canManageAnySite(user) {
  return Boolean(user && (user.is_global_admin || Object.values(user.site_roles || {}).includes('admin')));
}
function canCreateRca(user) {
  return Boolean(user && (user.is_global_admin || Object.values(user.site_roles || {}).some(r => r === 'admin' || r === 'editor')));
}
function editableSitesForUser(user) {
  if (!user) return [];
  if (user.is_global_admin) return (DB.sites || []).slice();
  return (DB.sites || []).filter(s => ['admin', 'editor'].includes(userRoleForSite(user, s.id)));
}
function accessibleSites(user) {
  if (!user) return [];
  if (user.is_global_admin) return (DB.sites || []).slice();
  const invSiteIds = new Set(
    (DB.investigations || []).filter(i => canAccessInv(user, i)).map(i => i.site_id).filter(Boolean)
  );
  return (DB.sites || []).filter(s => Boolean(userRoleForSite(user, s.id)) || invSiteIds.has(s.id));
}
function accessibleInvs() {
  const u = currentUser();
  if (!u) return [];
  return (DB.investigations || []).filter(i => canAccessInv(u, i));
}
function filteredInvs() {
  return accessibleInvs().filter(i => {
    const site = siteById(i.site_id);
    const regionOk = activeRegion === 'all' || (site && site.region === activeRegion);
    const siteOk = activeSiteId === 'all' || i.site_id === activeSiteId;
    return regionOk && siteOk;
  });
}
function accessibleCapas() {
  const ids = new Set(accessibleInvs().map(i => i.id));
  return (DB.capa_actions || []).filter(c => ids.has(c.investigation_id));
}
function filteredCapas() {
  const ids = new Set(filteredInvs().map(i => i.id));
  return (DB.capa_actions || []).filter(c => ids.has(c.investigation_id));
}
function userRoleSummary(user) {
  if (!user) return '';
  if (user.is_global_admin) return 'Global Admin';
  const roles = Object.values(user.site_roles || {});
  if (roles.includes('admin')) return 'Site Admin';
  if (roles.includes('editor')) return 'Editor';
  if (roles.includes('viewer')) return 'Viewer';
  if ((user.assigned_rcas || []).length) return 'Editor (Assigned RCA)';
  return 'Editor (Unassigned)';
}
function siteFilterSelect() {
  const sites = accessibleSites(currentUser());
  if (!sites.length) return '';
  const regions = Array.from(new Set(sites.map(s => (s.region || '').trim()).filter(Boolean))).sort();
  if (activeRegion !== 'all' && !regions.includes(activeRegion)) activeRegion = 'all';
  const regionSites = activeRegion === 'all' ? sites : sites.filter(s => (s.region || '').trim() === activeRegion);
  if (activeSiteId !== 'all' && !regionSites.some(s => s.id === activeSiteId)) activeSiteId = 'all';

  const regionOpts = [['all', `All regions (${regions.length})`], ...regions.map(r => [r, r])];
  const siteOpts = [['all', `All sites (${regionSites.length})`], ...regionSites.map(s => [s.id, `${s.code} — ${s.name}`])];

  return `<div class="chip-row" style="gap:8px;flex-wrap:wrap">
    ${regions.length ? `<div style="min-width:175px">${select('active_region', regionOpts, activeRegion)}</div>` : ''}
    <div style="min-width:230px">${select('active_site', siteOpts, activeSiteId)}</div>
  </div>`;
}

/* ---------- Team Database Sync (BYODB — local-only by default) ---------- */

const INV_CHILD_TABLES = ['timeline_events', 'five_whys_nodes', 'ishikawa_causes', 'fmea_items', 'capa_actions', 'attachments'];
const SB_TABLES = ['sites', 'app_users', 'investigations', ...INV_CHILD_TABLES];
const SB_MIGRATED_KEY = 'gridguard_supabase_migrated_v1';

const WEB_DEFAULT_SUPABASE_URL = 'https://nhhtxfimvlapqlbvcrlz.supabase.co';
const WEB_DEFAULT_SUPABASE_KEY = 'sb_publishable_5gmDFx3BwVPjNBxjobriDQ_LpDxDAnl';

function getSupabaseCfg() {
  const s = (typeof DB !== 'undefined' && DB && DB.app_settings) ? DB.app_settings : {};
  const onNative = !!(window.TotalRCANative && window.TotalRCANative.isNative());
  const url = (s.supabase_url || (!onNative ? WEB_DEFAULT_SUPABASE_URL : '')).trim().replace(/\/+$/, '');
  const key = (s.supabase_key || (!onNative ? WEB_DEFAULT_SUPABASE_KEY : '')).trim();
  return { url, key };
}
const hasSupabase = () => { const c = getSupabaseCfg(); return !!(c.url && c.key); };

let syncState = { status: 'offline', text: 'Local only', detail: 'Data stored locally on your device' };
let lastSyncAt = 0;

function setSyncState(status, text, detail = '') {
  syncState = { status, text, detail };
  const btn = document.getElementById('syncBtn');
  if (!btn) return;
  btn.className = `sync-pill ${status === 'ok' ? 'ok' : status === 'syncing' ? 'syncing' : status === 'setup' ? 'warn' : ''}`;
  const label = btn.querySelector('.sync-text');
  if (label) label.textContent = text;
  btn.title = detail || text;
}

function sbHeaders(extra = {}) {
  const { key } = getSupabaseCfg();
  const h = { apikey: key, 'Content-Type': 'application/json', ...extra };
  if (key.startsWith('eyJ')) h.Authorization = `Bearer ${key}`;
  return h;
}

async function sbFetch(path, opts = {}) {
  const { url, key } = getSupabaseCfg();
  if (!url || !key) return null;
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...opts,
    headers: sbHeaders(opts.headers || {}),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`Supabase ${res.status}: ${body}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function sbUpsert(table, rows) {
  if (!hasSupabase() || !isPro()) return Promise.resolve();
  const arr = Array.isArray(rows) ? rows : [rows];
  if (!arr.length) return Promise.resolve();
  return sbFetch(table, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(arr),
  }).then(() => setSyncState('ok', 'Synced', `Last saved ${new Date().toLocaleTimeString()}`))
    .catch(err => handleSbWriteError(err));
}

function sbDelete(table, id) {
  if (!hasSupabase() || !isPro()) return Promise.resolve();
  return sbFetch(`${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  }).then(() => setSyncState('ok', 'Synced', `Last saved ${new Date().toLocaleTimeString()}`))
    .catch(err => handleSbWriteError(err));
}

function sbDeleteByInv(table, invId) {
  if (!hasSupabase() || !isPro()) return Promise.resolve();
  return sbFetch(`${table}?investigation_id=eq.${encodeURIComponent(invId)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  }).catch(err => handleSbWriteError(err));
}

function sbTouchInv(invId) {
  if (!hasSupabase() || !isPro()) return Promise.resolve();
  const i = invById(invId);
  if (i) return sbUpsert('investigations', i);
  return Promise.resolve();
}

async function sbPushAll(store) {
  if (!hasSupabase() || !isPro()) return;
  for (const t of SB_TABLES) {
    if (Array.isArray(store[t]) && store[t].length) {
      await sbUpsert(t, store[t]);
    }
  }
}

function handleSbWriteError(err) {
  if (err && (err.status === 404 || (err.body && err.body.includes('PGRST205')))) {
    setSyncState('setup', 'Setup SQL', 'Run the setup SQL in your Supabase SQL Editor to enable team sync.');
  } else {
    setSyncState('offline', 'Local only', 'Could not reach your Supabase project — saved locally.');
  }
}

async function syncFromSupabase(showToast = false) {
  if (!hasSupabase()) {
    setSyncState('offline', 'Local only', 'Data stored locally on your device. Connect your own DB in Settings.');
    if (showToast) toast('Running local-only — configure your own database in Settings to sync');
    return;
  }
  if (!isPro()) {
    setSyncState('offline', 'Local only', 'Team DB Sync requires TotalRCA Pro');
    if (showToast && typeof openProModal === 'function') openProModal('Team Database Sync');
    return;
  }
  setSyncState('syncing', 'Syncing…', 'Fetching shared RCAs from your Supabase…');
  try {
    const results = await Promise.all(SB_TABLES.map(t => sbFetch(`${t}?select=*`).catch(() => [])));
    const remote = {};
    SB_TABLES.forEach((t, idx) => { remote[t] = Array.isArray(results[idx]) ? results[idx] : []; });

    const migrated = localStorage.getItem(SB_MIGRATED_KEY);
    if (remote.investigations.length === 0) {
      if (DB.investigations.length > 0) {
        await sbPushAll(DB);
      }
      localStorage.setItem(SB_MIGRATED_KEY, '1');
    } else {
      if (!migrated) {
        const remoteIds = new Set(remote.investigations.map(i => i.id));
        const localOnlyInvs = DB.investigations.filter(i => !remoteIds.has(i.id) && i.id !== DEMO_INV_ID);
        if (localOnlyInvs.length) {
          const localOnlyIds = new Set(localOnlyInvs.map(i => i.id));
          await sbUpsert('investigations', localOnlyInvs);
          for (const t of INV_CHILD_TABLES) {
            const childRows = (DB[t] || []).filter(r => localOnlyIds.has(r.investigation_id));
            if (childRows.length) await sbUpsert(t, childRows);
            remote[t] = remote[t].concat(childRows);
          }
          remote.investigations = remote.investigations.concat(localOnlyInvs);
          toast(`Uploaded ${localOnlyInvs.length} local RCA(s) to your database`);
        }
        localStorage.setItem(SB_MIGRATED_KEY, '1');
      }
      SB_TABLES.forEach(t => {
        if ((t === 'sites' || t === 'app_users') && remote[t].length === 0 && DB[t].length > 0) {
          sbUpsert(t, DB[t]);
        } else {
          DB[t] = remote[t];
        }
      });
    }

    ensureSitesAndUsers(true);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); } catch (e) {}

    lastSyncAt = Date.now();
    setSyncState('ok', 'Synced', `Your Supabase · ${DB.investigations.length} RCA(s) · ${new Date().toLocaleTimeString()}`);
    render();
    if (showToast) toast('Synced with your database');
  } catch (err) {
    handleSbWriteError(err);
    if (showToast) toast(syncState.detail);
  }
}

/* ---------- optional Apps Script & Custom REST webhook ---------- */

let webhookTimer = null;
function pushWebhook() {
  if (!isPro()) return;
  const s = DB.app_settings || {};
  const appsScriptUrl = (s.webhook_url || '').trim();
  const customRestUrl = (s.custom_rest_url || '').trim();
  const customRestToken = (s.custom_rest_token || '').trim();
  if (!appsScriptUrl && !customRestUrl) return;

  clearTimeout(webhookTimer);
  webhookTimer = setTimeout(async () => {
    const payload = JSON.stringify({ event: 'sync', at: new Date().toISOString(), store: DB });
    if (appsScriptUrl && /^https:\/\/script\.google\.com\//.test(appsScriptUrl)) {
      try {
        await fetch(appsScriptUrl, {
          method: 'POST', mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: payload,
        });
      } catch (e) {}
    }
    if (customRestUrl && /^https?:\/\//.test(customRestUrl)) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (customRestToken) headers.Authorization = `Bearer ${customRestToken}`;
        await fetch(customRestUrl, { method: 'POST', headers, body: payload });
      } catch (e) {}
    }
  }, 1200);
}

/* ---------- routing ---------- */

function parseRoute() {
  const h = (location.hash || '#/').replace(/^#\/?/, '');
  const parts = h.split('/').filter(Boolean);
  if (!parts.length) return { page: 'dashboard' };
  if (parts[0] === 'investigations') return { page: parts[1] ? 'rca' : 'investigations', id: parts[1], tab: parts[2] || 'overview' };
  if (parts[0] === 'capas') return { page: 'capas' };
  if (parts[0] === 'admin') return { page: 'admin' };
  return { page: 'dashboard' };
}
const go = (hash) => { location.hash = hash; };

/* ---------- Asana two-way integration (PAT + per-site project mapping) ---------- */

const ASANA_API = 'https://app.asana.com/api/1.0';

function getAsanaCfg() {
  if (!DB.app_settings) DB.app_settings = {};
  if (!DB.app_settings.asana) {
    DB.app_settings.asana = {
      pat: '',
      workspace_gid: '',
      workspace_name: '',
      user_name: '',
      auto_push: true,
      site_projects: {},
      capa_links: {},
      projects_cache: [],
    };
  }
  const a = DB.app_settings.asana;
  if (!a.site_projects) a.site_projects = {};
  if (!a.capa_links) a.capa_links = {};
  if (!Array.isArray(a.projects_cache)) a.projects_cache = [];
  if (typeof a.auto_push !== 'boolean') a.auto_push = true;
  return a;
}

function asanaSiteProjectGid(siteId) {
  if (!siteId) return '';
  const cfg = getAsanaCfg();
  const entry = cfg.site_projects[siteId];
  return typeof entry === 'string' ? entry : (entry?.project_gid || '');
}

function asanaSetSiteProject(siteId, projectGid, projectName = '') {
  if (!siteId) return;
  const cfg = getAsanaCfg();
  const gid = (projectGid || '').trim();
  if (!gid) {
    delete cfg.site_projects[siteId];
  } else {
    const cached = cfg.projects_cache.find(p => p.gid === gid);
    cfg.site_projects[siteId] = {
      project_gid: gid,
      project_name: projectName || cached?.name || gid,
    };
  }
}

function asanaCapaLink(capaId) {
  return getAsanaCfg().capa_links[capaId] || null;
}

async function asanaFetch(path, opts = {}) {
  const pat = (getAsanaCfg().pat || '').trim();
  if (!pat) throw new Error('Asana Personal Access Token is not configured in Settings.');
  const res = await fetch(`${ASANA_API}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${pat}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(opts.headers || {}),
    },
  });
  const text = await res.text().catch(() => '');
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (e) {}
  if (!res.ok) {
    const msg = json?.errors?.[0]?.message || text || `HTTP ${res.status}`;
    const err = new Error(`Asana API (${res.status}): ${msg}`);
    err.status = res.status;
    throw err;
  }
  return json?.data ?? json;
}

async function asanaTestAndLoad() {
  const cfg = getAsanaCfg();
  const me = await asanaFetch('/users/me?opt_fields=gid,name,email,workspaces.gid,workspaces.name');
  cfg.user_name = me.name || me.email || 'Connected';
  const workspaces = me.workspaces || [];
  if (!cfg.workspace_gid || !workspaces.some(w => w.gid === cfg.workspace_gid)) {
    if (workspaces[0]) {
      cfg.workspace_gid = workspaces[0].gid;
      cfg.workspace_name = workspaces[0].name;
    }
  } else {
    const ws = workspaces.find(w => w.gid === cfg.workspace_gid);
    if (ws) cfg.workspace_name = ws.name;
  }
  const allProjects = [];
  for (const ws of workspaces) {
    const projs = await asanaFetch(`/projects?workspace=${encodeURIComponent(ws.gid)}&archived=false&opt_fields=gid,name`);
    (projs || []).forEach(p => {
      allProjects.push({ gid: p.gid, name: p.name, workspace_gid: ws.gid, workspace_name: ws.name });
    });
  }
  cfg.projects_cache = allProjects;
  save();
  return { user: me, workspaces, projects: allProjects };
}

function asanaTaskPayload(capa) {
  const inv = invById(capa.investigation_id);
  const site = inv ? siteById(inv.site_id) : null;
  const stLabel = (CAPA_STATUS[capa.status] || {}).label || capa.status;
  const typeLabel = CAPA_TYPE[capa.type] || capa.type;
  const linkUrl = inv ? `${location.origin}${location.pathname}#/investigations/${inv.id}/capa` : '';
  const notes = [
    `TotalRCA CAPA Action`,
    inv ? `RCA: ${inv.document_code} — ${inv.title}` : '',
    site ? `Site: ${site.code} — ${site.name}${site.region ? ` (${site.region})` : ''}` : '',
    `Type: ${typeLabel} | Status: ${stLabel}`,
    `Owner: ${capa.owner || 'Unassigned'}`,
    capa.source_ref ? `Source: ${capa.source_ref}` : '',
    capa.verification_notes ? `Verification: ${capa.verification_notes}` : '',
    linkUrl ? `Open in TotalRCA: ${linkUrl}` : '',
    `[GridGuard-CAPA:${capa.id}]`,
  ].filter(Boolean).join('\n');

  const data = {
    name: `${inv ? `[${inv.document_code}] ` : ''}${capa.description}`,
    completed: ['verified', 'closed'].includes(capa.status),
    notes,
  };
  if (capa.target_date) data.due_on = toDateInput(capa.target_date);
  else data.due_on = null;
  return data;
}

async function asanaPushCapa(capa, silent = false) {
  const cfg = getAsanaCfg();
  if (!cfg.pat) {
    if (!silent) toast('Add your Asana PAT in Settings first');
    return null;
  }
  const inv = invById(capa.investigation_id);
  const projGid = asanaSiteProjectGid(inv?.site_id);
  if (!projGid) {
    if (!silent) {
      const site = inv ? siteById(inv.site_id) : null;
      toast(`Map an Asana Project to ${site ? site.code : 'this site'} in Settings or Sites & Users`);
    }
    return null;
  }
  const payload = asanaTaskPayload(capa);
  const existing = cfg.capa_links[capa.id];
  let task = null;
  if (existing?.task_gid) {
    try {
      task = await asanaFetch(`/tasks/${encodeURIComponent(existing.task_gid)}`, {
        method: 'PUT',
        body: JSON.stringify({ data: payload }),
      });
    } catch (err) {
      if (err.status !== 404) throw err;
      delete cfg.capa_links[capa.id];
    }
  }
  if (!task) {
    task = await asanaFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify({ data: { ...payload, projects: [projGid] } }),
    });
  }
  cfg.capa_links[capa.id] = {
    task_gid: task.gid,
    project_gid: projGid,
    permalink_url: task.permalink_url || `https://app.asana.com/0/${projGid}/${task.gid}`,
    last_synced: new Date().toISOString(),
  };
  save();
  return task;
}

async function asanaSyncTwoWay(scopeInvId = null) {
  const cfg = getAsanaCfg();
  if (!cfg.pat) {
    toast('Add your Asana Personal Access Token in Settings first');
    return { pulled: 0, pushed: 0 };
  }
  const capasInScope = scopeInvId
    ? byInv('capa_actions', scopeInvId)
    : accessibleCapas();

  const siteIds = Array.from(new Set(
    capasInScope.map(c => invById(c.investigation_id)?.site_id).filter(Boolean)
  ));
  const mappedProjects = new Map();
  siteIds.forEach(sid => {
    const pg = asanaSiteProjectGid(sid);
    if (pg) mappedProjects.set(sid, pg);
  });

  if (!mappedProjects.size) {
    toast('No accessible sites have an Asana Project mapped yet');
    return { pulled: 0, pushed: 0 };
  }

  const tasksByGid = new Map();
  const tasksByCapaId = new Map();
  const uniqueProjectGids = Array.from(new Set(mappedProjects.values()));

  for (const projGid of uniqueProjectGids) {
    const tasks = await asanaFetch(`/projects/${encodeURIComponent(projGid)}/tasks?opt_fields=gid,name,completed,due_on,notes,permalink_url,assignee.name,modified_at`);
    (tasks || []).forEach(t => {
      tasksByGid.set(t.gid, { ...t, _project_gid: projGid });
      const m = String(t.notes || '').match(/\[GridGuard-CAPA:([^\]]+)\]/);
      if (m) tasksByCapaId.set(m[1], { ...t, _project_gid: projGid });
    });
  }

  let pulled = 0;
  let pushed = 0;
  const updatedCapas = [];

  for (const c of capasInScope) {
    const inv = invById(c.investigation_id);
    const projGid = inv ? mappedProjects.get(inv.site_id) : '';
    if (!projGid) continue;

    const existingLink = cfg.capa_links[c.id];
    const matchedTask = (existingLink && tasksByGid.get(existingLink.task_gid)) || tasksByCapaId.get(c.id);

    if (matchedTask) {
      cfg.capa_links[c.id] = {
        task_gid: matchedTask.gid,
        project_gid: matchedTask._project_gid || projGid,
        permalink_url: matchedTask.permalink_url || `https://app.asana.com/0/${projGid}/${matchedTask.gid}`,
        last_synced: new Date().toISOString(),
      };
      let changed = false;
      if (matchedTask.completed && ['open', 'inProgress'].includes(c.status)) {
        c.status = 'verified';
        changed = true;
      } else if (!matchedTask.completed && ['verified', 'closed'].includes(c.status)) {
        c.status = 'inProgress';
        changed = true;
      }
      if (matchedTask.due_on && toDateInput(c.target_date) !== matchedTask.due_on) {
        c.target_date = fromDateInput(matchedTask.due_on);
        changed = true;
      }
      if (matchedTask.assignee?.name && !c.owner) {
        c.owner = matchedTask.assignee.name;
        changed = true;
      }
      if (changed) {
        touchInv(c.investigation_id);
        updatedCapas.push(c);
        pulled++;
      }
    } else {
      await asanaPushCapa(c, true);
      pushed++;
    }
  }

  if (updatedCapas.length) {
    await sbUpsert('capa_actions', updatedCapas);
    const touchedInvs = Array.from(new Set(updatedCapas.map(c => c.investigation_id)));
    for (const iid of touchedInvs) sbTouchInv(iid);
  }
  save();
  return { pulled, pushed };
}

/* ---------- landing / login ---------- */

let landingMode = 'login';
let landingSuccessMsg = '';
let landingPrefill = null;

function viewLanding() {
  const isReg = landingMode === 'register';
  const preUser = landingPrefill ? landingPrefill.username : 'demo';
  const prePass = landingPrefill ? landingPrefill.password : 'demo';
  return `
  <section class="landing">
    <div class="landing-grid"></div>
    <div class="landing-orb a"></div>
    <div class="landing-orb b"></div>
    <div class="landing-nodes">
      <span class="landing-node n1"></span>
      <span class="landing-node n2"></span>
      <span class="landing-node n3"></span>
      <span class="landing-node n4"></span>
    </div>
    <div class="landing-inner">
      <div class="landing-brand">
        <div class="landing-brand-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z"/>
          </svg>
        </div>
        <h1 class="landing-title">TotalRCA</h1>
        <p class="landing-sub">HV &amp; Renewable Operations · Multi-Site Root Cause Intelligence</p>
      </div>

      <div class="login-card">
        <div class="seg" style="width:100%;display:grid;grid-template-columns:1fr 1fr;margin-bottom:16px">
          <button type="button" class="${!isReg ? 'on' : ''}" data-action="landing-mode" data-mode="login">Sign in</button>
          <button type="button" class="${isReg ? 'on' : ''}" data-action="landing-mode" data-mode="register">Create account</button>
        </div>

        ${isReg ? `
          <div class="login-demo-banner">
            <strong>New Editor Account:</strong><br>
            Create your username &amp; password below. Accounts default to <strong>Editor</strong> on <strong>North Sea Offshore Substation OSP-01</strong>; an Admin can assign additional sites later.
          </div>
          <form id="registerForm">
            ${field('Username', `<input class="input mono" type="text" name="reg_username" placeholder="e.g. j.smith" autocomplete="username" required>`)}
            ${field('Password', `<input class="input" type="password" name="reg_password" placeholder="Choose a password" autocomplete="new-password" required>`)}
            <div class="form-grid">
              ${field('Full Name (optional)', `<input class="input" type="text" name="reg_full_name" placeholder="Jane Smith">`)}
              ${field('Job Title (optional)', `<input class="input" type="text" name="reg_role_title" placeholder="HV Engineer">`)}
            </div>
            <div id="registerError" class="dim" style="color:var(--red);font-size:12.5px;min-height:18px;margin-bottom:8px"></div>
            <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;padding:10px 16px" data-action="register">
              ${icon('plus')} Create Editor Account
            </button>
          </form>
        ` : `
          ${landingSuccessMsg ? `<div class="login-demo-banner" style="background:rgba(16,124,16,0.1);border-color:rgba(16,124,16,0.3);color:var(--ink)">
            <strong style="color:var(--green)">Account Created:</strong> ${esc(landingSuccessMsg)}
          </div>` : `
          <div class="login-demo-banner">
            <strong>Tester Demo Account (Pre-filled):</strong><br>
            Username: <span class="mono">demo</span> &nbsp;·&nbsp; Password: <span class="mono">demo</span>
          </div>`}
          <form id="loginForm">
            ${field('Username', `<input class="input" type="text" name="login_username" value="${esc(preUser)}" autocomplete="username" required>`)}
            ${field('Password (plain text for testing)', `<input class="input" type="text" name="login_password" value="${esc(prePass)}" autocomplete="current-password" required>`)}
            <div id="loginError" class="dim" style="color:var(--red);font-size:12.5px;min-height:18px;margin-bottom:8px"></div>
            <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;padding:10px 16px" data-action="login">
              ${icon('check')} Sign in to TotalRCA
            </button>
          </form>
          <div class="login-quick">
            <span>Quick switch role:</span>
            <button type="button" class="btn btn-ghost btn-sm" data-action="quick-login-fill" data-user="demo" data-pass="demo">Editor (demo)</button>
            <button type="button" class="btn btn-ghost btn-sm" data-action="quick-login-fill" data-user="viewer" data-pass="demo">Viewer</button>
            <button type="button" class="btn btn-ghost btn-sm" data-action="quick-login-fill" data-user="admin" data-pass="demo">Admin</button>
          </div>
        `}
      </div>

      <div class="landing-features">
        <span class="landing-feat">Multi-Site RBAC</span>
        <span class="landing-feat">5 Whys &amp; Ishikawa 6M</span>
        <span class="landing-feat">FMEA Risk Matrix</span>
        <span class="landing-feat">CAPA Tracking</span>
        <span class="landing-feat">Cloud Sync</span>
      </div>
    </div>
  </section>`;
}

/* ---------- shell ---------- */

function render() {
  const user = currentUser();
  const header = document.getElementById('appHeader');
  const viewEl = document.getElementById('view');
  const landingHost = document.getElementById('landingHost');

  if (!user) {
    if (header) header.style.display = 'none';
    if (viewEl) viewEl.style.display = 'none';
    if (landingHost) landingHost.innerHTML = viewLanding();
    return;
  }

  if (header) header.style.display = '';
  if (viewEl) viewEl.style.display = '';
  if (landingHost) landingHost.innerHTML = '';

  const adminNavBtn = document.getElementById('adminNavBtn');
  if (adminNavBtn) adminNavBtn.style.display = canManageAnySite(user) ? '' : 'none';
  const newRcaBtn = document.getElementById('newRcaBtn');
  if (newRcaBtn) newRcaBtn.style.display = canCreateRca(user) ? '' : 'none';

  const userChipHost = document.getElementById('userChipHost');
  if (userChipHost) {
    userChipHost.innerHTML = `<div class="user-pill">
      <span class="user-pill-name">${esc(user.full_name || user.username)}</span>
      <span class="user-pill-role">${esc(userRoleSummary(user))}</span>
      <button type="button" class="btn btn-ghost btn-sm" data-action="logout" style="padding:2px 6px;font-size:11.5px">Sign out</button>
    </div>`;
  }

  const r = parseRoute();
  const v = document.getElementById('view');
  if (r.page === 'dashboard')           v.innerHTML = viewDashboard();
  else if (r.page === 'investigations') v.innerHTML = viewInvestigations();
  else if (r.page === 'rca')            v.innerHTML = viewRca(r.id, r.tab);
  else if (r.page === 'capas')          v.innerHTML = viewCapas();
  else if (r.page === 'admin') {
    v.innerHTML = canManageAnySite(user)
      ? viewAdmin()
      : `<div class="empty"><strong>Access restricted</strong>Site Admin or Global Admin permissions are required. <button class="btn btn-sm" data-route="#/">Back to dashboard</button></div>`;
  }

  document.querySelectorAll('.nav-link').forEach(b => {
    const t = b.dataset.route;
    b.classList.toggle('active',
      (t === '#/' && r.page === 'dashboard') ||
      (t === '#/investigations' && (r.page === 'investigations' || r.page === 'rca')) ||
      (t === '#/capas' && r.page === 'capas') ||
      (t === '#/admin' && r.page === 'admin'));
  });
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

/* ---------- view: dashboard ---------- */

function viewDashboard() {
  const invs = filteredInvs();
  const invIds = new Set(invs.map(i => i.id));
  const capas = filteredCapas();
  const fmeas = (DB.fmea_items || []).filter(f => invIds.has(f.investigation_id));
  const openCapas = capas.filter(c => c.status === 'open' || c.status === 'inProgress');
  const highRpn = fmeas.filter(f => rpnOf(f) >= 100);
  const critical = invs.filter(i => i.severity === 'critical' || i.severity === 'catastrophic');

  const stat = (tone, ic, value, label, foot) => `
    <div class="stat tone-${tone}">
      <div class="stat-top"><span class="stat-icon">${icon(ic)}</span><span class="stat-label">${label}</span></div>
      <div class="stat-value">${value}</div>
      <div class="stat-foot">${foot}</div>
    </div>`;

  const rows = invs
    .slice().sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
    .map(i => rcaRow(i)).join('') || `<div class="empty"><strong>No investigations visible</strong>No RCAs match your site access or current filter.</div>`;

  const capaRows = openCapas
    .slice().sort((a, b) => new Date(a.target_date || 0) - new Date(b.target_date || 0))
    .map(c => {
      const inv = invById(c.investigation_id);
      const overdue = c.target_date && new Date(c.target_date) < new Date() && c.status !== 'verified';
      return `<div class="rca-row compact" data-goto="#/investigations/${c.investigation_id}/capa">
        <div>
          <div class="rca-title" style="font-size:14px">${esc(c.description).slice(0, 118)}${c.description.length > 118 ? '…' : ''}</div>
          <div class="rca-meta"><span>${esc(c.owner || 'Unassigned')}</span><span>${esc(inv ? inv.document_code : '')}</span><span>Due ${fmtDate(c.target_date)}</span></div>
        </div>
        <div class="chip-row">${chip(CAPA_TYPE[c.type] || c.type, c.type === 'preventive' ? 'cyan' : 'accent')}${overdue ? chip('Overdue', 'red') : capaChip(c.status)}</div>
      </div>`;
    }).join('') || `<div class="empty"><strong>No open actions</strong>Every corrective and preventive action is closed out.</div>`;

  const me = currentUser();
  const hasAnySiteOrRca = accessibleSites(me).length > 0 || invs.length > 0;
  const pendingBanner = !hasAnySiteOrRca
    ? `<div class="prompt-box" style="margin-bottom:18px;border-left:3px solid var(--amber)">
        <div class="prompt-box-title">Pending Site Assignment</div>
        <div style="font-size:13.5px;color:var(--ink-2)">Your <strong>Editor</strong> account (<code>@${esc(me?.username || '')}</code>) is active, but no operational sites or RCAs have been assigned to you yet. Once an Administrator assigns you a site in <strong>Sites &amp; Users</strong>, you will be able to create RCAs and view or edit RCAs for that site.</div>
      </div>`
    : '';

  return `
  <div class="page-head">
    <div>
      <div class="eyebrow">Operations Overview</div>
      <h1 class="display">Root cause intelligence<br>for HV &amp; renewable assets.</h1>
      <p class="lede">Structured 5 Whys, Ishikawa 6M and FMEA analysis with a tracked corrective action plan — scoped to your assigned sites and RCAs.</p>
    </div>
    <div class="page-actions">
      ${siteFilterSelect()}
      <button class="btn" data-route="#/investigations">Open register</button>
      <button class="btn" data-action="print-dashboard">${icon('print')} Export</button>
    </div>
  </div>
  ${pendingBanner}

  <div class="stats">
    ${stat('cyan',  'clipboard', invs.length, 'Accessible RCAs', `${invs.filter(i => i.status === 'inReview').length} awaiting review`)}
    ${stat('red',   'alert',     critical.length, 'Active Critical', `${critical.filter(i => i.status !== 'closed').length} still open`)}
    ${stat('amber', 'clock',     openCapas.length, 'Open CAPAs', `${capas.length} actions tracked`)}
    ${stat('slate', 'chart',     highRpn.length, 'High RPN (≥100)', `Assessed across ${fmeas.length} failure modes`)}
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
  const site = siteById(i.site_id);
  const role = roleForInv(currentUser(), i);
  return `<div class="rca-row" data-goto="#/investigations/${i.id}/overview">
    <div>${sevChip(i.severity)}</div>
    <div>
      <div class="rca-title">${esc(i.title)}</div>
      <div class="rca-meta">
        <span class="mono">${esc(i.document_code)}</span>
        ${site ? `<span class="chip chip-slate" style="padding:1px 6px;font-size:11px">${esc(site.code)}</span>` : ''}
        <span>${esc(i.facility_name)}</span>
        <span>${esc(i.equipment_tag || '—')}</span>
        <span>Updated ${fmtDate(i.updated_at)}</span>
      </div>
    </div>
    <div class="chip-row">${role === 'viewer' ? chip('View only', 'slate') : ''}${statusChip(i.status)}</div>
  </div>`;
}

/* ---------- view: investigations ---------- */

let invFilter = { q: '', sev: 'all' };

function viewInvestigations() {
  const baseList = filteredInvs();
  let list = baseList.slice();
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
      <p class="lede">${baseList.length} accessible record${baseList.length === 1 ? '' : 's'} in the register.</p>
    </div>
    <div class="page-actions">
      ${canCreateRca(currentUser()) ? `<button class="btn btn-primary" data-action="new-rca">${icon('plus')} New RCA</button>` : ''}
    </div>
  </div>

  <div class="toolbar">
    ${siteFilterSelect()}
    <div class="search">${icon('search')}<input class="input" id="invSearch" placeholder="Search title, document code, tag or investigator…" value="${esc(invFilter.q)}"></div>
    <div class="seg" id="sevSeg">${seg}</div>
  </div>

  <div class="card"><div class="rca-list">${rows}</div></div>`;
}

/* ---------- guided RCA coaching knowledge base ---------- */

const WHY_LEVEL_GUIDE = {
  1: { stage: 'Immediate Trigger', prompt: 'What directly tripped, failed, or breached operating limits?' },
  2: { stage: 'Mechanism', prompt: 'Which component, protection function, or control loop failed to hold?' },
  3: { stage: 'Direct Cause', prompt: 'Why did that component, material, or software lose integrity or margin?' },
  4: { stage: 'Control / Process Gap', prompt: 'Why did PMs, testing, alarms, or monitoring not detect this earlier?' },
  5: { stage: 'Systemic Root Cause', prompt: 'What standard, BOM spec, commissioning rule, or SOP allowed this gap?' },
};

const FAULT_PROMPTS = {
  electrical: [
    'Why did the protection relay or circuit breaker initiate a trip?',
    'Why did insulation, SF6/oil dielectric, or contact integrity degrade?',
    'Why did the auxiliary AC/DC supply fail to ride through the event?',
  ],
  mechanical: [
    'Why did the seal, bearing, or structural fastener lose integrity?',
    'Why was abnormal vibration, thermal rise, or wear not caught on PM?',
    'Why did the material specification fail under site operating loads?',
  ],
  control: [
    'Why did SCADA/RTU telemetry or PLC logic drop or misoperate?',
    'Why was the critical alarm masked, suppressed, or unsegregated?',
    'Why did FAT/SAT commissioning not verify this failure mode?',
  ],
  instrument: [
    'Why did the sensor or transducer drift or report an invalid value?',
    'Why did calibration or loop-check intervals miss this degradation?',
    'Why was there no redundant voting or plausibility check in SCADA?',
  ],
  human: [
    'Why did the switching sequence, LOTO, or handover step deviate?',
    'Why did the procedure or HMI layout make the error likely?',
    'Why did workload, alarm fatigue, or training gaps contribute?',
  ],
  environmental: [
    'Why did salt-mist, humidity, or storm loading penetrate the enclosure?',
    'Why was the IP/C5-M corrosion rating insufficient for site exposure?',
    'Why did HVAC, dehumidification, or heating fail to maintain margin?',
  ],
};

const ISHIKAWA_PROMPTS = {
  man: [
    'Were alarms acknowledged without field verification due to alarm fatigue?',
    'Did shift handover, LOTO, or switching authorization miss a critical check?',
    'Was specialized HV/SCADA training or OEM tooling available for the task?',
  ],
  machine: [
    'Did switchgear, transformer, or protection relay hardware degrade prematurely?',
    'Did auxiliary DC battery banks, chargers, or PSU hold-up fail under load?',
    'Were mechanical seals, bushings, or actuators operating beyond rated cycles?',
  ],
  material: [
    'Did spare parts BOM lack offshore C5-M marine or UV-stabilized specs?',
    'Was SF6 gas, insulating oil, or elastomer seal contaminated or out-of-spec?',
    'Were incompatible metals joined, causing galvanic or crevice corrosion?',
  ],
  method: [
    'Did the preventive maintenance (PM) checklist omit seal, gland, or torque checks?',
    'Did FAT/SAT commissioning procedures fail to test this fault scenario?',
    'Was the switching SOP or emergency recovery procedure ambiguous?',
  ],
  measurement: [
    'Was a critical health alarm grouped into a masked common SCADA DI?',
    'Were CTs, VTs, or density sensors out of calibration or unmonitored?',
    'Did COMTRADE, SOE, or PQ analyzers lack synchronized time-stamping?',
  ],
  milieu: [
    'Did high-salinity marine mist or condensation penetrate an IP-rated box?',
    'Did ambient temperature extremes, storm loading, or vibration accelerate wear?',
    'Did enclosure heaters or ventilation fail to prevent moisture ingress?',
  ],
};

let selectedIshVector = 'machine';

function computeRcaJourney(i) {
  const whys = byInv('five_whys_nodes', i.id);
  const ish = byInv('ishikawa_causes', i.id);
  const fmea = byInv('fmea_items', i.id);
  const capas = byInv('capa_actions', i.id);

  const hasScope = Boolean((i.executive_summary || '').trim() && (i.equipment_tag || '').trim());
  const maxWhyLevel = whys.reduce((m, n) => Math.max(m, Number(n.level) || 1), 0);
  const rootWhys = whys.filter(n => n.is_root_cause);
  const hasWhys = maxWhyLevel >= 3 && rootWhys.length >= 1;
  const distinctVectors = new Set(ish.map(c => c.vector)).size;
  const hasIsh = distinctVectors >= 3;
  const highRpnItems = fmea.filter(f => rpnOf(f) >= 100);
  const hasFmea = fmea.length >= 1;
  const hasCapa = capas.length >= 1 && (highRpnItems.length === 0 || capas.length >= Math.min(2, highRpnItems.length));
  const hasConclusion = Boolean((i.root_cause_conclusion || '').trim()) && (i.status === 'inReview' || i.status === 'closed');

  const steps = [
    { key: 'overview',  num: 1, label: 'Scope & Asset',   done: hasScope },
    { key: 'whys',      num: 2, label: '5 Whys',          done: hasWhys },
    { key: 'ishikawa',  num: 3, label: 'Ishikawa 6M',     done: hasIsh },
    { key: 'fmea',      num: 4, label: 'FMEA Risk',       done: hasFmea },
    { key: 'capa',      num: 5, label: 'CAPA Plan',       done: hasCapa },
    { key: 'report',    num: 6, label: 'Conclusion',      done: hasConclusion },
  ];

  let next = null;
  if (!hasScope) {
    next = { tab: 'overview', action: 'edit-rca', text: 'Document the equipment tag and executive summary (what happened and what was curtailed) to anchor the investigation.', cta: 'Complete scope' };
  } else if (whys.length === 0) {
    next = { tab: 'whys', action: 'add-why', text: 'Start your 5 Whys chain at Level 1: ask what directly triggered the trip or failure.', cta: 'Start 5 Whys' };
  } else if (!hasWhys) {
    next = { tab: 'whys', action: null, text: `You are at Why Level ${maxWhyLevel} with ${rootWhys.length} verified root cause(s). Drill down to Level 3–5 until you uncover the systemic or process gap.`, cta: 'Open 5 Whys' };
  } else if (!hasIsh) {
    next = { tab: 'ishikawa', action: null, text: `You have ${distinctVectors} of 6 Ishikawa vectors populated. Check at least 3 vectors (Man, Machine, Material, Method, Measurement, Milieu) so no contributing factor is missed.`, cta: 'Explore 6M vectors' };
  } else if (!hasFmea) {
    next = { tab: 'fmea', action: 'add-fmea', text: 'Score the failure modes in FMEA (Severity × Occurrence × Detection) to quantify risk priority.', cta: 'Score FMEA' };
  } else if (!hasCapa) {
    next = { tab: 'capa', action: 'add-capa', text: `${highRpnItems.length ? `${highRpnItems.length} high-RPN failure mode(s) ≥100 detected. ` : ''}Assign immediate Corrective and long-term Preventive actions with owners and due dates.`, cta: 'Assign CAPA' };
  } else if (!hasConclusion) {
    next = { tab: 'overview', action: 'edit-rca', text: 'Write the verified Root Cause Conclusion and move status to In Review or Closed to finalize the audit report.', cta: 'Finalize conclusion' };
  }

  return { steps, next, doneCount: steps.filter(s => s.done).length };
}

function viewRca(id, tab) {
  const i = invById(id);
  if (!i) return `<div class="empty"><strong>Investigation not found</strong>It may have been deleted. <button class="btn btn-sm" data-route="#/investigations">Back to register</button></div>`;
  if (!canAccessInv(currentUser(), i)) {
    return `<div class="empty"><strong>Access restricted</strong>You do not have permission to view this investigation. <button class="btn btn-sm" data-route="#/investigations">Back to register</button></div>`;
  }

  const editable = canEditInv(i);
  const site = siteById(i.site_id);
  const journey = computeRcaJourney(i);
  const tabs = TAB_LABELS.map(([k, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('');

  const stepHtml = journey.steps.map(s => {
    const cls = s.done ? 'done' : (tab === s.key ? 'active' : '');
    return `<button class="j-step ${cls}" data-tab="${s.key}">
      <span class="j-num">${s.done ? '✓' : s.num}</span>
      <span>${esc(s.label)}</span>
    </button>`;
  }).join('');

  const coachHtml = journey.next
    ? `<div class="coach-banner">
        <div class="coach-text"><strong>Next step:</strong> ${esc(journey.next.text)}</div>
        ${journey.next.action && editable
          ? `<button class="btn btn-primary btn-sm" data-action="${journey.next.action}" data-id="${i.id}">${esc(journey.next.cta)}</button>`
          : `<button class="btn btn-primary btn-sm" data-tab="${journey.next.tab}">${esc(journey.next.cta)}</button>`}
      </div>`
    : `<div class="coach-banner complete">
        <div class="coach-text"><strong>Investigation complete:</strong> All 6 RCA stages are verified and ready for audit export.</div>
        <button class="btn btn-sm" data-tab="report">${icon('print')} Review report</button>
      </div>`;

  return `
  <div class="breadcrumb">
    <button data-route="#/investigations">Investigations</button> <span>/</span> <span class="mono">${esc(i.document_code)}</span>
  </div>

  <div class="page-head">
    <div>
      <div class="eyebrow">${site ? esc(site.code + ' · ') : ''}${esc(FAULT[i.fault_category] || i.fault_category || 'Unclassified')} · ${esc(ASSET[i.asset_category] || i.asset_category || '')}</div>
      <h1 class="display" style="font-size:clamp(24px,2.6vw,34px)">${esc(i.title)}</h1>
      <div class="chip-row" style="margin-top:16px">
        ${sevChip(i.severity)} ${statusChip(i.status)}
        ${chip(i.voltage_class || '—', 'slate')}
        ${!editable ? chip('Read-only (Viewer)', 'amber') : ''}
      </div>
    </div>
    <div class="page-actions">
      ${editable ? `<button class="btn" data-action="edit-rca" data-id="${i.id}">${icon('edit')} Edit</button>` : ''}
      <button class="btn" data-action="print">${icon('print')} Report</button>
      ${editable ? `<button class="icon-btn" data-action="del-rca" data-id="${i.id}" title="Delete investigation" aria-label="Delete investigation">${icon('trash')}</button>` : ''}
    </div>
  </div>

  <div class="journey no-print">
    <div class="journey-head">
      <div class="journey-title">Guided RCA progression <span class="chip chip-accent">${journey.doneCount} / 6 stages complete</span></div>
    </div>
    <div class="journey-steps">${stepHtml}</div>
    ${coachHtml}
  </div>

  <div class="tabs" id="tabs">${tabs}</div>
  <div id="tabBody">${tabBody(i, tab)}</div>`;
}

function tabBody(i, tab) {
  if (tab === 'timeline') return tabTimeline(i);
  if (tab === 'whys')     return tabWhys(i);
  if (tab === 'ishikawa') return tabIshikawa(i);
  if (tab === 'fmea')     return tabFmea(i);
  if (tab === 'capa')     return tabCapa(i);
  if (tab === 'report')   return tabReport(i);
  return tabOverview(i);
}

function fmtBytes(b) {
  const n = Number(b || 0);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function getLinkedCapas(invId, sourceRef, prefix, specificPrefix) {
  const all = byInv('capa_actions', invId);
  const byRef = sourceRef ? all.filter(c => c.source_ref === sourceRef) : [];
  let byPrefix = [];
  if (specificPrefix) {
    byPrefix = all.filter(c => !c.source_ref && (c.description || '').startsWith(specificPrefix));
  }
  if (!byPrefix.length && prefix) {
    byPrefix = all.filter(c => !c.source_ref && (c.description || '').startsWith(prefix));
  }
  const seen = new Set();
  return [...byRef, ...byPrefix].filter(c => (seen.has(c.id) ? false : (seen.add(c.id), true)));
}

function renderLinkedCapas(invId, sourceRef, prefix, specificPrefix) {
  const list = getLinkedCapas(invId, sourceRef, prefix, specificPrefix);
  if (!list.length) return '';
  return `<div class="att-list" style="margin-top:8px">
    ${list.map(c => {
      const st = (CAPA_STATUS[c.status] || {}).label || c.status;
      const tone = (CAPA_STATUS[c.status] || {}).tone || 'slate';
      return `<button type="button" class="att-chip" style="padding:3px 9px;cursor:pointer;font-size:12px" data-action="edit-capa" data-capa="${c.id}" title="Click to view or edit this CAPA action">
        <span class="chip chip-${c.type === 'preventive' ? 'cyan' : 'accent'}" style="padding:1px 6px;font-size:10.5px">${esc(CAPA_TYPE[c.type] || c.type)}</span>
        <span style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.description)}</span>
        <span class="chip chip-${tone}" style="padding:1px 6px;font-size:10.5px">${esc(st)}</span>
      </button>`;
    }).join('')}
  </div>`;
}

function renderLinkedCapaTabs(invId, sourceRef, prefix, specificPrefix) {
  const list = getLinkedCapas(invId, sourceRef, prefix, specificPrefix);
  if (!list.length) return '';
  return list.map(c => {
    const st = (CAPA_STATUS[c.status] || {}).label || c.status;
    const tone = (CAPA_STATUS[c.status] || {}).tone || 'slate';
    return `<button type="button" class="att-chip capa-tab-chip" data-action="edit-capa" data-capa="${c.id}" title="${esc(c.description)}">
      <span class="chip chip-${c.type === 'preventive' ? 'cyan' : 'accent'}" style="padding:1px 5px;font-size:10px">${esc(CAPA_TYPE[c.type] || c.type)}</span>
      <span class="att-name">${esc(c.description)}</span>
      <span class="chip chip-${tone}" style="padding:1px 5px;font-size:10px">${esc(st)}</span>
    </button>`;
  }).join('');
}

function renderAttachments(invId, area, recordId, showAddBtn = true, extraHtml = '') {
  const inv = invById(invId);
  const editable = inv ? canEditInv(inv) : false;
  const list = (DB.attachments || []).filter(a => a.investigation_id === invId && a.area === area && a.record_id === recordId);
  if (!list.length && !(showAddBtn && editable) && !extraHtml) return '';
  const chips = list.map(a => {
    const isImg = /^image\//i.test(a.mime_type || '') && a.data_url;
    const iconHtml = isImg
      ? `<img class="att-thumb" src="${esc(a.data_url)}" alt="">`
      : icon('paperclip');
    return `<span class="att-chip">
      <button type="button" class="att-open" data-action="view-attachment" data-att="${a.id}" title="${esc(a.caption || a.file_name)}">
        ${iconHtml}
        <span class="att-name">${esc(a.file_name)}</span>
        <span class="att-size">${fmtBytes(a.size_bytes)}</span>
      </button>
      ${editable ? `<button type="button" class="att-del no-print" data-action="del-attachment" data-att="${a.id}" title="Remove attachment" aria-label="Remove attachment">×</button>` : ''}
    </span>`;
  }).join('');

  const addBtn = (showAddBtn && editable)
    ? `<button type="button" class="btn btn-ghost btn-sm no-print" data-action="add-attachment" data-id="${invId}" data-area="${area}" data-record="${recordId}">${icon('paperclip')} Attach</button>`
    : '';
  return `<div class="att-list">${chips}${addBtn}${extraHtml}</div>`;
}

function tabOverview(i) {
  const editable = canEditInv(i);
  return `
  <div class="grid-2">
    <div>
      <section class="section">
        <div class="section-head"><div><h2 class="h3">Problem statement</h2><p>What deviated, where, and operational impact</p></div></div>
        <div class="card card-pad" style="border-left:3px solid var(--amber)"><p class="muted" style="margin:0">${esc(i.problem_statement || 'No problem statement recorded yet.')}</p></div>
      </section>
      <section class="section">
        <div class="section-head"><div><h2 class="h3">Executive summary</h2><p>What happened, and what it cost</p></div></div>
        <div class="card card-pad"><p class="muted" style="margin:0">${esc(i.executive_summary || 'No summary recorded yet.')}</p></div>
      </section>
      <section class="section">
        <div class="section-head"><div><h2 class="h3">Root cause conclusion</h2><p>Verified primary cause</p></div></div>
        <div class="card card-pad" style="border-left:3px solid var(--accent)">
          <p class="muted" style="margin:0">${esc(i.root_cause_conclusion || 'Not yet concluded.')}</p>
        </div>
      </section>
      <section class="section" style="margin-bottom:0">
        <div class="section-head">
          <div><h2 class="h3">Attachments &amp; evidence</h2><p>Photos, COMTRADE records, test sheets, and supporting files</p></div>
          ${editable ? `<div class="chip-row no-print">
            <button class="btn btn-sm" data-action="add-capa" data-id="${i.id}" data-ref="overview:${i.id}" data-type="corrective" data-desc="${esc(`[Overview ${i.document_code}] `)}">${icon('plus')} Create CAPA</button>
            <button class="btn btn-primary btn-sm" data-action="add-attachment" data-id="${i.id}" data-area="overview" data-record="${i.id}">${icon('paperclip')} Attach file</button>
          </div>` : ''}
        </div>
        <div class="card card-pad">
          ${renderAttachments(i.id, 'overview', i.id, false) || '<p class="dim" style="margin:0">No investigation-level attachments yet. You can also attach files directly inside Timeline, 5 Whys, Ishikawa 6M, FMEA, and CAPA items.</p>'}
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
          ${chip(byInv('timeline_events', i.id).length + ' timeline events', 'slate')}
          ${chip(byInv('five_whys_nodes', i.id).length + ' why levels', 'slate')}
          ${chip(byInv('ishikawa_causes', i.id).length + ' 6M causes', 'slate')}
          ${chip(byInv('fmea_items', i.id).length + ' failure modes', 'slate')}
          ${chip(byInv('capa_actions', i.id).length + ' actions', 'slate')}
          ${chip(byInv('attachments', i.id).length + ' attachments', 'slate')}
        </div>
      </div>
    </section>
  </div>`;
}

function tabWhys(i) {
  const editable = canEditInv(i);
  const nodes = byInv('five_whys_nodes', i.id).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const roots = nodes.filter(n => !n.parent_id);
  const chainOne = (n, isBranch) => whyCard(n, isBranch) + nodes.filter(x => x.parent_id === n.id).map(g => chainOne(g, true)).join('');

  const body = roots.map(r => whyCard(r, false) + nodes.filter(n => n.parent_id === r.id).map(c => chainOne(c, true)).join('')).join('')
    || `<div class="empty"><strong>No 5 Whys chain yet</strong>Start with the first "why" and drill down until you uncover the systemic root cause.</div>`;

  return `
  <div class="section-head">
    <div><h2 class="h3">5 Whys interrogative chain</h2><p>Drill down through immediate triggers (L1–L2) to process &amp; design gaps (L4–L5)</p></div>
    ${editable ? `<button class="btn btn-primary btn-sm" data-action="add-why" data-id="${i.id}">${icon('plus')} Add why</button>` : ''}
  </div>
  ${body}`;
}

function whyCard(n, isBranch) {
  const inv = invById(n.investigation_id);
  const editable = inv ? canEditInv(inv) : false;
  const levelLabel = `Why L${n.level}`;
  const guide = WHY_LEVEL_GUIDE[Math.min(5, Math.max(1, Number(n.level) || 1))];
  const kids = DB.five_whys_nodes.filter(x => x.parent_id === n.id).length;
  const nextGuide = WHY_LEVEL_GUIDE[Math.min(5, (Number(n.level) || 1) + 1)];
  const capaDesc = `[5 Whys L${n.level}] ${n.answer || n.question}`;

  return `<div class="why ${n.is_root_cause ? 'root' : ''} ${isBranch ? 'branch' : ''}">
    <div class="why-head">
      <span class="why-level">${levelLabel} · ${esc(guide.stage)}</span>
      ${n.is_root_cause ? chip('Verified root cause', 'green') : ''}
      ${isBranch ? chip('Contributing branch', 'amber') : ''}
      ${editable ? `<div style="margin-left:auto" class="chip-row no-print">
        <button class="btn btn-ghost btn-sm" data-action="add-capa" data-id="${n.investigation_id}" data-ref="whys:${n.id}" data-type="${n.is_root_cause ? 'preventive' : 'corrective'}" data-desc="${esc(capaDesc)}">${icon('plus')} CAPA</button>
        <button class="btn btn-ghost btn-sm" data-action="add-why" data-id="${n.investigation_id}" data-parent="${n.id}" data-level="${(n.level || 1) + 1}">${icon('plus')} Branch</button>
        <button class="btn btn-ghost btn-sm" data-action="edit-why" data-why="${n.id}">${icon('edit')}</button>
        <button class="btn btn-ghost btn-sm" data-action="del-why" data-why="${n.id}">${icon('trash')}</button>
      </div>` : ''}
    </div>
    <div class="why-q">${esc(n.question)}</div>
    ${n.answer ? `<div class="why-a">${esc(n.answer)}</div>` : ''}
    ${n.evidence ? `<div class="why-e"><strong class="dim">Evidence:</strong> ${esc(n.evidence)}</div>` : ''}
    ${renderAttachments(n.investigation_id, 'whys', n.id, true)}
    ${renderLinkedCapaTabs(n.investigation_id, `whys:${n.id}`, `[5 Whys L${n.level}]`, `[5 Whys L${n.level}] ${(n.answer || n.question || '').slice(0, 30)}`)}
    ${renderLinkedCapas(n.investigation_id, `whys:${n.id}`, `[5 Whys L${n.level}]`, `[5 Whys L${n.level}] ${(n.answer || n.question || '').slice(0, 30)}`)}
    ${editable && !n.is_root_cause && kids === 0 ? `<div class="why-nudge no-print">
      <span><strong>Keep drilling (${esc(nextGuide.stage)}):</strong> ${esc(nextGuide.prompt)}</span>
      <button class="btn btn-sm" data-action="add-why" data-id="${n.investigation_id}" data-parent="${n.id}" data-level="${(n.level || 1) + 1}">${icon('plus')} Ask Why L${(n.level || 1) + 1}</button>
    </div>` : ''}
  </div>`;
}

function renderFishboneSvg(i, causes) {
  const ribs = [
    { key: 'man',         label: 'Man',         x1: 210, y1: 120, x2: 140, y2: 34,  top: true },
    { key: 'machine',     label: 'Machine',     x1: 420, y1: 120, x2: 350, y2: 34,  top: true },
    { key: 'material',    label: 'Material',    x1: 630, y1: 120, x2: 560, y2: 34,  top: true },
    { key: 'method',      label: 'Method',      x1: 210, y1: 120, x2: 140, y2: 206, top: false },
    { key: 'measurement', label: 'Measurement', x1: 420, y1: 120, x2: 350, y2: 206, top: false },
    { key: 'milieu',      label: 'Milieu',      x1: 630, y1: 120, x2: 560, y2: 206, top: false },
  ];

  const ribEls = ribs.map(r => {
    const items = causes.filter(c => c.vector === r.key);
    const sel = selectedIshVector === r.key;
    const stroke = sel ? 'var(--accent)' : (items.length ? 'var(--cyan)' : 'var(--line-strong)');
    const pillFill = sel ? 'var(--accent)' : (items.length ? 'var(--accent-soft)' : 'var(--bg-alt)');
    const pillText = sel ? '#FFFFFF' : 'var(--ink)';
    const py = r.top ? 8 : 204;
    const twigs = items.slice(0, 3).map((c, idx) => {
      const t = 0.28 + idx * 0.24;
      const bx = r.x1 + (r.x2 - r.x1) * t;
      const by = r.y1 + (r.y2 - r.y1) * t;
      return `<line x1="${bx}" y1="${by}" x2="${bx - 28}" y2="${by}" stroke="${c.is_primary ? 'var(--red)' : 'var(--cyan)'}" stroke-width="1.6"/>`;
    }).join('');

    return `<g class="fb-rib" data-ish-vector="${r.key}">
      <line x1="${r.x1}" y1="${r.y1}" x2="${r.x2}" y2="${r.y2}" stroke="${stroke}" stroke-width="${sel ? 2.6 : 1.8}" stroke-linecap="round"/>
      ${twigs}
      <rect class="fb-pill" x="${r.x2 - 58}" y="${py}" width="116" height="28" rx="4" fill="${pillFill}" stroke="${sel ? 'var(--accent)' : 'var(--line-strong)'}"/>
      <text x="${r.x2}" y="${py + 18}" text-anchor="middle" font-size="11.5" font-weight="600" fill="${pillText}">${esc(r.label)} (${items.length})</text>
    </g>`;
  }).join('');

  return `<div class="fishbone-wrap no-print">
    <svg class="fishbone-svg" viewBox="0 0 880 240" role="img" aria-label="Interactive Ishikawa 6M Fishbone Diagram">
      <line x1="32" y1="120" x2="700" y2="120" stroke="var(--ink-3)" stroke-width="2.5" stroke-linecap="round"/>
      <polygon points="708,120 696,114 696,126" fill="var(--ink-3)"/>
      ${ribEls}
      <rect x="712" y="82" width="154" height="76" rx="6" fill="var(--red-soft)" stroke="var(--red)" stroke-width="1.4"/>
      <text x="789" y="112" text-anchor="middle" font-size="11" font-weight="700" fill="var(--red)">FAILURE EVENT</text>
      <text x="789" y="131" text-anchor="middle" font-size="11.5" font-weight="600" fill="var(--ink)">${esc((i.equipment_tag || i.title || 'Incident').slice(0, 20))}</text>
    </svg>
  </div>`;
}

function tabIshikawa(i) {
  const editable = canEditInv(i);
  const causes = byInv('ishikawa_causes', i.id);
  const activeVec = selectedIshVector || 'machine';
  const prompts = ISHIKAWA_PROMPTS[activeVec] || [];

  const drawer = editable ? `<div class="ish-drawer no-print">
    <div class="ish-drawer-head">
      <div>
        <div style="font-size:12px;font-weight:600;color:var(--accent)">Diagnostic Questions · ${esc(VECTOR[activeVec])}</div>
        <div style="font-size:12.5px;color:var(--ink-2)">Click any rib above or a question below to log a contributing factor.</div>
      </div>
      <button class="btn btn-primary btn-sm" data-action="add-ish" data-id="${i.id}" data-vector="${activeVec}">${icon('plus')} Add to ${esc(activeVec)}</button>
    </div>
    <div class="prompt-chips">
      ${prompts.map(p => `<button class="prompt-chip" data-action="add-ish-prompt" data-id="${i.id}" data-vector="${activeVec}" data-prompt="${esc(p)}">+ ${esc(p)}</button>`).join('')}
    </div>
  </div>` : '';

  const groups = Object.keys(VECTOR).map(v => {
    const items = causes.filter(c => c.vector === v);
    const sel = activeVec === v ? 'selected' : '';
    return `<div class="ish ${sel}" data-ish-vector="${v}" style="cursor:pointer">
      <h4>${esc(VECTOR[v])} (${items.length})</h4>
      <ul>${items.map(c => `<li>
        <strong>${c.is_primary ? '<span style="color:var(--red)">◆ </span>' : ''}${esc(c.cause)}</strong>
        ${esc(c.detail || '')}
        ${renderAttachments(i.id, 'ishikawa', c.id, true)}
        ${renderLinkedCapas(i.id, `ishikawa:${c.id}`, `[${VECTOR[c.vector] || c.vector}] ${c.cause}`)}
        ${editable ? `<div class="chip-row no-print" style="margin-top:7px">
          <button class="btn btn-ghost btn-sm" data-action="add-capa" data-id="${i.id}" data-ref="ishikawa:${c.id}" data-type="${c.is_primary ? 'preventive' : 'corrective'}" data-desc="${esc(`[${VECTOR[c.vector] || c.vector}] ${c.cause}${c.detail ? ' — ' + c.detail : ''}`)}">${icon('plus')} CAPA</button>
          <button class="btn btn-ghost btn-sm" data-action="edit-ish" data-ish="${c.id}">${icon('edit')}</button>
          <button class="btn btn-ghost btn-sm" data-action="del-ish" data-ish="${c.id}">${icon('trash')}</button>
        </div>` : ''}
      </li>`).join('') || '<li class="dim">No causes recorded — click to inspect questions.</li>'}</ul>
    </div>`;
  }).join('');

  return `
  <div class="section-head">
    <div><h2 class="h3">Ishikawa 6M breakdown</h2><p>Click any rib on the diagram to explore diagnostic questions · ◆ marks a primary contributor</p></div>
    ${editable ? `<button class="btn btn-sm" data-action="add-ish" data-id="${i.id}">${icon('plus')} Add cause</button>` : ''}
  </div>
  ${renderFishboneSvg(i, causes)}
  ${drawer}
  <div class="ish-grid">${groups}</div>`;
}

function tabFmea(i) {
  const editable = canEditInv(i);
  const items = byInv('fmea_items', i.id).slice().sort((a, b) => rpnOf(b) - rpnOf(a));
  const rows = items.map(f => {
    const rpn = rpnOf(f);
    const [band, tone] = riskBand(rpn);
    const pct = Math.min(100, (rpn / 1000) * 100);
    return `<tr>
      <td><strong>${esc(f.component)}</strong><div class="dim" style="font-size:12.5px;margin-top:3px">${esc(f.failure_mode)}</div>${renderAttachments(i.id, 'fmea', f.id, true)}${renderLinkedCapas(i.id, `fmea:${f.id}`, `[FMEA ${f.component}`)}</td>
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
      <td class="no-print">${editable ? `<div class="chip-row">
        <button class="btn btn-ghost btn-sm" data-action="add-capa" data-id="${i.id}" data-ref="fmea:${f.id}" data-type="${rpn >= 100 ? 'preventive' : 'corrective'}" data-desc="${esc(`[FMEA ${f.component} · RPN ${rpn}] Mitigate ${f.failure_mode}`)}">${icon('plus')} CAPA</button>
        <button class="btn btn-ghost btn-sm" data-action="edit-fmea" data-fmea="${f.id}">${icon('edit')}</button>
        <button class="btn btn-ghost btn-sm" data-action="del-fmea" data-fmea="${f.id}">${icon('trash')}</button>
      </div>` : ''}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="9"><div class="empty"><strong>No failure modes assessed</strong>Add FMEA rows to score severity, occurrence and detection.</div></td></tr>`;

  return `
  <div class="section-head">
    <div><h2 class="h3">Failure mode &amp; effects analysis</h2><p>RPN = Severity × Occurrence × Detection · ≥100 triggers a corrective action</p></div>
    ${editable ? `<button class="btn btn-sm" data-action="add-fmea" data-id="${i.id}">${icon('plus')} Add failure mode</button>` : ''}
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
  const editable = canEditInv(i);
  const items = byInv('capa_actions', i.id).slice().sort((a, b) => new Date(a.target_date || 0) - new Date(b.target_date || 0));
  const highRpn = byInv('fmea_items', i.id).filter(f => rpnOf(f) >= 100);
  const rootWhys = byInv('five_whys_nodes', i.id).filter(n => n.is_root_cause);
  const asanaCfg = getAsanaCfg();
  const hasAsana = Boolean(asanaCfg.pat && asanaSiteProjectGid(i.site_id));

  const rows = items.map(c => {
    const overdue = c.target_date && new Date(c.target_date) < new Date() && !['verified', 'closed'].includes(c.status);
    const aLink = asanaCapaLink(c.id);
    const asanaBadge = aLink
      ? `<a class="chip chip-cyan" href="${esc(aLink.permalink_url)}" target="_blank" rel="noopener" style="text-decoration:none;margin-left:6px" title="Open linked Asana task">Asana ↗</a>`
      : (hasAsana && editable ? `<button class="btn btn-ghost btn-sm" data-action="asana-push-capa" data-capa="${c.id}" title="Push to Asana" style="margin-left:4px">↗ Asana</button>` : '');
    return `<tr>
      <td>${chip(CAPA_TYPE[c.type] || c.type, c.type === 'preventive' ? 'cyan' : 'accent')}</td>
      <td><strong>${esc(c.description)}</strong>${asanaBadge}${c.verification_notes ? `<div class="dim" style="font-size:12.5px;margin-top:5px">Verification: ${esc(c.verification_notes)}</div>` : ''}${renderAttachments(i.id, 'capa', c.id, true)}</td>
      <td class="muted">${esc(c.owner || '—')}</td>
      <td class="muted">${fmtDate(c.target_date)}</td>
      <td>${overdue ? chip('Overdue', 'red') : capaChip(c.status)}</td>
      <td class="no-print">${editable ? `<div class="chip-row">
        <button class="btn btn-ghost btn-sm" data-action="edit-capa" data-capa="${c.id}">${icon('edit')}</button>
        <button class="btn btn-ghost btn-sm" data-action="del-capa" data-capa="${c.id}">${icon('trash')}</button>
      </div>` : ''}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="6"><div class="empty"><strong>No actions raised</strong>Add corrective and preventive actions with owners and target dates.</div></td></tr>`;

  const open = items.filter(c => ['open', 'inProgress'].includes(c.status)).length;
  const done = items.filter(c => ['verified', 'closed'].includes(c.status)).length;

  const capaGuide = (highRpn.length > 0 || rootWhys.length > 0) && items.length < (highRpn.length + rootWhys.length)
    ? `<div class="prompt-box no-print">
        <div class="prompt-box-title">CAPA Alignment Check</div>
        <div style="font-size:13px;color:var(--ink-2)">You have <strong>${rootWhys.length}</strong> verified root cause(s) and <strong>${highRpn.length}</strong> FMEA failure mode(s) with RPN ≥ 100. Ensure each has both an immediate <strong>Corrective</strong> containment and a long-term <strong>Preventive</strong> engineering control.</div>
      </div>`
    : '';

  return `
  <div class="section-head">
    <div><h2 class="h3">Corrective &amp; preventive action plan</h2><p>${open} open · ${done} closed out of ${items.length}</p></div>
    <div class="chip-row no-print">
      ${hasAsana ? `<button class="btn btn-sm" data-action="asana-sync" data-inv="${i.id}" title="Two-way sync with Asana">${icon('refresh')} Sync Asana</button>` : ''}
      ${editable ? `<button class="btn btn-sm" data-action="add-capa" data-id="${i.id}">${icon('plus')} Add action</button>` : ''}
    </div>
  </div>
  ${capaGuide}
  <div class="card table-scroll">
    <table class="table table-wide">
      <thead><tr><th>Type</th><th>Action &amp; verification</th><th>Owner</th><th>Due</th><th>Status</th><th class="no-print"></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function renderVisualTimeline(events) {
  if (!events.length) return '<p class="dim">No sequence-of-events records added.</p>';
  return `<div class="timeline">
    ${events.map(ev => {
      const cat = TIMELINE_CAT[ev.category] || TIMELINE_CAT.note;
      return `<div class="tl-item">
        <span class="tl-dot tone-${cat.tone}"></span>
        <div class="tl-card">
          <div class="tl-head">
            <span class="tl-time">${esc(fmtDateTimeSec(ev.timestamp))}</span>
            ${timelineChip(ev.category)}
            ${ev.source ? `<span class="tl-source">${esc(ev.source)}</span>` : ''}
          </div>
          <div class="tl-title">${esc(ev.title)}</div>
          ${ev.detail ? `<div class="tl-detail">${esc(ev.detail)}</div>` : ''}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function tabTimeline(i) {
  const editable = canEditInv(i);
  const events = byInv('timeline_events', i.id).slice().sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
  const rows = events.map(ev => `<tr>
    <td class="mono" style="white-space:nowrap">${esc(fmtDateTimeSec(ev.timestamp))}</td>
    <td>${timelineChip(ev.category)}</td>
    <td><strong>${esc(ev.title)}</strong>${ev.detail ? `<div class="dim" style="font-size:12.5px;margin-top:4px">${esc(ev.detail)}</div>` : ''}${renderAttachments(i.id, 'timeline', ev.id, true)}${renderLinkedCapas(i.id, `timeline:${ev.id}`, `[Timeline ${fmtDateTimeSec(ev.timestamp)}] ${ev.title}`)}</td>
    <td class="muted">${esc(ev.source || '—')}</td>
    <td class="no-print">${editable ? `<div class="chip-row">
      <button class="btn btn-ghost btn-sm" data-action="add-capa" data-id="${i.id}" data-ref="timeline:${ev.id}" data-type="corrective" data-desc="${esc(`[Timeline ${fmtDateTimeSec(ev.timestamp)}] ${ev.title}`)}">${icon('plus')} CAPA</button>
      <button class="btn btn-ghost btn-sm" data-action="edit-timeline" data-tl="${ev.id}">${icon('edit')}</button>
      <button class="btn btn-ghost btn-sm" data-action="del-timeline" data-tl="${ev.id}">${icon('trash')}</button>
    </div>` : ''}</td>
  </tr>`).join('') || `<tr><td colspan="5"><div class="empty"><strong>No timeline events recorded</strong>Add SOE, SCADA alarm, trip, and restoration timestamps to build the incident timeline.</div></td></tr>`;

  return `
  <div class="section-head" style="flex-wrap:wrap">
    <div><h2 class="h3">Sequence of events table</h2><p>Log chronological timestamps (UTC) or import from Excel — automatically visualised here and in the Report</p></div>
    ${editable ? `<div class="chip-row no-print">
      <button class="btn btn-sm" data-action="download-timeline-template">${icon('download')} Excel template</button>
      <button class="btn btn-sm" data-action="import-timeline" data-id="${i.id}">${icon('upload')} Import Excel</button>
      <button class="btn btn-primary btn-sm" data-action="add-timeline" data-id="${i.id}">${icon('plus')} Add event</button>
    </div>` : ''}
  </div>
  <input type="file" id="timelineImportFile" accept=".xlsx,.xls,.csv" data-inv-id="${i.id}" style="display:none">
  <div class="card table-scroll" style="margin-bottom:28px">
    <table class="table table-wide">
      <thead><tr><th>Timestamp (UTC)</th><th>Category</th><th>Event &amp; detail</th><th>Source / System</th><th class="no-print"></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <div class="section-head">
    <div><h2 class="h3">Visual timeline preview</h2><p>Rendered in the audit report in chronological order</p></div>
    <button class="btn btn-sm" data-tab="report">${icon('print')} Open in report</button>
  </div>
  ${renderVisualTimeline(events)}`;
}

function tabReport(i) {
  const events = byInv('timeline_events', i.id).slice().sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
  const whys = byInv('five_whys_nodes', i.id).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const ish = byInv('ishikawa_causes', i.id);
  const fmea = byInv('fmea_items', i.id).slice().sort((a, b) => rpnOf(b) - rpnOf(a));
  const capas = byInv('capa_actions', i.id).slice().sort((a, b) => new Date(a.target_date || 0) - new Date(b.target_date || 0));
  const atts = byInv('attachments', i.id);
  const rootWhys = whys.filter(n => n.is_root_cause);
  const maxRpn = fmea.length ? Math.max(...fmea.map(rpnOf)) : 0;
  const openCapas = capas.filter(c => ['open', 'inProgress'].includes(c.status)).length;
  const generatedAt = fmtDateTime(new Date().toISOString());

  const tocItems = [
    ['01', 'Problem statement', i.problem_statement ? 'Recorded' : 'Pending', 'rep-sec-1'],
    ['02', 'Executive summary', i.executive_summary ? 'Recorded' : 'Pending', 'rep-sec-2'],
    ['03', 'Sequence of events (timeline)', `${events.length} event${events.length === 1 ? '' : 's'}`, 'rep-sec-3'],
    ['04', '5 Whys interrogative chain', `${whys.length} level${whys.length === 1 ? '' : 's'} · ${rootWhys.length} root cause${rootWhys.length === 1 ? '' : 's'}`, 'rep-sec-4'],
    ['05', 'Ishikawa 6M breakdown', `${ish.length} cause${ish.length === 1 ? '' : 's'}`, 'rep-sec-5'],
    ['06', 'Failure mode & effects analysis (FMEA)', `${fmea.length} item${fmea.length === 1 ? '' : 's'}${maxRpn ? ` · Max RPN ${maxRpn}` : ''}`, 'rep-sec-6'],
    ['07', 'Root cause conclusion', i.root_cause_conclusion ? 'Verified' : 'Pending', 'rep-sec-7'],
    ['08', 'Corrective & preventive action (CAPA) plan', `${capas.length} action${capas.length === 1 ? '' : 's'} (${openCapas} open)`, 'rep-sec-8'],
    ['09', 'Attachments & supporting evidence', `${atts.length} file${atts.length === 1 ? '' : 's'}`, 'rep-sec-9'],
  ];

  return `
  <div class="report" id="reportBody">
    <div class="section-head no-print">
      <div><h2 class="h3" style="margin:0;border:0;padding:0">Engineering RCA report</h2><p>Includes cover page, table of contents, and sign-off block for PDF export</p></div>
      <button class="btn btn-primary btn-sm" data-action="print">${icon('print')} Print / Save PDF</button>
    </div>

    <div class="report-cover">
      <div>
        <div class="report-cover-top">
          <div class="report-cover-brand">
            <span class="brand-mark" style="width:26px;height:26px">
              <svg viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px">
                <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z"/>
              </svg>
            </span>
            <span>TotalRCA</span>
          </div>
          <span class="report-cover-class">Engineering Audit Report · Confidential</span>
        </div>

        <div class="chip-row" style="margin-bottom:10px">
          <span class="chip chip-slate mono">${esc(i.document_code)}</span>
          ${sevChip(i.severity)}
          ${statusChip(i.status)}
          ${chip(FAULT[i.fault_category] || '—', 'slate')}
        </div>
        <h1 class="report-cover-title">${esc(i.title)}</h1>
        <p class="report-cover-sub">${esc(i.facility_name || '—')}${i.equipment_tag ? ' · ' + esc(i.equipment_tag) : ''}${i.voltage_class ? ' · ' + esc(i.voltage_class) : ''}</p>

        <dl class="kv" style="margin-top:20px">
          <dt>Document ID</dt><dd class="mono">${esc(i.document_code)}</dd>
          <dt>Facility / Site</dt><dd>${esc(i.facility_name || '—')}</dd>
          <dt>Asset hierarchy</dt><dd>${esc(ASSET[i.asset_category] || '—')}</dd>
          <dt>Equipment tag</dt><dd class="mono">${esc(i.equipment_tag || '—')}</dd>
          <dt>System / voltage</dt><dd>${esc(i.voltage_class || '—')}</dd>
          <dt>Incident date (UTC)</dt><dd>${fmtDateTime(i.incident_date)}</dd>
          <dt>Lead investigator</dt><dd>${esc(i.investigator_name || '—')}${i.investigator_role ? ' — ' + esc(i.investigator_role) : ''}</dd>
          <dt>Report generated</dt><dd>${generatedAt}</dd>
        </dl>

        <div class="report-kpis">
          <div class="report-kpi"><div class="report-kpi-val">${events.length}</div><div class="report-kpi-lbl">Timeline events</div></div>
          <div class="report-kpi"><div class="report-kpi-val">${whys.length}</div><div class="report-kpi-lbl">5 Whys levels</div></div>
          <div class="report-kpi"><div class="report-kpi-val">${ish.length}</div><div class="report-kpi-lbl">6M causes</div></div>
          <div class="report-kpi"><div class="report-kpi-val">${maxRpn || '—'}</div><div class="report-kpi-lbl">Max FMEA RPN</div></div>
          <div class="report-kpi"><div class="report-kpi-val">${capas.length}</div><div class="report-kpi-lbl">CAPA actions</div></div>
          <div class="report-kpi"><div class="report-kpi-val">${atts.length}</div><div class="report-kpi-lbl">Attachments</div></div>
        </div>
      </div>

      <div class="report-doc-ctrl">
        <div><strong>Prepared by</strong><span>${esc(i.investigator_name || '—')}${i.investigator_role ? '<br>' + esc(i.investigator_role) : ''}</span></div>
        <div><strong>Document status</strong><span>${esc((STATUS[i.status] || {}).label || i.status)} · ${esc((SEVERITY[i.severity] || {}).label || i.severity)} severity</span></div>
        <div><strong>Issue / export date</strong><span>${generatedAt}</span></div>
      </div>
    </div>

    <div class="report-toc">
      <div class="report-toc-title">Table of Contents</div>
      <div class="report-toc-list">
        ${tocItems.map(([num, name, meta, targetId]) => `<button type="button" class="report-toc-item" data-scroll-to="${targetId}">
          <span class="report-toc-num">${num}</span>
          <span class="report-toc-name">${esc(name)}</span>
          <span class="report-toc-dots"></span>
          <span class="report-toc-meta">${esc(meta)}</span>
        </button>`).join('')}
      </div>
    </div>

    <h2 id="rep-sec-1"><span class="sec-num">01</span> Problem statement</h2>
    <div class="report-callout warn"><p style="margin:0">${esc(i.problem_statement || 'No problem statement recorded.')}</p></div>

    <h2 id="rep-sec-2"><span class="sec-num">02</span> Executive summary</h2>
    <p>${esc(i.executive_summary || '—')}</p>

    <h2 id="rep-sec-3"><span class="sec-num">03</span> Sequence of events (timeline)</h2>
    ${renderVisualTimeline(events)}

    <h2 id="rep-sec-4"><span class="sec-num">04</span> 5 Whys interrogative chain</h2>
    ${whys.map(n => `<div class="report-why ${n.is_root_cause ? 'root' : ''}">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
        <strong>Why L${n.level}</strong>
        ${n.is_root_cause ? chip('Verified root cause', 'green') : ''}
      </div>
      <div style="font-weight:600;color:var(--ink);margin-bottom:4px">${esc(n.question)}</div>
      <div class="muted" style="font-size:13.5px;margin-bottom:4px"><strong>Finding:</strong> ${esc(n.answer || '—')}</div>
      <div class="dim" style="font-size:12.5px"><strong>Evidence:</strong> ${esc(n.evidence || '—')}</div>
      ${renderLinkedCapas(i.id, `whys:${n.id}`, `[5 Whys L${n.level}]`, `[5 Whys L${n.level}] ${(n.answer || n.question || '').slice(0, 30)}`)}
    </div>`).join('') || '<p class="dim">No chain recorded.</p>'}

    <h2 id="rep-sec-5"><span class="sec-num">05</span> Ishikawa 6M breakdown</h2>
    <table class="table"><thead><tr><th>6M vector</th><th>Identified causes</th></tr></thead><tbody>
      ${Object.keys(VECTOR).map(v => {
        const items = ish.filter(c => c.vector === v);
        if (!items.length) return '';
        return `<tr><td><strong>${esc(VECTOR[v])}</strong></td><td>${items.map(c => `${c.is_primary ? '<strong>[PRIMARY]</strong> ' : ''}${esc(c.cause)}${c.detail ? ' — ' + esc(c.detail) : ''}`).join('<br>')}</td></tr>`;
      }).join('') || '<tr><td colspan="2" class="dim">No causes recorded.</td></tr>'}
    </tbody></table>

    <h2 id="rep-sec-6"><span class="sec-num">06</span> Failure mode &amp; effects analysis (FMEA)</h2>
    <table class="table"><thead><tr><th>Component</th><th>Failure mode</th><th>Potential effect</th><th class="num">S</th><th class="num">O</th><th class="num">D</th><th class="num">RPN</th><th>Risk</th></tr></thead><tbody>
      ${fmea.map(f => { const [band] = riskBand(rpnOf(f)); return `<tr>
        <td><strong>${esc(f.component)}</strong></td><td class="muted">${esc(f.failure_mode)}</td><td class="muted">${esc(f.potential_effect)}</td>
        <td class="num">${f.severity}</td><td class="num">${f.occurrence}</td><td class="num">${f.detection}</td>
        <td class="num"><strong>${rpnOf(f)}</strong></td><td>${band}</td></tr>`; }).join('') || '<tr><td colspan="8" class="dim">No failure modes assessed.</td></tr>'}
    </tbody></table>

    <h2 id="rep-sec-7"><span class="sec-num">07</span> Root cause conclusion</h2>
    <div class="report-callout ok"><p style="margin:0"><strong>${esc(i.root_cause_conclusion || 'Not yet concluded.')}</strong></p></div>

    <h2 id="rep-sec-8"><span class="sec-num">08</span> Corrective &amp; preventive action (CAPA) plan</h2>
    <table class="table"><thead><tr><th>Type</th><th>Action &amp; verification</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead><tbody>
      ${capas.map(c => `<tr>
        <td>${esc(CAPA_TYPE[c.type] || c.type)}</td>
        <td>${esc(c.description)}${c.verification_notes ? `<br><span class="dim">Verification: ${esc(c.verification_notes)}</span>` : ''}</td>
        <td class="muted">${esc(c.owner || '—')}</td><td class="muted">${fmtDate(c.target_date)}</td>
        <td>${(CAPA_STATUS[c.status] || {}).label || esc(c.status)}</td></tr>`).join('') || '<tr><td colspan="5" class="dim">No actions raised.</td></tr>'}
    </tbody></table>

    <h2 id="rep-sec-9"><span class="sec-num">09</span> Attachments &amp; supporting evidence</h2>
    ${atts.length
      ? `<table class="table"><thead><tr><th>Area</th><th>File</th><th>Caption</th><th>Size</th></tr></thead><tbody>
          ${atts.map(a => `<tr>
            <td>${esc(AREA_LABELS[a.area] || a.area)}</td>
            <td><strong>${esc(a.file_name)}</strong>${/^image\//i.test(a.mime_type || '') && a.data_url ? `<div style="margin-top:6px"><img src="${esc(a.data_url)}" alt="${esc(a.file_name)}" style="max-width:220px;max-height:140px;border-radius:4px;border:1px solid var(--line)"></div>` : ''}</td>
            <td class="muted">${esc(a.caption || '—')}</td>
            <td class="muted">${fmtBytes(a.size_bytes)}</td>
          </tr>`).join('')}
        </tbody></table>`
      : '<p class="dim">No attachments uploaded.</p>'}

    <div class="report-signoff">
      <div class="eyebrow" style="margin-bottom:4px">Document Sign-Off &amp; Audit Approval</div>
      <p class="dim" style="margin:0;font-size:12.5px">TotalRCA Engineering Report · ${esc(i.document_code)} · Generated ${generatedAt}</p>
      <div class="report-signoff-grid">
        <div class="report-sig-box"><strong>Investigator</strong>${esc(i.investigator_name || '—')}${i.investigator_role ? ' · ' + esc(i.investigator_role) : ''}</div>
        <div class="report-sig-box"><strong>Technical Reviewer</strong>Signature / Date</div>
        <div class="report-sig-box"><strong>Operations / HSE Approval</strong>Signature / Date</div>
      </div>
    </div>
  </div>`;
}

/* ---------- view: CAPA ---------- */

let capaFilter = 'open';

function viewCapas() {
  const allAccessible = filteredCapas();
  let list = allAccessible.slice();
  if (capaFilter === 'open') list = list.filter(c => ['open', 'inProgress'].includes(c.status));
  else if (capaFilter !== 'all') list = list.filter(c => c.status === capaFilter);
  list.sort((a, b) => new Date(a.target_date || 0) - new Date(b.target_date || 0));
  const asanaCfg = getAsanaCfg();

  const rows = list.map(c => {
    const inv = invById(c.investigation_id);
    const editable = inv ? canEditInv(inv) : false;
    const overdue = c.target_date && new Date(c.target_date) < new Date() && !['verified', 'closed'].includes(c.status);
    const aLink = asanaCapaLink(c.id);
    const hasSiteAsana = Boolean(asanaCfg.pat && inv && asanaSiteProjectGid(inv.site_id));
    const asanaBadge = aLink
      ? `<a class="chip chip-cyan" href="${esc(aLink.permalink_url)}" target="_blank" rel="noopener" style="text-decoration:none;margin-left:6px" title="Open linked Asana task">Asana ↗</a>`
      : (hasSiteAsana && editable ? `<button class="btn btn-ghost btn-sm" data-action="asana-push-capa" data-capa="${c.id}" title="Push to Asana" style="margin-left:4px">↗ Asana</button>` : '');
    return `<tr>
      <td>${chip(CAPA_TYPE[c.type] || c.type, c.type === 'preventive' ? 'cyan' : 'accent')}</td>
      <td><strong>${esc(c.description)}</strong>${asanaBadge}${c.verification_notes ? `<div class="dim" style="font-size:12.5px;margin-top:5px">${esc(c.verification_notes)}</div>` : ''}</td>
      <td class="muted">${esc(c.owner || '—')}</td>
      <td class="muted">${inv ? `<button class="btn btn-ghost btn-sm" data-goto="#/investigations/${inv.id}/capa"><span class="mono">${esc(inv.document_code)}</span></button>` : '—'}</td>
      <td class="muted">${fmtDate(c.target_date)}</td>
      <td>${overdue ? chip('Overdue', 'red') : capaChip(c.status)}</td>
      <td>${editable ? `<div class="chip-row">
        <button class="btn btn-ghost btn-sm" data-action="edit-capa" data-capa="${c.id}">${icon('edit')}</button>
        <button class="btn btn-ghost btn-sm" data-action="del-capa" data-capa="${c.id}">${icon('trash')}</button>
      </div>` : ''}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="7"><div class="empty"><strong>Nothing here</strong>No actions match this filter.</div></td></tr>`;

  const counts = { open: allAccessible.filter(c => ['open', 'inProgress'].includes(c.status)).length, all: allAccessible.length };
  const seg = [['open', `Open (${counts.open})`], ['verified', 'Verified'], ['all', `All (${counts.all})`]]
    .map(([k, l]) => `<button class="${capaFilter === k ? 'on' : ''}" data-capa-filter="${k}">${l}</button>`).join('');

  return `
  <div class="page-head">
    <div>
      <div class="eyebrow">Action Tracking</div>
      <h1 class="display">CAPA Actions</h1>
      <p class="lede">Corrective and preventive actions across your accessible sites and investigations.</p>
    </div>
    <div class="page-actions">${siteFilterSelect()}</div>
  </div>
  <div class="toolbar">
    <div class="seg" id="capaSeg">${seg}</div>
    ${asanaCfg.pat ? `<button class="btn btn-sm" data-action="asana-sync" title="Two-way sync CAPAs with Asana">${icon('refresh')} Sync Asana</button>` : `<button class="btn btn-ghost btn-sm" data-action="settings" title="Connect Asana in Settings">Connect Asana…</button>`}
  </div>
  <div class="card table-scroll">
    <table class="table table-wide">
      <thead><tr><th>Type</th><th>Action &amp; verification</th><th>Owner</th><th>RCA</th><th>Due</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

/* ---------- view: Sites & Users Admin ---------- */

function viewAdmin() {
  const me = currentUser();
  const isGlobal = Boolean(me && me.is_global_admin);
  const sites = (DB.sites || []).filter(s => isGlobal || canAdminSite(me, s.id));
  const users = (DB.app_users || []).slice();

  const siteRows = sites.map(s => {
    const rcaCount = (DB.investigations || []).filter(i => i.site_id === s.id).length;
    return `<tr>
      <td><span class="chip chip-slate mono">${esc(s.code)}</span></td>
      <td><strong>${esc(s.name)}</strong></td>
      <td class="muted">${esc(s.region || '—')}</td>
      <td class="muted">${esc(s.voltage_class || '—')}</td>
      <td class="num">${rcaCount}</td>
      <td><div class="chip-row">
        <button class="btn btn-ghost btn-sm" data-action="edit-site" data-site="${s.id}">${icon('edit')}</button>
        ${isGlobal && sites.length > 1 ? `<button class="btn btn-ghost btn-sm" data-action="del-site" data-site="${s.id}">${icon('trash')}</button>` : ''}
      </div></td>
    </tr>`;
  }).join('') || `<tr><td colspan="6"><div class="empty"><strong>No sites configured</strong>Add a site to organize investigations and user access.</div></td></tr>`;

  const userRows = users.map(u => {
    const siteBadges = u.is_global_admin
      ? chip('Global Admin (All Sites)', 'accent')
      : Object.entries(u.site_roles || {})
          .filter(([, role]) => role)
          .map(([sid, role]) => {
            const st = siteById(sid);
            const tone = role === 'admin' ? 'accent' : role === 'editor' ? 'cyan' : 'slate';
            return chip(`${st ? st.code : sid}: ${role}`, tone);
          }).join(' ') || chip('Editor · Pending site', 'amber');
    const rcaCount = Array.isArray(u.assigned_rcas) ? u.assigned_rcas.length : 0;
    const canDelete = u.id !== 'usr-demo' && (!me || u.id !== me.id);
    return `<tr>
      <td><strong>${esc(u.full_name || u.username)}</strong><div class="dim mono" style="font-size:12px">@${esc(u.username)}</div></td>
      <td class="muted">${esc(u.role_title || '—')}</td>
      <td><div class="chip-row">${siteBadges}</div></td>
      <td class="muted">${rcaCount ? chip(`${rcaCount} RCA${rcaCount === 1 ? '' : 's'}`, 'amber') : '—'}</td>
      <td><div class="chip-row">
        <button class="btn btn-ghost btn-sm" data-action="edit-user" data-user="${u.id}">${icon('edit')}</button>
        ${canDelete ? `<button class="btn btn-ghost btn-sm" data-action="del-user" data-user="${u.id}">${icon('trash')}</button>` : ''}
      </div></td>
    </tr>`;
  }).join('');

  return `
  <div class="page-head">
    <div>
      <div class="eyebrow">Administration</div>
      <h1 class="display">Sites &amp; Users</h1>
      <p class="lede">Manage operational sites, assign per-site Admin / Editor / Viewer roles, and grant access to specific RCAs.</p>
    </div>
  </div>

  <section class="section">
    <div class="section-head">
      <div><h2 class="h3">Operational Sites (${sites.length})</h2><p>Each investigation belongs to a site; site roles control view and edit permissions</p></div>
      ${isGlobal ? `<button class="btn btn-primary btn-sm" data-action="add-site">${icon('plus')} Add site</button>` : ''}
    </div>
    <div class="card table-scroll">
      <table class="table table-wide">
        <thead><tr><th>Code</th><th>Site / Facility Name</th><th>Region</th><th>Voltage Class</th><th class="num">RCAs</th><th></th></tr></thead>
        <tbody>${siteRows}</tbody>
      </table>
    </div>
  </section>

  <section class="section" style="margin-bottom:0">
    <div class="section-head">
      <div><h2 class="h3">User Accounts (${users.length})</h2><p>Assign multiple sites with independent roles and/or specific individual RCAs</p></div>
      <button class="btn btn-primary btn-sm" data-action="add-user">${icon('plus')} Add user</button>
    </div>
    <div class="card table-scroll">
      <table class="table table-wide">
        <thead><tr><th>User</th><th>Title</th><th>Site Roles</th><th>Assigned RCAs</th><th></th></tr></thead>
        <tbody>${userRows}</tbody>
      </table>
    </div>
  </section>`;
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
  closeDropdown();
  document.getElementById('modalHost').innerHTML = '';
  document.removeEventListener('keydown', escClose);
}
function escClose(e) {
  if (e.key === 'Escape') {
    if (activeDropdown) { closeDropdown(); return; }
    closeModal();
  }
}

let activeDropdown = null;

function closeDropdown() {
  const host = document.getElementById('dropdownHost');
  if (host) host.innerHTML = '';
  if (activeDropdown) {
    activeDropdown.trigger.setAttribute('aria-expanded', 'false');
    activeDropdown = null;
  }
}

function openDropdown(root) {
  const trigger = root.querySelector('.gg-select-trigger');
  const input = root.querySelector('input[type="hidden"]');
  const labelEl = root.querySelector('.gg-select-label');
  const optsWrap = root.querySelector('.gg-select-options');
  if (!trigger || !input || !optsWrap) return;

  if (activeDropdown && activeDropdown.root === root) {
    closeDropdown();
    return;
  }
  closeDropdown();

  const host = document.getElementById('dropdownHost');
  const backdrop = document.createElement('div');
  backdrop.className = 'gg-dropdown-backdrop';
  backdrop.addEventListener('click', closeDropdown);

  const menu = document.createElement('div');
  menu.className = 'gg-dropdown-menu';
  menu.setAttribute('role', 'listbox');
  menu.innerHTML = optsWrap.innerHTML;

  host.appendChild(backdrop);
  host.appendChild(menu);

  const rect = trigger.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom - 12;
  const menuHeight = Math.min(260, menu.scrollHeight || 220);
  const openAbove = spaceBelow < menuHeight && rect.top > spaceBelow;
  menu.style.left = `${Math.max(8, rect.left)}px`;
  menu.style.width = `${rect.width}px`;
  if (openAbove) {
    menu.style.bottom = `${window.innerHeight - rect.top + 4}px`;
  } else {
    menu.style.top = `${rect.bottom + 4}px`;
  }

  trigger.setAttribute('aria-expanded', 'true');
  activeDropdown = { root, trigger, menu };

  const selectedOpt = menu.querySelector('.is-selected') || menu.querySelector('.gg-select-opt');
  if (selectedOpt) {
    selectedOpt.scrollIntoView({ block: 'nearest' });
    selectedOpt.focus({ preventScroll: true });
  }

  menu.addEventListener('click', (e) => {
    const opt = e.target.closest('.gg-select-opt');
    if (!opt) return;
    const val = opt.dataset.value;
    input.value = val;
    if (labelEl) labelEl.textContent = opt.dataset.label || opt.textContent.trim();
    optsWrap.querySelectorAll('.gg-select-opt').forEach(o => {
      const isSel = o.dataset.value === val;
      o.classList.toggle('is-selected', isSel);
      o.setAttribute('aria-selected', String(isSel));
    });
    closeDropdown();
    input.dispatchEvent(new Event('change', { bubbles: true }));
    trigger.focus();
  });

  menu.addEventListener('keydown', (e) => {
    const items = Array.from(menu.querySelectorAll('.gg-select-opt'));
    const idx = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(idx + 1) % items.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(idx - 1 + items.length) % items.length]?.focus();
    } else if (e.key === 'Tab') {
      closeDropdown();
    }
  });
}

function field(label, inner, hint) {
  return `<div class="field"><label>${label}</label>${inner}${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
}
function select(name, options, value, extraAttrs = '') {
  const valStr = String(value ?? '');
  const matched = options.find(([v]) => String(v) === valStr) || options[0] || ['', ''];
  const selectedVal = matched[0];
  const selectedLabel = matched[1];
  const checkSvg = `<svg class="gg-select-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
  return `<div class="gg-select" data-gg-select>
    <input type="hidden" name="${esc(name)}" value="${esc(selectedVal)}"${extraAttrs ? ' ' + extraAttrs : ''}>
    <button type="button" class="select gg-select-trigger" aria-haspopup="listbox" aria-expanded="false">
      <span class="gg-select-label">${esc(selectedLabel)}</span>
    </button>
    <div class="gg-select-options" hidden>
      ${options.map(([v, l]) => {
        const sel = String(v) === String(selectedVal);
        return `<button type="button" class="gg-select-opt ${sel ? 'is-selected' : ''}" role="option" aria-selected="${sel}" data-value="${esc(v)}" data-label="${esc(l)}"><span>${esc(l)}</span>${checkSvg}</button>`;
      }).join('')}
    </div>
  </div>`;
}
const optsFrom = (obj) => Object.entries(obj).map(([v, m]) => [v, m.label || m]);

/* ---------- forms ---------- */

function rcaForm(i) {
  const isNew = !i;
  const editableSites = editableSitesForUser(currentUser());
  const siteOpts = (editableSites.length ? editableSites : (DB.sites || [])).map(s => [s.id, `${s.code} — ${s.name}${s.region ? ` (${s.region})` : ''}`]);
  const defaultSiteId = (i && i.site_id) || (activeSiteId !== 'all' && siteOpts.some(([id]) => id === activeSiteId) ? activeSiteId : (siteOpts[0] ? siteOpts[0][0] : 'site-main'));
  const defaultSite = siteById(defaultSiteId);
  const d = i || {
    site_id: defaultSiteId,
    document_code: `RCA-${new Date().getFullYear()}-${(defaultSite?.code || 'FAC1').replace(/[^A-Z0-9]/gi, '')}-${String(DB.investigations.length + 1).padStart(3, '0')}`,
    title: '', facility_name: defaultSite ? defaultSite.name : 'Main Operations Facility', asset_category: 'pumpCompressor',
    equipment_tag: '', voltage_class: defaultSite ? defaultSite.voltage_class : '', severity: 'major', fault_category: 'mechanical', status: 'inProgress',
    incident_date: new Date().toISOString(), investigator_name: '', investigator_role: '', problem_statement: '', executive_summary: '',
    root_cause_conclusion: '',
  };

  const tplOpts = Object.entries(INDUSTRY_TEMPLATES).map(([k, t]) => [k, t.label]);

  return {
    eyebrow: isNew ? 'New record' : 'Editing record',
    title: isNew ? 'Create RCA' : 'Edit RCA',
    width: 'wide',
    body: `
      ${isNew ? `
      <div class="form-grid" style="margin-bottom:6px">
        <div class="field col-span-2">
          ${field('Industry template (optional)', select('industry_template', tplOpts, 'none'), 'Pre-fills asset category, fault type & starter problem statement.')}
        </div>
      </div>` : ''}
      <div class="form-grid">
        ${field('Site / Location', select('site_id', siteOpts, d.site_id || defaultSiteId))}
        ${field('Document ID', `<input class="input" name="document_code" value="${esc(d.document_code)}" required>`)}
      </div>
      <div class="form-grid">
        <div class="field col-span-2">
          <label>Title</label>
          <input class="input" name="title" value="${esc(d.title)}" placeholder="e.g. Centrifugal Pump P-104A Seal Failure" required>
        </div>
      </div>
      <div class="form-grid">
        ${field('Facility / Site Name', `<input class="input" name="facility_name" value="${esc(d.facility_name)}">`)}
        ${field('Asset / Equipment Tag', `<input class="input" name="equipment_tag" value="${esc(d.equipment_tag)}" placeholder="e.g. PUMP-P104A">`)}
      </div>
      <div class="form-grid">
        ${field('Severity', select('severity', optsFrom(SEVERITY), d.severity))}
        ${field('Status', select('status', optsFrom(STATUS), d.status))}
      </div>
      <div class="form-grid">
        ${field('Asset category', select('asset_category', Object.entries(ASSET), d.asset_category))}
        ${field('Fault category', select('fault_category', Object.entries(FAULT), d.fault_category))}
      </div>
      <div class="form-grid">
        ${field('System / Operating Spec', `<input class="input" name="voltage_class" value="${esc(d.voltage_class)}" placeholder="e.g. 400V 3-Phase / 45 kW">`)}
        ${field('Incident date', `<input class="input" type="date" name="incident_date" value="${toDateInput(d.incident_date)}">`)}
      </div>
      <div class="form-grid">
        ${field('Investigator name', `<input class="input" name="investigator_name" value="${esc(d.investigator_name)}" placeholder="e.g. Alex Morgan">`)}
        ${field('Investigator role', `<input class="input" name="investigator_role" value="${esc(d.investigator_role)}" placeholder="e.g. Reliability Engineer">`)}
      </div>
      <div class="form-grid">
        <div class="field col-span-2">
          <label>Problem statement</label>
          <textarea class="textarea" name="problem_statement" placeholder="Concise statement of what deviated, where, and its operational impact…">${esc(d.problem_statement || '')}</textarea>
        </div>
      </div>
      <div class="form-grid">
        <div class="field col-span-2">
          <label>Executive summary</label>
          <textarea class="textarea" name="executive_summary" placeholder="What happened, downtime or cost impact, and containment…">${esc(d.executive_summary)}</textarea>
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

function siteForm(site) {
  const isNew = !site;
  const d = site || { code: '', name: '', region: '', voltage_class: '' };
  const regions = Array.from(new Set([
    'North Sea', 'English Channel', 'Irish Sea', 'South East UK', 'Scotland', 'Onshore Grid',
    ...(DB.sites || []).map(s => (s.region || '').trim()).filter(Boolean),
  ])).sort();
  const asanaCfg = getAsanaCfg();
  const currentProjGid = site ? asanaSiteProjectGid(site.id) : '';
  const projectOpts = [['', '— Not mapped to Asana —'], ...asanaCfg.projects_cache.map(p => [p.gid, `${p.name} (${p.workspace_name || p.gid})`])];
  const asanaField = asanaCfg.projects_cache.length
    ? field('Asana Project (optional)', select('asana_project_gid', projectOpts, currentProjGid), 'CAPAs for this site will sync two-way with the selected Asana project.')
    : field('Asana Project GID (optional)', `<input class="input mono" name="asana_project_gid" value="${esc(currentProjGid)}" placeholder="1201234567890123">`, 'Load projects in Settings → Asana to pick from a dropdown, or paste an Asana project GID.');
  return {
    eyebrow: isNew ? 'New Site' : 'Editing Site',
    title: isNew ? 'Add Operational Site' : `Edit ${d.code}`,
    body: `
      <div class="form-grid">
        ${field('Site Code', `<input class="input mono" name="site_code" value="${esc(d.code)}" placeholder="OSP-02" required>`)}
        ${field('Voltage Class', `<input class="input" name="voltage_class" value="${esc(d.voltage_class)}" placeholder="220 kV / 66 kV">`)}
      </div>
      ${field('Site / Facility Name', `<input class="input" name="site_name" value="${esc(d.name)}" placeholder="North Sea Offshore Substation OSP-02" required>`)}
      ${field('Region / Location', `<input class="input" name="region" list="regionPresets" value="${esc(d.region)}" placeholder="Select or type a region…">
        <datalist id="regionPresets">${regions.map(r => `<option value="${esc(r)}">`).join('')}</datalist>`)}
      ${asanaField}`,
    foot: `<button class="btn" data-action="close-modal">Cancel</button>
           <button class="btn btn-primary" data-action="save-site" data-site="${site ? site.id : ''}">${icon('check')} ${isNew ? 'Create site' : 'Save changes'}</button>`,
  };
}

function userForm(user) {
  const isNew = !user;
  const me = currentUser();
  const isGlobalMe = Boolean(me && me.is_global_admin);
  const d = user || {
    username: '',
    password: '',
    full_name: '',
    role_title: '',
    is_global_admin: 0,
    site_roles: {},
    assigned_rcas: [],
  };
  const roleOpts = [['', 'No access'], ['viewer', 'Viewer (read-only)'], ['editor', 'Editor (create & edit)'], ['admin', 'Admin (site & users)']];
  const manageableSites = (DB.sites || []).filter(s => isGlobalMe || canAdminSite(me, s.id));
  const siteRoleRows = manageableSites.map(s => {
    const cur = (d.site_roles && d.site_roles[s.id]) || '';
    return `<div class="site-role-row">
      <div><strong>${esc(s.code)}</strong> <span class="muted">${esc(s.name)}</span></div>
      ${select(`site_role_${s.id}`, roleOpts, cur)}
    </div>`;
  }).join('');

  const allInvs = (DB.investigations || []).filter(inv => isGlobalMe || canAdminSite(me, inv.site_id));
  const assignedSet = new Set(Array.isArray(d.assigned_rcas) ? d.assigned_rcas : []);
  const rcaRows = allInvs.map(inv => {
    const st = siteById(inv.site_id);
    return `<label class="rca-assign-item">
      <input type="checkbox" name="assigned_rca" value="${esc(inv.id)}" ${assignedSet.has(inv.id) ? 'checked' : ''}>
      <span class="mono" style="font-size:12px">${esc(inv.document_code)}</span>
      ${st ? `<span class="chip chip-slate" style="padding:1px 5px;font-size:10.5px">${esc(st.code)}</span>` : ''}
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(inv.title)}</span>
    </label>`;
  }).join('') || '<div class="dim" style="font-size:12.5px">No investigations available to assign.</div>';

  return {
    eyebrow: isNew ? 'New User' : 'Editing User',
    title: isNew ? 'Add User Account' : `Edit @${d.username}`,
    width: 'wide',
    body: `
      <div class="form-grid">
        ${field('Username', `<input class="input mono" name="username" value="${esc(d.username)}" placeholder="j.smith" required>`)}
        ${field('Password', `<input class="input" type="text" name="password" value="${esc(d.password)}" placeholder="Password" required>`)}
      </div>
      <div class="form-grid">
        ${field('Full Name', `<input class="input" name="full_name" value="${esc(d.full_name)}" placeholder="Jane Smith">`)}
        ${field('Job Title / Role', `<input class="input" name="role_title" value="${esc(d.role_title)}" placeholder="HV Protection Engineer">`)}
      </div>
      ${isGlobalMe ? field('Global Administrator', select('is_global_admin', [[0, 'No — scoped to assigned sites & RCAs'], [1, 'Yes — Global Admin across all sites']], d.is_global_admin ? 1 : 0)) : ''}
      <div class="field" style="margin-top:8px">
        <label>Site Access &amp; Roles</label>
        <div class="site-role-grid">${siteRoleRows || '<div class="dim">No sites configured.</div>'}</div>
      </div>
      <div class="field" style="margin-top:8px">
        <label>Direct RCA Assignments (optional — grants access to specific RCAs across sites)</label>
        <div class="rca-assign-list">${rcaRows}</div>
      </div>`,
    foot: `<button class="btn" data-action="close-modal">Cancel</button>
           <button class="btn btn-primary" data-action="save-user" data-user="${user ? user.id : ''}">${icon('check')} ${isNew ? 'Create user' : 'Save changes'}</button>`,
  };
}

function modalCapaSection(invId, action, idAttrs, sourceRef, matchPrefix, specificPrefix) {
  const existing = getLinkedCapas(invId, sourceRef, matchPrefix, specificPrefix);
  return `<div class="prompt-box" style="margin-top:14px">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
      <div>
        <div class="prompt-box-title" style="margin-bottom:2px">CAPA Plan Actions${existing.length ? ` (${existing.length})` : ''}</div>
        ${!existing.length ? '<div style="font-size:12.5px;color:var(--ink-2)">Create a Corrective or Preventive action linked to this item.</div>' : ''}
      </div>
      <button type="button" class="btn btn-sm" data-action="${action}" ${idAttrs}>${icon('plus')} Add CAPA</button>
    </div>
    ${existing.length ? `<div class="linked-capa-list">
      ${existing.map(c => {
        const st = (CAPA_STATUS[c.status] || {}).label || c.status;
        const tone = (CAPA_STATUS[c.status] || {}).tone || 'slate';
        return `<div class="linked-capa-card">
          <div class="linked-capa-head">
            <div class="chip-row">
              <span class="chip chip-${c.type === 'preventive' ? 'cyan' : 'accent'}">${esc(CAPA_TYPE[c.type] || c.type)}</span>
              <span class="chip chip-${tone}">${esc(st)}</span>
              ${c.owner ? `<span class="dim" style="font-size:12px">Owner: ${esc(c.owner)}</span>` : ''}
            </div>
            <button type="button" class="btn btn-ghost btn-sm" data-action="edit-capa" data-capa="${c.id}">${icon('edit')} Edit</button>
          </div>
          <div class="linked-capa-desc">${esc(c.description)}</div>
        </div>`;
      }).join('')}
    </div>` : ''}
  </div>`;
}

function whyForm(invId, node, parentId, level) {
  const lvl = Number(level || (node ? node.level : 1)) || 1;
  const d = node || { question: '', answer: '', evidence: '', level: lvl, is_root_cause: lvl >= 5 ? 1 : 0 };
  const guide = WHY_LEVEL_GUIDE[Math.min(5, Math.max(1, lvl))];
  const inv = invById(invId);
  const domainPrompts = FAULT_PROMPTS[(inv && inv.fault_category) || 'electrical'] || FAULT_PROMPTS.electrical;
  const parentNode = parentId ? DB.five_whys_nodes.find(x => x.id === parentId) : null;
  const whyAttrs = `data-id="${invId}" data-why="${node ? node.id : ''}" data-parent="${parentId || ''}"`;

  return {
    eyebrow: `5 Whys · Level ${lvl} (${guide.stage})`, title: node ? 'Edit why level' : 'Add why level',
    body: `
      ${parentNode ? `<div class="prompt-box" style="margin-bottom:12px">
        <div class="prompt-box-title">Drilling down from L${parentNode.level} finding</div>
        <div style="font-size:13px;color:var(--ink-2)">${esc(parentNode.answer || parentNode.question)}</div>
      </div>` : ''}
      <div class="prompt-box">
        <div class="prompt-box-title">Coaching prompt · ${esc(guide.prompt)}</div>
        <div class="prompt-chips">
          ${domainPrompts.map(p => `<button type="button" class="prompt-chip" data-fill-question="${esc(p)}">${esc(p)}</button>`).join('')}
        </div>
      </div>
      <div class="form-grid">
        ${field('Why level', `<input class="input" type="number" min="1" max="9" name="level" value="${d.level}">`)}
        ${field('Root cause?', select('is_root_cause', [[0, 'No — keep drilling'], [1, 'Yes — verified root cause']], d.is_root_cause))}
      </div>
      ${field('Question', `<input class="input" name="question" value="${esc(d.question)}" placeholder="Why did…" required>`)}
      ${field('Finding', `<textarea class="textarea" name="answer" placeholder="State the verified physical, control, or process finding…">${esc(d.answer)}</textarea>`)}
      ${field('Evidence (required to verify root cause)', `<textarea class="textarea" name="evidence" placeholder="COMTRADE record, SOE log, borescope photo ID, SAP BOM…">${esc(d.evidence)}</textarea>`)}
      ${modalCapaSection(invId, 'save-why-capa', whyAttrs, node ? `whys:${node.id}` : '', node ? `[5 Whys L${node.level}]` : '', node ? `[5 Whys L${node.level}] ${(node.answer || node.question || '').slice(0, 30)}` : '')}`,
    foot: `<button class="btn" data-action="close-modal">Cancel</button>
           <button class="btn" data-action="save-why-capa" ${whyAttrs}>${icon('plus')} Save &amp; Add CAPA</button>
           <button class="btn btn-primary" data-action="save-why" ${whyAttrs}>${icon('check')} Save</button>`,
  };
}

function ishForm(invId, cause, presetVector, presetPrompt) {
  const d = cause || { vector: presetVector || selectedIshVector || 'machine', cause: '', detail: presetPrompt ? `Diagnostic check: ${presetPrompt}` : '', is_primary: 0 };
  const prompts = ISHIKAWA_PROMPTS[d.vector] || [];
  const ishAttrs = `data-id="${invId}" data-ish="${cause ? cause.id : ''}"`;
  return {
    eyebrow: 'Ishikawa 6M', title: cause ? 'Edit cause' : 'Add cause',
    body: `
      ${prompts.length ? `<div class="prompt-box">
        <div class="prompt-box-title">Questions to ask for ${esc(VECTOR[d.vector])}</div>
        <div class="prompt-chips">
          ${prompts.map(p => `<button type="button" class="prompt-chip" data-fill-detail="${esc(p)}">${esc(p)}</button>`).join('')}
        </div>
      </div>` : ''}
      <div class="form-grid">
        ${field('6M vector', select('vector', Object.entries(VECTOR), d.vector))}
        ${field('Primary contributor?', select('is_primary', [[0, 'Contributing'], [1, 'Primary']], d.is_primary))}
      </div>
      ${field('Cause', `<input class="input" name="cause" value="${esc(d.cause)}" placeholder="Short cause headline…" required>`)}
      ${field('Technical detail', `<textarea class="textarea" name="detail" placeholder="Specific component, condition, or observation…">${esc(d.detail)}</textarea>`)}
      ${modalCapaSection(invId, 'save-ish-capa', ishAttrs, cause ? `ishikawa:${cause.id}` : '', cause ? `[${VECTOR[cause.vector] || cause.vector}] ${cause.cause}` : '')}`,
    foot: `<button class="btn" data-action="close-modal">Cancel</button>
           <button class="btn" data-action="save-ish-capa" ${ishAttrs}>${icon('plus')} Save &amp; Add CAPA</button>
           <button class="btn btn-primary" data-action="save-ish" ${ishAttrs}>${icon('check')} Save</button>`,
  };
}

function fmeaLiveHtml(s, o, d) {
  const rpn = Number(s) * Number(o) * Number(d);
  const [band, tone] = riskBand(rpn);
  const advice = rpn >= 100
    ? 'RPN ≥ 100: A tracked CAPA action is required.'
    : 'Below 100 threshold — monitor under standard PM controls.';
  return `
    <div>
      <div style="font-size:12px;font-weight:600;color:var(--ink-3)">Live Risk Priority Number (S × O × D)</div>
      <div class="fmea-rubric">${advice}</div>
    </div>
    <div class="chip-row">
      <span class="fmea-live-score" style="color:var(--${tone})">${rpn}</span>
      ${chip(band, tone)}
    </div>`;
}

function fmeaForm(invId, item) {
  const d = item || { component: '', failure_mode: '', potential_effect: '', potential_cause: '', current_controls: '', severity: 5, occurrence: 5, detection: 5 };
  const score = (n, v) => select(n, Array.from({ length: 10 }, (_, k) => [k + 1, String(k + 1)]), v, 'data-fmea-score');
  const fmeaAttrs = `data-id="${invId}" data-fmea="${item ? item.id : ''}"`;
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
        ${field('Severity (1–10)', score('severity', d.severity), '1 = None · 10 = Catastrophic safety/grid loss')}
        ${field('Occurrence (1–10)', score('occurrence', d.occurrence), '1 = Remote · 10 = Very frequent')}
        ${field('Detection (1–10)', score('detection', d.detection), '1 = Certain alarm · 10 = Undetected')}
      </div>
      <div class="fmea-live" id="fmeaLiveBox">${fmeaLiveHtml(d.severity, d.occurrence, d.detection)}</div>
      ${modalCapaSection(invId, 'save-fmea-capa', fmeaAttrs, item ? `fmea:${item.id}` : '', item ? `[FMEA ${item.component}` : '')}`,
    foot: `<button class="btn" data-action="close-modal">Cancel</button>
           <button class="btn" data-action="save-fmea-capa" ${fmeaAttrs}>${icon('plus')} Save &amp; Add CAPA</button>
           <button class="btn btn-primary" data-action="save-fmea" ${fmeaAttrs}>${icon('check')} Save</button>`,
  };
}

function capaForm(invId, item, preset) {
  const inv = invById(invId);
  const editable = inv ? canEditInv(inv) : false;
  const d = item || {
    type: (preset && preset.type) || 'corrective',
    description: (preset && preset.description) || '',
    owner: '',
    target_date: null,
    status: 'open',
    verification_notes: '',
    source_ref: (preset && preset.source_ref) || '',
  };
  const roots = byInv('five_whys_nodes', invId).filter(n => n.is_root_cause);
  return {
    eyebrow: 'CAPA plan', title: !editable ? 'View action (read-only)' : (item ? 'Edit action' : 'Add action'), width: 'wide',
    body: `
      <input type="hidden" name="source_ref" value="${esc(d.source_ref || '')}">
      ${roots.length ? `<div class="prompt-box">
        <div class="prompt-box-title">Verified Root Cause(s) to address</div>
        <div style="font-size:12.5px;color:var(--ink-2)">${roots.map(r => `• ${esc(r.answer || r.question)}`).join('<br>')}</div>
      </div>` : ''}
      <div class="form-grid">
        ${field('Action type', select('type', Object.entries(CAPA_TYPE), d.type), 'Corrective = immediate containment · Preventive = long-term fix')}
        ${field('Status', select('status', optsFrom(CAPA_STATUS), d.status))}
      </div>
      ${field('Action', `<textarea class="textarea" name="description" required>${esc(d.description)}</textarea>`)}
      <div class="form-grid">
        ${field('Owner', `<input class="input" name="owner" value="${esc(d.owner)}" placeholder="M. Sorensen (Offshore HV Tech)">`)}
        ${field('Target date', `<input class="input" type="date" name="target_date" value="${toDateInput(d.target_date)}">`)}
      </div>
      ${field('Verification notes', `<textarea class="textarea" name="verification_notes">${esc(d.verification_notes)}</textarea>`)}`,
    foot: editable
      ? `<button class="btn" data-action="close-modal">Cancel</button>
         <button class="btn btn-primary" data-action="save-capa" data-id="${invId}" data-capa="${item ? item.id : ''}">${icon('check')} Save</button>`
      : `<button class="btn btn-primary" data-action="close-modal">Close</button>`,
  };
}

function timelineForm(invId, ev) {
  const inv = invById(invId);
  const d = ev || {
    timestamp: (inv && inv.incident_date) || new Date().toISOString(),
    category: 'trigger',
    source: '',
    title: '',
    detail: '',
  };
  const tlAttrs = `data-id="${invId}" data-tl="${ev ? ev.id : ''}"`;
  return {
    eyebrow: 'Sequence of events', title: ev ? 'Edit timeline event' : 'Add timeline event', width: 'wide',
    body: `
      <div class="form-grid">
        ${field('Date (UTC)', `<input class="input" type="date" name="ev_date" value="${toDateInput(d.timestamp)}" required>`)}
        ${field('Time (HH:MM:SS UTC)', `<input class="input mono" type="time" step="1" name="ev_time" value="${toTimeInput(d.timestamp)}">`)}
      </div>
      <div class="form-grid">
        ${field('Category', select('category', optsFrom(TIMELINE_CAT), d.category))}
        ${field('Source / System', `<input class="input" name="source" value="${esc(d.source)}" placeholder="Relay P543 / SCADA / Field Tech">`)}
      </div>
      ${field('Event headline', `<input class="input" name="title" value="${esc(d.title)}" placeholder="Stage-2 SF6 lockout trip on CB-04…" required>`)}
      ${field('Technical detail / evidence', `<textarea class="textarea" name="detail" placeholder="Measured values, alarm states, or field observations…">${esc(d.detail)}</textarea>`)}
      ${modalCapaSection(invId, 'save-timeline-capa', tlAttrs, ev ? `timeline:${ev.id}` : '', ev ? `[Timeline ${fmtDateTimeSec(ev.timestamp)}]` : '')}`,
    foot: `<button class="btn" data-action="close-modal">Cancel</button>
           <button class="btn" data-action="save-timeline-capa" ${tlAttrs}>${icon('plus')} Save &amp; Add CAPA</button>
           <button class="btn btn-primary" data-action="save-timeline" ${tlAttrs}>${icon('check')} Save</button>`,
  };
}

const AREA_LABELS = {
  overview: 'Overview',
  timeline: 'Sequence of events',
  whys: '5 Whys',
  ishikawa: 'Ishikawa 6M',
  fmea: 'FMEA',
  capa: 'CAPA plan',
};

function attachmentModal(invId, area, recordId) {
  const areaLabel = AREA_LABELS[area] || area;
  return {
    eyebrow: `Attachment · ${areaLabel}`,
    title: 'Attach file or photo',
    body: `
      ${field('Select file (max 5 MB)', `<input class="input" type="file" id="attFileInput" accept="image/*,.pdf,.csv,.xlsx,.xls,.txt,.log,.doc,.docx">`, 'Photos, COMTRADE/SCADA exports, PDFs, or test records. Synced to Supabase for all team members.')}
      ${field('Caption / description (optional)', `<input class="input" name="att_caption" placeholder="e.g. Breaker SF6 gauge reading, field photo, test certificate…">`)}`,
    foot: `<button class="btn" data-action="close-modal">Cancel</button>
           <button class="btn btn-primary" data-action="save-attachment" data-id="${invId}" data-area="${esc(area)}" data-record="${esc(recordId)}">${icon('paperclip')} Upload &amp; attach</button>`,
  };
}

function previewAttachmentModal(att) {
  const areaLabel = AREA_LABELS[att.area] || att.area;
  const isImg = /^image\//i.test(att.mime_type || '') && att.data_url;
  const isPdf = /^application\/pdf/i.test(att.mime_type || '') && att.data_url;
  return {
    eyebrow: `Attachment · ${areaLabel}`,
    title: att.file_name,
    width: 'wide',
    body: `
      <div class="muted" style="font-size:12.5px;margin-bottom:10px">
        ${fmtBytes(att.size_bytes)} · ${esc(att.mime_type || 'file')}${att.created_at ? ' · ' + fmtDateTime(att.created_at) : ''}
      </div>
      ${att.caption ? `<p style="margin:0 0 12px">${esc(att.caption)}</p>` : ''}
      ${isImg
        ? `<img class="att-preview-img" src="${esc(att.data_url)}" alt="${esc(att.file_name)}">`
        : isPdf
          ? `<iframe src="${esc(att.data_url)}" style="width:100%;height:420px;border:1px solid var(--line);border-radius:var(--r-sm)"></iframe>`
          : att.data_url
            ? `<p class="muted" style="margin:0">Preview is not available for this file type. Use Download below to open it.</p>`
            : `<p class="muted" style="margin:0">File content is not cached locally — click Sync in the top bar to refresh from Supabase.</p>`}`,
    foot: `<button class="btn btn-danger" data-action="del-attachment" data-att="${att.id}">Remove</button>
           ${att.data_url ? `<a class="btn" href="${esc(att.data_url)}" download="${esc(att.file_name)}">Download</a>` : ''}
           <button class="btn btn-primary" data-action="close-modal">Close</button>`,
  };
}

let pendingTimelineImport = null;

function downloadTimelineTemplate() {
  const headers = ['Date (YYYY-MM-DD)', 'Time (HH:MM:SS UTC)', 'Category', 'Source / System', 'Event Headline', 'Technical Detail / Evidence'];
  const sampleRows = [
    ['2026-11-14', '03:38:15', 'SCADA / Alarm', 'SCADA / RTU', 'Stage-1 SF6 low-density warning on Bay 04 Phase B', 'Compartment pressure crossed 0.56 MPa warning threshold.'],
    ['2026-11-14', '03:42:11', 'Trip / Fault', 'Relay P543 / COMTRADE #4419', 'Stage-2 SF6 lockout trip on CB-04 (240 MW curtailment)', 'Pressure fell below 0.52 MPa; protection relay executed breaker trip.'],
  ];
  const catGuide = [
    ['Valid Category Values', 'Description'],
    ['Trip / Fault', 'Protection trip, fault inception, or equipment lockout (Red)'],
    ['SCADA / Alarm', 'Telemetry loss, warning alarm, or measurement event (Amber)'],
    ['Operator / Field', 'Switching action, dispatch, or field inspection (Cyan)'],
    ['Restoration', 'Repair completion or re-energisation (Green)'],
    ['Observation', 'General note or contextual observation (Slate)'],
  ];

  if (window.XLSX) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws['!cols'] = [{ wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 26 }, { wch: 44 }, { wch: 52 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Timeline Events');
    const wsGuide = XLSX.utils.aoa_to_sheet(catGuide);
    wsGuide['!cols'] = [{ wch: 22 }, { wch: 58 }];
    XLSX.utils.book_append_sheet(wb, wsGuide, 'Categories');
    XLSX.writeFile(wb, 'totalrca-timeline-template.xlsx');
    toast('Excel template downloaded');
  } else {
    const csv = [headers, ...sampleRows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'totalrca-timeline-template.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('CSV template downloaded');
  }
}

function normalizeTimelineCategory(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (!s) return 'note';
  if (TIMELINE_CAT[s]) return s;
  if (s.includes('trip') || s.includes('fault') || s.includes('trigger')) return 'trigger';
  if (s.includes('scada') || s.includes('alarm') || s.includes('telemetry')) return 'telemetry';
  if (s.includes('operator') || s.includes('field') || s.includes('action')) return 'action';
  if (s.includes('restor') || s.includes('recover') || s.includes('re-energ')) return 'recovery';
  return 'note';
}

function parseExcelDateStr(val) {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'number' && window.XLSX?.SSF?.parse_date_code) {
    const d = XLSX.SSF.parse_date_code(val);
    if (d && d.y) return `${String(d.y).padStart(4, '0')}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  const s = String(val).trim();
  const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  const ukMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (ukMatch) return `${ukMatch[3]}-${ukMatch[2].padStart(2, '0')}-${ukMatch[1].padStart(2, '0')}`;
  const parsed = new Date(s);
  return isNaN(parsed) ? '' : parsed.toISOString().slice(0, 10);
}

function parseExcelTimeStr(val) {
  if (val === null || val === undefined || val === '') return '00:00:00';
  if (typeof val === 'number' && window.XLSX?.SSF?.parse_date_code) {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return `${String(d.H || 0).padStart(2, '0')}:${String(d.M || 0).padStart(2, '0')}:${String(d.S || 0).padStart(2, '0')}`;
  }
  const s = String(val).trim();
  const m = s.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) return `${m[1].padStart(2, '0')}:${m[2]}:${(m[3] || '00').padStart(2, '0')}`;
  return '00:00:00';
}

function parseTimelineRows(rawRows) {
  const events = [];
  rawRows.forEach(row => {
    const norm = {};
    Object.keys(row).forEach(k => { norm[String(k).trim().toLowerCase()] = row[k]; });
    const pick = (...keys) => {
      for (const k of keys) {
        if (norm[k] !== undefined && String(norm[k]).trim() !== '') return norm[k];
      }
      return '';
    };

    const title = String(pick('event headline', 'event', 'headline', 'title', 'description')).trim();
    if (!title) return;

    const rawTs = pick('timestamp', 'timestamp (utc)', 'datetime');
    let timestamp;
    if (rawTs) {
      if (typeof rawTs === 'number' && window.XLSX?.SSF?.parse_date_code) {
        const d = XLSX.SSF.parse_date_code(rawTs);
        timestamp = new Date(Date.UTC(d.y, d.m - 1, d.d, d.H || 0, d.M || 0, d.S || 0)).toISOString();
      } else {
        const d = new Date(String(rawTs).trim());
        timestamp = isNaN(d) ? fromDateTimeInput(parseExcelDateStr(rawTs), parseExcelTimeStr(rawTs)) : d.toISOString();
      }
    } else {
      const dateStr = parseExcelDateStr(pick('date (yyyy-mm-dd)', 'date (utc)', 'date'));
      const timeStr = parseExcelTimeStr(pick('time (hh:mm:ss utc)', 'time (utc)', 'time'));
      timestamp = dateStr ? fromDateTimeInput(dateStr, timeStr) : new Date().toISOString();
    }

    events.push({
      timestamp,
      category: normalizeTimelineCategory(pick('category', 'type')),
      source: String(pick('source / system', 'source', 'system')).trim(),
      title,
      detail: String(pick('technical detail / evidence', 'technical detail', 'detail', 'details', 'evidence', 'notes')).trim(),
    });
  });
  return events;
}

function timelineImportModal(invId, rows, fileName) {
  pendingTimelineImport = { invId, rows };
  const previewRows = rows.slice(0, 8).map(ev => `<tr>
    <td class="mono" style="white-space:nowrap">${esc(fmtDateTimeSec(ev.timestamp))}</td>
    <td>${timelineChip(ev.category)}</td>
    <td><strong>${esc(ev.title)}</strong>${ev.detail ? `<div class="dim" style="font-size:12px">${esc(ev.detail)}</div>` : ''}</td>
    <td class="muted">${esc(ev.source || '—')}</td>
  </tr>`).join('');

  return {
    eyebrow: 'Excel / CSV Import',
    title: `Import ${rows.length} timeline event${rows.length === 1 ? '' : 's'}`,
    width: 'wide',
    body: `
      <p class="muted" style="margin:0 0 14px">Parsed <strong>${rows.length}</strong> valid event(s) from <span class="mono">${esc(fileName)}</span>.</p>
      ${field('Import mode', select('import_mode', [['append', 'Append to existing timeline'], ['replace', 'Replace existing timeline events']], 'append'))}
      <div class="card table-scroll">
        <table class="table">
          <thead><tr><th>Timestamp (UTC)</th><th>Category</th><th>Event &amp; detail</th><th>Source</th></tr></thead>
          <tbody>${previewRows}</tbody>
        </table>
      </div>
      ${rows.length > 8 ? `<p class="dim" style="font-size:12.5px;margin:10px 0 0">Showing first 8 of ${rows.length} events.</p>` : ''}`,
    foot: `<button class="btn" data-action="close-modal">Cancel</button>
           <button class="btn btn-primary" data-action="confirm-timeline-import">${icon('check')} Import ${rows.length} event${rows.length === 1 ? '' : 's'}</button>`,
  };
}

const SB_SETUP_SQL = `-- Run this once in your Supabase SQL Editor to enable TotalRCA Team Sync:
create table if not exists sites (id text primary key, name text, code text, region text, voltage_class text);
create table if not exists app_users (id text primary key, username text, password text, full_name text, role_title text, is_global_admin int default 0, site_roles jsonb default '{}'::jsonb, assigned_rcas jsonb default '[]'::jsonb);
create table if not exists investigations (id text primary key, site_id text, document_code text, title text, facility_name text, asset_category text, equipment_tag text, voltage_class text, severity text, fault_category text, status text, incident_date text, investigator_name text, investigator_role text, problem_statement text, executive_summary text, root_cause_conclusion text, drive_share_url text, updated_at text);
create table if not exists timeline_events (id text primary key, investigation_id text, timestamp text, category text, source text, title text, detail text);
create table if not exists five_whys_nodes (id text primary key, investigation_id text, parent_id text, level int, question text, answer text, evidence text, is_root_cause int default 0, sort_order int default 0);
create table if not exists ishikawa_causes (id text primary key, investigation_id text, vector text, cause text, detail text, is_primary int default 0);
create table if not exists fmea_items (id text primary key, investigation_id text, component text, failure_mode text, potential_effect text, potential_cause text, current_controls text, severity int, occurrence int, detection int);
create table if not exists capa_actions (id text primary key, investigation_id text, type text, description text, owner text, target_date text, status text, verification_notes text);
create table if not exists attachments (id text primary key, investigation_id text, area text, record_id text, name text, mime text, size int, data_url text, created_at text);`;

function updateProPill() {
  const btn = document.getElementById('proBtn');
  if (!btn) return;
  if (!window.TotalRCANative || !window.TotalRCANative.isNative()) {
    btn.style.display = 'none';
    return;
  }
  btn.style.display = '';
  const active = isPro();
  btn.className = `sync-pill ${active ? 'ok' : 'warn'}`;
  const label = btn.querySelector('.pro-text');
  if (label) label.textContent = active ? 'Pro Active' : 'Upgrade to Pro';
  btn.title = active ? 'TotalRCA Pro unlocked' : 'Free trial: 1 sample + 1 custom RCA. Click to upgrade.';
}

function proModal(reason = '') {
  const active = isPro();
  return {
    eyebrow: 'TotalRCA Pro',
    title: active ? 'Pro Unlocked' : 'Upgrade to TotalRCA Pro',
    width: 'wide',
    body: `
      ${reason ? `<div class="login-demo-banner" style="margin-bottom:14px"><strong>Unlock ${esc(reason)}:</strong> Free plan includes the sample Centrifugal Pump RCA plus 1 custom RCA (up to 3 CAPA actions) stored locally on your device.</div>` : ''}
      <div class="card" style="padding:16px;margin-bottom:14px">
        <div class="eyebrow" style="margin-bottom:8px">Everything included in TotalRCA Pro</div>
        <ul style="margin:0;padding-left:18px;font-size:13.5px;line-height:1.7;color:var(--ink)">
          <li><strong>Unlimited RCAs &amp; CAPA Actions</strong> stored locally offline on your phone</li>
          <li><strong>Unbranded PDF &amp; Excel Exports</strong> + Timeline spreadsheet import</li>
          <li><strong>Bring Your Own Database (Team Sync)</strong> — connect your own Supabase, Google Apps Script, or custom REST endpoint</li>
          <li><strong>All Industry Templates</strong> — Mechanical, Electrical, Manufacturing, IT/Ops &amp; HV</li>
        </ul>
      </div>
      ${active ? `
        <div class="chip-row">${chip('TotalRCA Pro is active on this device', 'green')}</div>
      ` : `
        <div class="form-grid" style="gap:12px">
          <div class="card" style="padding:16px;border:2px solid var(--accent)">
            <div class="chip-row" style="justify-content:space-between;margin-bottom:6px">
              <strong>Pro Lifetime</strong>
              ${chip('Best Value', 'cyan')}
            </div>
            <div style="font-size:22px;font-weight:700;margin-bottom:4px">£34.99 <span class="muted" style="font-size:12.5px;font-weight:400">/ one-time</span></div>
            <p class="muted" style="font-size:12.5px;margin:0 0 12px">Pay once, own forever. Ideal for engineers &amp; field techs.</p>
            <button class="btn btn-primary" style="width:100%;justify-content:center" data-action="buy-pro" data-plan="lifetime">Unlock Lifetime</button>
          </div>
          <div class="card" style="padding:16px">
            <div class="chip-row" style="justify-content:space-between;margin-bottom:6px">
              <strong>Pro Annual / Monthly</strong>
              ${chip('Teams', 'slate')}
            </div>
            <div style="font-size:22px;font-weight:700;margin-bottom:4px">£29.99<span class="muted" style="font-size:12.5px;font-weight:400">/yr</span> <span class="muted" style="font-size:13px">or £4.99/mo</span></div>
            <p class="muted" style="font-size:12.5px;margin:0 0 12px">Easy to expense. Cancel anytime in App Store / Google Play.</p>
            <div class="chip-row" style="gap:8px">
              <button class="btn btn-sm" style="flex:1;justify-content:center" data-action="buy-pro" data-plan="annual">Annual (£29.99)</button>
              <button class="btn btn-sm" style="flex:1;justify-content:center" data-action="buy-pro" data-plan="monthly">Monthly (£4.99)</button>
            </div>
          </div>
        </div>
      `}
    `,
    foot: `<button class="btn" data-action="restore-purchases">Restore Purchases</button>
           <button class="btn" data-action="close-modal">Close</button>`,
  };
}

function openProModal(reason = '') {
  openModal(proModal(reason));
}

function settingsModal() {
  const s = DB.app_settings || {};
  const a = getAsanaCfg();
  const sites = accessibleSites(currentUser());
  const projectOpts = [['', '— Not mapped —'], ...a.projects_cache.map(p => [p.gid, `${p.name} (${p.workspace_name || p.gid})`])];
  const siteMapRows = sites.map(site => {
    const cur = asanaSiteProjectGid(site.id);
    const control = a.projects_cache.length
      ? select(`asana_site_${site.id}`, projectOpts, cur)
      : `<input class="input mono" name="asana_site_${site.id}" value="${esc(cur)}" placeholder="Asana Project GID">`;
    return `<tr>
      <td><span class="chip chip-slate mono">${esc(site.code)}</span> <span class="muted" style="font-size:12.5px">${esc(site.name)}</span></td>
      <td style="min-width:220px">${control}</td>
    </tr>`;
  }).join('');

  return {
    eyebrow: 'Configuration', title: 'Settings', width: 'wide',
    body: `
      <section style="margin-bottom:8px">
        <div class="section-head" style="margin-bottom:8px">
          <div>
            <h3 class="h3" style="margin-bottom:4px">TotalRCA Pro License</h3>
            <p class="muted" style="font-size:13px;margin:0">${isPro() ? 'Pro is active — unlimited RCAs, exports &amp; Team DB sync unlocked.' : 'Free Plan — includes 1 sample RCA + 1 custom RCA (up to 3 CAPAs) stored locally.'}</p>
          </div>
          ${isPro() ? chip('Pro Active', 'green') : chip('Free Plan', 'amber')}
        </div>
        <div class="chip-row">
          ${isPro() ? '' : `<button class="btn btn-primary btn-sm" type="button" data-action="open-pro">Upgrade to Pro</button>`}
          <button class="btn btn-sm" type="button" data-action="restore-purchases">Restore Purchases</button>
        </div>
      </section>
      <div class="divider"></div>
      <section style="margin-bottom:8px">
        <div class="section-head" style="margin-bottom:8px">
          <div>
            <h3 class="h3" style="margin-bottom:4px">Team Database Sync (Bring Your Own Database)</h3>
            <p class="muted" style="font-size:13px;margin:0">Runs 100% local on your device by default with no central server. Teams on Pro can connect their own Supabase project, Google Apps Script, or custom REST API.</p>
          </div>
          ${hasSupabase() ? chip('Supabase Configured', 'green') : chip('Local Only', 'slate')}
        </div>
        <div class="form-grid">
          ${field('Supabase Project URL', `<input class="input mono" name="supabase_url" value="${esc(s.supabase_url || '')}" placeholder="https://your-project.supabase.co">`)}
          ${field('Supabase Anon / Publishable Key', `<input class="input mono" type="password" name="supabase_key" value="${esc(s.supabase_key || '')}" placeholder="sb_publishable_... or eyJ...">`)}
        </div>
        <div class="chip-row" style="margin-bottom:14px">
          <button class="btn btn-sm" type="button" data-action="copy-sb-sql">Copy Supabase Setup SQL</button>
          <button class="btn btn-sm" type="button" data-action="sync-now">Test &amp; Sync Now</button>
        </div>
        ${field('Google Apps Script Web App URL (optional)',
          `<input class="input" name="webhook_url" value="${esc(s.webhook_url || '')}" placeholder="https://script.google.com/macros/s/AKfy…/exec">`,
          'Mirrors changes to your own Google Drive / Sheets.')}
        <div class="form-grid">
          ${field('Custom REST / Webhook URL (optional)', `<input class="input" name="custom_rest_url" value="${esc(s.custom_rest_url || '')}" placeholder="https://api.yourcompany.com/rca-sync">`)}
          ${field('Bearer Token (optional)', `<input class="input mono" type="password" name="custom_rest_token" value="${esc(s.custom_rest_token || '')}" placeholder="Optional Authorization header">`)}
        </div>
      </section>
      <div class="divider"></div>
      <section style="margin-bottom:8px">
        <div class="section-head" style="margin-bottom:8px">
          <div>
            <h3 class="h3" style="margin-bottom:4px">Asana Two-Way Integration</h3>
            <p class="muted" style="font-size:13px;margin:0">Connect with your Asana Personal Access Token to sync CAPA actions two-way per operational site.</p>
          </div>
          ${a.user_name ? chip(`Connected: ${a.user_name}`, 'green') : chip('Not connected', 'slate')}
        </div>
        ${field('Asana Personal Access Token (PAT)',
          `<div class="chip-row" style="gap:8px;flex-wrap:nowrap">
            <input class="input mono" type="password" name="asana_pat" value="${esc(a.pat || '')}" placeholder="1/1201234567890:abcdef..." style="flex:1">
            <button class="btn btn-sm" type="button" data-action="asana-test">${icon('refresh')} Test &amp; Load Projects</button>
          </div>`,
          'Generate a PAT in Asana → My Settings → Apps → Developer Console.')}
        <label style="display:flex;align-items:center;gap:8px;font-size:13.5px;margin:8px 0 14px;cursor:pointer">
          <input type="checkbox" name="asana_auto_push" ${a.auto_push ? 'checked' : ''}>
          <span>Auto-push CAPA creations &amp; edits to Asana when the site has a mapped project</span>
        </label>
        ${sites.length ? `
          <div style="margin-bottom:12px">
            <div class="eyebrow" style="margin-bottom:6px">Per-Site Asana Project Mapping</div>
            <div class="card table-scroll" style="margin:0">
              <table class="table">
                <thead><tr><th>Operational Site</th><th>Asana Project</th></tr></thead>
                <tbody>${siteMapRows}</tbody>
              </table>
            </div>
          </div>` : ''}
        <div class="chip-row">
          <button class="btn btn-sm" type="button" data-action="asana-sync">${icon('refresh')} Sync All Sites with Asana Now</button>
        </div>
      </section>
      <div class="divider"></div>
      <section>
        <h3 class="h3" style="margin-bottom:6px">Data &amp; Backups</h3>
        <p class="muted" style="font-size:13.5px;margin:0 0 16px">
          ${DB.investigations.length} investigations · ${DB.timeline_events.length} timeline events · ${DB.five_whys_nodes.length} why levels ·
          ${DB.ishikawa_causes.length} 6M causes · ${DB.fmea_items.length} failure modes ·
          ${DB.capa_actions.length} actions · ${(DB.attachments || []).length} attachments
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
  const scope = document.getElementById('modalHost') || document;
  names.forEach(n => {
    const el = scope.querySelector(`input[name="${n}"], textarea[name="${n}"], select[name="${n}"]`);
    if (el) out[n] = (el.value ?? '').trim();
  });
  return out;
}

function saveTimelineFromModal(el) {
  const v = collect(['category','source','title','detail']);
  if (!v.title) { toast('An event headline is required'); return null; }
  const dv = document.querySelector('[name="ev_date"]')?.value;
  const tv = document.querySelector('[name="ev_time"]')?.value;
  v.timestamp = fromDateTimeInput(dv, tv);
  let savedRow;
  if (el.dataset.tl) {
    savedRow = DB.timeline_events.find(x => x.id === el.dataset.tl);
    Object.assign(savedRow, v);
  } else {
    savedRow = Object.assign({ id: uid('tl'), investigation_id: el.dataset.id }, v);
    DB.timeline_events.push(savedRow);
  }
  touchInv(el.dataset.id); save(); sbUpsert('timeline_events', savedRow); sbTouchInv(el.dataset.id);
  return savedRow;
}

function saveWhyFromModal(el) {
  const v = collect(['question','answer','evidence','level','is_root_cause']);
  if (!v.question) { toast('A question is required'); return null; }
  if (Number(v.is_root_cause) === 1 && !v.evidence) {
    toast('Add supporting evidence (log, photo, test record) to verify a root cause');
    return null;
  }
  const node = { level: Number(v.level) || 1, question: v.question, answer: v.answer, evidence: v.evidence, is_root_cause: Number(v.is_root_cause) || 0 };
  let savedNode;
  if (el.dataset.why) {
    savedNode = DB.five_whys_nodes.find(x => x.id === el.dataset.why);
    Object.assign(savedNode, node);
  } else {
    savedNode = Object.assign({ id: uid('w'), investigation_id: el.dataset.id, parent_id: el.dataset.parent || null, sort_order: DB.five_whys_nodes.length + 1 }, node);
    DB.five_whys_nodes.push(savedNode);
  }
  touchInv(el.dataset.id); save(); sbUpsert('five_whys_nodes', savedNode); sbTouchInv(el.dataset.id);
  return savedNode;
}

function saveIshFromModal(el) {
  const v = collect(['vector','cause','detail','is_primary']);
  if (!v.cause) { toast('A cause is required'); return null; }
  v.is_primary = Number(v.is_primary) || 0;
  let savedIsh;
  if (el.dataset.ish) {
    savedIsh = DB.ishikawa_causes.find(x => x.id === el.dataset.ish);
    Object.assign(savedIsh, v);
  } else {
    savedIsh = Object.assign({ id: uid('ish'), investigation_id: el.dataset.id }, v);
    DB.ishikawa_causes.push(savedIsh);
  }
  touchInv(el.dataset.id); save(); sbUpsert('ishikawa_causes', savedIsh); sbTouchInv(el.dataset.id);
  return savedIsh;
}

function saveFmeaFromModal(el) {
  const v = collect(['component','failure_mode','potential_effect','potential_cause','current_controls','severity','occurrence','detection']);
  if (!v.component) { toast('A component is required'); return null; }
  ['severity','occurrence','detection'].forEach(k => v[k] = Number(v[k]) || 1);
  let savedFmea;
  if (el.dataset.fmea) {
    savedFmea = DB.fmea_items.find(x => x.id === el.dataset.fmea);
    Object.assign(savedFmea, v);
  } else {
    savedFmea = Object.assign({ id: uid('fmea'), investigation_id: el.dataset.id }, v);
    DB.fmea_items.push(savedFmea);
  }
  touchInv(el.dataset.id); save(); sbUpsert('fmea_items', savedFmea); sbTouchInv(el.dataset.id);
  return savedFmea;
}

/* ---------- actions ---------- */

function requireEdit(invId) {
  const inv = invById(invId);
  if (!inv || !canEditInv(inv)) {
    toast('Read-only access: Editor or Admin role required');
    return false;
  }
  return true;
}

const ACTIONS = {
  'close-modal': closeModal,

  'landing-mode': (el) => {
    landingMode = el.dataset.mode === 'register' ? 'register' : 'login';
    landingSuccessMsg = '';
    render();
  },
  'register': async () => {
    const form = document.getElementById('registerForm');
    if (!form) return;
    const uname = (form.querySelector('[name="reg_username"]')?.value || '').trim();
    const pass = (form.querySelector('[name="reg_password"]')?.value || '');
    const fullName = (form.querySelector('[name="reg_full_name"]')?.value || '').trim();
    const roleTitle = (form.querySelector('[name="reg_role_title"]')?.value || '').trim();
    const errEl = document.getElementById('registerError');
    if (!uname || !pass) {
      if (errEl) errEl.textContent = 'Username and password are required.';
      return;
    }
    if (/\s/.test(uname)) {
      if (errEl) errEl.textContent = 'Username cannot contain spaces.';
      return;
    }
    const dup = (DB.app_users || []).find(u => String(u.username || '').toLowerCase() === uname.toLowerCase());
    if (dup) {
      if (errEl) errEl.textContent = 'That username is already taken. Choose another or sign in.';
      return;
    }
    const demoUser = (DB.app_users || []).find(u => u.id === 'usr-demo');
    const demoSiteId = (demoUser && demoUser.site_roles && Object.keys(demoUser.site_roles)[0]) || (DB.sites && DB.sites[0]?.id) || 'site-osp1';
    const demoSite = siteById(demoSiteId);
    const newUser = {
      id: uid('usr'),
      username: uname,
      password: pass,
      full_name: fullName || uname,
      role_title: roleTitle || 'Editor',
      is_global_admin: 0,
      site_roles: demoSiteId ? { [demoSiteId]: 'editor' } : {},
      assigned_rcas: [],
    };
    if (!Array.isArray(DB.app_users)) DB.app_users = [];
    DB.app_users.push(newUser);
    save();
    await sbUpsert('app_users', newUser);
    landingPrefill = { username: uname, password: pass };
    landingSuccessMsg = `@${uname} created as Editor for ${demoSite ? `${demoSite.code} — ${demoSite.name}` : 'OSP-01'}. Sign in below.`;
    landingMode = 'login';
    render();
    toast(`Account @${uname} created`);
  },
  'login': () => {
    const form = document.getElementById('loginForm');
    if (!form) return;
    const uname = (form.querySelector('[name="login_username"]')?.value || '').trim().toLowerCase();
    const pass = (form.querySelector('[name="login_password"]')?.value || '');
    const errEl = document.getElementById('loginError');
    const user = (DB.app_users || []).find(u => String(u.username || '').toLowerCase() === uname && String(u.password || '') === pass);
    if (!user) {
      if (errEl) errEl.textContent = 'Invalid username or password. Try demo / demo.';
      return;
    }
    landingSuccessMsg = '';
    landingPrefill = null;
    setSession(user.id);
    activeRegion = 'all';
    activeSiteId = 'all';
    if (!location.hash || location.hash === '#/') go('#/');
    render();
    toast(`Signed in as ${user.full_name || user.username}`);
  },
  'quick-login-fill': (el) => {
    const form = document.getElementById('loginForm');
    if (!form) return;
    const uEl = form.querySelector('[name="login_username"]');
    const pEl = form.querySelector('[name="login_password"]');
    if (uEl) uEl.value = el.dataset.user || 'demo';
    if (pEl) pEl.value = el.dataset.pass || 'demo';
    const errEl = document.getElementById('loginError');
    if (errEl) errEl.textContent = '';
  },
  'logout': () => {
    clearSession();
    landingMode = 'login';
    landingSuccessMsg = '';
    landingPrefill = null;
    activeRegion = 'all';
    activeSiteId = 'all';
    closeModal();
    go('#/');
    render();
    toast('Signed out');
  },

  'add-site': () => {
    if (!canManageAnySite(currentUser())) { toast('Admin access required'); return; }
    openModal(siteForm(null));
  },
  'edit-site': (el) => {
    const s = siteById(el.dataset.site);
    if (!s || !canAdminSite(currentUser(), s.id)) { toast('Site Admin access required'); return; }
    openModal(siteForm(s));
  },
  'save-site': (el) => {
    const sid = el.dataset.site;
    const me = currentUser();
    if (sid && !canAdminSite(me, sid)) { toast('Site Admin access required'); return; }
    if (!sid && !canManageAnySite(me)) { toast('Admin access required'); return; }
    const v = collect(['site_code', 'site_name', 'region', 'voltage_class', 'asana_project_gid']);
    if (!v.site_code || !v.site_name) { toast('Site code and name are required'); return; }
    const payload = { code: v.site_code, name: v.site_name, region: v.region, voltage_class: v.voltage_class };
    let savedSite;
    if (sid) {
      savedSite = siteById(sid);
      Object.assign(savedSite, payload);
    } else {
      savedSite = Object.assign({ id: uid('site') }, payload);
      DB.sites.push(savedSite);
      if (me && !me.is_global_admin) {
        me.site_roles = Object.assign({}, me.site_roles || {}, { [savedSite.id]: 'admin' });
        sbUpsert('app_users', me);
      }
    }
    asanaSetSiteProject(savedSite.id, v.asana_project_gid || '');
    save(); sbUpsert('sites', savedSite); closeModal(); render(); toast('Site saved');
  },
  'del-site': (el) => {
    if (!currentUser()?.is_global_admin) { toast('Global Admin access required'); return; }
    const s = siteById(el.dataset.site);
    if (!s) return;
    if (DB.sites.length <= 1) { toast('At least one site must remain'); return; }
    const inUse = (DB.investigations || []).some(i => i.site_id === s.id);
    if (inUse) { toast('Reassign or delete investigations at this site first'); return; }
    confirmDo(`Delete site ${s.code} — ${s.name}?`, () => {
      DB.sites = DB.sites.filter(x => x.id !== s.id);
      DB.app_users.forEach(u => { if (u.site_roles) delete u.site_roles[s.id]; });
      save(); sbDelete('sites', s.id); sbUpsert('app_users', DB.app_users); render(); toast('Site deleted');
    });
  },

  'add-user': () => {
    if (!canManageAnySite(currentUser())) { toast('Admin access required'); return; }
    openModal(userForm(null));
  },
  'edit-user': (el) => {
    if (!canManageAnySite(currentUser())) { toast('Admin access required'); return; }
    const u = (DB.app_users || []).find(x => x.id === el.dataset.user);
    if (u) openModal(userForm(u));
  },
  'save-user': (el) => {
    const me = currentUser();
    if (!canManageAnySite(me)) { toast('Admin access required'); return; }
    const uidVal = el.dataset.user;
    const v = collect(['username', 'password', 'full_name', 'role_title', 'is_global_admin']);
    if (!v.username || !v.password) { toast('Username and password are required'); return; }
    const dup = (DB.app_users || []).find(x => x.username.toLowerCase() === v.username.toLowerCase() && x.id !== uidVal);
    if (dup) { toast('That username is already in use'); return; }

    const existing = uidVal ? DB.app_users.find(x => x.id === uidVal) : null;
    const site_roles = Object.assign({}, existing ? existing.site_roles : {});
    const scope = document.getElementById('modalHost');
    (DB.sites || []).forEach(s => {
      if (me.is_global_admin || canAdminSite(me, s.id)) {
        const inp = scope.querySelector(`input[name="site_role_${s.id}"]`);
        if (inp) {
          if (inp.value) site_roles[s.id] = inp.value;
          else delete site_roles[s.id];
        }
      }
    });

    const manageableInvIds = new Set((DB.investigations || []).filter(i => me.is_global_admin || canAdminSite(me, i.site_id)).map(i => i.id));
    const keptOtherRcas = (existing && Array.isArray(existing.assigned_rcas) ? existing.assigned_rcas : []).filter(id => !manageableInvIds.has(id));
    const checkedRcas = Array.from(scope.querySelectorAll('input[name="assigned_rca"]:checked')).map(cb => cb.value);
    const assigned_rcas = Array.from(new Set([...keptOtherRcas, ...checkedRcas]));

    const payload = {
      username: v.username,
      password: v.password,
      full_name: v.full_name || v.username,
      role_title: v.role_title,
      is_global_admin: me.is_global_admin ? (Number(v.is_global_admin) ? 1 : 0) : (existing ? existing.is_global_admin : 0),
      site_roles,
      assigned_rcas,
    };

    let savedUser;
    if (existing) {
      Object.assign(existing, payload);
      savedUser = existing;
    } else {
      savedUser = Object.assign({ id: uid('usr') }, payload);
      DB.app_users.push(savedUser);
    }
    save(); sbUpsert('app_users', savedUser); closeModal(); render(); toast('User saved');
  },
  'del-user': (el) => {
    const me = currentUser();
    if (!canManageAnySite(me)) { toast('Admin access required'); return; }
    const u = (DB.app_users || []).find(x => x.id === el.dataset.user);
    if (!u) return;
    if (u.id === 'usr-demo' || (me && u.id === me.id)) { toast('Cannot delete this account'); return; }
    confirmDo(`Delete user @${u.username}?`, () => {
      DB.app_users = DB.app_users.filter(x => x.id !== u.id);
      save(); sbDelete('app_users', u.id); render(); toast('User deleted');
    });
  },

  'new-rca': () => {
    if (!canCreateRca(currentUser())) { toast('Editor or Admin role required to create RCAs'); return; }
    if (!isPro() && customRcas().length >= FREE_CUSTOM_RCA_LIMIT) {
      openProModal('Unlimited RCAs');
      return;
    }
    openModal(rcaForm(null));
  },
  'edit-rca': (el) => {
    const i = invById(el.dataset.id);
    if (i && requireEdit(i.id)) openModal(rcaForm(i));
  },
  'del-rca': (el) => {
    const i = invById(el.dataset.id);
    if (!i || !requireEdit(i.id)) return;
    confirmDo(`Delete ${i.document_code} and all of its timeline events, why levels, causes, failure modes, actions and attachments?`, () => {
      ['timeline_events', 'five_whys_nodes', 'ishikawa_causes', 'fmea_items', 'capa_actions', 'attachments'].forEach(c => {
        DB[c] = (DB[c] || []).filter(r => r.investigation_id !== i.id);
      });
      DB.investigations = DB.investigations.filter(x => x.id !== i.id);
      save(); sbDelete('investigations', i.id); go('#/investigations'); render(); toast('Investigation deleted');
    });
  },

  'add-timeline': (el) => { if (requireEdit(el.dataset.id)) openModal(timelineForm(el.dataset.id, null)); },
  'edit-timeline': (el) => { const ev = DB.timeline_events.find(x => x.id === el.dataset.tl); if (ev && requireEdit(ev.investigation_id)) openModal(timelineForm(ev.investigation_id, ev)); },
  'save-timeline': (el) => {
    if (!requireEdit(el.dataset.id)) return;
    const savedRow = saveTimelineFromModal(el);
    if (!savedRow) return;
    closeModal(); render(); toast('Timeline event saved');
  },
  'save-timeline-capa': (el) => {
    if (!requireEdit(el.dataset.id)) return;
    const savedRow = saveTimelineFromModal(el);
    if (!savedRow) return;
    closeModal(); render();
    openModal(capaForm(el.dataset.id, null, {
      type: 'corrective',
      description: `[Timeline ${fmtDateTimeSec(savedRow.timestamp)}] ${savedRow.title}`,
      source_ref: `timeline:${savedRow.id}`,
    }));
  },
  'del-timeline': (el) => {
    const ev = DB.timeline_events.find(x => x.id === el.dataset.tl);
    if (!ev || !requireEdit(ev.investigation_id)) return;
    confirmDo('Delete this timeline event?', () => {
      DB.timeline_events = DB.timeline_events.filter(x => x.id !== el.dataset.tl);
      touchInv(ev.investigation_id);
      save(); sbDelete('timeline_events', el.dataset.tl); sbTouchInv(ev.investigation_id);
      render(); toast('Deleted');
    });
  },
  'download-timeline-template': () => downloadTimelineTemplate(),
  'import-timeline': (el) => {
    if (!requireEdit(el.dataset.id)) return;
    if (!isPro()) { openProModal('Excel Timeline Import'); return; }
    const inp = document.getElementById('timelineImportFile');
    if (inp) { inp.dataset.invId = el.dataset.id; inp.value = ''; inp.click(); }
  },
  'confirm-timeline-import': async () => {
    if (!pendingTimelineImport) return;
    const { invId, rows } = pendingTimelineImport;
    if (!requireEdit(invId)) return;
    const mode = document.querySelector('#modalHost [name="import_mode"]')?.value || 'append';
    if (mode === 'replace') {
      DB.timeline_events = DB.timeline_events.filter(r => r.investigation_id !== invId);
      await sbDeleteByInv('timeline_events', invId);
    }
    const newRows = rows.map(r => Object.assign({ id: uid('tl'), investigation_id: invId }, r));
    DB.timeline_events.push(...newRows);
    pendingTimelineImport = null;
    touchInv(invId); save(); sbUpsert('timeline_events', newRows); sbTouchInv(invId);
    closeModal(); render();
    toast(`Imported ${rows.length} timeline event${rows.length === 1 ? '' : 's'}`);
  },

  'save-rca': (el) => {
    const id = el.dataset.id;
    if (id && !requireEdit(id)) return;
    if (!id && !canCreateRca(currentUser())) { toast('Editor or Admin role required'); return; }
    if (!id && !isPro() && customRcas().length >= FREE_CUSTOM_RCA_LIMIT) {
      openProModal('Unlimited RCAs');
      return;
    }
    const v = collect(['site_id','document_code','title','facility_name','equipment_tag','asset_category','fault_category','voltage_class','severity','status','investigator_name','investigator_role','problem_statement','executive_summary','root_cause_conclusion']);
    if (!v.title) { toast('A title is required'); return; }
    if (v.site_id && !v.facility_name) {
      const s = siteById(v.site_id);
      if (s) v.facility_name = s.name;
    }
    v.incident_date = fromDateInput(document.querySelector('[name="incident_date"]').value);
    if (id) {
      const i = invById(id);
      Object.assign(i, v, { updated_at: new Date().toISOString() });
      save(); sbUpsert('investigations', i); closeModal(); render(); toast('Investigation updated');
    } else {
      const nid = uid('rca');
      const rec = Object.assign({ id: nid, drive_share_url: null }, v, { updated_at: new Date().toISOString() });
      DB.investigations.push(rec);
      save(); sbUpsert('investigations', rec); closeModal(); go(`#/investigations/${nid}/overview`); toast('Investigation created');
    }
  },

  'add-why': (el) => { if (requireEdit(el.dataset.id)) openModal(whyForm(el.dataset.id, null, el.dataset.parent || null, el.dataset.level || 1)); },
  'edit-why': (el) => {
    const n = DB.five_whys_nodes.find(x => x.id === el.dataset.why);
    if (n && requireEdit(n.investigation_id)) openModal(whyForm(n.investigation_id, n, n.parent_id, n.level));
  },
  'save-why': (el) => {
    if (!requireEdit(el.dataset.id)) return;
    const savedNode = saveWhyFromModal(el);
    if (!savedNode) return;
    closeModal(); render(); toast('Why level saved');
  },
  'save-why-capa': (el) => {
    if (!requireEdit(el.dataset.id)) return;
    const savedNode = saveWhyFromModal(el);
    if (!savedNode) return;
    closeModal(); render();
    openModal(capaForm(el.dataset.id, null, {
      type: savedNode.is_root_cause ? 'preventive' : 'corrective',
      description: `[5 Whys L${savedNode.level}] ${savedNode.answer || savedNode.question}`,
      source_ref: `whys:${savedNode.id}`,
    }));
  },
  'del-why': (el) => {
    const first = DB.five_whys_nodes.find(n => n.id === el.dataset.why);
    if (!first || !requireEdit(first.investigation_id)) return;
    const ids = [el.dataset.why];
    for (let k = 0; k < ids.length; k++) DB.five_whys_nodes.filter(n => n.parent_id === ids[k]).forEach(c => ids.push(c.id));
    confirmDo(`Delete this why level and ${ids.length - 1} nested branch(es)?`, () => {
      DB.five_whys_nodes = DB.five_whys_nodes.filter(n => !ids.includes(n.id));
      touchInv(first.investigation_id);
      save(); ids.forEach(wid => sbDelete('five_whys_nodes', wid)); sbTouchInv(first.investigation_id);
      render(); toast('Deleted');
    });
  },

  'add-ish': (el) => { if (requireEdit(el.dataset.id)) openModal(ishForm(el.dataset.id, null, el.dataset.vector || null, null)); },
  'add-ish-prompt': (el) => { if (requireEdit(el.dataset.id)) openModal(ishForm(el.dataset.id, null, el.dataset.vector || null, el.dataset.prompt || null)); },
  'edit-ish': (el) => { const c = DB.ishikawa_causes.find(x => x.id === el.dataset.ish); if (c && requireEdit(c.investigation_id)) openModal(ishForm(c.investigation_id, c)); },
  'save-ish': (el) => {
    if (!requireEdit(el.dataset.id)) return;
    const savedIsh = saveIshFromModal(el);
    if (!savedIsh) return;
    closeModal(); render(); toast('Cause saved');
  },
  'save-ish-capa': (el) => {
    if (!requireEdit(el.dataset.id)) return;
    const savedIsh = saveIshFromModal(el);
    if (!savedIsh) return;
    closeModal(); render();
    openModal(capaForm(el.dataset.id, null, {
      type: savedIsh.is_primary ? 'preventive' : 'corrective',
      description: `[${VECTOR[savedIsh.vector] || savedIsh.vector}] ${savedIsh.cause}${savedIsh.detail ? ' — ' + savedIsh.detail : ''}`,
      source_ref: `ishikawa:${savedIsh.id}`,
    }));
  },
  'del-ish': (el) => {
    const c = DB.ishikawa_causes.find(x => x.id === el.dataset.ish);
    if (!c || !requireEdit(c.investigation_id)) return;
    confirmDo('Delete this cause?', () => {
      DB.ishikawa_causes = DB.ishikawa_causes.filter(x => x.id !== el.dataset.ish);
      touchInv(c.investigation_id);
      save(); sbDelete('ishikawa_causes', el.dataset.ish); sbTouchInv(c.investigation_id);
      render(); toast('Deleted');
    });
  },

  'add-fmea': (el) => { if (requireEdit(el.dataset.id)) openModal(fmeaForm(el.dataset.id, null)); },
  'edit-fmea': (el) => { const f = DB.fmea_items.find(x => x.id === el.dataset.fmea); if (f && requireEdit(f.investigation_id)) openModal(fmeaForm(f.investigation_id, f)); },
  'save-fmea': (el) => {
    if (!requireEdit(el.dataset.id)) return;
    const savedFmea = saveFmeaFromModal(el);
    if (!savedFmea) return;
    closeModal(); render(); toast('Failure mode saved');
  },
  'save-fmea-capa': (el) => {
    if (!requireEdit(el.dataset.id)) return;
    const savedFmea = saveFmeaFromModal(el);
    if (!savedFmea) return;
    const rpn = savedFmea.severity * savedFmea.occurrence * savedFmea.detection;
    closeModal(); render();
    openModal(capaForm(el.dataset.id, null, {
      type: rpn >= 100 ? 'preventive' : 'corrective',
      description: `[FMEA ${savedFmea.component} · RPN ${rpn}] Mitigate ${savedFmea.failure_mode || savedFmea.component}`,
      source_ref: `fmea:${savedFmea.id}`,
    }));
  },
  'del-fmea': (el) => {
    const f = DB.fmea_items.find(x => x.id === el.dataset.fmea);
    if (!f || !requireEdit(f.investigation_id)) return;
    confirmDo('Delete this failure mode?', () => {
      DB.fmea_items = DB.fmea_items.filter(x => x.id !== el.dataset.fmea);
      touchInv(f.investigation_id);
      save(); sbDelete('fmea_items', el.dataset.fmea); sbTouchInv(f.investigation_id);
      render(); toast('Deleted');
    });
  },

  'add-capa': (el) => {
    if (!requireEdit(el.dataset.id)) return;
    if (!isPro() && el.dataset.id !== DEMO_INV_ID && byInv('capa_actions', el.dataset.id).length >= FREE_CAPA_PER_CUSTOM_RCA_LIMIT) {
      openProModal('Unlimited CAPA Actions');
      return;
    }
    openModal(capaForm(el.dataset.id, null, {
      type: el.dataset.type || 'corrective',
      description: el.dataset.desc || '',
      source_ref: el.dataset.ref || '',
    }));
  },
  'edit-capa': (el) => { const c = DB.capa_actions.find(x => x.id === el.dataset.capa); if (c && canAccessInv(currentUser(), invById(c.investigation_id))) openModal(capaForm(c.investigation_id, c)); },
  'save-capa': (el) => {
    if (!requireEdit(el.dataset.id)) return;
    const v = collect(['type','description','owner','status','verification_notes','source_ref']);
    if (!v.description) { toast('An action description is required'); return; }
    v.target_date = fromDateInput(document.querySelector('[name="target_date"]').value);
    let savedCapa;
    if (el.dataset.capa) {
      savedCapa = DB.capa_actions.find(x => x.id === el.dataset.capa);
      Object.assign(savedCapa, v);
    } else {
      savedCapa = Object.assign({ id: uid('capa'), investigation_id: el.dataset.id }, v);
      DB.capa_actions.push(savedCapa);
    }
    touchInv(el.dataset.id); save(); sbUpsert('capa_actions', savedCapa); sbTouchInv(el.dataset.id);
    closeModal(); render(); toast('Action saved');
    const aCfg = getAsanaCfg();
    const inv = invById(el.dataset.id);
    if (aCfg.pat && aCfg.auto_push && inv && asanaSiteProjectGid(inv.site_id)) {
      asanaPushCapa(savedCapa, true)
        .then(t => { if (t) { render(); toast('Action synced to Asana'); } })
        .catch(err => toast(err.message || 'Asana sync failed'));
    }
  },
  'del-capa': (el) => {
    const c = DB.capa_actions.find(x => x.id === el.dataset.capa);
    if (!c || !requireEdit(c.investigation_id)) return;
    confirmDo('Delete this action?', () => {
      DB.capa_actions = DB.capa_actions.filter(x => x.id !== el.dataset.capa);
      const aCfg = getAsanaCfg();
      if (aCfg.capa_links && aCfg.capa_links[el.dataset.capa]) delete aCfg.capa_links[el.dataset.capa];
      touchInv(c.investigation_id);
      save(); sbDelete('capa_actions', el.dataset.capa); sbTouchInv(c.investigation_id);
      render(); toast('Deleted');
    });
  },

  'add-attachment': (el) => { if (requireEdit(el.dataset.id)) openModal(attachmentModal(el.dataset.id, el.dataset.area || 'overview', el.dataset.record || el.dataset.id)); },
  'save-attachment': (el) => {
    if (!requireEdit(el.dataset.id)) return;
    const inp = document.getElementById('attFileInput');
    const file = inp && inp.files && inp.files[0];
    if (!file) { toast('Please select a file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast('File exceeds 5 MB limit'); return; }
    const caption = (document.querySelector('#modalHost [name="att_caption"]')?.value || '').trim();
    const reader = new FileReader();
    reader.onload = () => {
      const att = {
        id: uid('att'),
        investigation_id: el.dataset.id,
        area: el.dataset.area || 'overview',
        record_id: el.dataset.record || el.dataset.id,
        file_name: file.name,
        mime_type: file.type || 'application/octet-stream',
        size_bytes: file.size,
        caption,
        data_url: reader.result,
        created_at: new Date().toISOString(),
      };
      if (!Array.isArray(DB.attachments)) DB.attachments = [];
      DB.attachments.push(att);
      touchInv(el.dataset.id); save(); sbUpsert('attachments', att); sbTouchInv(el.dataset.id);
      closeModal(); render(); toast('Attachment saved');
    };
    reader.onerror = () => toast('Failed to read file');
    reader.readAsDataURL(file);
  },
  'view-attachment': (el) => {
    const att = (DB.attachments || []).find(x => x.id === el.dataset.att);
    if (att) openModal(previewAttachmentModal(att));
  },
  'del-attachment': (el) => {
    const att = (DB.attachments || []).find(x => x.id === el.dataset.att);
    if (!att || !requireEdit(att.investigation_id)) return;
    confirmDo('Remove this attachment?', () => {
      DB.attachments = (DB.attachments || []).filter(x => x.id !== el.dataset.att);
      touchInv(att.investigation_id);
      save(); sbDelete('attachments', el.dataset.att); sbTouchInv(att.investigation_id);
      render(); toast('Attachment removed');
    });
  },

  'print': () => {
    if (!isPro()) { openProModal('PDF & Print Reports'); return; }
    window.print();
  },
  'print-dashboard': () => {
    if (!isPro()) { openProModal('PDF & Print Reports'); return; }
    window.print();
  },

  'open-pro': () => openProModal(),
  'buy-pro': async (el) => {
    const plan = el.dataset.plan || 'lifetime';
    if (!window.TotalRCANative) return;
    try {
      toast('Connecting to store…');
      const ok = await window.TotalRCANative.purchasePlan(plan);
      if (ok) {
        updateProPill();
        closeModal();
        render();
        toast('Welcome to TotalRCA Pro!');
      }
    } catch (err) {
      toast(err.message || 'Purchase cancelled or unavailable');
    }
  },
  'restore-purchases': async () => {
    if (!window.TotalRCANative) return;
    try {
      const ok = await window.TotalRCANative.restorePurchases();
      updateProPill();
      render();
      toast(ok ? 'TotalRCA Pro restored!' : 'No active Pro purchase found');
      if (ok) closeModal();
    } catch (err) {
      toast(err.message || 'Could not restore purchases');
    }
  },
  'copy-sb-sql': async () => {
    try {
      await navigator.clipboard.writeText(SB_SETUP_SQL);
      toast('Supabase Setup SQL copied to clipboard');
    } catch (_) {
      toast('Could not copy SQL — check clipboard permissions');
    }
  },

  'settings': () => openModal(settingsModal()),
  'save-settings': () => {
    const cfg = collect(['supabase_url', 'supabase_key', 'webhook_url', 'custom_rest_url', 'custom_rest_token']);
    const wantsExternalDb = !!(cfg.supabase_url || cfg.supabase_key || cfg.webhook_url || cfg.custom_rest_url);
    if (wantsExternalDb && !isPro()) {
      openProModal('Team Database Sync');
      return;
    }
    DB.app_settings = Object.assign({}, DB.app_settings, cfg);
    const a = getAsanaCfg();
    const patEl = document.querySelector('#modalHost [name="asana_pat"]');
    if (patEl) a.pat = (patEl.value || '').trim();
    const autoEl = document.querySelector('#modalHost [name="asana_auto_push"]');
    if (autoEl) a.auto_push = Boolean(autoEl.checked);
    accessibleSites(currentUser()).forEach(site => {
      const pEl = document.querySelector(`#modalHost [name="asana_site_${site.id}"]`);
      if (pEl) asanaSetSiteProject(site.id, pEl.value);
    });
    save(); closeModal(); render(); toast('Settings saved');
    if (hasSupabase() && isPro()) syncFromSupabase(false);
    else setSyncState('offline', 'Local only', 'Data stored locally on your device');
  },
  'asana-test': async () => {
    const a = getAsanaCfg();
    const patEl = document.querySelector('#modalHost [name="asana_pat"]');
    if (patEl) a.pat = (patEl.value || '').trim();
    if (!a.pat) { toast('Paste your Asana PAT first'); return; }
    toast('Connecting to Asana…');
    try {
      const res = await asanaTestAndLoad();
      openModal(settingsModal());
      toast(`Connected as ${res.user.name || 'Asana user'} · ${res.projects.length} project(s) loaded`);
    } catch (err) {
      toast(err.message || 'Could not connect to Asana');
    }
  },
  'asana-sync': async (el) => {
    const invId = el.dataset.inv || null;
    if (document.querySelector('#modalHost [name="asana_pat"]')) {
      const a = getAsanaCfg();
      a.pat = (document.querySelector('#modalHost [name="asana_pat"]').value || '').trim();
      accessibleSites(currentUser()).forEach(site => {
        const pEl = document.querySelector(`#modalHost [name="asana_site_${site.id}"]`);
        if (pEl) asanaSetSiteProject(site.id, pEl.value);
      });
      save();
    }
    toast('Syncing two-way with Asana…');
    try {
      const { pulled, pushed } = await asanaSyncTwoWay(invId);
      render();
      toast(`Asana sync complete: ${pulled} updated from Asana, ${pushed} pushed to Asana`);
    } catch (err) {
      toast(err.message || 'Asana sync failed');
    }
  },
  'asana-push-capa': async (el) => {
    const c = DB.capa_actions.find(x => x.id === el.dataset.capa);
    if (!c || !requireEdit(c.investigation_id)) return;
    toast('Pushing action to Asana…');
    try {
      const task = await asanaPushCapa(c, false);
      if (task) { render(); toast('Pushed to Asana'); }
    } catch (err) {
      toast(err.message || 'Asana push failed');
    }
  },
  'sync-now': () => syncFromSupabase(true),
  'export-json': async () => {
    const filename = `totalrca-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const jsonStr = JSON.stringify(DB, null, 2);
    if (window.TotalRCANative && await window.TotalRCANative.shareFile(filename, jsonStr, false)) {
      toast('Shared backup');
      return;
    }
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `totalrca-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Exported');
  },
  'import-json': () => document.getElementById('importFile').click(),
  'reset-demo': () => confirmDo('Replace all data with the original sample record?', () => {
    DB = seed(); ensureSitesAndUsers(false); save(); sbPushAll(DB); closeModal(); render(); toast('Sample data restored');
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

document.addEventListener('submit', (e) => {
  if (e.target && e.target.id === 'loginForm') {
    e.preventDefault();
    ACTIONS.login();
  } else if (e.target && e.target.id === 'registerForm') {
    e.preventDefault();
    ACTIONS.register();
  }
});

document.addEventListener('click', (e) => {
  const selectTrigger = e.target.closest('.gg-select-trigger');
  if (selectTrigger) {
    e.preventDefault();
    openDropdown(selectTrigger.closest('[data-gg-select]'));
    return;
  }
  const actionEl = e.target.closest('[data-action]');
  if (actionEl) {
    const fn = ACTIONS[actionEl.dataset.action];
    if (fn) { e.preventDefault(); fn(actionEl); return; }
  }
  const gotoEl = e.target.closest('[data-goto]');
  if (gotoEl) { e.preventDefault(); go(gotoEl.dataset.goto); return; }

  const routeEl = e.target.closest('[data-route]');
  if (routeEl) { e.preventDefault(); go(routeEl.dataset.route); return; }

  const scrollEl = e.target.closest('[data-scroll-to]');
  if (scrollEl) {
    e.preventDefault();
    const target = document.getElementById(scrollEl.dataset.scrollTo);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  const tabEl = e.target.closest('[data-tab]');
  if (tabEl) {
    const r = parseRoute();
    if (r.page === 'rca') go(`#/investigations/${r.id}/${tabEl.dataset.tab}`);
    return;
  }
  const sevEl = e.target.closest('[data-sev]');
  if (sevEl) { invFilter.sev = sevEl.dataset.sev; render(); return; }

  const fillQ = e.target.closest('[data-fill-question]');
  if (fillQ) {
    const qEl = document.querySelector('#modalHost [name="question"]');
    if (qEl) { qEl.value = fillQ.dataset.fillQuestion; qEl.focus(); }
    return;
  }

  const fillD = e.target.closest('[data-fill-detail]');
  if (fillD) {
    const dEl = document.querySelector('#modalHost [name="detail"]');
    if (dEl) { dEl.value = fillD.dataset.fillDetail; dEl.focus(); }
    return;
  }

  const ishVec = e.target.closest('[data-ish-vector]');
  if (ishVec && !e.target.closest('[data-action]')) {
    selectedIshVector = ishVec.dataset.ishVector;
    render();
    return;
  }

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
  if (e.target.matches('input[name="active_region"]')) {
    activeRegion = e.target.value || 'all';
    activeSiteId = 'all';
    render();
    return;
  }
  if (e.target.matches('input[name="active_site"]')) {
    activeSiteId = e.target.value || 'all';
    render();
    return;
  }
  if (e.target.matches('#modalHost input[name="industry_template"]')) {
    const tpl = INDUSTRY_TEMPLATES[e.target.value];
    if (tpl && e.target.value !== 'none') {
      const setDropdown = (name, val) => {
        const inp = document.querySelector(`#modalHost input[name="${name}"]`);
        if (!inp) return;
        inp.value = val;
        const root = inp.closest('[data-gg-select]');
        const opt = root && root.querySelector(`.gg-select-opt[data-value="${CSS.escape(val)}"]`);
        if (opt) {
          root.querySelectorAll('.gg-select-opt').forEach(o => { o.classList.remove('is-selected'); o.setAttribute('aria-selected', 'false'); });
          opt.classList.add('is-selected');
          opt.setAttribute('aria-selected', 'true');
          const lbl = root.querySelector('.gg-select-label');
          if (lbl) lbl.textContent = opt.dataset.label || opt.textContent.trim();
        }
      };
      setDropdown('asset_category', tpl.asset_category);
      setDropdown('fault_category', tpl.fault_category);
      const voltEl = document.querySelector('#modalHost [name="voltage_class"]');
      if (voltEl && tpl.voltage_class) voltEl.value = tpl.voltage_class;
      const probEl = document.querySelector('#modalHost [name="problem_statement"]');
      if (probEl && tpl.problem_statement && !probEl.value.trim()) probEl.value = tpl.problem_statement;
    }
    return;
  }
  if (e.target.matches('#modalHost input[name="site_id"]')) {
    const s = siteById(e.target.value);
    if (s) {
      const facEl = document.querySelector('#modalHost [name="facility_name"]');
      if (facEl) facEl.value = s.name || '';
      const voltEl = document.querySelector('#modalHost [name="voltage_class"]');
      if (voltEl && !voltEl.value.trim()) voltEl.value = s.voltage_class || '';
    }
    return;
  }
  if (e.target.matches('[data-fmea-score]')) {
    const box = document.getElementById('fmeaLiveBox');
    if (box) {
      const s = document.querySelector('#modalHost [name="severity"]')?.value || 5;
      const o = document.querySelector('#modalHost [name="occurrence"]')?.value || 5;
      const d = document.querySelector('#modalHost [name="detection"]')?.value || 5;
      box.innerHTML = fmeaLiveHtml(s, o, d);
    }
    return;
  }
  if (e.target.id === 'timelineImportFile' && e.target.files[0]) {
    const file = e.target.files[0];
    const invId = e.target.dataset.invId;
    if (!window.XLSX) { toast('Excel parser is still loading — try again in a moment'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const wb = XLSX.read(new Uint8Array(reader.result), { type: 'array', cellDates: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });
        const parsed = parseTimelineRows(rawRows);
        if (!parsed.length) { toast('No valid timeline events found in that spreadsheet'); return; }
        openModal(timelineImportModal(invId, parsed, file.name));
      } catch (err) {
        toast('Could not read that Excel / CSV file');
      }
    };
    reader.readAsArrayBuffer(file);
    return;
  }
  if (e.target.id === 'importFile' && e.target.files[0]) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || !Array.isArray(data.investigations)) throw new Error('not a TotalRCA store');
        DB = Object.assign(seed(), data);
        ensureSitesAndUsers(false);
        save(); sbPushAll(DB); closeModal(); render(); toast('Data imported & synced');
      } catch (err) { toast('That file is not a TotalRCA export'); }
    };
    reader.readAsText(file);
  }
});

document.getElementById('proBtn')?.addEventListener('click', () => openProModal());
document.getElementById('syncBtn')?.addEventListener('click', () => syncFromSupabase(true));
document.getElementById('newRcaBtn').addEventListener('click', () => ACTIONS['new-rca']());
document.getElementById('settingsBtn').addEventListener('click', () => ACTIONS['settings']());
document.getElementById('navLinks').addEventListener('click', (e) => { /* handled by delegation */ });
window.addEventListener('hashchange', render);
window.addEventListener('resize', closeDropdown);
window.addEventListener('focus', () => {
  if (hasSupabase() && isPro() && Date.now() - lastSyncAt > 15000) syncFromSupabase(false);
});
window.addEventListener('totalrca:pro-changed', () => {
  updateProPill();
  render();
});

/* ---------- boot ---------- */

load();
updateProPill();
render();
if (window.TotalRCANative) {
  window.TotalRCANative.initStorageMirror(STORE_KEY, () => { load(); render(); });
  window.TotalRCANative.initPurchases().then(() => updateProPill());
}
syncFromSupabase(false);
