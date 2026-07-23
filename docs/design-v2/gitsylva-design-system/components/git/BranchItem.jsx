import React from 'react';
/** Sidebar branch row. lane picks color; current = filled dot + bold. */
export function BranchItem({ name, lane = 0, current, onClick, onContextMenu, style }) {
  return (
    <div onClick={onClick} onContextMenu={onContextMenu}
      style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 10px', borderRadius: 'var(--r-btn)',
        fontSize: 'var(--fs-sm)', fontFamily: 'var(--font-mono)', cursor: 'pointer',
        color: current ? 'var(--text)' : 'var(--text2)', fontWeight: current ? 'var(--fw-semibold)' : 'var(--fw-regular)', ...style }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', boxSizing: 'border-box', flexShrink: 0,
        background: current ? 'var(--l'+lane+')' : 'transparent', border: '1.5px solid var(--l'+lane+')' }} />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
    </div>
  );
}
