import React from 'react';

export function Button({ variant = 'secondary', size = 'md', disabled, loading, iconLeft, iconRight, children, style, ...rest }) {
  const pad = size === 'sm' ? '6px 11px' : size === 'lg' ? '10px 18px' : '7px 13px';
  const fs = size === 'lg' ? 'var(--fs-base)' : 'var(--fs-btn)';
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)',
    padding: pad, fontSize: fs, fontFamily: 'var(--font)', fontWeight: 'var(--fw-semibold)',
    borderRadius: 'var(--r-btn)', border: '1px solid transparent', cursor: disabled ? 'default' : 'pointer',
    whiteSpace: 'nowrap', boxSizing: 'border-box', opacity: disabled ? 0.55 : 1,
    transition: 'transform var(--dur-micro) var(--ease-std), background var(--dur-micro) var(--ease-std), filter var(--dur-micro) var(--ease-std)',
  };
  const variants = {
    primary: { background: 'var(--accent)', color: 'var(--accentT)' },
    secondary: { background: 'var(--btn)', borderColor: 'var(--btnB)', color: 'var(--btnT)' },
    ghost: { background: 'transparent', color: 'var(--btnT)' },
    danger: { background: '#C25555', color: '#FFFFFF' },
  };
  const onEnter = (e) => { if (!disabled) { e.currentTarget.style.transform = 'translateY(var(--lift))'; if (variant === 'secondary' || variant === 'ghost') e.currentTarget.style.background = 'var(--hover)'; else e.currentTarget.style.filter = 'brightness(1.06)'; } };
  const onLeave = (e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.filter = 'none'; e.currentTarget.style.background = variants[variant].background; };
  return (
    <button disabled={disabled} onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ ...base, ...variants[variant], ...style }} {...rest}>
      {loading && <span style={{ display: 'inline-block', animation: 'gs-spin 0.8s linear infinite' }}>⟳</span>}
      {!loading && iconLeft}{children}{iconRight}
    </button>
  );
}
