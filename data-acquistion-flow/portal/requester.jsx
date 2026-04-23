// portal/requester.jsx — wizard steps + RequesterView

const OFFICIAL_STEPS  = ['Metadata','Classification','PII Check','Legal','Ingestion','Review'];
const SENSITIVE_STEPS = ['Metadata','Classification','PII & Privacy','Legal','DPIA','Security','Ingestion','Review'];

// ── STEP: METADATA ─────────────────────────────────────────────────────────
const MetadataStep = ({ data, onChange }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
    <div>
      <FieldLabel required>Dataset Name</FieldLabel>
      <Input value={data.name} onChange={e=>onChange('name',e.target.value)} placeholder="e.g. Medicare Claims Extract – QLD 2023"/>
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
      <div><FieldLabel required>Owning Agency / Division</FieldLabel>
        <Input value={data.agency} onChange={e=>onChange('agency',e.target.value)} placeholder="e.g. Dept. of Health"/></div>
      <div><FieldLabel required>Data Owner (name & email)</FieldLabel>
        <Input value={data.owner} onChange={e=>onChange('owner',e.target.value)} placeholder="Full name · email@agency.gov.au"/></div>
    </div>
    <div><FieldLabel required>Dataset Description</FieldLabel>
      <Input value={data.description} onChange={e=>onChange('description',e.target.value)} placeholder="Contents, source system and intended use for prototyping…" rows={3}/></div>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
      <div><FieldLabel required>Source System</FieldLabel>
        <Select value={data.sourceSystem} onChange={e=>onChange('sourceSystem',e.target.value)} options={[{value:'',label:'Select…'},{value:'sql',label:'SQL Database'},{value:'s3',label:'S3 / Object Storage'},{value:'api',label:'REST API'},{value:'sftp',label:'SFTP'},{value:'manual',label:'Manual Upload'}]}/></div>
      <div><FieldLabel required>Estimated Record Count</FieldLabel>
        <Select value={data.recordCount} onChange={e=>onChange('recordCount',e.target.value)} options={[{value:'',label:'Select…'},{value:'<10k',label:'< 10,000'},{value:'10k-100k',label:'10K – 100K'},{value:'100k-1m',label:'100K – 1M'},{value:'>1m',label:'> 1M'}]}/></div>
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
      <div><FieldLabel>Jira / ServiceNow Reference</FieldLabel>
        <Input value={data.ticketRef} onChange={e=>onChange('ticketRef',e.target.value)} placeholder="DATA-1042 or CHG0012345"/></div>
      <div><FieldLabel required>Urgency</FieldLabel>
        <Select value={data.urgency} onChange={e=>onChange('urgency',e.target.value)} options={[{value:'low',label:'Low'},{value:'standard',label:'Standard'},{value:'high',label:'High — provide justification below'}]}/></div>
    </div>
    <div><FieldLabel>Business Justification for Prototyping</FieldLabel>
      <Input value={data.justification} onChange={e=>onChange('justification',e.target.value)} placeholder="Why is this dataset required? What problem does it solve?" rows={2}/></div>
  </div>
);

// ── STEP: CLASSIFICATION ───────────────────────────────────────────────────
const ClassificationStep = ({ value, onChange }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
    <InfoBox type="info">Select the <strong>highest</strong> applicable classification. If uncertain, apply the higher tier — classification determines the approval path, security controls and SLA.</InfoBox>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
      {[
        { v:'OFFICIAL',  icon:'📋', desc:'General government business. Non-sensitive information. Parallel approval workflow — Data Owner & Data Custodian notified simultaneously.', controls:'Standard — TLS in transit, RBAC',     approvals:'Data Owner + Data Custodian (parallel · ~2–3 days)' },
        { v:'SENSITIVE', icon:'🔒', desc:'Information where compromise could cause adverse impact. Includes PII, legally privileged, commercial-in-confidence or security-related data. Sequential approval chain.', controls:'Enhanced — AES-256, DLP, audit logs', approvals:'Owner → Legal/Privacy → Custodian → CISO (sequential · ~5–10 days)' },
      ].map(opt => (
        <div key={opt.v} onClick={()=>onChange(opt.v)} style={{
          border:`2px solid ${value===opt.v ? (opt.v==='SENSITIVE'?'#A86403':'var(--blue)') : 'var(--gray-3)'}`,
          borderRadius:8, padding:18, cursor:'pointer', transition:'all .15s',
          background: value===opt.v ? (opt.v==='SENSITIVE'?'#FEF3E2':'var(--blue-light)') : '#fff',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <span style={{ fontSize:22 }}>{opt.icon}</span>
            <Badge type={opt.v}>{opt.v}</Badge>
            {value===opt.v && <span style={{ marginLeft:'auto', color: opt.v==='SENSITIVE'?'#A86403':'var(--blue)', fontWeight:700 }}>✓</span>}
          </div>
          <p style={{ fontSize:13, color:'var(--gray-6)', lineHeight:1.5, marginBottom:12 }}>{opt.desc}</p>
          <div style={{ borderTop:'1px solid var(--gray-2)', paddingTop:10 }}>
            <div style={{ fontSize:12, marginBottom:4 }}><span style={{ fontWeight:600, color:'var(--gray-5)' }}>Controls: </span>{opt.controls}</div>
            <div style={{ fontSize:12 }}><span style={{ fontWeight:600, color:'var(--gray-5)' }}>Approvals: </span>{opt.approvals}</div>
          </div>
        </div>
      ))}
    </div>
    {value==='OFFICIAL' && <InfoBox type="success"><strong>OFFICIAL path.</strong> Parallel approval. Estimated 2–3 business days.</InfoBox>}
    {value==='SENSITIVE' && <InfoBox type="warning"><strong>SENSITIVE path.</strong> Sequential 4–5 step chain including Legal and CISO sign-off. Estimated 5–10 business days.</InfoBox>}
  </div>
);

// ── STEP: PII ──────────────────────────────────────────────────────────────
const PiiStep = ({ data, onChange, isSensitive }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
    {isSensitive && <InfoBox type="warning">SENSITIVE classification: a DPIA is required if PII is confirmed.</InfoBox>}
    <Card style={{ padding:18 }}>
      <div style={{ fontWeight:600, fontSize:14, marginBottom:14 }}>PII Identification</div>
      <Toggle checked={data.containsPii} onChange={v=>onChange('containsPii',v)} label="This dataset contains Personally Identifiable Information (PII)"/>
      {data.containsPii && (
        <div style={{ paddingLeft:46, marginTop:14, borderLeft:'3px solid var(--amber-border)', marginLeft:7, display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--gray-6)', marginBottom:2 }}>PII categories present:</div>
          {[['names','Full names'],['dob','Date of birth'],['addresses','Physical / postal addresses'],['identifiers','Government identifiers (TFN, Medicare no.)'],['health','Health or medical information'],['financial','Financial account details'],['location','Precise location data'],['biometric','Biometric data']].map(([k,l])=>(
            <Checkbox key={k} checked={!!data.piiCategories?.[k]} onChange={v=>onChange('piiCategories',{...data.piiCategories,[k]:v})} label={l}/>
          ))}
        </div>
      )}
    </Card>
    {isSensitive && (
      <Card style={{ padding:18 }}>
        <div style={{ fontWeight:600, fontSize:14, marginBottom:14 }}>Privacy Assessment</div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div><FieldLabel required>Applicable Privacy Act provisions</FieldLabel>
            <Input value={data.privacyProvisions} onChange={e=>onChange('privacyProvisions',e.target.value)} placeholder="e.g. Privacy Act 1988 s.95A, APPs 3, 6, 11"/></div>
          <div><FieldLabel required>De-identification approach</FieldLabel>
            <Select value={data.deidentApproach||''} onChange={e=>onChange('deidentApproach',e.target.value)} options={[{value:'',label:'Select…'},{value:'none',label:'No de-identification (justify below)'},{value:'pseudonymise',label:'Pseudonymisation'},{value:'aggregate',label:'Aggregation / statistical suppression'},{value:'k-anon',label:'k-Anonymisation'},{value:'synthetic',label:'Replace with synthetic data'}]}/></div>
          <div><FieldLabel>Notes</FieldLabel>
            <Input value={data.privacyNotes} onChange={e=>onChange('privacyNotes',e.target.value)} rows={2} placeholder="Additional context for the privacy review…"/></div>
        </div>
      </Card>
    )}
  </div>
);

// ── STEP: LEGAL ────────────────────────────────────────────────────────────
const LegalStep = ({ data, onChange, isSensitive }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
    {isSensitive && <InfoBox type="warning">Legal sign-off is required. Legal Counsel must review before the DPIA Officer is engaged.</InfoBox>}
    <div><FieldLabel required>Data Sharing Authority / Legal Basis</FieldLabel>
      <Input value={data.legalBasis} onChange={e=>onChange('legalBasis',e.target.value)} placeholder="e.g. Privacy Act 1988 s.95A, Data Sharing Agreement, MOU"/></div>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
      <div><FieldLabel>Data Sharing Agreement Reference</FieldLabel>
        <Input value={data.dsaRef} onChange={e=>onChange('dsaRef',e.target.value)} placeholder="DSA-2026-014"/></div>
      <div><FieldLabel>Agreement Expiry</FieldLabel>
        <Input type="date" value={data.dsaExpiry} onChange={e=>onChange('dsaExpiry',e.target.value)}/></div>
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
      <div><FieldLabel required>Retention Period</FieldLabel>
        <Select value={data.retention||''} onChange={e=>onChange('retention',e.target.value)} options={[{value:'',label:'Select…'},{value:'30d',label:'30 days'},{value:'90d',label:'90 days'},{value:'1y',label:'1 year'},{value:'3y',label:'3 years'},{value:'5y',label:'5 years'},{value:'7y',label:'7 years (gov standard)'}]}/></div>
      <div><FieldLabel required>Disposal Method</FieldLabel>
        <Select value={data.disposal||''} onChange={e=>onChange('disposal',e.target.value)} options={[{value:'',label:'Select…'},{value:'auto-delete',label:'Automated deletion'},{value:'manual-review',label:'Manual review then delete'},{value:'archive',label:'Archive'},{value:'national-archives',label:'National Archives transfer'}]}/></div>
    </div>
    {isSensitive && <div><FieldLabel required>Legal Counsel Assigned</FieldLabel>
      <Input value={data.legalCounsel} onChange={e=>onChange('legalCounsel',e.target.value)} placeholder="Name and email of legal reviewer"/></div>}
    <div><FieldLabel>Additional Legal Notes</FieldLabel>
      <Input value={data.legalNotes} onChange={e=>onChange('legalNotes',e.target.value)} rows={2} placeholder="Restrictions, caveats, or conditions…"/></div>
  </div>
);

// ── STEP: DPIA ─────────────────────────────────────────────────────────────
const DpiaStep = ({ data, onChange }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
    <InfoBox type="warning">DPIA is mandatory for SENSITIVE data containing PII. This will be reviewed by the Privacy Officer.</InfoBox>
    <div><FieldLabel required>Nature and purpose of processing</FieldLabel>
      <Input value={data.dpiaPurpose} onChange={e=>onChange('dpiaPurpose',e.target.value)} rows={2} placeholder="What will be done with the data and why…"/></div>
    <div><FieldLabel required>Necessity and proportionality</FieldLabel>
      <Select value={data.dpiaProportional||''} onChange={e=>onChange('dpiaProportional',e.target.value)} options={[{value:'',label:'Select…'},{value:'proportional',label:'Confirmed proportional — minimum data required'},{value:'review',label:'Requires further review'},{value:'disproportional',label:'Potentially disproportional — requires justification'}]}/></div>
    <div>
      <FieldLabel required>Risks identified</FieldLabel>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:6 }}>
        {[['reIdentification','Re-identification risk'],['unauthorisedAccess','Unauthorised access or insider threat'],['dataLoss','Data loss or breach during transfer'],['purposeCreep','Purpose creep beyond approved use'],['thirdParty','Third-party sharing risk']].map(([k,l])=>(
          <Checkbox key={k} checked={!!data.dpiaRisks?.[k]} onChange={v=>onChange('dpiaRisks',{...data.dpiaRisks,[k]:v})} label={l}/>
        ))}
      </div>
    </div>
    <div><FieldLabel required>Mitigation measures</FieldLabel>
      <Input value={data.dpiaMitigations} onChange={e=>onChange('dpiaMitigations',e.target.value)} rows={2} placeholder="Controls to address identified risks…"/></div>
    <div><FieldLabel required>DPIA Officer Assigned</FieldLabel>
      <Input value={data.dpiaOfficer} onChange={e=>onChange('dpiaOfficer',e.target.value)} placeholder="Name and email"/></div>
  </div>
);

// ── STEP: SECURITY ─────────────────────────────────────────────────────────
const SecurityStep = ({ data, onChange }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
    <InfoBox type="warning">SENSITIVE data requires enhanced controls. All mandatory items must be confirmed.</InfoBox>
    <Card style={{ padding:18 }}>
      <div style={{ fontWeight:600, fontSize:14, marginBottom:14 }}>Encryption</div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div><FieldLabel required>Encryption at rest</FieldLabel>
          <Select value={data.encryptionAtRest||''} onChange={e=>onChange('encryptionAtRest',e.target.value)} options={[{value:'',label:'Select…'},{value:'aes256',label:'AES-256 (required for SENSITIVE)'},{value:'aes128',label:'AES-128'},{value:'none',label:'Not encrypted (CISO waiver required)'}]}/></div>
        <div><FieldLabel required>Encryption in transit</FieldLabel>
          <Select value={data.encryptionInTransit||''} onChange={e=>onChange('encryptionInTransit',e.target.value)} options={[{value:'',label:'Select…'},{value:'tls13',label:'TLS 1.3'},{value:'tls12',label:'TLS 1.2 minimum'},{value:'sftp',label:'SFTP / SCP'}]}/></div>
        <div><FieldLabel required>Key management</FieldLabel>
          <Select value={data.keyManagement||''} onChange={e=>onChange('keyManagement',e.target.value)} options={[{value:'',label:'Select…'},{value:'aws-kms',label:'AWS KMS'},{value:'azure-kv',label:'Azure Key Vault'},{value:'agency-hsm',label:'Agency HSM'},{value:'manual',label:'Manual key management'}]}/></div>
      </div>
    </Card>
    <Card style={{ padding:18 }}>
      <div style={{ fontWeight:600, fontSize:14, marginBottom:14 }}>Access Controls</div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div><FieldLabel required>Access control model</FieldLabel>
          <Select value={data.accessControl||''} onChange={e=>onChange('accessControl',e.target.value)} options={[{value:'',label:'Select…'},{value:'rbac',label:'RBAC'},{value:'abac',label:'ABAC'},{value:'need-to-know',label:'Need-to-know list'}]}/></div>
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {[['mfa','Multi-factor authentication enforced','Mandatory'],['dlp','DLP monitoring enabled','Mandatory'],['auditLog','Comprehensive audit logging','Mandatory'],['networkSeg','Network segmentation','Recommended']].map(([k,l,sub])=>(
            <Checkbox key={k} checked={!!data.securityControls?.[k]} onChange={v=>onChange('securityControls',{...data.securityControls,[k]:v})} label={l} sublabel={sub}/>
          ))}
        </div>
      </div>
    </Card>
  </div>
);

// ── STEP: INGESTION ────────────────────────────────────────────────────────
const IngestionStep = ({ data, onChange }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
      <div><FieldLabel required>Target Environment</FieldLabel>
        <Select value={data.targetEnv||''} onChange={e=>onChange('targetEnv',e.target.value)} options={[{value:'',label:'Select…'},{value:'dev',label:'Development'},{value:'sandbox',label:'Sandbox / Prototype'},{value:'staging',label:'Staging'},{value:'prod',label:'Production'}]}/></div>
      <div><FieldLabel required>Data Format</FieldLabel>
        <Select value={data.dataFormat||''} onChange={e=>onChange('dataFormat',e.target.value)} options={[{value:'',label:'Select…'},{value:'csv',label:'CSV'},{value:'json',label:'JSON'},{value:'parquet',label:'Parquet'},{value:'sql-dump',label:'SQL Dump'},{value:'xml',label:'XML'},{value:'api',label:'API / Live feed'}]}/></div>
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
      <div><FieldLabel required>Ingestion Method</FieldLabel>
        <Select value={data.ingestionMethod||''} onChange={e=>onChange('ingestionMethod',e.target.value)} options={[{value:'',label:'Select…'},{value:'batch',label:'Batch / one-time'},{value:'scheduled',label:'Scheduled pipeline'},{value:'streaming',label:'Streaming'},{value:'manual',label:'Manual file transfer'}]}/></div>
      <div><FieldLabel>Refresh Frequency</FieldLabel>
        <Select value={data.refreshFreq||'once'} onChange={e=>onChange('refreshFreq',e.target.value)} options={[{value:'once',label:'One-time'},{value:'daily',label:'Daily'},{value:'weekly',label:'Weekly'},{value:'monthly',label:'Monthly'},{value:'realtime',label:'Real-time'}]}/></div>
    </div>
    <div><FieldLabel>Access Restrictions / Conditions of Use</FieldLabel>
      <Input value={data.accessRestrictions} onChange={e=>onChange('accessRestrictions',e.target.value)} rows={2} placeholder="Limitations on who can access, query, or export…"/></div>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
      <div><FieldLabel>ServiceNow Change Request</FieldLabel>
        <Input value={data.changeRef} onChange={e=>onChange('changeRef',e.target.value)} placeholder="CHG0012345"/></div>
      <div><FieldLabel>Technical Contact</FieldLabel>
        <Input value={data.techContact} onChange={e=>onChange('techContact',e.target.value)} placeholder="data.eng@agency.gov.au"/></div>
    </div>
  </div>
);

// ── STEP: REVIEW ───────────────────────────────────────────────────────────
const ReviewStep = ({ formData }) => {
  const cl = formData.classification;
  const chain = computeChain(cl, formData.pii.containsPii);
  const initSS = {};
  chain.forEach(n => {
    if (n.type === 'parallel') n.children.forEach(c => { initSS[c.id] = { status:'pending' }; });
    else initSS[n.id] = { status:'pending' };
  });
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <InfoBox type="info">Review your submission. Once submitted, approvers will be notified and the classification cannot be changed.</InfoBox>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Card style={{ padding:16 }}>
          <SectionHead>Dataset</SectionHead>
          <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>{formData.metadata.name||'—'}</div>
          <div style={{ fontSize:13, color:'var(--gray-5)', marginBottom:10 }}>{formData.metadata.agency||'—'}</div>
          <Badge type={cl}>{cl}</Badge>
          {formData.pii.containsPii && <span style={{ marginLeft:8 }}><Badge type="high" size="sm">Contains PII</Badge></span>}
        </Card>
        <Card style={{ padding:16 }}>
          <SectionHead>Approval Path</SectionHead>
          <ChainDisplay chain={chain} stepStatuses={initSS} compact={true}/>
        </Card>
      </div>
      <Card style={{ padding:16 }}>
        <SectionHead>Summary</SectionHead>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 24px' }}>
          {[['Source',formData.metadata.sourceSystem],['Records',formData.metadata.recordCount],['Contains PII',formData.pii.containsPii?'Yes':'No'],['Legal Basis',formData.legal.legalBasis],['Retention',formData.legal.retention],['Disposal',formData.legal.disposal],['Target Env',formData.ingestion.targetEnv],['Format',formData.ingestion.dataFormat]].map(([k,v])=>(
            <KV key={k} label={k} value={v}/>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ── REQUESTER VIEW ─────────────────────────────────────────────────────────
const RequesterView = ({ requests, setRequests }) => {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(null);
  const emptyForm = () => ({
    metadata:   { name:'',agency:'',owner:'',description:'',sourceSystem:'',recordCount:'',ticketRef:'',urgency:'standard',justification:'' },
    classification: 'OFFICIAL',
    pii:        { containsPii:false, piiCategories:{}, privacyProvisions:'',deidentApproach:'',privacyNotes:'' },
    legal:      { legalBasis:'',dsaRef:'',dsaExpiry:'',retention:'',disposal:'',legalCounsel:'',legalNotes:'' },
    dpia:       { dpiaPurpose:'',dpiaProportional:'',dpiaRisks:{},dpiaMitigations:'',dpiaOfficer:'' },
    security:   { encryptionAtRest:'',encryptionInTransit:'',keyManagement:'',accessControl:'',securityControls:{} },
    ingestion:  { targetEnv:'',dataFormat:'',ingestionMethod:'',refreshFreq:'once',accessRestrictions:'',changeRef:'',techContact:'' },
  });
  const [form, setForm] = useState(emptyForm());
  const isSensitive = form.classification === 'SENSITIVE';
  const steps = isSensitive ? SENSITIVE_STEPS : OFFICIAL_STEPS;

  const upd = (section, key, val) => setForm(p=>({...p,[section]:{...p[section],[key]:val}}));

  // Check if returned request is being resubmitted
  const [returnedReq, setReturnedReq] = useState(null);
  const [reclassifyReq, setReclassifyReq] = useState(null);

  const returnedRequests = requests.filter(r=>r.requester==='J. Nguyen' && (r.status==='returned'||r.status==='reclassify_pending'));

  const stepContent = () => {
    const idx = step;
    if (!isSensitive) {
      return [
        <MetadataStep data={form.metadata} onChange={(k,v)=>upd('metadata',k,v)}/>,
        <ClassificationStep value={form.classification} onChange={v=>setForm(p=>({...p,classification:v}))}/>,
        <PiiStep data={form.pii} onChange={(k,v)=>upd('pii',k,v)} isSensitive={false}/>,
        <LegalStep data={form.legal} onChange={(k,v)=>upd('legal',k,v)} isSensitive={false}/>,
        <IngestionStep data={form.ingestion} onChange={(k,v)=>upd('ingestion',k,v)}/>,
        <ReviewStep formData={form}/>,
      ][idx];
    }
    return [
      <MetadataStep data={form.metadata} onChange={(k,v)=>upd('metadata',k,v)}/>,
      <ClassificationStep value={form.classification} onChange={v=>setForm(p=>({...p,classification:v}))}/>,
      <PiiStep data={form.pii} onChange={(k,v)=>upd('pii',k,v)} isSensitive={true}/>,
      <LegalStep data={form.legal} onChange={(k,v)=>upd('legal',k,v)} isSensitive={true}/>,
      <DpiaStep data={form.dpia} onChange={(k,v)=>upd('dpia',k,v)}/>,
      <SecurityStep data={form.security} onChange={(k,v)=>upd('security',k,v)}/>,
      <IngestionStep data={form.ingestion} onChange={(k,v)=>upd('ingestion',k,v)}/>,
      <ReviewStep formData={form}/>,
    ][Math.min(idx,7)];
  };

  const handleSubmit = () => {
    const id = `DOR-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`;
    const chain = computeChain(form.classification, form.pii.containsPii);
    const ss = {};
    // Activate first step(s)
    const first = chain[0];
    if (first.type==='parallel') first.children.forEach(c=>{ss[c.id]={status:'active',deadline:computeDeadline(first.sla),assignee:'Pending assignment'};});
    else { ss[first.id]={status:'active',deadline:computeDeadline(first.sla),assignee:'Pending assignment'}; }
    chain.slice(1).forEach(n=>{
      if(n.type==='parallel') n.children.forEach(c=>{ss[c.id]={status:'pending'};});
      else ss[n.id]={status:'pending'};
    });
    const newReq = { id, name:form.metadata.name||'Untitled Dataset', classification:form.classification, status:'in_review', requester:'J. Nguyen', requesterEmail:'j.nguyen@health.gov.au', agency:form.metadata.agency, submitted:TODAY_STR, description:form.metadata.description, urgency:form.metadata.urgency, ticketRef:form.metadata.ticketRef, containsPii:form.pii.containsPii, piiCategories:form.pii.piiCategories, legal:form.legal, ingestion:form.ingestion, security:form.security, chain, stepStatuses:ss };
    setRequests(p=>[newReq,...p]);
    setSubmitted(newReq);
  };

  if (submitted) return (
    <div style={{ maxWidth:640, margin:'0 auto', paddingTop:20, paddingBottom:40 }}>
      <Card style={{ padding:36, textAlign:'center', marginBottom:20 }}>
        <div style={{ width:56,height:56,borderRadius:'50%',background:'#EEF4EB',border:'2px solid #2E844A',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:24 }}>✓</div>
        <div style={{ fontSize:20, fontWeight:700, marginBottom:6 }}>Request Submitted</div>
        <div style={{ fontSize:14, color:'var(--gray-5)', marginBottom:16 }}>Approvers have been notified. Track status in My Requests.</div>
        <div style={{ display:'inline-flex',alignItems:'center',gap:10,background:'var(--gray-1)',borderRadius:6,padding:'8px 18px',marginBottom:10 }}>
          <span style={{ fontSize:12,color:'var(--gray-5)' }}>Reference</span>
          <span style={{ fontFamily:'IBM Plex Mono,monospace',fontWeight:600,fontSize:15 }}>{submitted.id}</span>
        </div>
        <div style={{ display:'flex',justifyContent:'center',gap:8,marginTop:10 }}><Badge type={submitted.classification}>{submitted.classification}</Badge></div>
      </Card>
      <Card style={{ padding:20, marginBottom:16 }}>
        <SectionHead>Approval Workflow</SectionHead>
        <ChainDisplay chain={submitted.chain} stepStatuses={submitted.stepStatuses}/>
      </Card>
      <div style={{ textAlign:'center' }}>
        <Btn variant="secondary" onClick={()=>{setSubmitted(null);setStep(0);setForm(emptyForm());}}>Submit another request</Btn>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth:780, margin:'0 auto', paddingTop:20, paddingBottom:40 }}>
      {/* Returned/reclassify banners */}
      {returnedRequests.length > 0 && (
        <div style={{ marginBottom:18 }}>
          {returnedRequests.map(r=>(
            <div key={r.id} style={{ background: r.status==='returned'?'var(--red-bg)':'var(--amber-bg)', border:`1px solid ${r.status==='returned'?'#F5B3A9':'var(--amber-border)'}`, borderRadius:8, padding:'12px 16px', marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
              <div>
                <div style={{ fontWeight:600, fontSize:13, color: r.status==='returned'?'var(--red)':'#7A4504', marginBottom:3 }}>
                  {r.status==='returned'?'↩ Returned:':'⚑ Reclassification requested:'} {r.name}
                </div>
                <div style={{ fontSize:12, color:'var(--gray-6)' }}>{r.status==='returned'?r.returnNote:r.reclassifyFlag?.reason}</div>
              </div>
              <Btn size="sm" variant={r.status==='returned'?'danger':'warning'} onClick={()=>{}}>Address & Resubmit</Btn>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>New Data Onboarding Request</div>
        <div style={{ fontSize:14, color:'var(--gray-5)' }}>Classification determines the approval path and security controls applied.</div>
      </div>
      <Stepper steps={steps} current={step}/>
      <Card style={{ padding:28, marginBottom:18 }}>
        <div style={{ fontSize:16, fontWeight:700, marginBottom:2 }}>{steps[step]}</div>
        <div style={{ fontSize:13, color:'var(--gray-5)', marginBottom:20 }}>Step {step+1} of {steps.length}</div>
        {stepContent()}
      </Card>
      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <Btn variant="ghost" onClick={()=>setStep(s=>s-1)} disabled={step===0}>← Back</Btn>
        {step < steps.length-1
          ? <Btn variant="primary" onClick={()=>setStep(s=>s+1)}>Continue →</Btn>
          : <Btn variant="success" onClick={handleSubmit}>Submit Request</Btn>
        }
      </div>
    </div>
  );
};

// My Requests tab
const MyRequestsView = ({ requests }) => {
  const mine = requests.filter(r=>r.requester==='J. Nguyen');
  return (
    <div style={{ maxWidth:800, paddingTop:4, paddingBottom:40 }}>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:18 }}>My Requests</div>
      {mine.length===0 && <div style={{ color:'var(--gray-5)', fontSize:14 }}>No requests submitted yet.</div>}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {mine.map(r=>(
          <Card key={r.id} style={{ padding:18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:3 }}>{r.name}</div>
                <div style={{ fontSize:12, fontFamily:'IBM Plex Mono,monospace', color:'var(--gray-5)' }}>{r.id}</div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <Badge type={r.classification} size="sm">{r.classification}</Badge>
                <Badge type={r.status} size="sm">{r.status.replace('_',' ')}</Badge>
              </div>
            </div>
            {r.status==='returned' && <InfoBox type="error"><strong>Returned at {r.returnedAtStep} step:</strong> {r.returnNote}</InfoBox>}
            {r.status==='reclassify_pending' && <InfoBox type="warning"><strong>Reclassification requested by {r.reclassifyFlag?.flaggedBy}:</strong> {r.reclassifyFlag?.reason}</InfoBox>}
            <div style={{ marginTop:12 }}>
              <ChainDisplay chain={r.chain} stepStatuses={r.stepStatuses} compact={true}/>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

Object.assign(window, { RequesterView, MyRequestsView });
