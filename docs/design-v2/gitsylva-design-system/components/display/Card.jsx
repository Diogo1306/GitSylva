import React from 'react';
export function Card({ pad = 18, children, style }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-card)', background: 'var(--panel)',
      padding: pad, boxSizing: 'border-box', ...style }}>{children}</div>
  );
}
