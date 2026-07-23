import React from 'react';
/** Top-right card for git results. Pass closing=true to play the exit animation before unmount. */
export function Notification({ title, sub, dot = 'var(--leaf)', closing, onClose, style }) {
  return (
    <div style={{ position: 'fixed', bottom: 88, right: 44, zIndex: 72, width: 310, background: 'var(--win)',
      border: '1px solid var(--border)', borderRadius: 'var(--r-card)', boxShadow: '0 16px 50px rgba(0,0,0,0.3)',
      padding: '13px 15px', display: 'flex', gap: 11, alignItems: 'flex-start', fontFamily: 'var(--font)',
      animation: (closing ? 'gs-notif-out 0.32s var(--ease-out)' : 'gs-notif-in 0.35s var(--ease-pop)') + ' both', ...style }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: dot, marginTop: 4, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-semibold)', color: 'var(--text)' }}>{title}</div>
        {sub && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
      </div>
      {onClose && <div onClick={onClose} style={{ width: 20, height: 20, borderRadius: 'var(--r-sm)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--muted)', fontSize: 11, flexShrink: 0 }}>✕</div>}
    </div>
  );
}
