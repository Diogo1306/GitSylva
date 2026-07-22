import React from 'react';

export function Toggle({ checked, onChange, disabled }) {
  return (
    <div onClick={() => !disabled && onChange && onChange(!checked)}
      style={{ width: 'var(--w-toggle)', height: 'var(--h-toggle)', borderRadius: 'var(--r-pill)',
        background: checked ? 'var(--accent)' : 'var(--btnB)', position: 'relative', flexShrink: 0,
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
        transition: 'background var(--dur-ui) var(--ease-std)' }}>
      <div style={{ position: 'absolute', top: 2, left: checked ? 18 : 2, width: 18, height: 18,
        borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        transition: 'left var(--dur-ui) var(--ease-std)' }} />
    </div>
  );
}
