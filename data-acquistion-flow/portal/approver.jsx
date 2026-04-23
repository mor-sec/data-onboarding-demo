// portal/approver.jsx — all approver role views + ActionPanel + delegation

// ── ROLE-SPECIFIC REVIEW PANELS ────────────────────────────────────────────
const OwnerReview = ({ req }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
    <SectionHead>Dataset Overview</SectionHead>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 20px' }}>
      <KV label="Agency" value={req.agency}/>
      <KV label="Ticket Ref" value={req.ticketRef}/>
      <KV label="Source System" value={req.ingestion?.sourceSystem || req.ingestion?.ingestionMethod}/>
      <KV label="Record Count" value={req.ingestion?.recordCount}/>
      <KV label="Target Env" value={req.ingestion?.targetEnv}/>
      <KV label="Urgency" value={req.urgency}/>
    </div>
    <div><div style={{ fontSize:11,fontWeight:700,color:'var(--gray-5)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4 }}>Description</div>
      <div style={{ fontSize:13,color:'var(--gray-6)',lineHeight:1.6 }}>{req.description}</div>
    </div>
    {req.containsPii && (
      <InfoBox type="warning">Contains PII — {Object.entries(req.piiCategories||{}).filter(([,v])=>v).map(([k])=>k).join(', ')}</InfoBox>
    )}
  </div>
);

const LegalReview = ({ req }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
    <SectionHead>Legal & Compliance</SectionHead>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 20px' }}>
      <KV label="Legal Basis" value={req.legal?.legalBasis}/>
      <KV label="DSA Reference" value={req.legal?.dsaRef || 'None'}/>
      <KV label="DSA Expiry" value={req.legal?.dsaExpiry || '—'}/>
      <KV label="Retention Period" value={req.legal?.retention}/>
      <KV label="Disposal Method" value={req.legal?.disposal}/>
      <KV label="Legal Counsel" value={req.legal?.legalCounsel || 'Unassigned'}/>
    </div>
    {req.legal?.legalNotes && <div><div style={{ fontSize:11,fontWeight:700,color:'var(--gray-5)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4 }}>Legal Notes</div>
      <div style={{ fontSize:13,color:'var(--gray-6)',lineHeight:1.6 }}>{req.legal.legalNotes}</div></div>}
    {!req.legal?.dsaRef && <InfoBox type="warning">No Data Sharing Agreement on file. Confirm legal authority before approving.</InfoBox>}
    {req.containsPii && <InfoBox type="info">Dataset contains PII. Privacy Officer review will run in parallel with this review.</InfoBox>}
  </div>
);

const PrivacyReview = ({ req }) => {
  const piiCats = Object.entries(req.piiCategories||{}).filter(([,v])=>v).map(([k])=>k);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <SectionHead>Privacy & DPIA</SectionHead>
      <div>
        <div style={{ fontSize:11,fontWeight:700,color:'var(--gray-5)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6 }}>PII Categories Present</div>
        {piiCats.length===0
          ? <div style={{ fontSize:13,color:'var(--gray-5)' }}>None declared by requester</div>
          : <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {piiCats.map(k=><Badge key={k} type="high" size="sm">{k}</Badge>)}
            </div>}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 20px' }}>
        <KV label="Privacy Act Provisions" value={req.pii?.privacyProvisions || req.legal?.legalBasis}/>
        <KV label="De-identification" value={req.pii?.deidentApproach || '—'}/>
        <KV label="DPIA Required" value={req.containsPii ? 'Yes' : 'Not required'}/>
        <KV label="Retention Period" value={req.legal?.retention}/>
      </div>
      {req.pii?.privacyNotes && <div><div style={{ fontSize:11,fontWeight:700,color:'var(--gray-5)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4 }}>Privacy Notes</div>
        <div style={{ fontSize:13,color:'var(--gray-6)',lineHeight:1.6 }}>{req.pii.privacyNotes}</div></div>}
      {req.containsPii && <InfoBox type="warning">High-risk PII present. Confirm de-identification approach is adequate before approving.</InfoBox>}
    </div>
  );
};

const CustodianReview = ({ req }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
    <SectionHead>Technical Ingestion Config</SectionHead>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 20px' }}>
      <KV label="Target Environment" value={req.ingestion?.targetEnv}/>
      <KV label="Data Format" value={req.ingestion?.dataFormat}/>
      <KV label="Ingestion Method" value={req.ingestion?.ingestionMethod}/>
      <KV label="Refresh Frequency" value={req.ingestion?.refreshFreq || 'One-time'}/>
      <KV label="Record Count" value={req.ingestion?.recordCount}/>
      <KV label="Technical Contact" value={req.ingestion?.techContact || '—'}/>
    </div>
    {req.ingestion?.accessRestrictions && <div><div style={{ fontSize:11,fontWeight:700,color:'var(--gray-5)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4 }}>Access Restrictions</div>
      <div style={{ fontSize:13,color:'var(--gray-6)',lineHeight:1.6 }}>{req.ingestion.accessRestrictions}</div></div>}
    <InfoBox type="info">Confirm the ingestion configuration is technically feasible and compliant with environment policies before approving.</InfoBox>
  </div>
);

const CISOReview = ({ req }) => {
  const sec = req.security || {};
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <SectionHead>Security Controls</SectionHead>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 20px' }}>
        <KV label="Encryption at Rest" value={sec.encryptionAtRest}/>
        <KV label="Encryption in Transit" value={sec.encryptionInTransit}/>
        <KV label="Key Management" value={sec.keyManagement}/>
        <KV label="Access Control" value={sec.accessControl}/>
      </div>
      <div>
        <div style={{ fontSize:11,fontWeight:700,color:'var(--gray-5)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8 }}>Mandatory Controls</div>
        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
          {[['mfa','MFA Enforced'],['dlp','DLP Monitoring'],['auditLog','Audit Logging'],['networkSeg','Network Segmentation']].map(([k,l])=>(
            <div key={k} style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:18,height:18,borderRadius:3,background:sec[k]?'#2E844A':'#F5B3A9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                <span style={{ color:'#fff',fontSize:10,fontWeight:700 }}>{sec[k]?'✓':'✕'}</span>
              </div>
              <span style={{ fontSize:13, color: sec[k]?'var(--gray-6)':'var(--red)', fontWeight: sec[k]?400:600 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
      {!sec.mfa && <InfoBox type="error">MFA is not confirmed. This is mandatory for SENSITIVE data. Request cannot proceed without MFA enforcement.</InfoBox>}
    </div>
  );
};

// ── RECLASSIFY MODAL ────────────────────────────────────────────────────────
const ReclassifyModal = ({ show, onClose, onSubmit, currentClassification }) => {
  const [suggested, setSuggested] = useState(currentClassification==='OFFICIAL'?'SENSITIVE':'OFFICIAL');
  const [reason, setReason] = useState('');
  return (
    <Modal show={show} onClose={onClose} title="Flag for Reclassification">
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <InfoBox type="warning">Flagging will pause the current approval chain and return the request to the requester with your recommendation.</InfoBox>
        <div>
          <FieldLabel required>Suggested Classification</FieldLabel>
          <div style={{ display:'flex', gap:10, marginTop:6 }}>
            {['OFFICIAL','SENSITIVE'].map(c=>(
              <div key={c} onClick={()=>setSuggested(c)} style={{ flex:1, padding:'10px 14px', borderRadius:6, border:`2px solid ${suggested===c?(c==='SENSITIVE'?'#A86403':'var(--blue)'):'var(--gray-3)'}`, background:suggested===c?(c==='SENSITIVE'?'var(--amber-bg)':'var(--blue-light)'):'#fff', cursor:'pointer', textAlign:'center' }}>
                <Badge type={c}>{c}</Badge>
              </div>
            ))}
          </div>
        </div>
        <div>
          <FieldLabel required>Reason for reclassification</FieldLabel>
          <Input value={reason} onChange={e=>setReason(e.target.value)} rows={3} placeholder="Explain why a different classification is appropriate…"/>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <Btn variant="ghost" onClick={onClose} style={{ flex:1 }}>Cancel</Btn>
          <Btn variant="warning" onClick={()=>onSubmit(suggested,reason)} disabled={!reason.trim()} style={{ flex:1 }}>Submit Flag</Btn>
        </div>
      </div>
    </Modal>
  );
};

// ── DELEGATE MODAL ──────────────────────────────────────────────────────────
const DelegateModal = ({ show, onClose, onSubmit }) => {
  const [delegate, setDelegate] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [expiry, setExpiry] = useState('');
  return (
    <Modal show={show} onClose={onClose} title="Manage Delegation">
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <InfoBox type="info">Your delegate will receive and action approval requests on your behalf until the expiry date.</InfoBox>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div><FieldLabel required>Delegate Name</FieldLabel><Input value={delegate} onChange={e=>setDelegate(e.target.value)} placeholder="Full name"/></div>
          <div><FieldLabel required>Delegate Email</FieldLabel><Input value={email} onChange={e=>setEmail(e.target.value)} placeholder="delegate@agency.gov.au"/></div>
        </div>
        <div><FieldLabel required>Reason for Delegation</FieldLabel><Input value={reason} onChange={e=>setReason(e.target.value)} placeholder="e.g. Annual leave 28 Apr – 5 May"/></div>
        <div><FieldLabel required>Delegation Expiry</FieldLabel><Input type="date" value={expiry} onChange={e=>setExpiry(e.target.value)}/></div>
        <div style={{ display:'flex', gap:10 }}>
          <Btn variant="ghost" onClick={onClose} style={{ flex:1 }}>Cancel</Btn>
          <Btn variant="primary" onClick={()=>onSubmit({delegate,email,reason,expiry})} disabled={!delegate||!email||!expiry} style={{ flex:1 }}>Save Delegation</Btn>
        </div>
      </div>
    </Modal>
  );
};

// ── ACTION PANEL ────────────────────────────────────────────────────────────
const ActionPanel = ({ req, stepId, onApprove, onApproveConditions, onReject, onReclassify }) => {
  const [mode, setMode] = useState('idle'); // idle | conditions | reject
  const [note, setNote] = useState('');
  const ss = req.stepStatuses[stepId] || {};
  if (ss.status !== 'active') {
    return (
      <div style={{ borderTop:'1px solid var(--gray-2)', paddingTop:16, marginTop:4 }}>
        <div style={{ fontSize:13, color:'var(--gray-5)', fontStyle:'italic' }}>
          {ss.status==='pending' ? 'This step is not yet active.' : `Decision recorded: ${ss.status?.replace('_',' ')} on ${ss.decidedAt||'—'}`}
        </div>
      </div>
    );
  }
  return (
    <div style={{ borderTop:'1px solid var(--gray-2)', paddingTop:16, marginTop:4 }}>
      <div style={{ fontSize:12, fontWeight:700, color:'var(--gray-5)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12 }}>Decision</div>
      {mode==='idle' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="success" style={{ flex:1 }} onClick={()=>onApprove(req.id,stepId)}>Approve</Btn>
            <Btn variant="warning" style={{ flex:1 }} onClick={()=>setMode('conditions')}>Approve with Conditions</Btn>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="danger" style={{ flex:1 }} onClick={()=>setMode('reject')}>Reject</Btn>
            <Btn variant="ghost" style={{ flex:1 }} onClick={onReclassify}>⚑ Flag Reclassification</Btn>
          </div>
        </div>
      )}
      {mode==='conditions' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <InfoBox type="warning">Approval will proceed with the conditions you specify. Conditions are attached to this request permanently.</InfoBox>
          <div><FieldLabel required>Conditions of Approval</FieldLabel>
            <Input value={note} onChange={e=>setNote(e.target.value)} rows={3} placeholder="Specify the conditions that must be met…"/></div>
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="ghost" onClick={()=>{setMode('idle');setNote('');}} style={{ flex:1 }}>Cancel</Btn>
            <Btn variant="warning" disabled={!note.trim()} onClick={()=>onApproveConditions(req.id,stepId,note)} style={{ flex:1 }}>Approve with Conditions</Btn>
          </div>
        </div>
      )}
      {mode==='reject' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <InfoBox type="error">Rejection will return the request to the requester at this step with your note. The approval chain will pause.</InfoBox>
          <div><FieldLabel required>Rejection Reason</FieldLabel>
            <Input value={note} onChange={e=>setNote(e.target.value)} rows={3} placeholder="Explain why this request cannot proceed and what the requester should do…"/></div>
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="ghost" onClick={()=>{setMode('idle');setNote('');}} style={{ flex:1 }}>Cancel</Btn>
            <Btn variant="danger" disabled={!note.trim()} onClick={()=>onReject(req.id,stepId,note)} style={{ flex:1 }}>Confirm Rejection</Btn>
          </div>
        </div>
      )}
    </div>
  );
};

// ── APPROVER SHELL ──────────────────────────────────────────────────────────
const ApproverShell = ({ role, requests, setRequests }) => {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('mine');
  const [showReclassify, setShowReclassify] = useState(false);
  const [showDelegate, setShowDelegate] = useState(false);
  const [delegations, setDelegations] = useState({});
  const [actionFlash, setActionFlash] = useState(null);

  const cfg = ROLE_CONFIG[role];
  const stepId = cfg.stepIds[0];

  // Filter: 'mine' = requests at this role's step; 'all' = everything
  const filtered = requests.filter(r => {
    if (filter==='all') return true;
    if (!stepId) return true;
    const ss = r.stepStatuses[stepId];
    return ss?.status==='active' || r.status==='reclassify_pending' || r.status==='returned';
  });

  const req = requests.find(r=>r.id===selected);

  const flash = (type) => { setActionFlash(type); setTimeout(()=>setActionFlash(null),2000); };

  const updateReq = (id, updater) => setRequests(prev=>prev.map(r=>r.id===id ? updater(r) : r));

  const handleApprove = (id, sId) => {
    updateReq(id, r => {
      const newSS = activateNext(r.chain, {
        ...r.stepStatuses,
        [sId]: { ...r.stepStatuses[sId], status:'approved', decidedAt:TODAY_STR, decidedBy:cfg.label }
      }, sId);
      const complete = isChainComplete(r.chain, newSS);
      return { ...r, stepStatuses:newSS, status: complete?'approved':'in_review' };
    });
    flash('approved');
  };

  const handleApproveConditions = (id, sId, conditions) => {
    updateReq(id, r => {
      const newSS = activateNext(r.chain, {
        ...r.stepStatuses,
        [sId]: { ...r.stepStatuses[sId], status:'approved_conditions', conditions, decidedAt:TODAY_STR, decidedBy:cfg.label }
      }, sId);
      const complete = isChainComplete(r.chain, newSS);
      return { ...r, stepStatuses:newSS, status: complete?'approved':'in_review' };
    });
    flash('approved_conditions');
  };

  const handleReject = (id, sId, note) => {
    updateReq(id, r => ({
      ...r,
      status: 'returned',
      returnedAtStep: sId,
      returnNote: note,
      stepStatuses: {
        ...r.stepStatuses,
        [sId]: { ...r.stepStatuses[sId], status:'rejected', note, decidedAt:TODAY_STR, decidedBy:cfg.label }
      }
    }));
    flash('rejected');
  };

  const handleReclassify = (id, suggested, reason) => {
    updateReq(id, r => ({
      ...r,
      status: 'reclassify_pending',
      reclassifyFlag: { flaggedBy: cfg.label, flaggedAt: TODAY_STR, suggestedClassification: suggested, reason }
    }));
    setShowReclassify(false);
    flash('reclassify');
  };

  const reviewPanel = (r) => {
    if (!r) return null;
    if (role==='owner')     return <OwnerReview req={r}/>;
    if (role==='legal')     return <LegalReview req={r}/>;
    if (role==='privacy')   return <PrivacyReview req={r}/>;
    if (role==='custodian') return <CustodianReview req={r}/>;
    if (role==='ciso')      return <CISOReview req={r}/>;
    return null;
  };

  const pendingCount = requests.filter(r=>stepId && r.stepStatuses[stepId]?.status==='active').length;

  return (
    <div style={{ display:'flex', gap:16, paddingTop:4, paddingBottom:40, maxWidth:1100, height:'calc(100vh - 72px)', overflow:'hidden' }}>
      {/* Left: request list */}
      <div style={{ width:340, flexShrink:0, display:'flex', flexDirection:'column', gap:10, overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div style={{ fontSize:18, fontWeight:700 }}>
            {cfg.label} Queue
            {pendingCount>0 && <span style={{ marginLeft:8, background:'var(--red)', color:'#fff', borderRadius:10, padding:'1px 8px', fontSize:12, fontWeight:700 }}>{pendingCount}</span>}
          </div>
          <Btn size="sm" variant="ghost" onClick={()=>setShowDelegate(true)}>Delegate →</Btn>
        </div>
        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
          {['mine','all'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{ padding:'4px 12px', borderRadius:4, fontSize:12, fontWeight:600, border:'1px solid', cursor:'pointer', background:filter===f?'var(--blue)':'#fff', color:filter===f?'#fff':'var(--gray-5)', borderColor:filter===f?'var(--blue)':'var(--gray-3)', transition:'all .15s' }}>
              {f==='mine'?'My Queue':'All Requests'}
            </button>
          ))}
        </div>
        {filtered.length===0 && (
          <div style={{ padding:20, textAlign:'center', color:'var(--gray-5)', fontSize:13 }}>No requests in your queue.</div>
        )}
        {filtered.map(r=>{
          const myStepSS = stepId ? r.stepStatuses[stepId] : null;
          const isActive = myStepSS?.status==='active';
          const isOverdue = isActive && myStepSS?.deadline && daysFromToday(myStepSS.deadline)<0;
          return (
            <Card key={r.id} selected={selected===r.id} onClick={()=>setSelected(r.id===selected?null:r.id)} hover style={{ padding:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                  <Badge type={r.classification} size="sm">{r.classification}</Badge>
                  {isOverdue && <Badge type="overdue" size="sm">OVERDUE</Badge>}
                </div>
                <Badge type={r.status} size="sm">{r.status.replace('_',' ')}</Badge>
              </div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:3, lineHeight:1.3 }}>{r.name}</div>
              <div style={{ display:'flex', gap:10, fontSize:12, color:'var(--gray-5)' }}>
                <span style={{ fontFamily:'IBM Plex Mono,monospace' }}>{r.id}</span>
                <span>·</span><span>{r.requester}</span>
              </div>
              {isActive && myStepSS?.deadline && (
                <div style={{ marginTop:8, fontSize:12, color:isOverdue?'var(--red)':'var(--blue)', fontWeight:600 }}>
                  {isOverdue ? `⚠ ${Math.abs(daysFromToday(myStepSS.deadline))}d overdue` : `⏳ ${daysFromToday(myStepSS.deadline)}d remaining (SLA ${myStepSS.deadline})`}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Right: detail */}
      {req ? (
        <div style={{ flex:1, overflowY:'auto' }}>
          {actionFlash && (
            <div style={{ background:actionFlash==='approved'?'#EEF4EB':actionFlash==='rejected'?'#FEF1EE':'#FFFDE7', border:`1px solid ${actionFlash==='approved'?'#A8D5B5':actionFlash==='rejected'?'#F5B3A9':'#FFE082'}`, borderRadius:6, padding:'10px 16px', marginBottom:12, display:'flex', gap:10, alignItems:'center', fontSize:13, fontWeight:600, color:actionFlash==='approved'?'#2E844A':actionFlash==='rejected'?'#BA0517':'#A86403' }}>
              {actionFlash==='approved'?'✓ Approved — next approver notified.':actionFlash==='approved_conditions'?'✓ Approved with conditions — next approver notified.':actionFlash==='reclassify'?'⚑ Reclassification flag sent to requester.':'✕ Rejected — request returned to requester.'}
            </div>
          )}
          <Card style={{ padding:22 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
              <div>
                <div style={{ fontSize:16, fontWeight:700, marginBottom:3 }}>{req.name}</div>
                <div style={{ fontSize:12, fontFamily:'IBM Plex Mono,monospace', color:'var(--gray-5)' }}>{req.id} · {req.submitted}</div>
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'flex-end' }}>
                <Badge type={req.classification}>{req.classification}</Badge>
                <Badge type={req.status}>{req.status.replace('_',' ')}</Badge>
                {req.urgency==='high' && <Badge type="high" size="sm">URGENT</Badge>}
              </div>
            </div>
            {req.status==='reclassify_pending' && (
              <InfoBox type="warning" style={{ marginBottom:16 }}>
                <strong>Reclassification pending:</strong> {req.reclassifyFlag?.reason} — Flagged by {req.reclassifyFlag?.flaggedBy} on {req.reclassifyFlag?.flaggedAt}.
              </InfoBox>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:20 }}>
              <div>
                {reviewPanel(req)}
                {stepId && (
                  <ActionPanel
                    req={req} stepId={stepId}
                    onApprove={handleApprove}
                    onApproveConditions={handleApproveConditions}
                    onReject={handleReject}
                    onReclassify={()=>setShowReclassify(true)}
                  />
                )}
              </div>
              <div>
                <SectionHead>Approval Chain</SectionHead>
                <ChainDisplay chain={req.chain} stepStatuses={req.stepStatuses}/>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ textAlign:'center', color:'var(--gray-5)' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>📋</div>
            <div style={{ fontSize:14, fontWeight:500 }}>Select a request to review</div>
          </div>
        </div>
      )}

      {req && <ReclassifyModal show={showReclassify} onClose={()=>setShowReclassify(false)} currentClassification={req?.classification} onSubmit={(s,r)=>handleReclassify(req.id,s,r)}/>}
      <DelegateModal show={showDelegate} onClose={()=>setShowDelegate(false)} onSubmit={(d)=>{ setDelegations(p=>({...p,[role]:d})); setShowDelegate(false); }}/>
    </div>
  );
};

Object.assign(window, { ApproverShell });
