import React from 'react';
/** File status: A(dded) / M(odified) / D(eleted). */
export function StatusBadge({ status = 'M', style }) {
  const map = { A: ['var(--stAB)','var(--stAT)'], M: ['var(--stMB)','var(--stMT)'], D: ['var(--stDB)','var(--stDT)'] };
  const [bg, color] = map[status] || map.M;
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: 16, height: 16, borderRadius: 'var(--r-xs)',
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 'var(--fw-bold)', background: bg, color, flexShrink: 0, ...style }}>{status}</span>
  );
}
