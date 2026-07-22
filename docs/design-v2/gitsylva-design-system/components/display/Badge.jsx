import React from 'react';
export function Badge({ tone = 'neutral', children, style }) {
  const tones = {
    neutral: { background: 'var(--badge)', color: 'var(--badgeT)' },
    accent: { background: 'var(--accent)', color: 'var(--accentT)' },
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 'var(--r-pill)',
      fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-bold)', padding: '1px 7px', ...tones[tone], ...style }}>{children}</span>
  );
}
