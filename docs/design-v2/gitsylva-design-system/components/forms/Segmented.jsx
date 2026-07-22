import React from 'react';

export function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 'var(--r-lg)',
      background: 'var(--panel2)', border: '1px solid var(--border)' }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <div key={o.value} onClick={() => onChange && onChange(o.value)}
            style={{ padding: '6px 14px', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)',
              fontWeight: 'var(--fw-semibold)', cursor: 'pointer',
              background: on ? 'var(--win)' : 'transparent', color: on ? 'var(--text)' : 'var(--muted)',
              transition: 'background var(--dur-micro) var(--ease-std)' }}>{o.label}</div>
        );
      })}
    </div>
  );
}
