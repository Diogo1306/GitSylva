import React from 'react';
/** kind: 'hunk' | 'context' | 'add' | 'del' */
export function DiffLine({ kind = 'context', children, style }) {
  const map = {
    hunk: { background: 'var(--dhB)', color: 'var(--dhT)' },
    context: { background: 'transparent', color: 'var(--dcT)' },
    add: { background: 'var(--daB)', color: 'var(--daT)' },
    del: { background: 'var(--ddB)', color: 'var(--ddT)' },
  };
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 'var(--lh-mono)',
      padding: '0 14px', whiteSpace: 'pre', ...map[kind], ...style }}>{children}</div>
  );
}
