import React from 'react';
/** Branch/tag chip. lane 0=main,1,2; tag renders as an outlined pill. */
export function Chip({ label, lane = 0, tag, style }) {
  const s = tag
    ? { color: 'var(--text2)', background: 'transparent', borderColor: 'var(--tagbd)' }
    : { color: 'var(--l'+lane+')', background: 'var(--l'+lane+'bg)', borderColor: 'var(--l'+lane+'bd)' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-mono)',
      fontSize: '10.5px', padding: '2px 8px', borderRadius: 'var(--r-pill)', whiteSpace: 'nowrap',
      border: '1px solid ' + s.borderColor, color: s.color, background: s.background, ...style }}>{label}</span>
  );
}
