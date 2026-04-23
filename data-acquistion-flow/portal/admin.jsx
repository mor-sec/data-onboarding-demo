// portal/admin.jsx — AdminView

const StatCard = ({ label, value, sub, color }) => (
  <Card style={{ padding:18 }}>
    <div style={{ fontSize:28, fontWeight:700, color, marginBottom:2 }}>{value}</div>
    <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>{label}</div>
    <div style={{ fontSize:12, color:'var(--gray-5)' }}>{sub}</div>
  </Card>
);

const AdminView = ({ requests }) => {
  const pending  = requests.filter(r=>r.status==='in_review');
  const approved = requests.filter(r=>r.status==='approved');
  const returned = requests.filter(r=>r.status==='returned');
  const reclassify = requests.filter(r=>r.status==='reclassify_pending');
  const sensitive = requests.filter(r=>r.classification==='SENSITIVE');
  const overdue  = requests.filter(r=>{
    return Object.values(r.stepStatuses).some(ss=>ss.status==='active' && ss.deadline && daysFromToday(ss.deadline)<0);
  });

  const [expandId, setExpandId] = useState(null);

  return (
    <div style={{ paddingTop:4, paddingBottom:40, maxWidth:1000 }}>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:20 }}>Admin Overview</div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        <StatCard label="Total Requests" value={requests.length} sub="All time" color="var(--blue)"/>
        <StatCard label="In Review" value={pending.length} sub={`${sensitive.filter(r=>r.status==='in_review').length} SENSITIVE`} color="var(--navy-mid)"/>
        <StatCard label="Approved" value={approved.length} sub="Avg. 4.2 days" color="var(--green)"/>
        <StatCard label="Overdue / Issues" value={overdue.length + returned.length + reclassify.length} sub={`${overdue.length} overdue · ${returned.length} returned · ${reclassify.length} reclassify`} color="var(--red)"/>
      </div>

      {/* Flags */}
      {(reclassify.length > 0 || overdue.length > 0) && (
        <div style={{ marginBottom:20, display:'flex', flexDirection:'column', gap:10 }}>
          {reclassify.map(r=>(
            <InfoBox key={r.id} type="warning">
              <strong>Reclassification pending — {r.id}:</strong> {r.reclassifyFlag?.flaggedBy} suggests {r.classification} → <Badge type={r.reclassifyFlag?.suggestedClassification} size="sm">{r.reclassifyFlag?.suggestedClassification}</Badge>. "{r.reclassifyFlag?.reason}"
            </InfoBox>
          ))}
          {overdue.map(r=>(
            <InfoBox key={r.id} type="error">
              <strong>SLA breach — {r.id} {r.name}:</strong> {Object.entries(r.stepStatuses).filter(([,ss])=>ss.status==='active'&&ss.deadline&&daysFromToday(ss.deadline)<0).map(([k,ss])=>`${k} overdue by ${Math.abs(daysFromToday(ss.deadline))}d (${ss.assignee||'unassigned'})`).join('; ')}
            </InfoBox>
          ))}
        </div>
      )}

      {/* Pipeline by classification */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:24 }}>
        {['OFFICIAL','SENSITIVE'].map(cl=>{
          const reqs = requests.filter(r=>r.classification===cl);
          const inR  = reqs.filter(r=>r.status==='in_review').length;
          const app  = reqs.filter(r=>r.status==='approved').length;
          return (
            <Card key={cl} style={{ padding:18 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <Badge type={cl}>{cl}</Badge>
                <span style={{ fontSize:13, color:'var(--gray-5)' }}>{reqs.length} total</span>
              </div>
              <div style={{ display:'flex', gap:0, borderRadius:6, overflow:'hidden', height:10, background:'var(--gray-2)', marginBottom:10 }}>
                {app>0 && <div style={{ width:`${(app/reqs.length)*100}%`, background:'var(--green)' }}/>}
                {inR>0 && <div style={{ width:`${(inR/reqs.length)*100}%`, background:'var(--blue)' }}/>}
              </div>
              <div style={{ display:'flex', gap:16, fontSize:12, color:'var(--gray-5)' }}>
                <span><span style={{ color:'var(--green)', fontWeight:700 }}>■</span> {app} approved</span>
                <span><span style={{ color:'var(--blue)', fontWeight:700 }}>■</span> {inR} in review</span>
                <span><span style={{ color:'var(--gray-4)', fontWeight:700 }}>■</span> {reqs.length-app-inR} other</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* All requests table */}
      <Card style={{ overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--gray-2)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:700, fontSize:14 }}>All Requests</div>
          <Btn size="sm" variant="secondary">Export CSV</Btn>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--gray-1)' }}>
                {['Reference','Dataset','Classification','Requester','Submitted','Status',''].map(h=>(
                  <th key={h} style={{ padding:'9px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--gray-5)', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((r,i)=>{
                const isOverdueRow = Object.values(r.stepStatuses).some(ss=>ss.status==='active'&&ss.deadline&&daysFromToday(ss.deadline)<0);
                return (
                  <React.Fragment key={r.id}>
                    <tr style={{ borderTop:'1px solid var(--gray-2)', background: isOverdueRow?'#FFF8F8':i%2===0?'#fff':'var(--gray-1)', cursor:'pointer' }} onClick={()=>setExpandId(expandId===r.id?null:r.id)}>
                      <td style={{ padding:'10px 16px', fontFamily:'IBM Plex Mono,monospace', fontSize:12, color:'var(--blue)', whiteSpace:'nowrap' }}>{r.id}</td>
                      <td style={{ padding:'10px 16px', fontSize:13, fontWeight:500, maxWidth:220 }}><div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:220 }}>{r.name}</div></td>
                      <td style={{ padding:'10px 16px' }}><Badge type={r.classification} size="sm">{r.classification}</Badge></td>
                      <td style={{ padding:'10px 16px', fontSize:13, whiteSpace:'nowrap' }}>{r.requester}</td>
                      <td style={{ padding:'10px 16px', fontSize:12, color:'var(--gray-5)', whiteSpace:'nowrap' }}>{r.submitted}</td>
                      <td style={{ padding:'10px 16px' }}><Badge type={r.status} size="sm">{r.status.replace('_',' ')}</Badge>{isOverdueRow&&<span style={{ marginLeft:6 }}><Badge type="overdue" size="sm">OVERDUE</Badge></span>}</td>
                      <td style={{ padding:'10px 16px', fontSize:12, color:'var(--gray-5)' }}>{expandId===r.id?'▲':'▼'}</td>
                    </tr>
                    {expandId===r.id && (
                      <tr style={{ borderTop:'1px solid var(--gray-2)' }}>
                        <td colSpan={7} style={{ padding:'12px 20px', background:'#F9F9F9' }}>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:20 }}>
                            <div>
                              <div style={{ fontSize:13, color:'var(--gray-6)', lineHeight:1.6, marginBottom:10 }}>{r.description}</div>
                              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'4px 16px' }}>
                                {[['PII',r.containsPii?'Yes':'No'],['Retention',r.legal?.retention],['Disposal',r.legal?.disposal],['Format',r.ingestion?.dataFormat],['Target',r.ingestion?.targetEnv],['Urgency',r.urgency]].map(([k,v])=><KV key={k} label={k} value={v}/>)}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize:11, fontWeight:700, color:'var(--gray-5)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Chain Status</div>
                              <ChainDisplay chain={r.chain} stepStatuses={r.stepStatuses} compact={true}/>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

Object.assign(window, { AdminView, StatCard });
