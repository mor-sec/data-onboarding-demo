// portal/ui.jsx — shared UI primitives
const { useState, useEffect, useRef } = React;

const Badge = ({ type, children, size = 'md' }) => {
  const map = {
    OFFICIAL:            { bg: '#D8EDFF', color: '#014486', border: '#9FD4FC' },
    SENSITIVE:           { bg: '#FEF3E2', color: '#7A4504', border: '#FDD89B' },
    approved:            { bg: '#EEF4EB', color: '#2E844A', border: '#A8D5B5' },
    approved_conditions: { bg: '#FFFDE7', color: '#A86403', border: '#FFE082' },
    pending:             { bg: '#F3F2F2', color: '#706E6B', border: '#C9C7C5' },
    active:              { bg: '#E8F4FC', color: '#014486', border: '#9FD4FC' },
    rejected:            { bg: '#FEF1EE', color: '#BA0517', border: '#F5B3A9' },
    returned:            { bg: '#FEF1EE', color: '#BA0517', border: '#F5B3A9' },
    reclassify_pending:  { bg: '#FEF3E2', color: '#7A4504', border: '#FDD89B' },
    in_review:           { bg: '#E8F4FC', color: '#014486', border: '#9FD4FC' },
    skipped:             { bg: '#F3F2F2', color: '#B0B0B0', border: '#E0E0E0' },
    overdue:             { bg: '#FEF1EE', color: '#BA0517', border: '#F5B3A9' },
    high:                { bg: '#FEF1EE', color: '#BA0517', border: '#F5B3A9' },
    standard:            { bg: '#F3F2F2', color: '#706E6B', border: '#C9C7C5' },
    low:                 { bg: '#EEF4EB', color: '#2E844A', border: '#A8D5B5' },
  };
  const s = map[type] || map.standard;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: size === 'sm' ? '2px 8px' : '3px 10px', borderRadius: 12,
      fontSize: size === 'sm' ? 11 : 12, fontWeight: 600, letterSpacing: '0.03em',
      display: 'inline-block', whiteSpace: 'nowrap',
    }}>{children}</span>
  );
};

const Card = ({ children, style = {}, onClick, selected }) => (
  <div onClick={onClick} style={{
    background: '#fff', borderRadius: 8,
    boxShadow: '0 1px 3px rgba(0,0,0,.1)',
    border: `1px solid ${selected ? 'var(--blue)' : '#E5E5E5'}`,
    outline: selected ? '1px solid var(--blue)' : 'none',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'border .15s',
    ...style,
  }}>{children}</div>
);

const Btn = ({ variant = 'primary', children, onClick, disabled, style = {}, size = 'md', icon }) => {
  const sizes = { sm: { padding: '5px 12px', fontSize: 13 }, md: { padding: '8px 18px', fontSize: 14 }, lg: { padding: '11px 24px', fontSize: 15 } };
  const variants = {
    primary:   { background: 'var(--blue)', color: '#fff', border: 'none' },
    secondary: { background: '#fff', color: 'var(--blue)', border: '1px solid var(--blue)' },
    danger:    { background: 'var(--red)', color: '#fff', border: 'none' },
    ghost:     { background: 'transparent', color: 'var(--gray-5)', border: '1px solid var(--gray-3)' },
    success:   { background: 'var(--green)', color: '#fff', border: 'none' },
    warning:   { background: '#A86403', color: '#fff', border: 'none' },
  };
  return (
    <button disabled={disabled} onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      borderRadius: 4, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'opacity .15s', fontFamily: 'IBM Plex Sans, sans-serif',
      opacity: disabled ? 0.5 : 1, ...sizes[size], ...variants[variant], ...style,
    }}>
      {icon && <span style={{ fontSize: 15 }}>{icon}</span>}{children}
    </button>
  );
};

const FieldLabel = ({ children, required }) => (
  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 5 }}>
    {children}{required && <span style={{ color: 'var(--red)', marginLeft: 3 }}>*</span>}
  </label>
);

const Input = ({ value, onChange, placeholder, type = 'text', rows, disabled, style = {} }) => {
  const base = {
    width: '100%', padding: '8px 12px', border: '1px solid var(--gray-3)', borderRadius: 4,
    fontSize: 14, color: 'var(--navy)', background: disabled ? '#F9F9F9' : '#fff',
    outline: 'none', fontFamily: 'IBM Plex Sans, sans-serif', ...style,
  };
  return rows
    ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} disabled={disabled} style={{ ...base, resize: 'vertical', lineHeight: 1.5 }} />
    : <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} style={base} />;
};

const Select = ({ value, onChange, options, disabled }) => (
  <select value={value} onChange={onChange} disabled={disabled} style={{
    width: '100%', padding: '8px 12px', border: '1px solid var(--gray-3)', borderRadius: 4,
    fontSize: 14, color: 'var(--navy)', background: disabled ? '#F9F9F9' : '#fff',
    outline: 'none', fontFamily: 'IBM Plex Sans, sans-serif',
  }}>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const Toggle = ({ checked, onChange, label }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
    <div onClick={() => onChange(!checked)} style={{
      width: 36, height: 20, borderRadius: 10,
      background: checked ? 'var(--blue)' : 'var(--gray-4)',
      position: 'relative', transition: 'background .2s', flexShrink: 0,
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, left: checked ? 18 : 2,
        transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      }} />
    </div>
    {label && <span style={{ fontSize: 14, color: 'var(--gray-6)' }}>{label}</span>}
  </label>
);

const Checkbox = ({ checked, onChange, label, sublabel }) => (
  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
    <div onClick={() => onChange(!checked)} style={{
      width: 16, height: 16, borderRadius: 3,
      border: `2px solid ${checked ? 'var(--blue)' : 'var(--gray-4)'}`,
      background: checked ? 'var(--blue)' : '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, marginTop: 2, transition: 'all .15s',
    }}>
      {checked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
    </div>
    <div>
      <div style={{ fontSize: 14, color: 'var(--gray-6)' }}>{label}</div>
      {sublabel && <div style={{ fontSize: 12, color: 'var(--gray-5)', marginTop: 1 }}>{sublabel}</div>}
    </div>
  </label>
);

const InfoBox = ({ type = 'info', children }) => {
  const map = {
    info:    { bg: '#E8F4FC', border: '#9FD4FC', icon: 'ℹ', color: '#014486' },
    warning: { bg: '#FEF3E2', border: '#FDD89B', icon: '⚠', color: '#7A4504' },
    success: { bg: '#EEF4EB', border: '#A8D5B5', icon: '✓', color: '#2E844A' },
    error:   { bg: '#FEF1EE', border: '#F5B3A9', icon: '✕', color: '#BA0517' },
  };
  const m = map[type];
  return (
    <div style={{ background: m.bg, border: `1px solid ${m.border}`, borderRadius: 6, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 14, color: m.color, fontWeight: 700, flexShrink: 0 }}>{m.icon}</span>
      <div style={{ fontSize: 13, color: m.color, lineHeight: 1.5 }}>{children}</div>
    </div>
  );
};

const Stepper = ({ steps, current }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
    {steps.map((s, i) => {
      const done = i < current, active = i === current;
      return (
        <React.Fragment key={s}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
              background: done || active ? 'var(--blue)' : '#fff',
              border: `2px solid ${done || active ? 'var(--blue)' : 'var(--gray-3)'}`,
              color: done || active ? '#fff' : 'var(--gray-5)', transition: 'all .2s',
            }}>{done ? '✓' : i + 1}</div>
            <div style={{ fontSize: 10, marginTop: 4, color: active ? 'var(--blue)' : done ? 'var(--gray-5)' : 'var(--gray-4)', fontWeight: active ? 600 : 400, whiteSpace: 'nowrap', textAlign: 'center', maxWidth: 72 }}>{s}</div>
          </div>
          {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: done ? 'var(--blue)' : 'var(--gray-3)', marginBottom: 18, minWidth: 6 }} />}
        </React.Fragment>
      );
    })}
  </div>
);

const Modal = ({ show, onClose, title, children, width = 500 }) => {
  if (!show) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(3,45,96,.35)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, width, maxWidth: '92vw', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,.2)' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--gray-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--gray-5)', lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
};

const SectionHead = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{children}</div>
);

const KV = ({ label, value }) => (
  <div style={{ marginBottom: 8 }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    <div style={{ fontSize: 13, color: 'var(--gray-6)', marginTop: 2 }}>{value || '—'}</div>
  </div>
);

Object.assign(window, { Badge, Card, Btn, Input, Select, Toggle, Checkbox, FieldLabel, InfoBox, Stepper, Modal, SectionHead, KV });
