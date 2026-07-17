import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function SVGChart({ type, data }) {
  const { theme } = useTheme();
  
  if (!data) return <div className="text-zinc-400 text-xs italic">No chart data.</div>;

  const isDark = theme === 'dark';

  const GRID  = isDark ? '#27272a' : '#e4e4e7';
  const AXIS  = isDark ? '#3f3f46' : '#d4d4d8';
  const LABEL = isDark ? '#a1a1aa' : '#71717a';
  const VAL   = isDark ? '#c4b5fd' : '#4f46e5';
  const VAL_LINE = isDark ? '#6ee7b7' : '#059669';

  const W = 480, H = 240;
  const PL = 48, PR = 14, PT = 18, PB = 52;
  const CW = W - PL - PR, CH = H - PT - PB;

  const fmt = v => v >= 10000 ? `${(v/1000).toFixed(1)}k` : v >= 1000 ? `${(v/1000).toFixed(1)}k` : Number.isInteger(v) ? String(v) : v.toFixed(1);

  const Grid = ({ yRatios, yFn }) => (
    <>
      <defs>
        <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="gh" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yRatios.map((r, i) => {
        const y = H - PB - r * CH;
        return (
          <g key={i}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke={GRID} strokeWidth="0.75" strokeDasharray={r === 0 ? '0' : '3 3'} />
            <text x={PL - 6} y={y + 3} textAnchor="end" fontSize="9" fontFamily="inherit" fill={LABEL} className="font-mono font-medium">{yFn(r)}</text>
          </g>
        );
      })}
      <line x1={PL} y1={PT} x2={PL} y2={H - PB} stroke={AXIS} strokeWidth="1" />
      <line x1={PL} y1={H - PB} x2={W - PR} y2={H - PB} stroke={AXIS} strokeWidth="1" />
    </>
  );

  const Wrap = ({ title, badge, children }) => (
    <div className="w-full bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800/60 p-3.5 rounded-xl flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{title}</span>
        {badge && <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/50 px-2 py-0.5 rounded-full">{badge}</span>}
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible select-none">
        {children}
      </svg>
    </div>
  );

  if (type === 'bar') {
    const labels = data.labels || [];
    const values = data.datasets?.[0]?.data || [];
    if (!values.length) return null;
    const maxVal = Math.max(...values, 1);
    const slotW = CW / labels.length;
    const barW = Math.min(slotW * 0.6, 32);
    return (
      <Wrap title={data.datasets?.[0]?.label || 'Bar Chart'} badge={`${values.length} items`}>
        <Grid yRatios={[0, 0.25, 0.5, 0.75, 1]} yFn={r => fmt(r * maxVal)} />
        {values.map((v, i) => {
          const bh = (v / maxVal) * CH;
          const x = PL + i * slotW + (slotW - barW) / 2;
          const y = H - PB - bh;
          const lbl = String(labels[i] || '');
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={bh} rx="3" fill="url(#gb)" className="hover:opacity-90 transition-opacity" />
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="8.5" fontFamily="inherit" fill={VAL} className="font-bold">{fmt(v)}</text>
              <text x={x + barW / 2} y={H - PB + 10} textAnchor="end"
                transform={`rotate(-35, ${x + barW / 2}, ${H - PB + 10})`}
                fontSize="9" fontFamily="inherit" fill={LABEL} className="font-medium">
                {lbl.length > 10 ? lbl.slice(0, 9) + '…' : lbl}
              </text>
            </g>
          );
        })}
        <text x={PL + CW / 2} y={H - 2} textAnchor="middle" fontSize="9" fontFamily="inherit" fill={AXIS} className="font-semibold">{data.xAxisLabel || 'Category'}</text>
        <text x={10} y={PT + CH / 2} textAnchor="middle" transform={`rotate(-90, 10, ${PT + CH / 2})`} fontSize="9" fontFamily="inherit" fill={AXIS} className="font-semibold">{data.yAxisLabel || 'Value'}</text>
      </Wrap>
    );
  }

  if (type === 'line') {
    const labels = data.labels || [];
    const values = data.datasets?.[0]?.data || [];
    if (!values.length) return null;
    const maxV = Math.max(...values), minV = Math.min(...values);
    const range = maxV - minV || 1;
    const pts = values.map((v, i) => ({
      x: PL + (i / Math.max(values.length - 1, 1)) * CW,
      y: H - PB - ((v - minV) / range) * CH, v, label: labels[i] || ''
    }));
    const line = `M ${pts.map(p => `${p.x},${p.y}`).join(' L ')}`;
    const area = `M ${pts[0].x},${H - PB} L ${pts.map(p => `${p.x},${p.y}`).join(' L ')} L ${pts[pts.length - 1].x},${H - PB} Z`;
    return (
      <Wrap title={data.datasets?.[0]?.label || 'Line Chart'}>
        <Grid yRatios={[0, 0.25, 0.5, 0.75, 1]} yFn={r => fmt(minV + r * range)} />
        <path d={area} fill="url(#ga)" />
        <path d={line} fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => {
          const show = pts.length <= 8 || i % Math.ceil(pts.length / 6) === 0;
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="3" fill="#34d399" stroke={isDark ? '#18181b' : '#ffffff'} strokeWidth="1.5" />
              <text x={p.x} y={p.y - 6} textAnchor="middle" fontSize="8.5" fontFamily="inherit" fill={VAL_LINE} className="font-bold">{fmt(p.v)}</text>
              {show && <text x={p.x} y={H - PB + 10} textAnchor="end"
                transform={`rotate(-35, ${p.x}, ${H - PB + 10})`}
                fontSize="9" fontFamily="inherit" fill={LABEL} className="font-medium">
                {p.label.length > 10 ? p.label.slice(0, 9) + '…' : p.label}
              </text>}
            </g>
          );
        })}
        <text x={PL + CW / 2} y={H - 2} textAnchor="middle" fontSize="9" fontFamily="inherit" fill={AXIS} className="font-semibold">{data.xAxisLabel || 'Timeline'}</text>
        <text x={10} y={PT + CH / 2} textAnchor="middle" transform={`rotate(-90, 10, ${PT + CH / 2})`} fontSize="9" fontFamily="inherit" fill={AXIS} className="font-semibold">{data.yAxisLabel || 'Value'}</text>
      </Wrap>
    );
  }

  if (type === 'pie') {
    const labels = data.labels || [];
    const values = data.datasets?.[0]?.data || [];
    const total = values.reduce((a, b) => a + b, 0) || 1;
    const PAL = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa', '#f472b6', '#2dd4bf'];
    const cx = 110, cy = H / 2, R = 72, r = 36;
    let ang = -90;
    const slices = values.map((v, i) => {
      const pct = v / total, deg = pct * 360, s = ang, e = ang + deg; ang = e;
      const toR = d => d * Math.PI / 180;
      const [x1, y1] = [cx + R * Math.cos(toR(s)), cy + R * Math.sin(toR(s))];
      const [x2, y2] = [cx + R * Math.cos(toR(e)), cy + R * Math.sin(toR(e))];
      const [xi1, yi1] = [cx + r * Math.cos(toR(s)), cy + r * Math.sin(toR(s))];
      const [xi2, yi2] = [cx + r * Math.cos(toR(e)), cy + r * Math.sin(toR(e))];
      const lg = deg > 180 ? 1 : 0;
      return {
        path: `M ${xi1} ${yi1} A ${r} ${r} 0 ${lg} 1 ${xi2} ${yi2} L ${x2} ${y2} A ${R} ${R} 0 ${lg} 0 ${x1} ${y1} Z`,
        pct, label: labels[i] || 'Other', color: PAL[i % PAL.length]
      };
    });
    return (
      <Wrap title={data.datasets?.[0]?.label || 'Proportion'}>
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="12" fontFamily="inherit" fill={isDark ? '#e4e4e7' : '#27272a'} className="font-bold">{values.length}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fontFamily="inherit" fill={LABEL} className="font-semibold">slices</text>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke={isDark ? '#18181b' : '#ffffff'} strokeWidth="1.5" opacity="0.95" />
        ))}
        {slices.map((s, i) => (
          <g key={i} transform={`translate(${cx + R + 14}, ${24 + i * 22})`}>
            <rect width="8" height="8" rx="2" fill={s.color} />
            <text x={12} y={8} fontSize="9" fontFamily="inherit" fill={isDark ? '#d4d4d8' : '#27272a'} className="font-bold">{s.label.length > 12 ? s.label.slice(0, 10) + '…' : s.label}</text>
            <text x={12} y={18} fontSize="8" fontFamily="inherit" fill={LABEL} className="font-medium">{(s.pct * 100).toFixed(1)}%</text>
          </g>
        ))}
      </Wrap>
    );
  }

  if (type === 'histogram') {
    const labels = data.labels || [];
    const values = data.datasets?.[0]?.data || [];
    if (!values.length) return null;
    const maxVal = Math.max(...values, 1);
    const barW = (CW / values.length) - 1.5;
    return (
      <Wrap title={data.datasets?.[0]?.label || 'Distribution'} badge={`${values.length} bins`}>
        <Grid yRatios={[0, 0.25, 0.5, 0.75, 1]} yFn={r => String(Math.round(r * maxVal))} />
        {values.map((v, i) => {
          const bh = (v / maxVal) * CH, x = PL + i * (barW + 1.5), y = H - PB - bh;
          const lbl = String(labels[i] || '');
          const show = values.length <= 6 || i % 2 === 0;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={bh} rx="2" fill="url(#gh)" opacity="0.9" />
              {v > 0 && <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="8" fontFamily="inherit" fill={isDark ? '#67e8f9' : '#06b6d4'} className="font-bold">{v}</text>}
              {show && <text x={x + barW / 2} y={H - PB + 10} textAnchor="end"
                transform={`rotate(-35, ${x + barW / 2}, ${H - PB + 10})`}
                fontSize="8.5" fontFamily="inherit" fill={LABEL} className="font-medium">
                {lbl.length > 12 ? lbl.slice(0, 10) + '…' : lbl}
              </text>}
            </g>
          );
        })}
        <text x={PL + CW / 2} y={H - 2} textAnchor="middle" fontSize="9" fontFamily="inherit" fill={AXIS} className="font-semibold">{data.xAxisLabel || 'Range'}</text>
        <text x={10} y={PT + CH / 2} textAnchor="middle" transform={`rotate(-90, 10, ${PT + CH / 2})`} fontSize="9" fontFamily="inherit" fill={AXIS} className="font-semibold">{data.yAxisLabel || 'Frequency'}</text>
      </Wrap>
    );
  }

  if (type === 'scatter') {
    const points = data.dataPoints || [];
    if (!points.length) return null;
    const xV = points.map(p => p.x), yV = points.map(p => p.y);
    const minX = Math.min(...xV), maxX = Math.max(...xV), minY = Math.min(...yV), maxY = Math.max(...yV);
    const rX = maxX - minX || 1, rY = maxY - minY || 1;
    return (
      <Wrap title={`${data.xAxisLabel || 'X'} vs ${data.yAxisLabel || 'Y'}`}>
        <Grid yRatios={[0, 0.25, 0.5, 0.75, 1]} yFn={r => fmt(minY + r * rY)} />
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
          <text key={i} x={PL + r * CW} y={H - PB + 14} textAnchor="middle" fontSize="8.5" fontFamily="inherit" fill={LABEL} className="font-mono font-medium">{fmt(minX + r * rX)}</text>
        ))}
        {points.map((p, i) => (
          <circle key={i}
            cx={PL + ((p.x - minX) / rX) * CW}
            cy={H - PB - ((p.y - minY) / rY) * CH}
            r="3.5" fill="#818cf8" stroke={isDark ? '#18181b' : '#ffffff'} strokeWidth="1.0" opacity="0.85" />
        ))}
        <text x={PL + CW / 2} y={H - 2} textAnchor="middle" fontSize="9" fontFamily="inherit" fill={AXIS} className="font-semibold">{data.xAxisLabel || 'X'}</text>
        <text x={10} y={PT + CH / 2} textAnchor="middle" transform={`rotate(-90, 10, ${PT + CH / 2})`} fontSize="9" fontFamily="inherit" fill={AXIS} className="font-semibold">{data.yAxisLabel || 'Y'}</text>
      </Wrap>
    );
  }

  return null;
}
