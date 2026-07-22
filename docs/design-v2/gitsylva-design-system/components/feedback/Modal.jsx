import React from 'react';
/** Centered dialog with scrim. */
export function Modal({ title, children, onClose, actionLabel, onAction, danger, cancelLabel = 'Cancelar', width = 460 }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', display: 'grid', placeItems: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width, boxSizing: 'border-box', background: 'var(--win)',
        border: '1px solid var(--border)', borderRadius: 'var(--r-win)', boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        padding: 20, display: 'flex', flexDirection: 'column', gap: 14, fontFamily: 'var(--font)', color: 'var(--text)',
        animation: 'gs-pop var(--dur-panel) var(--ease-pop) both' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 'var(--fw-bold)', flex: 1 }}>{title}</div>
          <div onClick={onClose} style={{ width: 26, height: 26, borderRadius: 'var(--r-md)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--muted)', fontSize: 14 }}>✕</div>
        </div>
        {children}
        {actionLabel && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 2 }}>
            <button onClick={onClose} style={{ padding: '8px 14px', borderRadius: 'var(--r-lg)', background: 'var(--btn)', border: '1px solid var(--btnB)', color: 'var(--btnT)', fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>{cancelLabel}</button>
            <button onClick={onAction} style={{ padding: '8px 16px', borderRadius: 'var(--r-lg)', background: danger ? '#C25555' : 'var(--accent)', color: danger ? '#fff' : 'var(--accentT)', fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-bold)', border: 'none', cursor: 'pointer' }}>{actionLabel}</button>
          </div>
        )}
      </div>
    </div>
  );
}
