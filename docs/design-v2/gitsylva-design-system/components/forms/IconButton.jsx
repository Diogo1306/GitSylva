import React from 'react';

export function IconButton({ size = 30, title, active, children, style, ...rest }) {
  const base = {
    display: 'grid', placeItems: 'center', width: size, height: size, boxSizing: 'border-box',
    borderRadius: 'var(--r-btn)', border: '1px solid var(--btnB)', background: active ? 'var(--sel)' : 'var(--btn)',
    color: 'var(--btnT)', cursor: 'pointer', fontSize: 14,
    transition: 'transform var(--dur-micro) var(--ease-std), background var(--dur-micro) var(--ease-std)',
  };
  return (
    <button title={title} onMouseEnter={(e)=>{e.currentTarget.style.transform='translateY(var(--lift))';e.currentTarget.style.background='var(--hover)';}} onMouseLeave={(e)=>{e.currentTarget.style.transform='none';e.currentTarget.style.background=active?'var(--sel)':'var(--btn)';}} style={{ ...base, ...style }} {...rest}>{children}</button>
  );
}
