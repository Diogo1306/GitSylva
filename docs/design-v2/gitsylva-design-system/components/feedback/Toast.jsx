import React from 'react';
/** Bottom-center pill confirmation. */
export function Toast({ children, style }) {
  return (
    <div style={{ position: 'fixed', left: '50%', bottom: 30, transform: 'translateX(-50%)', zIndex: 70,
      background: 'var(--text)', color: 'var(--win)', padding: '10px 18px', borderRadius: 'var(--r-pill)',
      fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-semibold)', fontFamily: 'var(--font)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.3)', whiteSpace: 'nowrap',
      animation: 'gs-fade-up var(--dur-ui) var(--ease-pop) both', ...style }}>{children}</div>
  );
}
