import React from 'react';
import { Chip } from '../display/Chip.jsx';
import { Avatar } from '../display/Avatar.jsx';

/** One row of the history list (graph cell is rendered separately/left). */
export function CommitRow({ message, chips = [], author, initials, tone, hash, time, merge, selected, onClick, style }) {
  return (
    <div onClick={onClick} style={{ height: 52, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px',
      cursor: 'pointer', boxSizing: 'border-box', background: selected ? 'var(--sel)' : 'transparent',
      borderBottom: '1px solid var(--bsoft)', transition: 'background var(--dur-ui) var(--ease-std)', ...style }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 'var(--fs-base)', color: merge ? 'var(--text2)' : 'var(--text)',
          fontWeight: merge ? 'var(--fw-regular)' : 'var(--fw-medium)', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{message}</span>
        {chips.map((c, i) => <Chip key={i} {...c} />)}
      </div>
      <Avatar initials={initials} tone={tone} />
      <div style={{ width: 66, fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-mono)', color: 'var(--text2)', flexShrink: 0 }}>{hash}</div>
      <div style={{ width: 96, fontSize: 'var(--fs-xs)', color: 'var(--muted)', textAlign: 'right', flexShrink: 0 }}>{time}</div>
    </div>
  );
}
