import React from 'react';
/** Initials avatar. tone: AS/MD/LF map to author token colors, or pass a color. */
export function Avatar({ initials, tone = 'AS', size = 22, color, style }) {
  const bg = color ? color + '26' : 'var(--au' + tone + 'b)';
  const fg = color || 'var(--au' + tone + ')';
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: '50%',
      fontSize: size < 26 ? 9.5 : 12, fontWeight: 'var(--fw-bold)', background: bg, color: fg, flexShrink: 0, ...style }}>{initials}</span>
  );
}
