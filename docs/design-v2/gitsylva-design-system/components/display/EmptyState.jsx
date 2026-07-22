import React from 'react';
export function EmptyState({ children, style }) {
  return (
    <div style={{ border: '1px dashed var(--btnB)', borderRadius: 'var(--r-card)', padding: '28px 20px',
      textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--fs-base)', ...style }}>{children}</div>
  );
}
