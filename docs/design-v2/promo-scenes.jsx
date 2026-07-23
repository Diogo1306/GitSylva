// GitSylva Promo — faithful to the shipped v0.1.0: real TreeLogo geometry, real splash,
// real onboarding (Bem-vindo / Personaliza o teu jardim), real tokens (Inter, #82c99b).
/* global React, SceneStage, useScene, Easing, useTweaks, TweaksPanel, TweakSection, TweakToggle */

(() => {
  const E = window.Easing || {};
  const easeOut = E.cubicOut || ((t) => 1 - Math.pow(1 - t, 3));
  const easeInOut = E.cubicInOut || ((t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2));
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const seg = (p, a, b, ease) => (ease || easeOut)(clamp01((p - a) / (b - a)));
  const lerp = (a, b, k) => a + (b - a) * k;
  // gentle scene-edge dissolve (in over first 9%, out over last 8%)
  const fadeIO = (p) => seg(p, 0, 0.09, easeInOut) * (1 - seg(p, 0.92, 1, easeInOut));

  // ——— real v0.1.0 tokens (src/theme/tokens.css) ———
  const WIN = '#141618', PANEL = '#101214', PANEL2 = '#0c0e10', BORDER = '#272b2e', BG = '#0b0c0d';
  const INK = '#eaecee', TEXT2 = '#a5acb2', MUTED = '#7b838b';
  const BTN = '#1b1e21', BTNB = '#2d3134', BTNT = '#c8cdd2';
  const GREEN = '#82c99b', BLUE = '#7fa6d9', AMBER = '#d9a96b';
  const DESK = 'radial-gradient(120% 90% at 50% 0%, #1b1d1f 0%, #0b0c0d 62%)';
  const FONT = "'Inter', sans-serif", MONO = "'JetBrains Mono', monospace", LOGO = "'Space Grotesk', sans-serif";

  // ————— real TreeLogo geometry (ported from src/components/TreeLogo.tsx) —————
  const bez = (s, t) => {
    const u = 1 - t;
    return [
      u * u * u * s[0][0] + 3 * u * u * t * s[1][0] + 3 * u * t * t * s[2][0] + t * t * t * s[3][0],
      u * u * u * s[0][1] + 3 * u * u * t * s[1][1] + 3 * u * t * t * s[2][1] + t * t * t * s[3][1],
    ];
  };
  function taperD(segs, w0, w1) {
    const pts = [];
    const N = 14;
    segs.forEach((s, si) => { for (let i = si === 0 ? 0 : 1; i <= N; i++) pts.push(bez(s, i / N)); });
    const left = [], right = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const w = (w0 + (w1 - w0) * (i / (pts.length - 1))) / 2;
      left.push([pts[i][0] + nx * w, pts[i][1] + ny * w]);
      right.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
    }
    const fmt = (p) => p[0].toFixed(1) + ',' + p[1].toFixed(1);
    return 'M' + left.map(fmt).join(' L') + ' L' + right.reverse().map(fmt).join(' L') + ' Z';
  }
  // p-driven appearance: element with design delay d becomes visible over p ∈ [d*0.85, d*0.85+0.16]
  const vis = (p, d) => seg(p, d * 0.85, d * 0.85 + 0.16);

  // S da logo em traço limpo (a logo atual — igual ao site e ao app)
  function treeKids(p, kb) {
    const el = React.createElement;
    const S = (d, sw, dd, k) => el('path', {
      key: kb + k, d, fill: 'none', stroke: GREEN, strokeWidth: sw, strokeLinecap: 'round',
      pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - vis(p, dd),
    });
    const node = (cx, cy, r, dd, filled, k) => el('circle', {
      key: kb + k, cx, cy, r, fill: filled ? GREEN : WIN, stroke: GREEN, strokeWidth: 4,
      opacity: vis(p, dd), transform: `scale(${0.3 + 0.7 * vis(p, dd)})`, style: { transformBox: 'fill-box', transformOrigin: 'center' },
    });
    const leafEl = (x, y, rot, s, dd, k) => el('g', { key: kb + k, transform: `translate(${x},${y}) rotate(${rot}) scale(${s})`, opacity: vis(p, dd) },
      el('path', { d: 'M0,0 Q5,-4.5 10.5,-1 Q5.5,3.5 0,0 Z', fill: GREEN, opacity: 0.95 }));
    return [
      S('M34,12 C31,4 14,4 13,14 C12,24 33,32 33,44 C34,56 13,58 12,48', 7, 0.05, 's'),
      S('M26,32 C31,34 35,37 38,41', 4.5, 0.4, 'b1'),
      S('M13.5,13.5 C10,10.5 7.5,7.5 5,4.5', 4, 0.5, 'b2'),
      S('M28,51 C31.5,53.5 34,55.5 36.5,58', 4, 0.58, 'b3'),
      node(34, 12, 4, 0.62, false, 'n1'),
      node(12, 48, 4, 0.66, false, 'n2'),
      node(38, 41, 3.2, 0.7, true, 'n3'),
      node(5, 4.5, 3, 0.74, true, 'n4'),
      leafEl(36, 57, -25, 0.85, 0.8, 'l1'),
      leafEl(9, 9, -60, 0.7, 0.85, 'l2'),
      leafEl(30, 6, -110, 0.6, 0.9, 'l3'),
    ];
  }

  function TreeLogo({ p = 1, size, crop = true, xScale = 1.22 }) {
    const vbH = crop ? 52 : 62;
    const width = Math.round((size * 46) / vbH) * xScale;
    return (
      <svg viewBox={`0 0 46 ${vbH}`} width={width} height={size} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
        {treeKids(p, 'tl')}
      </svg>
    );
  }

  // onboarding: o S limpo da logo (traço) cresce por estágios — igual ao Floresta v2
  function OnboardTree({ p = 1, stage = 0, w, h }) {
    const el = React.createElement;
    const S = (d, sw, dd, k) => el('path', {
      key: k, d, fill: 'none', stroke: GREEN, strokeWidth: sw, strokeLinecap: 'round',
      pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - vis(p, dd),
    });
    const nodeE = (cx, cy, r, dd, filled, k) => el('circle', {
      key: k, cx, cy, r, fill: filled ? GREEN : WIN, stroke: GREEN, strokeWidth: 3.2,
      opacity: vis(p, dd), transform: `scale(${0.3 + 0.7 * vis(p, dd)})`, style: { transformBox: 'fill-box', transformOrigin: 'center' },
    });
    const leafE = (x, y, rot, s, dd, k) => el('g', { key: k, transform: `translate(${x},${y}) rotate(${rot}) scale(${s})`, opacity: vis(p, dd) },
      el('path', { d: 'M0,0 Q5,-4.5 10.5,-1 Q5.5,3.5 0,0 Z', fill: GREEN, opacity: 0.95 }));
    const tuftE = (x, y, rot, s, dd, k) => el('g', { key: k, transform: `translate(${x},${y}) rotate(${rot}) scale(${s})`, opacity: vis(p, dd) },
      [[-44, 0.8], [0, 1], [42, 0.78]].map(([dr, ds], i) =>
        el('g', { key: i, transform: `rotate(${dr}) scale(${ds})` },
          el('path', { d: 'M0,0 Q5,-4.5 10.5,-1 Q5.5,3.5 0,0 Z', fill: GREEN, opacity: 0.95 }))));
    const kids = [el('g', { key: 'base', transform: 'translate(12, 46)' },
      S('M34,12 C31,4 14,4 13,14 C12,24 33,32 33,44 C34,56 13,58 12,48', 7, 0.05, 's'),
      S('M26,32 C31,34 35,37 38,41', 4.5, 0.42, 'b1'),
      S('M13.5,13.5 C10,10.5 7.5,7.5 5,4.5', 4, 0.52, 'b2'),
      S('M28,51 C31.5,53.5 34,55.5 36.5,58', 4, 0.6, 'b3'),
      nodeE(12, 48, 3.6, 0.66, false, 'n0'),
      nodeE(38, 41, 3, 0.7, true, 'n1'),
      nodeE(5, 4.5, 2.8, 0.76, true, 'n2'),
      leafE(36, 57, -25, 0.8, 0.8, 'l1'),
      leafE(9, 9, -60, 0.65, 0.85, 'l2'))];
    if (stage === 0) kids.push(el('g', { key: 'cap', transform: 'translate(12, 46)' },
      nodeE(34, 12, 3.8, 0.68, false, 'cn'), leafE(30, 6, -110, 0.55, 0.88, 'cl')));
    if (stage >= 1) kids.push(el('g', { key: 'ext' },
      S('M46,58 C50,48 47,40 42,32', 4.5, 0.12, 'e1'),
      S('M45,44 C41,40 36,37 31,34', 2.6, 0.38, 'e2'),
      tuftE(31, 34, -150, 0.8, 0.52, 'et'),
      nodeE(42, 32, 3.4, 0.6, false, 'en'),
      leafE(49, 50, 15, 0.6, 0.68, 'el')));
    if (stage >= 2) kids.push(el('g', { key: 'cr' },
      S('M43,40 C50,37 57,35 63,31', 2.4, 0.18, 'f1'),
      S('M42,31 C44,27 46,24 49,21', 2.2, 0.32, 'f2'),
      S('M42,32 C38,27 34,24 29,21', 2, 0.42, 'f3'),
      tuftE(66, 32, -35, 0.85, 0.5, 'ft1'),
      tuftE(49, 21, -80, 0.95, 0.62, 'ft2'),
      tuftE(29, 21, -130, 0.8, 0.72, 'ft3'),
      nodeE(63, 31, 2.6, 0.68, true, 'fn'),
      leafE(54, 36, -60, 0.6, 0.78, 'fl1'),
      leafE(38, 34, 150, 0.55, 0.84, 'fl2')));
    return el('svg', { viewBox: '0 0 84 112', width: w, height: h, style: { display: 'block', overflow: 'visible' } }, kids);
  }

  function Wordmark({ size = 20, p = 1 }) {
    // proporção do splash do app: S = 71% do corpo da letra, assente na baseline
    const tree = Math.round(size * 0.71);
    return (
      <div style={{ display: 'flex', alignItems: 'baseline', fontFamily: LOGO, fontWeight: 600, fontSize: size, letterSpacing: '0.3px', color: INK }}>
        <span>git</span>
        <span style={{ display: 'inline-block', margin: '0 2px' }}>
          <TreeLogo p={p} size={tree} />
        </span>
        <span>ylva</span>
      </div>
    );
  }

  function Cursor({ x, y, click = 0 }) {
    return (
      <div style={{ position: 'absolute', left: x, top: y, zIndex: 40, pointerEvents: 'none', transform: `scale(${1 - 0.18 * click})`, transformOrigin: '4px 4px' }}>
        <svg width="22" height="24" viewBox="0 0 22 24"><path d="M3,2 L3,19 L7.5,15 L10.5,21.5 L13.5,20 L10.5,13.8 L17,13.5 Z" fill="#FFFFFF" stroke="#000" strokeWidth="1.2" /></svg>
        {click > 0 && <div style={{ position: 'absolute', left: -8, top: -8, width: 26, height: 26, borderRadius: '50%', border: `2px solid ${GREEN}`, opacity: 1 - click, transform: `scale(${0.5 + click})` }} />}
      </div>
    );
  }

  const btnS = (primary, extra) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 30, padding: '0 13px', boxSizing: 'border-box', borderRadius: 8, whiteSpace: 'nowrap', fontFamily: FONT, fontSize: 12.5, fontWeight: 600, background: primary ? INK : BTN, color: primary ? '#111315' : BTNT, border: primary ? 'none' : `1px solid ${BTNB}`, ...extra });

  // ————— the app window (recreated from the shipped screenshot) —————
  function AppUI({ s }) {
    const rows = s.rows;
    const laneX = (l) => 24 + l * 16;
    const rowH = 44;
    const nodes = [], paths = [];
    const byLane = {};
    rows.forEach((r, i) => { (byLane[r.lane] = byLane[r.lane] || []).push(i); });
    Object.entries(byLane).forEach(([l, idxs]) => {
      const x = laneX(+l);
      for (let k = 0; k + 1 < idxs.length; k++) {
        const y1 = idxs[k] * rowH + rowH / 2, y2 = idxs[k + 1] * rowH + rowH / 2;
        paths.push(<line key={`l${l}-${k}`} x1={x} y1={y1} x2={x} y2={y2} stroke={+l === 0 ? GREEN : (+l === 1 ? BLUE : AMBER)} strokeWidth={+l === 0 ? 3 : 2} opacity="0.85" />);
      }
    });
    rows.forEach((r, i) => {
      if (r.curveTo == null) return;
      const x1 = laneX(r.lane), y1 = i * rowH + rowH / 2;
      const x2 = laneX(rows[r.curveTo].lane), y2 = r.curveTo * rowH + rowH / 2;
      paths.push(<path key={`c${i}`} d={`M${x1},${y1} C${x1},${y1 + 24} ${x2},${y2 - 24} ${x2},${y2}`} fill="none" stroke={BLUE} strokeWidth="2" opacity="0.85" />);
    });
    rows.forEach((r, i) => {
      const x = laneX(r.lane), y = i * rowH + rowH / 2;
      const col = r.lane === 0 ? GREEN : r.lane === 1 ? BLUE : AMBER;
      nodes.push(<circle key={`n${i}`} cx={x} cy={y} r={r.merge ? 3.4 : 4.4} fill={r.merge ? col : WIN} stroke={col} strokeWidth="2.2"
        style={r.pop != null ? { transform: `scale(${r.pop})`, transformOrigin: `${x}px ${y}px` } : null} />);
    });

    return (
      <div style={{ width: 1180, height: 660, borderRadius: 10, overflow: 'hidden', background: WIN, border: `1px solid rgba(255,255,255,0.08)`, boxShadow: '0 0 0 1px rgba(0,0,0,0.55), 0 24px 80px rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', fontFamily: FONT, color: INK, position: 'relative' }}>
        {/* titlebar (real layout: wordmark left · actions + window controls right) */}
        <div style={{ height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', background: WIN }}>
          <Wordmark size={15} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginLeft: 10, border: `1px solid ${BTNB}`, borderRadius: 8, padding: '4px 11px', fontSize: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN }} />aurora-app <span style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>develop</span> <span style={{ color: MUTED, fontSize: 8 }}>▾</span>
          </div>
          <div style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${BTNB}`, display: 'grid', placeItems: 'center', color: MUTED, fontSize: 13, marginLeft: 4 }}>+</div>
          <div style={{ flex: 1 }} />
          <div style={btnS(false, { height: 27 })}>↓ Pull</div>
          <div style={btnS(false, { height: 27 })}>↑ Push <span style={{ background: '#262a2e', color: '#aeb5bb', borderRadius: 999, fontSize: 9.5, fontWeight: 700, padding: '0 6px' }}>1</span></div>
          <div style={btnS(false, { height: 27 })}><span style={{ display: 'inline-block', transform: `rotate(${(s.fetchSpin || 0) * 360}deg)` }}>⟳</span> Fetch</div>
          <div style={btnS(false, { height: 27, width: 30, padding: 0, fontFamily: MONO, fontSize: 10.5 })}>&gt;_</div>
          <div style={btnS(false, { height: 27, color: MUTED, fontWeight: 500 })}>Search <span style={{ fontFamily: MONO, fontSize: 9.5, border: `1px solid ${BTNB}`, borderRadius: 4, padding: '0 4px' }}>Ctrl+K</span></div>
          <div style={{ width: 10 }} />
          <span style={{ color: MUTED, fontSize: 13 }}>—</span>
          <span style={{ color: MUTED, fontSize: 11 }}>□</span>
          <span style={{ color: MUTED, fontSize: 12 }}>✕</span>
        </div>
        {/* body */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* sidebar */}
          <div style={{ width: 208, flexShrink: 0, borderRight: `1px solid ${BORDER}`, background: PANEL, padding: '12px 8px', boxSizing: 'border-box', fontSize: 12.5 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: MUTED, padding: '0 8px 6px' }}>WORKSPACE</div>
            {[['Working copy', s.view === 'working', AMBER, 2], ['History', s.view === 'history', GREEN, '50%'], ['Stashes', false, BLUE, 2]].map(([n, on, c, br], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 7, background: on ? 'rgba(234,236,238,0.08)' : 'transparent', color: on ? INK : TEXT2 }}>
                <span style={{ width: 6, height: 6, borderRadius: br, background: c }} />{n}
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 8px 6px' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: MUTED, flex: 1 }}>BRANCHES</span>
              <span style={{ color: s.hl === 'branch' ? GREEN : MUTED, width: 20, height: 20, display: 'grid', placeItems: 'center', borderRadius: 6, boxShadow: s.hl === 'branch' ? '0 0 0 2px rgba(130,201,155,0.55), 0 0 14px rgba(130,201,155,0.3)' : 'none' }}>+</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', fontFamily: MONO, fontSize: 11.5, color: GREEN }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', border: `1.5px solid ${GREEN}`, boxSizing: 'border-box' }} />main
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', fontFamily: MONO, fontSize: 11.5, color: TEXT2, background: s.hl === 'merge' ? 'rgba(234,236,238,0.06)' : 'transparent', borderRadius: 7 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', border: `1.5px solid ${AMBER}`, boxSizing: 'border-box' }} /><span style={{ flex: 1 }}>fix/api</span>
              {s.hl === 'merge' ? <span style={{ fontSize: 9.5, fontWeight: 700, color: GREEN, border: '1px solid rgba(130,201,155,0.4)', background: 'rgba(130,201,155,0.12)', borderRadius: 5, padding: '1px 6px', boxShadow: '0 0 0 2px rgba(130,201,155,0.55), 0 0 14px rgba(130,201,155,0.3)' }}>Merge</span> : null}
            </div>
            {s.newBranch && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', fontFamily: MONO, fontSize: 11.5, color: TEXT2, opacity: s.newBranchIn ?? 1 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', border: `1.5px solid ${BLUE}`, boxSizing: 'border-box' }} />feature/leaves
              </div>
            )}
            {[['fix/', 2], ['feat/', 1], ['integration/', 1]].map(([n, c]) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 8px', fontFamily: MONO, fontSize: 11.5, color: TEXT2 }}>
                <span style={{ color: MUTED, fontSize: 9 }}>▸</span><span style={{ flex: 1 }}>{n}</span>
                <span style={{ background: '#262a2e', color: '#aeb5bb', borderRadius: 999, fontSize: 9.5, fontWeight: 700, padding: '0 6px' }}>{c}</span>
              </div>
            ))}
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: MUTED, padding: '14px 8px 6px' }}>REMOTES</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 8px', fontFamily: MONO, fontSize: 11.5, color: TEXT2 }}>
              <span style={{ color: MUTED, fontSize: 9 }}>▾</span>origin
            </div>
          </div>

          {s.view === 'history' && (
            <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
              <div style={{ flex: 1, position: 'relative', borderRight: `1px solid ${BORDER}`, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' }}>
                  <div style={{ flex: 1, border: `1px solid ${BTNB}`, borderRadius: 8, padding: '6px 10px', fontSize: 12, color: MUTED, background: '#181b1d' }}>Filter history...</div>
                  <span style={{ fontFamily: MONO, fontSize: 10.5, color: MUTED }}>200 commits</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <svg width="60" height={rows.length * rowH} style={{ position: 'absolute', left: 8, top: 0 }}>{paths}{nodes}</svg>
                  {rows.map((r) => (
                    <div key={r.hash} style={{ height: rowH, display: 'flex', alignItems: 'center', gap: 9, padding: '0 12px 0 72px', boxSizing: 'border-box', background: r.sel ? 'rgba(234,236,238,0.07)' : 'transparent', opacity: r.pop != null ? r.pop : 1 }}>
                      <span style={{ flex: 1, fontSize: 12, color: r.merge ? TEXT2 : INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.msg}</span>
                      {r.chips && r.chips.map((c) => <span key={c} style={{ fontFamily: MONO, fontSize: 9, padding: '1px 7px', borderRadius: 999, background: 'rgba(130,201,155,0.12)', border: '1px solid rgba(130,201,155,0.28)', color: GREEN, whiteSpace: 'nowrap' }}>{c}</span>)}
                      <span style={{ width: 18, height: 18, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 8, fontWeight: 700, background: 'rgba(127,166,217,0.15)', color: BLUE, flexShrink: 0 }}>DI</span>
                      <span style={{ fontFamily: MONO, fontSize: 10.5, color: MUTED }}>{r.hash}</span>
                      <span style={{ fontSize: 10.5, color: MUTED, width: 46, textAlign: 'right' }}>{r.time || '5 d ago'}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* detail */}
              <div style={{ width: 310, flexShrink: 0, background: PANEL, padding: 14, boxSizing: 'border-box', opacity: s.detailIn ?? 1, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, background: 'rgba(127,166,217,0.15)', color: BLUE }}>DI</span>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>DiogoEsteves</div>
                    <div style={{ fontSize: 10, color: MUTED }}>7/14/2026, 2:21 PM</div>
                  </div>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontFamily: MONO, fontSize: 11, color: GREEN, background: 'rgba(130,201,155,0.1)', border: '1px solid rgba(130,201,155,0.25)', borderRadius: 6, padding: '2px 8px' }}>{s.selHash}</span>
                </div>
                <div style={{ fontSize: 12.5, marginTop: 10, lineHeight: 1.45 }}>{s.selMsg}</div>
                <div style={{ display: 'flex', gap: 10, fontFamily: MONO, fontSize: 11, marginTop: 8 }}>
                  <span style={{ color: '#a9ddbc' }}>+87</span><span style={{ color: '#e4a3a3' }}>−0</span><span style={{ color: MUTED }}>{s.files.length} files</span>
                </div>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.2, color: MUTED, margin: '14px 0 6px' }}>CHANGED FILES</div>
                {s.files.map((f, i) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 0', opacity: seg(s.filesIn ?? 1, i * 0.18, i * 0.18 + 0.3) }}>
                    <span style={{ width: 14, height: 14, borderRadius: 3, display: 'grid', placeItems: 'center', fontFamily: MONO, fontSize: 8, fontWeight: 700, background: 'rgba(127,166,217,0.15)', color: BLUE }}>md</span>
                    <span style={{ fontFamily: MONO, fontSize: 10.5, color: TEXT2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f}</span>
                    <span style={{ fontFamily: MONO, fontSize: 9.5, color: '#a9ddbc' }}>A</span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0 6px' }}>
                  <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.2, color: MUTED, flex: 1 }}>DIFF</span>
                  <span style={{ display: 'flex', border: `1px solid ${BTNB}`, borderRadius: 7, overflow: 'hidden', fontSize: 10 }}>
                    <span style={{ padding: '2px 8px', background: 'rgba(234,236,238,0.1)', color: INK }}>Unified</span>
                    <span style={{ padding: '2px 8px', color: MUTED }}>Side by side</span>
                  </span>
                </div>
                <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, background: PANEL2, padding: '6px 0', fontFamily: MONO, fontSize: 10, lineHeight: 1.8 }}>
                  {[['diff --git a/docs/CONTRIBUTING.md…', MUTED, 'transparent'], ['@@ -0,0 +1,34 @@', BLUE, 'rgba(127,166,217,0.08)'], ['+# Contributing', '#a9ddbc', 'rgba(130,201,155,0.09)'], ['+## Getting started', '#a9ddbc', 'rgba(130,201,155,0.09)'], ['+Fork and create a branch.', '#a9ddbc', 'rgba(130,201,155,0.09)'], ['+## Commits', '#a9ddbc', 'rgba(130,201,155,0.09)']].map(([t, c, b], i) => (
                    <div key={i} style={{ padding: '0 10px', color: c, background: b, whiteSpace: 'pre', overflow: 'hidden', textOverflow: 'ellipsis', opacity: seg(s.filesIn ?? 1, 0.3 + i * 0.1, 0.45 + i * 0.1) }}>{t}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {s.view === 'working' && (
            <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
              <div style={{ width: 330, flexShrink: 0, borderRight: `1px solid ${BORDER}`, padding: 12, boxSizing: 'border-box' }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.2, color: MUTED, marginBottom: 8 }}>CHANGES · 3</div>
                {[['src/graph/leaves.ts', 'M'], ['src/theme/tokens.css', 'M'], ['assets/leaf.svg', 'A']].map(([f, st], i) => {
                  const on = (s.staged ?? 0) > i;
                  return (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 7 }}>
                      <span style={{ width: 15, height: 15, borderRadius: 4, boxSizing: 'border-box', border: on ? 'none' : `1.5px solid ${BTNB}`, background: on ? GREEN : 'transparent', display: 'grid', placeItems: 'center', color: '#111315', fontSize: 9, fontWeight: 800 }}>{on ? '✓' : ''}</span>
                      <span style={{ width: 14, height: 14, borderRadius: 4, display: 'grid', placeItems: 'center', fontFamily: MONO, fontSize: 9, fontWeight: 700, background: st === 'A' ? 'rgba(130,201,155,0.14)' : 'rgba(217,169,107,0.14)', color: st === 'A' ? '#a9ddbc' : '#dcbe93' }}>{st}</span>
                      <span style={{ fontFamily: MONO, fontSize: 11.5, color: TEXT2 }}>{f}</span>
                    </div>
                  );
                })}
                <div style={{ marginTop: 14, border: `1px solid ${BTNB}`, borderRadius: 8, padding: '8px 10px', fontSize: 12, background: '#181b1d', color: (s.msgTyped || '').length ? INK : MUTED, height: 40 }}>
                  {(s.msgTyped || '') || 'Commit message…'}<span style={{ opacity: s.caret ? 1 : 0, color: GREEN }}>|</span>
                </div>
                <div style={btnS(true, { marginTop: 10, justifyContent: 'center', boxShadow: s.hl === 'commit' ? `0 0 0 2px rgba(130,201,155,0.55), 0 0 16px rgba(130,201,155,0.35)` : 'none' })}>Commit on main{(s.staged ?? 0) > 0 ? <span style={{ background: '#11131522', borderRadius: 999, padding: '0 6px', fontSize: 10.5, marginLeft: 6 }}>{s.staged}</span> : null}</div>
              </div>
              <div style={{ flex: 1, background: PANEL2, padding: '10px 0', fontFamily: MONO, fontSize: 11.5, lineHeight: 1.85 }}>
                {[['@@ -12,4 +12,9 @@ function leafFor(commit) {', BLUE, 'rgba(127,166,217,0.08)'], ['   const lane = commit.lane;', '#8c9399', 'transparent'], ['-  return null;', '#e4a3a3', 'rgba(228,122,122,0.09)'], ['+  const angle = seed(commit.hash) * 360;', '#a9ddbc', 'rgba(130,201,155,0.09)'], ['+  return { angle, size: lane ? 0.8 : 1 };', '#a9ddbc', 'rgba(130,201,155,0.09)'], [' }', '#8c9399', 'transparent']].map(([t, c, b], i) => (
                  <div key={i} style={{ padding: '0 16px', color: c, background: b, whiteSpace: 'pre' }}>{t}</div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* branch modal */}
        {s.modal && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'grid', placeItems: 'center', opacity: s.modalIn }}>
            <div style={{ width: 360, background: WIN, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 18, boxShadow: '0 24px 70px rgba(0,0,0,0.5)', transform: `scale(${0.95 + 0.05 * s.modalIn}) translateY(${(1 - s.modalIn) * 10}px)` }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>New branch</div>
              <div style={{ border: `1px solid ${BTNB}`, borderRadius: 8, padding: '8px 10px', fontFamily: MONO, fontSize: 12.5, background: '#181b1d', color: INK }}>
                {s.typed}<span style={{ opacity: s.caret ? 1 : 0, color: GREEN }}>|</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                <div style={btnS(false, { height: 28 })}>Cancel</div>
                <div style={btnS(true, { height: 28, boxShadow: s.hl === 'create' ? '0 0 0 2px rgba(130,201,155,0.55)' : 'none' })}>Create branch</div>
              </div>
            </div>
          </div>
        )}

        {/* merge modal */}
        {s.mmodal && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'grid', placeItems: 'center', opacity: s.mmodalIn }}>
            <div style={{ width: 360, background: WIN, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 18, boxShadow: '0 24px 70px rgba(0,0,0,0.5)', transform: `scale(${0.95 + 0.05 * s.mmodalIn}) translateY(${(1 - s.mmodalIn) * 10}px)` }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Merge</div>
              <div style={{ fontSize: 12, color: TEXT2, marginBottom: 8 }}>Merge into <span style={{ fontFamily: MONO, color: GREEN }}>main</span> from:</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 9, border: `2px solid ${INK}`, fontFamily: MONO, fontSize: 12.5 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', border: `3.5px solid ${INK}`, boxSizing: 'border-box' }} />fix/api
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                <div style={btnS(false, { height: 28 })}>Cancel</div>
                <div style={btnS(true, { height: 28, boxShadow: s.hl === 'domerge' ? '0 0 0 2px rgba(130,201,155,0.55)' : 'none' })}>Merge</div>
              </div>
            </div>
          </div>
        )}

        {/* notification/toast */}
        {s.notif > 0 && (
          <div style={{ position: 'absolute', right: 14, bottom: 14, width: 250, background: WIN, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 12px', boxShadow: '0 14px 40px rgba(0,0,0,0.5)', display: 'flex', gap: 9, transform: `translateX(${(1 - s.notif) * 30}px)`, opacity: s.notif }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN, marginTop: 4, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{s.notifTitle}</div>
              <div style={{ fontSize: 10.5, color: MUTED, marginTop: 1 }}>{s.notifSub}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function Desk({ scale = 1, ox = 640, oy = 360, children, opacity = 1 }) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: DESK, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', transform: `scale(${scale})`, transformOrigin: `${ox}px ${oy}px`, opacity }}>{children}</div>
      </div>
    );
  }

  // falling leaves (onboarding backdrop)
  function Leaves({ t, n = 6 }) {
    const items = [];
    for (let i = 0; i < n; i++) {
      const speed = 24 + (i % 3) * 8;
      const y = ((t * speed + i * 150) % 840) - 60;
      const x = ((i * 211) % 1280) + Math.sin(t * 0.7 + i) * 28;
      items.push(<path key={i} d="M0,0 Q7,-6 14.5,-1.5 Q7.5,4.5 0,0 Z" fill={GREEN} opacity="0.2" transform={`translate(${x},${y}) rotate(${t * 38 + i * 51})`} />);
    }
    return <svg width="1280" height="720" style={{ position: 'absolute', inset: 0 }}>{items}</svg>;
  }

  const BASE_ROWS = [
    { lane: 0, msg: 'feat(ui): dark theme for the editor', chips: ['main'], hash: '7aadc28', time: '25 min ago' },
    { lane: 0, msg: 'docs: contributing guide', chips: ['origin/main'], hash: 'fa56f6f', sel: true, time: '21 h ago' },
    { lane: 1, msg: 'fix(api): login timeout', chips: [], hash: 'b51dd75', time: '5 d ago' },
    { lane: 0, msg: 'build: dependency cache', hash: '9759558', time: '24 h ago' },
    { lane: 1, msg: 'feat(api): result pagination', hash: '6b83dba', curveTo: 5, time: '5 d ago' },
    { lane: 0, msg: 'perf: 2× faster rendering', hash: '43e5ed0', time: '5 d ago' },
    { lane: 0, msg: 'refactor: sessions module', hash: '1b13134', time: '5 d ago' },
  ];
  const FILES = ['docs/CONTRIBUTING.md', 'docs/CODE_OF_CONDUCT.md', 'docs/STYLEGUIDE.md'];
  const baseState = { view: 'history', rows: BASE_ROWS, selHash: 'fa56f6f', selMsg: 'docs: contributing guide, code of conduct and styleguide', files: FILES, notif: 0 };

  // ————— Scenes —————
  // Splash: real behavior — letters slide in, tree grows, letters hop away leaving the sapling.
  function Splash() {
    const { progress: p } = useScene();
    const letter = (ch, side, d, hd, m) => {
      const inK = seg(p, 0.12 + d, 0.26 + d);
      const hop = seg(p, 0.62 + hd, 0.78 + hd);
      const dir = side === 'L' ? -14 : 14;
      return (
        <span key={ch + d} style={{ display: 'inline-block', marginRight: m === 'r' ? 5 : 0, marginLeft: m === 'l' ? 5 : 0, opacity: inK * (1 - hop), transform: `translate(${(1 - inK) * dir}px, ${-hop * 26}px)` }}>{ch}</span>
      );
    };
    return (
      <div style={{ position: 'absolute', inset: 0, background: DESK, display: 'grid', placeItems: 'center' }}>
        <div style={{ opacity: 1 - seg(p, 0.93, 1, easeInOut), display: 'flex', alignItems: 'baseline', fontFamily: LOGO, fontWeight: 600, fontSize: 78, color: INK, letterSpacing: '0.5px' }}>
          {letter('g', 'L', 0.1, 0.06)}
          {letter('i', 'L', 0.05, 0.03)}
          {letter('t', 'L', 0, 0, 'r')}
          <span style={{ display: 'inline-block' }}>
            <TreeLogo p={seg(p, 0.05, 0.6, (x) => x)} size={55} />
          </span>
          {letter('y', 'R', 0, 0, 'l')}
          {letter('l', 'R', 0.05, 0.03)}
          {letter('v', 'R', 0.1, 0.06)}
          {letter('a', 'R', 0.15, 0.09)}
        </div>
      </div>
    );
  }

  // Login: real onboarding — tree column left, "Bem-vindo" + providers right.
  function Login() {
    const { progress: p, localTime: t } = useScene();
    const inK = seg(p, 0.02, 0.22);
    const providers = [['G', 'Continue with GitHub', 'github.com'], ['GL', 'Continue with GitLab', 'gitlab.com'], ['B', 'Continue with Bitbucket', 'bitbucket.org']];
    return (
      <div style={{ position: 'absolute', inset: 0, background: DESK, display: 'grid', placeItems: 'center', overflow: 'hidden', fontFamily: FONT, color: INK }}>
        <Leaves t={t} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 60, opacity: 1 - seg(p, 0.92, 1, easeInOut), transform: `translateY(${seg(p, 0.92, 1, easeInOut) * -14}px)` }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 262 }}>
            <div style={{ width: 172, height: 229 }}><OnboardTree p={seg(p, 0, 0.5, (x) => x)} stage={0} w={172} h={229} /></div>
            <div style={{ marginTop: 4, opacity: seg(p, 0.2, 0.35) }}><Wordmark size={20} /></div>
            <div style={{ fontSize: 11, color: MUTED, letterSpacing: '1.8px', opacity: seg(p, 0.25, 0.4) }}>SIGN IN</div>
          </div>
          <div style={{ width: 336, display: 'flex', flexDirection: 'column', gap: 8, opacity: inK, transform: `translateY(${(1 - inK) * 14}px)` }}>
            <div style={{ fontSize: 21, fontWeight: 700 }}>Welcome</div>
            <div style={{ fontSize: 13, color: TEXT2, marginBottom: 10, lineHeight: 1.5 }}>Connect your account to sync your repositories, or stay local only.</div>
            {providers.map(([ini, label, sub], i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 15px', borderRadius: 11, background: BTN, border: `1px solid ${BTNB}`, opacity: seg(p, 0.18 + i * 0.08, 0.32 + i * 0.08) }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#262a2e', color: '#aeb5bb', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{ini}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 11, color: MUTED, fontFamily: MONO }}>{sub}</div>
                </div>
                <span style={{ fontSize: 10, color: MUTED, border: `1px solid ${BTNB}`, borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' }}>Coming soon</span>
              </div>
            ))}
            <div style={{ alignSelf: 'flex-start', marginTop: 8, fontSize: 12.5, color: TEXT2, borderBottom: `1px dashed ${BTNB}`, paddingBottom: 1, whiteSpace: 'nowrap', opacity: seg(p, 0.45, 0.6) }}>continue without an account →</div>
          </div>
        </div>
      </div>
    );
  }

  // Setup: real "Personaliza o teu jardim" — tree grows to stage 1.
  function Setup() {
    const { progress: p, localTime: t } = useScene();
    const inK = seg(p, 0.02, 0.22);
    const themes = [['#141618', '#101214', '#82c99b', 'Batman', true], ['#ffffff', '#fafaf7', '#3b7a57', 'Classic', false], ['#fffdfd', '#fdf7f8', '#d4899f', 'Nipon', false], ['#0a0c0d', '#0d1011', '#3fb950', 'Git Classic', false]];
    return (
      <div style={{ position: 'absolute', inset: 0, background: DESK, display: 'grid', placeItems: 'center', overflow: 'hidden', fontFamily: FONT, color: INK }}>
        <Leaves t={t + 4} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 60, opacity: 1 - seg(p, 0.92, 1, easeInOut), transform: `translateY(${seg(p, 0.92, 1, easeInOut) * -14}px)` }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 262 }}>
            <div style={{ width: 208, height: 277 }}><OnboardTree p={seg(p, 0, 0.55, (x) => x)} stage={1} w={208} h={277} /></div>
            <div style={{ marginTop: 4 }}><Wordmark size={20} /></div>
            <div style={{ fontSize: 11, color: MUTED, letterSpacing: '1.8px' }}>PERSONALIZE</div>
          </div>
          <div style={{ width: 380, display: 'flex', flexDirection: 'column', gap: 14, opacity: inK, transform: `translateY(${(1 - inK) * 14}px)` }}>
            <div>
              <div style={{ fontSize: 21, fontWeight: 700 }}>Personalize your garden</div>
              <div style={{ fontSize: 13, color: TEXT2, marginTop: 4 }}>You can change all of this later in Settings.</div>
            </div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '1.4px', color: MUTED, marginBottom: 7 }}>THEME</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {themes.map(([win, panel, l0, name, active], i) => (
                  <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, opacity: seg(p, 0.16 + i * 0.06, 0.3 + i * 0.06) }}>
                    <div style={{ width: 76, height: 52, borderRadius: 9, border: `2px solid ${active ? INK : BTNB}`, background: win, overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: 24, background: panel, borderRight: `1px solid rgba(128,128,128,0.2)`, boxSizing: 'border-box' }} />
                      <div style={{ flex: 1, padding: 7, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ height: 5, width: '72%', borderRadius: 3, background: l0 }} />
                        <div style={{ height: 5, width: '50%', borderRadius: 3, background: 'rgba(128,128,128,0.3)' }} />
                        <div style={{ height: 5, width: '62%', borderRadius: 3, background: 'rgba(128,128,128,0.3)' }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: active ? INK : MUTED }}>{name}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '1.4px', color: MUTED, marginBottom: 7 }}>TREE STYLE</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['Classic', 'Sakura', 'Tropical', 'Graph'].map((n, i) => (
                  <div key={n} style={{ padding: '6px 13px', borderRadius: 999, border: `2px solid ${i === 0 ? INK : BTNB}`, fontSize: 12.5, color: i === 0 ? INK : TEXT2, opacity: seg(p, 0.34 + i * 0.05, 0.46 + i * 0.05) }}>{n}</div>
                ))}
              </div>
            </div>
            <div style={{ opacity: seg(p, 0.55, 0.7) }}>
              <div style={btnS(true, { width: 140, height: 34 })}>Plant →</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function Principal() {
    const { progress: p } = useScene();
    const inK = seg(p, 0, 0.3);
    return (
      <Desk scale={lerp(0.97, 1.02, easeInOut(p))}>
        <div style={{ opacity: inK, transform: `translateY(${(1 - inK) * 16}px)` }}>
          <AppUI s={{ ...baseState, filesIn: seg(p, 0.25, 0.8), detailIn: seg(p, 0.2, 0.45) }} />
        </div>
      </Desk>
    );
  }

  function Branch() {
    const { progress: p, localTime: t } = useScene();
    const NAME = 'feature/leaves';
    const typedN = Math.floor(seg(p, 0.38, 0.64, (x) => x) * NAME.length);
    const modalIn = seg(p, 0.25, 0.37) * (1 - seg(p, 0.85, 0.93));
    const cx = p < 0.2 ? lerp(700, 242, seg(p, 0, 0.16, easeInOut)) : p < 0.66 ? 242 : lerp(242, 754, seg(p, 0.66, 0.76, easeInOut));
    const cy = p < 0.2 ? lerp(400, 204, seg(p, 0, 0.16, easeInOut)) : p < 0.66 ? 204 : lerp(204, 397, seg(p, 0.66, 0.76, easeInOut));
    const click = p >= 0.16 && p < 0.24 ? seg(p, 0.16, 0.24) : p >= 0.76 && p < 0.84 ? seg(p, 0.76, 0.84) : 0;
    const s = {
      ...baseState,
      hl: p > 0.1 && p < 0.24 ? 'branch' : (p > 0.72 && p < 0.8 ? 'create' : null),
      modal: modalIn > 0.01, modalIn, typed: NAME.slice(0, typedN), caret: Math.floor(t * 3) % 2 === 0,
      newBranch: p > 0.85, newBranchIn: seg(p, 0.85, 0.97),
      rows: p > 0.85 ? [{ ...BASE_ROWS[0], chips: ['main', 'feature/leaves'] }, ...BASE_ROWS.slice(1)] : BASE_ROWS,
    };
    return (
      <Desk scale={lerp(1.02, 1.055, seg(p, 0, 0.35, easeInOut))} ox={640} oy={420}>
        <div style={{ position: 'relative', opacity: 1 - seg(p, 0.94, 1, easeInOut) * 0.5 }}>
          <AppUI s={s} />
          <Cursor x={cx - 50} y={cy - 30} click={click} />
        </div>
      </Desk>
    );
  }

  function Commit() {
    const { progress: p, localTime: t } = useScene();
    const MSG = 'feat(ui): leaves on the graph';
    const staged = Math.floor(seg(p, 0.08, 0.3, (x) => x) * 3.99);
    const typedN = Math.floor(seg(p, 0.32, 0.55, (x) => x) * MSG.length);
    const committed = p > 0.72;
    const pop = seg(p, 0.74, 0.9, (x) => 1 - Math.pow(1 - x, 2));
    const cx = p < 0.6 ? 330 : lerp(330, 385, seg(p, 0.6, 0.68, easeInOut));
    const cy = p < 0.6 ? lerp(160, 320, seg(p, 0.1, 0.5, easeInOut)) : lerp(320, 250, seg(p, 0.6, 0.68, easeInOut));
    const click = p >= 0.68 && p < 0.74 ? seg(p, 0.68, 0.74) : 0;
    const rows = committed
      ? [{ lane: 0, msg: MSG, chips: ['main'], hash: '3fa9d21', pop, sel: true, time: 'now' }, { ...BASE_ROWS[0], chips: [], sel: false }, ...BASE_ROWS.slice(1).map((r) => ({ ...r, sel: false }))]
      : BASE_ROWS;
    const s = committed
      ? { ...baseState, rows, selHash: '3fa9d21', selMsg: MSG, files: ['src/graph/leaves.ts', 'src/theme/tokens.css', 'assets/leaf.svg'], filesIn: seg(p, 0.78, 1), hl: null }
      : { ...baseState, view: 'working', staged, msgTyped: MSG.slice(0, typedN), caret: Math.floor(t * 3) % 2 === 0, hl: p > 0.58 && p < 0.74 ? 'commit' : null };
    return (
      <Desk scale={lerp(1.055, 1.02, seg(p, 0.68, 0.92, easeInOut))} ox={560} oy={400}>
        <div style={{ position: 'relative', opacity: (0.35 + 0.65 * seg(p, 0, 0.09, easeInOut)) * (1 - 0.35 * Math.sin(Math.PI * seg(p, 0.71, 0.79, easeInOut))), transform: `translateY(${(1 - seg(p, 0, 0.09, easeInOut)) * 10 + Math.sin(Math.PI * seg(p, 0.71, 0.79, easeInOut)) * 6}px)` }}>
          <AppUI s={s} />
          {!committed && <Cursor x={cx} y={cy} click={click} />}
        </div>
      </Desk>
    );
  }

  function MergeFetch() {
    const { progress: p } = useScene();
    const merged = p > 0.6;
    const mergePop = seg(p, 0.62, 0.74, (x) => 1 - Math.pow(1 - x, 2));
    const mmodalIn = seg(p, 0.2, 0.3) * (1 - seg(p, 0.56, 0.64));
    const fetchPhase = seg(p, 0.82, 1, (x) => x);
    // continues from the Commit scene: the new commit sits on top
    const CROWS = [
      { lane: 0, msg: 'feat(ui): leaves on the graph', chips: ['main'], hash: '3fa9d21', sel: true, time: 'now' },
      { ...BASE_ROWS[0], chips: [], sel: false },
      ...BASE_ROWS.slice(1).map((r) => ({ ...r, sel: false, curveTo: r.curveTo != null ? r.curveTo + 1 : undefined })),
    ];
    const rows = merged
      ? [{ lane: 0, msg: "Merge branch 'fix/api'", chips: ['main'], hash: 'a41f9c2', merge: true, pop: mergePop, curveTo: 4, time: 'now' }, ...CROWS.map((r, i) => ({ ...r, chips: i === 0 ? [] : r.chips, sel: false, curveTo: r.curveTo != null && r.curveTo + 1 <= 6 ? r.curveTo + 1 : undefined })).slice(0, 6)]
      : CROWS;
    // cursor: → chip Merge na branch fix/api (sidebar) → modal "Merge" → Fetch (titlebar)
    const cx = p < 0.32 ? lerp(700, 225, seg(p, 0, 0.12, easeInOut)) : p < 0.62 ? lerp(225, 754, seg(p, 0.34, 0.44, easeInOut)) : lerp(754, 995, seg(p, 0.66, 0.76, easeInOut));
    const cy = p < 0.32 ? lerp(300, 252, seg(p, 0, 0.12, easeInOut)) : p < 0.62 ? lerp(252, 409, seg(p, 0.34, 0.44, easeInOut)) : lerp(409, 82, seg(p, 0.66, 0.76, easeInOut));
    const click = p >= 0.13 && p < 0.2 ? seg(p, 0.13, 0.2) : p >= 0.47 && p < 0.55 ? seg(p, 0.47, 0.55) : p >= 0.76 && p < 0.83 ? seg(p, 0.76, 0.83) : 0;
    const s = {
      ...baseState, rows,
      selHash: merged ? 'a41f9c2' : '3fa9d21',
      selMsg: merged ? "Merge branch 'fix/api' into main" : 'feat(ui): leaves on the graph',
      files: merged ? baseState.files : ['src/graph/leaves.ts', 'src/theme/tokens.css', 'assets/leaf.svg'],
      hl: p > 0.06 && p < 0.22 ? 'merge' : (p > 0.44 && p < 0.56 ? 'domerge' : null),
      mmodal: mmodalIn > 0.01, mmodalIn,
      fetchSpin: fetchPhase, notif: p > 0.93 ? seg(p, 0.93, 1) : 0, notifTitle: 'Fetch complete', notifSub: 'origin · 2 new commits on main',
    };
    return (
      <Desk scale={lerp(1.02, 1.05, easeInOut(p))} ox={640} oy={400}>
        <div style={{ position: 'relative', opacity: 1 - seg(p, 0.96, 1, easeInOut) * 0.15 }}>
          <AppUI s={s} />
          <Cursor x={cx - 50} y={cy - 30} click={click} />
        </div>
      </Desk>
    );
  }

  function Fecho() {
    const { progress: p } = useScene();
    const uiOut = 1 - seg(p, 0, 0.28, easeInOut);
    return (
      <div style={{ position: 'absolute', inset: 0, background: DESK, overflow: 'hidden' }}>
        {uiOut > 0.01 && (
          <Desk scale={1.02} ox={640} oy={400} opacity={uiOut * 0.85}>
            <AppUI s={baseState} />
          </Desk>
        )}
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <div style={{ textAlign: 'center', opacity: seg(p, 0.2, 0.4) }}>
            <div style={{ display: 'grid', placeItems: 'center' }}><OnboardTree p={1} stage={2} w={190} h={253} /></div>
            <div style={{ display: 'grid', placeItems: 'center', marginTop: 6, opacity: seg(p, 0.42, 0.62) }}><Wordmark size={44} /></div>
            <div style={{ fontFamily: FONT, fontSize: 22, color: TEXT2, marginTop: 14, opacity: seg(p, 0.52, 0.72) }}>Your Git history, alive.</div>
            <div style={{ fontFamily: MONO, fontSize: 14, color: GREEN, marginTop: 16, opacity: seg(p, 0.62, 0.82) }}>github.com/Diogo1306/GitSylva</div>
          </div>
        </div>
      </div>
    );
  }

  function GitSylvaPromo() {
    const [tw, setTweak] = useTweaks(window.TWEAK_DEFAULTS);
    return (
      <div style={{ height: '100vh', display: 'grid', placeItems: 'center', background: BG, padding: 0, boxSizing: 'border-box', overflow: 'hidden' }}>
        <SceneStage width={1280} height={720} bg={BG} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK}>
          {{ Splash, Login, Setup, Principal, Branch, Commit, MergeFetch, Fecho }}
        </SceneStage>
        <TweaksPanel>
          <TweakSection label="Editor" />
          <TweakToggle label="Motion editor" value={tw.motionEditor} onChange={(v) => setTweak('motionEditor', v)} />
        </TweaksPanel>
      </div>
    );
  }

  window.GitSylvaPromo = GitSylvaPromo;
})();
