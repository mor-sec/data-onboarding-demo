// portal/chain.jsx — chain logic, ChainDisplay, mock data, role config

const TODAY_STR = '2026-04-24';
const TODAY = new Date(TODAY_STR);

const daysFromToday = (dateStr) => Math.round((new Date(dateStr) - TODAY) / 86400000);

const computeDeadline = (slaDays) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + slaDays);
  return d.toISOString().split('T')[0];
};

// Returns a flat chain of nodes; type 'step' or 'parallel'
const computeChain = (classification, containsPii) => {
  if (classification === 'OFFICIAL') {
    if (containsPii) {
      return [
        { id: 'owner',    label: 'Data Owner',      type: 'step',     sla: 3 },
        { id: 'privacy',  label: 'Privacy Officer', type: 'step',     sla: 5 },
        { id: 'custodian',label: 'Data Custodian',  type: 'step',     sla: 3 },
      ];
    }
    return [
      { id: 'parallel_oc', label: 'Parallel Approval', type: 'parallel', sla: 3, children: [
        { id: 'owner',     label: 'Data Owner' },
        { id: 'custodian', label: 'Data Custodian' },
      ]},
    ];
  }
  // SENSITIVE
  const chain = [{ id: 'owner', label: 'Data Owner', type: 'step', sla: 3 }];
  if (containsPii) {
    chain.push({ id: 'parallel_ld', label: 'Legal & Privacy Review', type: 'parallel', sla: 5, children: [
      { id: 'legal',   label: 'Legal Counsel' },
      { id: 'privacy', label: 'Privacy Officer' },
    ]});
  } else {
    chain.push({ id: 'legal', label: 'Legal Counsel', type: 'step', sla: 5 });
  }
  chain.push(
    { id: 'custodian', label: 'Data Custodian', type: 'step', sla: 3 },
    { id: 'ciso',      label: 'CISO',           type: 'step', sla: 3 }
  );
  return chain;
};

// All leaf step IDs from a chain
const getLeafIds = (chain) => {
  const ids = [];
  chain.forEach(n => n.type === 'parallel' ? n.children.forEach(c => ids.push(c.id)) : ids.push(n.id));
  return ids;
};

const isDone = (s) => s === 'approved' || s === 'approved_conditions' || s === 'skipped';

// After approving stepId, advance the chain and return updated stepStatuses
const activateNext = (chain, stepStatuses, approvedStepId) => {
  const ns = JSON.parse(JSON.stringify(stepStatuses));
  for (let i = 0; i < chain.length; i++) {
    const node = chain[i];
    if (node.type === 'parallel') {
      const childIds = node.children.map(c => c.id);
      if (childIds.includes(approvedStepId)) {
        const allDone = childIds.every(id => isDone(id === approvedStepId ? 'approved' : (ns[id]?.status || 'pending')));
        if (allDone && i + 1 < chain.length) activateNode(chain[i + 1], ns);
        break;
      }
    } else if (node.id === approvedStepId) {
      if (i + 1 < chain.length) activateNode(chain[i + 1], ns);
      break;
    }
  }
  return ns;
};

const activateNode = (node, ns) => {
  if (node.type === 'parallel') {
    node.children.forEach(c => { ns[c.id] = { ...(ns[c.id] || {}), status: 'active', deadline: computeDeadline(node.sla) }; });
  } else {
    ns[node.id] = { ...(ns[node.id] || {}), status: 'active', deadline: computeDeadline(node.sla) };
  }
};

// Is the chain fully complete?
const isChainComplete = (chain, stepStatuses) =>
  getLeafIds(chain).every(id => isDone(stepStatuses[id]?.status || 'pending'));

// ── CHAIN DISPLAY ──────────────────────────────────────────────────────────
const ChainDisplay = ({ chain, stepStatuses, compact = false }) => {
  const colors = (status, deadline) => {
    if (status === 'approved')            return { bg: '#EEF4EB', border: '#A8D5B5', text: '#2E844A',  iconBg: '#2E844A',  iconColor: '#fff' };
    if (status === 'approved_conditions') return { bg: '#FFFDE7', border: '#FFE082', text: '#A86403',  iconBg: '#A86403',  iconColor: '#fff' };
    if (status === 'rejected')            return { bg: '#FEF1EE', border: '#F5B3A9', text: '#BA0517',  iconBg: '#BA0517',  iconColor: '#fff' };
    if (status === 'skipped')             return { bg: '#F9F9F9', border: '#E0E0E0', text: '#B0B0B0',  iconBg: '#E0E0E0',  iconColor: '#B0B0B0' };
    if (status === 'active') {
      const over = deadline && daysFromToday(deadline) < 0;
      return over
        ? { bg: '#FEF1EE', border: '#F5B3A9', text: '#BA0517', iconBg: '#BA0517', iconColor: '#fff' }
        : { bg: '#E8F4FC', border: '#9FD4FC', text: '#014486', iconBg: '#0176D3', iconColor: '#fff' };
    }
    return { bg: '#F9F9F9', border: '#E5E5E5', text: '#706E6B', iconBg: '#fff', iconColor: '#C9C7C5' };
  };

  const icon = (status) => ({ approved: '✓', approved_conditions: '✓', rejected: '✕', skipped: '—', active: '●', pending: '·' }[status] || '·');

  const StepNode = ({ stepId, label }) => {
    const ss = stepStatuses[stepId] || { status: 'pending' };
    const c = colors(ss.status, ss.deadline);
    const over = ss.status === 'active' && ss.deadline && daysFromToday(ss.deadline) < 0;
    const dLeft = ss.deadline ? daysFromToday(ss.deadline) : null;
    return (
      <div style={{ background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 7, padding: compact ? '7px 11px' : '10px 13px', flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: c.iconBg, border: `1.5px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: c.iconColor, fontWeight: 700, flexShrink: 0 }}>{icon(ss.status)}</div>
          <span style={{ fontSize: compact ? 12 : 13, fontWeight: 600, color: c.text, flex: 1, minWidth: 0, lineHeight: 1.3 }}>{label}</span>
          {ss.status === 'active' && dLeft !== null && (
            <span style={{ fontSize: 11, fontWeight: 600, color: over ? '#BA0517' : '#706E6B', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {over ? `${Math.abs(dLeft)}d overdue` : `${dLeft}d left`}
            </span>
          )}
        </div>
        {!compact && (ss.assignee || ss.delegate) && (
          <div style={{ fontSize: 11, color: '#706E6B', paddingLeft: 28, marginTop: 3 }}>
            {ss.delegate ? `Acting: ${ss.delegate}` : ss.assignee}
          </div>
        )}
        {!compact && ss.decidedBy && <div style={{ fontSize: 11, color: '#706E6B', paddingLeft: 28, marginTop: 2 }}>{ss.decidedBy} · {ss.decidedAt}</div>}
        {!compact && ss.conditions && <div style={{ fontSize: 11, color: '#A86403', paddingLeft: 28, marginTop: 3, fontStyle: 'italic' }}>Conditions: {ss.conditions}</div>}
        {!compact && ss.status === 'rejected' && ss.note && <div style={{ fontSize: 11, color: '#BA0517', paddingLeft: 28, marginTop: 3 }}>"{ss.note}"</div>}
      </div>
    );
  };

  const Connector = ({ done }) => (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0' }}>
      <div style={{ width: 2, height: 18, background: done ? '#2E844A' : '#DDDBDA' }} />
    </div>
  );

  return (
    <div>
      {chain.map((node, i) => {
        const isLast = i === chain.length - 1;
        if (node.type === 'parallel') {
          const allDone = node.children.every(c => isDone(stepStatuses[c.id]?.status || 'pending'));
          // connector before
          const prevDone = i > 0 && (() => {
            const prev = chain[i - 1];
            if (prev.type === 'parallel') return prev.children.every(c => isDone(stepStatuses[c.id]?.status || 'pending'));
            return isDone(stepStatuses[prev.id]?.status || 'pending');
          })();
          return (
            <React.Fragment key={node.id}>
              {i > 0 && <Connector done={!!prevDone} />}
              <div style={{ background: '#F9F9F9', border: '1px dashed #C9C7C5', borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#706E6B', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', marginBottom: 8 }}>Parallel Review</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {node.children.map(c => <StepNode key={c.id} stepId={c.id} label={c.label} />)}
                </div>
              </div>
              {!isLast && <Connector done={allDone} />}
            </React.Fragment>
          );
        }
        const prevDone = i > 0 && (() => {
          const prev = chain[i - 1];
          if (prev.type === 'parallel') return prev.children.every(c => isDone(stepStatuses[c.id]?.status || 'pending'));
          return isDone(stepStatuses[prev.id]?.status || 'pending');
        })();
        return (
          <React.Fragment key={node.id}>
            {i > 0 && <Connector done={!!prevDone} />}
            <StepNode stepId={node.id} label={node.label} />
            {!isLast && <Connector done={isDone(stepStatuses[node.id]?.status || 'pending')} />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── MOCK DATA ──────────────────────────────────────────────────────────────
const MOCK_REQUESTS = [
  {
    id: 'DOR-2026-0041', name: 'Medicare Claims Extract – QLD 2023',
    classification: 'SENSITIVE', status: 'in_review',
    requester: 'J. Nguyen', requesterEmail: 'j.nguyen@health.gov.au',
    agency: 'Dept. of Health & Aged Care', submitted: '2026-04-20',
    description: 'Linked Medicare claims dataset for research into hospital readmissions. Approx. 4.2M records covering 2023 calendar year.',
    urgency: 'standard', ticketRef: 'DATA-1042', containsPii: true,
    piiCategories: { names: true, dob: true, identifiers: true, health: true },
    legal: { legalBasis: 'Privacy Act 1988 s.95A', retention: '7y', disposal: 'archive', dsaRef: 'DSA-2026-014', dsaExpiry: '2027-12-31', legalCounsel: 'B. Thompson' },
    ingestion: { targetEnv: 'sandbox', dataFormat: 'parquet', ingestionMethod: 'batch', recordCount: '>1m', techContact: 'data.eng@health.gov.au' },
    security: { encryptionAtRest: 'aes256', encryptionInTransit: 'tls13', keyManagement: 'aws-kms', accessControl: 'need-to-know', mfa: true, dlp: true, auditLog: true },
    chain: computeChain('SENSITIVE', true),
    stepStatuses: {
      owner:    { status: 'approved', decidedAt: '2026-04-21', conditions: null, decidedBy: 'Dr. A. Singh', assignee: 'Dr. A. Singh' },
      legal:    { status: 'active', deadline: '2026-04-26', assignee: 'B. Thompson' },
      privacy:  { status: 'active', deadline: '2026-04-28', assignee: 'C. Martinez' },
      custodian:{ status: 'pending' },
      ciso:     { status: 'pending' },
    },
  },
  {
    id: 'DOR-2026-0039', name: 'Public Tender Register FY25',
    classification: 'OFFICIAL', status: 'in_review',
    requester: 'S. Patel', requesterEmail: 's.patel@finance.gov.au',
    agency: 'Dept. of Finance', submitted: '2026-04-22',
    description: 'Published tender register for procurement analytics dashboard. All data is publicly available.',
    urgency: 'low', ticketRef: 'DATA-1038', containsPii: false, piiCategories: {},
    legal: { legalBasis: 'Freedom of Information Act 1982', retention: '5y', disposal: 'auto-delete', dsaRef: null },
    ingestion: { targetEnv: 'dev', dataFormat: 'csv', ingestionMethod: 'batch', recordCount: '10k-100k', techContact: 'platform@finance.gov.au' },
    security: { encryptionAtRest: 'aes128', encryptionInTransit: 'tls12', accessControl: 'rbac' },
    chain: computeChain('OFFICIAL', false),
    stepStatuses: {
      owner:     { status: 'active', deadline: '2026-04-25', assignee: 'M. Okafor' },
      custodian: { status: 'active', deadline: '2026-04-25', assignee: 'T. Williams' },
    },
  },
  {
    id: 'DOR-2026-0038', name: 'HR Staff Directory Snapshot',
    classification: 'SENSITIVE', status: 'returned',
    requester: 'M. Chen', requesterEmail: 'm.chen@apsc.gov.au',
    agency: 'Australian Public Service Commission', submitted: '2026-04-18',
    description: 'HR staff directory for org-chart tooling integration.',
    urgency: 'high', ticketRef: 'DATA-1035', containsPii: true,
    piiCategories: { names: true, addresses: true, identifiers: true },
    legal: { legalBasis: 'Privacy Act 1988 s.6', retention: '3y', disposal: 'manual-review', dsaRef: 'DSA-2026-011' },
    ingestion: { targetEnv: 'sandbox', dataFormat: 'json', ingestionMethod: 'manual', recordCount: '10k-100k' },
    security: { encryptionAtRest: 'aes256', encryptionInTransit: 'tls13', accessControl: 'need-to-know' },
    chain: computeChain('SENSITIVE', true),
    stepStatuses: {
      owner:    { status: 'approved', decidedAt: '2026-04-19', decidedBy: 'R. Kumar', assignee: 'R. Kumar' },
      legal:    { status: 'rejected', decidedAt: '2026-04-22', decidedBy: 'B. Thompson', assignee: 'B. Thompson', note: 'No active DSA covers HR data for this purpose. Requester must obtain MOU amendment.' },
      privacy:  { status: 'skipped', reason: 'Parallel step rejected' },
      custodian:{ status: 'pending' },
      ciso:     { status: 'pending' },
    },
    returnedAtStep: 'legal', returnNote: 'No active DSA covers HR data for this purpose. Obtain MOU amendment and resubmit.',
  },
  {
    id: 'DOR-2026-0036', name: 'Centrelink Payment Summaries FY24',
    classification: 'OFFICIAL', status: 'reclassify_pending',
    requester: 'K. Brown', requesterEmail: 'k.brown@dss.gov.au',
    agency: 'Dept. of Social Services', submitted: '2026-04-19',
    description: 'Annual payment summary data aggregated by region and payment type for dashboard reporting.',
    urgency: 'standard', ticketRef: 'DATA-1033', containsPii: false, piiCategories: {},
    legal: { legalBasis: 'Social Security Act 1991', retention: '7y', disposal: 'archive' },
    ingestion: { targetEnv: 'sandbox', dataFormat: 'csv', ingestionMethod: 'scheduled', recordCount: '100k-1m' },
    security: { encryptionAtRest: 'aes128', encryptionInTransit: 'tls12', accessControl: 'rbac' },
    chain: computeChain('OFFICIAL', false),
    stepStatuses: {
      owner:     { status: 'active', deadline: '2026-04-24', assignee: 'P. Davis' },
      custodian: { status: 'pending' },
    },
    reclassifyFlag: {
      flaggedBy: 'P. Davis', flaggedAt: '2026-04-24',
      suggestedClassification: 'SENSITIVE',
      reason: 'Aggregated data can be re-combined with ABS postal data to re-identify individuals in small regions. Recommend re-classifying as SENSITIVE.',
    },
  },
  {
    id: 'DOR-2026-0034', name: 'Bureau of Meteorology Climate Dataset',
    classification: 'OFFICIAL', status: 'approved',
    requester: 'A. Wilson', requesterEmail: 'a.wilson@bom.gov.au',
    agency: 'Bureau of Meteorology', submitted: '2026-04-10',
    description: 'Historical climate data 1990–2024 for predictive modelling.',
    urgency: 'low', ticketRef: 'DATA-1029', containsPii: false, piiCategories: {},
    legal: { legalBasis: 'Meteorology Act 1955', retention: '5y', disposal: 'auto-delete' },
    ingestion: { targetEnv: 'prod', dataFormat: 'parquet', ingestionMethod: 'batch', recordCount: '>1m' },
    security: { encryptionAtRest: 'aes128', encryptionInTransit: 'tls12', accessControl: 'rbac' },
    chain: computeChain('OFFICIAL', false),
    stepStatuses: {
      owner:     { status: 'approved_conditions', decidedAt: '2026-04-12', conditions: 'Data may only be used for climate modelling. No export outside the analytics environment.', decidedBy: 'L. Park', assignee: 'L. Park' },
      custodian: { status: 'approved', decidedAt: '2026-04-14', decidedBy: 'T. Williams', assignee: 'T. Williams' },
    },
  },
  {
    id: 'DOR-2026-0031', name: 'My Health Record Diagnostic Codes',
    classification: 'SENSITIVE', status: 'in_review',
    requester: 'F. Osei', requesterEmail: 'f.osei@aihw.gov.au',
    agency: 'Australian Institute of Health & Welfare', submitted: '2026-04-15',
    description: 'Diagnostic codes from My Health Record for disease burden analysis.',
    urgency: 'high', ticketRef: 'DATA-1025', containsPii: true,
    piiCategories: { health: true, identifiers: true, dob: true },
    legal: { legalBasis: 'My Health Records Act 2012 s.70', retention: '7y', disposal: 'national-archives', dsaRef: 'DSA-2026-008', legalCounsel: 'B. Thompson' },
    ingestion: { targetEnv: 'sandbox', dataFormat: 'parquet', ingestionMethod: 'batch', recordCount: '>1m' },
    security: { encryptionAtRest: 'aes256', encryptionInTransit: 'tls13', keyManagement: 'aws-kms', accessControl: 'need-to-know', mfa: true, dlp: true, auditLog: true, networkSeg: true },
    chain: computeChain('SENSITIVE', true),
    stepStatuses: {
      owner:    { status: 'approved', decidedAt: '2026-04-17', decidedBy: 'Prof. E. Lim', assignee: 'Prof. E. Lim' },
      legal:    { status: 'approved_conditions', decidedAt: '2026-04-20', decidedBy: 'B. Thompson', assignee: 'B. Thompson', conditions: 'Data must be destroyed within 24h of project completion. Destruction certificate required.' },
      privacy:  { status: 'active', deadline: '2026-04-23', assignee: 'C. Martinez' }, // overdue
      custodian:{ status: 'pending' },
      ciso:     { status: 'pending' },
    },
  },
];

// ── ROLE CONFIG ────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  requester: { label: 'Requester',       icon: '👤', stepIds: [] },
  owner:     { label: 'Data Owner',      icon: '🔑', stepIds: ['owner'] },
  legal:     { label: 'Legal Counsel',   icon: '⚖',  stepIds: ['legal'] },
  privacy:   { label: 'Privacy Officer', icon: '🛡',  stepIds: ['privacy'] },
  custodian: { label: 'Data Custodian',  icon: '🗄',  stepIds: ['custodian'] },
  ciso:      { label: 'CISO',            icon: '🔐', stepIds: ['ciso'] },
  admin:     { label: 'Admin',           icon: '⚙',  stepIds: [] },
};

Object.assign(window, {
  computeChain, getLeafIds, activateNext, isChainComplete,
  isDone, daysFromToday, computeDeadline,
  ChainDisplay, MOCK_REQUESTS, ROLE_CONFIG,
});
