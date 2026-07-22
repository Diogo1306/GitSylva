import React from 'react';

export function Input({ mono, style, ...rest }) {
  return (
    <input
      style={{
        background: 'var(--input)', border: '1px solid var(--btnB)', borderRadius: 'var(--r-lg)',
        padding: '9px 12px', fontSize: 'var(--fs-sm)', color: 'var(--text)', outline: 'none',
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font)', boxSizing: 'border-box', width: '100%',
        transition: 'border-color var(--dur-micro) var(--ease-std)',
      }}
      onFocus={(e)=>e.currentTarget.style.borderColor='var(--accent)'}
      onBlur={(e)=>e.currentTarget.style.borderColor='var(--btnB)'}
      {...rest}
    />
  );
}
