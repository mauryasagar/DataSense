import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Upload, X, Sun, Moon, ArrowLeft,
  MessageSquare, Table, Search, Send,
  Database, FileText, Cpu, ShieldCheck, Play,
  AlertTriangle, RefreshCw, Download, BarChart2, BookOpen, Check
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAIWorker } from '../hooks/useAIWorker'
import { useFileHandler } from '../hooks/useFileHandler'
import { useSession } from '../hooks/useSession'
import { determineChartType, extractChartData } from '../utils/chartSelector'
import { answerLocally, buildRichAIContext } from '../utils/nlqEngine'
import { buildNotebookContext } from '../utils/contextBuilder'
import { exportSessionReport } from '../utils/pdfExporter'
import Footer from '../components/landing/Footer'
// Compact SVG Chart — theme-matching and responsive
function SVGChart({ type, data }) {
  if (!data) return <div className="text-zinc-400 text-xs italic">No chart data.</div>;

  const { theme } = useTheme();
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

  // Shared Grid & Axes Component using presentation attributes
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
      {/* Grid lines */}
      {yRatios.map((r, i) => {
        const y = H - PB - r * CH;
        return (
          <g key={i}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke={GRID} strokeWidth="0.75" strokeDasharray={r === 0 ? '0' : '3 3'} />
            <text x={PL - 6} y={y + 3} textAnchor="end" fontSize="9" fontFamily="inherit" fill={LABEL} className="font-mono font-medium">{yFn(r)}</text>
          </g>
        );
      })}
      {/* Main axes */}
      <line x1={PL} y1={PT} x2={PL} y2={H - PB} stroke={AXIS} strokeWidth="1" />
      <line x1={PL} y1={H - PB} x2={W - PR} y2={H - PB} stroke={AXIS} strokeWidth="1" />
    </>
  );

  // Wrapper with fixed width and theme matching styles
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

  // ── Bar ──────────────────────────────────────────────────────────────────
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

  // ── Line ─────────────────────────────────────────────────────────────────
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

  // ── Pie / Donut ───────────────────────────────────────────────────────────
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

  // ── Histogram ─────────────────────────────────────────────────────────────
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

  // ── Scatter ───────────────────────────────────────────────────────────────
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



// Empty State Dropzone Component supporting multiple extensions




function EmptyDropZone({ onFileSelect, fileError, onLoadSample, onScroll }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFileSelect(file)
  }

  return (
    <div className="flex-1 w-full overflow-y-auto flex flex-col grid-pattern-scroll relative" onScroll={onScroll}>
      {/* Radial gradient — inside scrollable area so it scrolls with content */}
      <div className="sticky top-0 left-1/2 pointer-events-none" style={{height: 0}}>
        <div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-zinc-100 dark:bg-zinc-900/60 rounded-full blur-3xl opacity-70" />
      </div>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center pt-14 pb-12 px-6 max-w-5xl mx-auto w-full relative z-10">

        {/* Badge */}
        <div className="badge mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-fast-pulse" />
          100% On-Device AI · No Cloud · No API Keys
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.1] mb-5 text-center animate-slide-up">
          Analyze your data, <br className="hidden sm:block" />
          <span className="gradient-text">locally and privately.</span>
        </h1>

        {/* Description */}
        <p className="text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-lg text-center mb-12 leading-relaxed animate-slide-up" style={{ animationDelay: '0.05s' }}>
          Drop any CSV, PDF, or Jupyter Notebook below to run local WebAssembly engines and AI models entirely inside your browser sandbox.
        </p>

        {/* Error banner */}
        {fileError && (
          <div className="w-full max-w-xl mb-8 flex items-start gap-3 p-5 rounded-2xl border border-red-200 bg-red-50 text-red-800 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300 animate-slide-up shadow-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
            <div className="text-sm font-medium">{fileError}</div>
          </div>
        )}

        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
          className={`w-full max-w-lg border-2 border-dashed rounded-3xl p-8 flex flex-col items-center gap-4 cursor-pointer transition-all duration-300 relative z-10 group shadow-lg
            ${dragging
              ? 'border-zinc-900 dark:border-white scale-[1.02] shadow-2xl bg-zinc-50 dark:bg-zinc-900/60'
              : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/40 hover:border-zinc-500 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:scale-[1.01] hover:shadow-2xl'
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.ipynb,.pdf"
            className="hidden"
            onChange={(e) => onFileSelect(e.target.files[0])}
          />

          {/* Upload icon */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md ${
            dragging
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 scale-110 shadow-zinc-900/30'
              : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 group-hover:bg-zinc-800 dark:group-hover:bg-zinc-100 group-hover:scale-105 group-hover:shadow-lg'
          }`}>
            <Upload className="w-6 h-6" strokeWidth={2.2} />
          </div>

          <div className="text-center space-y-2">
            <p className="font-bold text-zinc-900 dark:text-zinc-50 text-lg tracking-tight">
              {dragging ? 'Drop your file here' : 'Upload dataset or document'}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
              Drag & drop your CSV, PDF, or Jupyter Notebook (.ipynb) directly into the browser.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500 border-t border-zinc-200 dark:border-zinc-800 w-full pt-5 justify-center">
            <ShieldCheck className="w-4 h-4" />
            <span>Local on-device parsing · 100% private</span>
          </div>
        </div>

        {/* Sample Loaders */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 z-10 relative">
          <button
            onClick={(e) => { e.stopPropagation(); onLoadSample('csv') }}
            className="btn-primary flex items-center gap-2.5 px-8 py-3.5 text-sm rounded-full shadow-md hover:shadow-lg hover:scale-[1.01] transition-all"
          >
            <Table className="w-4 h-4" />
            <span>Load Sample CSV</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onLoadSample('pdf') }}
            className="btn-ghost flex items-center gap-2.5 px-8 py-3.5 text-sm rounded-full hover:scale-[1.01] transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Load Sample PDF</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onLoadSample('ipynb') }}
            className="btn-ghost flex items-center gap-2.5 px-8 py-3.5 text-sm rounded-full hover:scale-[1.01] transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>Load Sample Notebook</span>
          </button>
        </div>
      </div>

      {/* Feature Cards Section */}
      <div className="px-6 pb-12 max-w-5xl mx-auto w-full relative z-10">
        <div className="mb-8 text-center">
          <span className="section-label">What you can do</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="feature-card group flex flex-col justify-start">
            <div className="icon-box mb-4 group-hover:bg-zinc-900 dark:group-hover:bg-white transition-colors duration-300">
              <BarChart2 className="w-5 h-5 text-zinc-600 dark:text-zinc-400 group-hover:text-white dark:group-hover:text-zinc-900 transition-colors duration-300" />
            </div>
            <div className="fn-name mb-1.5">analyzeCSV()</div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">CSV Data Copilot</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Interactive EDA charts, correlational analysis, instant data summaries, and SQL-powered Q&A chat.
            </p>
          </div>

          <div className="feature-card group flex flex-col justify-start">
            <div className="icon-box mb-4 group-hover:bg-zinc-900 dark:group-hover:bg-white transition-colors duration-300">
              <FileText className="w-5 h-5 text-zinc-600 dark:text-zinc-400 group-hover:text-white dark:group-hover:text-zinc-900 transition-colors duration-300" />
            </div>
            <div className="fn-name mb-1.5">parsePDF()</div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">Doc Chat & Summary</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Extracts text from PDF documents locally and uses AI to generate summaries and answer context-retrieved questions.
            </p>
          </div>

          <div className="feature-card group flex flex-col justify-start">
            <div className="icon-box mb-4 group-hover:bg-zinc-900 dark:group-hover:bg-white transition-colors duration-300">
              <BookOpen className="w-5 h-5 text-zinc-600 dark:text-zinc-400 group-hover:text-white dark:group-hover:text-zinc-900 transition-colors duration-300" />
            </div>
            <div className="fn-name mb-1.5">parseNotebook()</div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">Notebook Explainer</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Instantly parses <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">.ipynb</code> files and uses on-device AI to explain code cells and outputs.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

function ModelStatusBanner({ status, progress, error, loadModels, modelCached }) {
  if (status === 'ready') return null;

  const isInitializing = status === 'initializing';
  const isLoading = status === 'loading';

  return (
    <div className="flex-shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-zinc-50 via-white to-zinc-50 dark:from-zinc-900/20 dark:via-zinc-950 dark:to-zinc-900/20 p-5 sm:p-6 transition-all duration-300 animate-slide-up backdrop-blur-md">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-5 justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl transition-all ${(isLoading || isInitializing) ? 'bg-zinc-900/10 dark:bg-white/10 shadow-inner border border-zinc-900/20 dark:border-white/20' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
            <Cpu className={`w-5 h-5 ${(isLoading || isInitializing) ? 'text-zinc-900 dark:text-zinc-100 animate-pulse' : 'text-zinc-400'}`} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {status === 'idle' && 'AI features are not loaded yet'}
              {isLoading && `Downloading models… (${progress}%)`}
              {isInitializing && 'Warming up AI engine…'}
              {status === 'error' && 'Failed to load AI models'}
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1">
              {status === 'idle' && (
                modelCached
                  ? 'Model is cached locally. Click to load — takes ~20s to initialize. Data exploration works without it.'
                  : 'One-time ~350MB download needed for AI Q&A, summaries & notebook explainer. CSV data analysis works right now.'
              )}
              {isLoading && 'Downloading WebAssembly runtimes and AI weights. Please keep this tab active.'}
              {isInitializing && 'Compiling and loading model weights into WebAssembly memory. Almost ready…'}
              {status === 'error' && `Error details: ${error}. Please refresh or try again.`}
            </p>
          </div>
        </div>
        
        <div className="flex-shrink-0 w-full md:w-auto flex items-center gap-3">
          {status === 'idle' && (
            <div className="flex items-center gap-2.5">
              {modelCached && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  ✓ Cached
                </span>
              )}
              <button
                onClick={loadModels}
                className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold shadow-md hover:shadow-lg transition-all"
              >
                {modelCached ? 'Initialize AI' : 'Load AI Models'}
              </button>
            </div>
          )}
          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-48 bg-zinc-200 dark:bg-zinc-700 h-2.5 rounded-full overflow-hidden shadow-inner">
                <div
                  className="bg-zinc-900 dark:bg-white h-full rounded-full"
                  style={{ width: `${progress}%`, transition: 'width 0.5s ease-out' }}
                />
              </div>
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 tabular-nums w-8">{progress}%</span>
            </div>
          )}
          {isInitializing && (
            <div className="flex items-center gap-2.5">
              {/* Indeterminate spinner */}
              <svg className="w-5 h-5 animate-spin text-zinc-500 dark:text-zinc-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Initializing…</span>
            </div>
          )}
          {status === 'error' && (
            <button
              onClick={loadModels}
              className="px-6 py-2.5 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-sm font-bold flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Download
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function retrieveRelevantContext(question, paragraphs) {
  const stopWords = new Set(['what', 'is', 'the', 'a', 'an', 'of', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'how', 'why', 'where', 'when', 'who', 'which', 'do', 'does', 'did', 'are', 'was', 'were', 'has', 'have', 'had', 'can', 'could', 'should', 'would']);
  const words = question.toLowerCase().split(/[\s_\-\?\.\,]+/).filter(w => w.length > 1 && !stopWords.has(w));
  
  if (words.length === 0) {
    return paragraphs.slice(0, 2).join('\n\n');
  }

  const scoredParagraphs = paragraphs.map((p, idx) => {
    const lp = p.toLowerCase();
    let score = 0;
    words.forEach(w => {
      if (lp.includes(w)) {
        score += 1;
        const regex = new RegExp('\\b' + w + '\\b', 'g');
        const matches = lp.match(regex);
        if (matches) {
          score += matches.length * 0.5;
        }
      }
    });
    return { p, score, idx };
  });

  scoredParagraphs.sort((a, b) => b.score - a.score);

  const selected = [];
  let currentLength = 0;
  for (const item of scoredParagraphs) {
    if (item.score <= 0 && selected.length > 0) break;
    if (currentLength + item.p.length > 1500 && selected.length > 0) continue;
    selected.push(item);
    currentLength += item.p.length;
    if (selected.length >= 3) break;
  }

  selected.sort((a, b) => a.idx - b.idx);
  return selected.map(item => item.p).join('\n\n');
}

export default function AppPage() {
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()

  // Custom AI Worker Hook
  const ai = useAIWorker()
  
  // Custom File Handler Hook
  const fileHandler = useFileHandler()
  const { file, fileType, parsedData, loading: fileParsing, error: fileError } = fileHandler

  // Session Persistence Hook
  const { restoredSession, saveSession, clearSession } = useSession()

  // Local State
  const [activeTab, setActiveTab] = useState('chat')
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [suggestedQuestions, setSuggestedQuestions] = useState([])
  
    
  // Extra features states for CSV & Notebooks
  const [csvSummary, setCsvSummary] = useState('')
  const [notebookExplanations, setNotebookExplanations] = useState({}) // cellIndex -> explanation text
  const [explainingCellIdx, setExplainingCellIdx] = useState(null)
  const [explainAllProgress, setExplainAllProgress] = useState(null) // { current, total } or null
  
  // EDA AI Summary states
  const [pdfSummary, setPdfSummary] = useState('')
  const [pdfSummaryLoading, setPdfSummaryLoading] = useState(false)

  // Toast notifications for caching/offline status
  const [toastMessage, setToastMessage] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  // DOM Refs for report capturing
  const chatEndRef = useRef(null)
  const messageRefs = useRef([])

  // Restore session from IndexedDB if available
  useEffect(() => {
    if (restoredSession && !file) {
      // Re-create a mock File object to satisfy file selection state
      const mockFile = { name: restoredSession.fileName, size: 0 }
      fileHandler.loadSessionData(mockFile, restoredSession.fileType, restoredSession.parsedData)
      setChatHistory(restoredSession.chatHistory || [])
      
      if (restoredSession.fileType === 'csv' || restoredSession.fileType === 'pdf') {
        setPdfSummary(restoredSession.extra?.pdfSummary || '')
      } else if (restoredSession.fileType === 'ipynb') {
        setNotebookExplanations(restoredSession.extra?.notebookExplanations || {})
      }

      // Since rows are no longer persisted (to save memory), tell user to re-upload for live queries
      const hasRows = restoredSession.parsedData?.rows?.length > 0;
      setToastMessage(
        hasRows
          ? "Restored previous workspace session!"
          : `Session restored! Re-upload "${restoredSession.fileName}" to run new queries.`
      )
    }
  }, [restoredSession, file, fileHandler])

  // Save session on state changes
  useEffect(() => {
    if (file && fileType && parsedData) {
      const extra = {}
      if (fileType === 'csv' || fileType === 'pdf') {
        extra.pdfSummary = pdfSummary
      } else if (fileType === 'ipynb') {
        extra.notebookExplanations = notebookExplanations
      }
      saveSession(file.name, fileType, parsedData, chatHistory, extra)
    }
  }, [file, fileType, parsedData, chatHistory, pdfSummary, notebookExplanations, saveSession])

    // Auto-generate suggested questions when CSV loads and set tab on file load
  useEffect(() => {
    if (fileType === 'csv' && parsedData?.columns) {
      // Static suggestions based on columns & types for speed and accuracy
      const cols = parsedData.columns;
      const types = parsedData.columnTypes;
      const numCols = cols.filter(c => types[c] === 'numeric');
      const catCols = cols.filter(c => types[c] === 'categorical');

      const questions = [];
      if (numCols.length > 0) {
        questions.push(`What is the average distribution of ${numCols[0]}?`);
        if (catCols.length > 0) {
          questions.push(`Show me the breakdown of ${numCols[0]} by ${catCols[0]}`);
        } else if (numCols.length > 1) {
          questions.push(`Analyze the correlation between ${numCols[0]} and ${numCols[1]}`);
        }
      }
      if (catCols.length > 0) {
        questions.push(`Which are the top categories in ${catCols[0]}?`);
        if (numCols.length > 0) {
          questions.push(`Is there a trend of ${numCols[0]} vs ${catCols[0]}?`);
        }
      }
      while (questions.length < 5 && cols.length > 0) {
        const col = cols[questions.length % cols.length];
        questions.push(`Display summary details for the column ${col}`);
      }
      setSuggestedQuestions(questions.slice(0, 5));
      setActiveTab('chat');
    } else if (fileType === 'ipynb') {
      setActiveTab('notebook');
    } else if (fileType === 'pdf') {
      setSuggestedQuestions([
        "What is the core methodology of this report?",
        "What are the main conclusions?",
        "Give me a detailed breakdown of the findings.",
        "What privacy measures are detailed in the document?"
      ]);
      setActiveTab('pdf-chat');
    }
  }, [fileType, parsedData])

  

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  // Listen for the custom cached event from Hook
  useEffect(() => {
    const handleCached = () => {
      setToastMessage("AI models cached — app now works offline! 🌐✈️");
    };
    window.addEventListener('ai-model-cached', handleCached);
    return () => window.removeEventListener('ai-model-cached', handleCached);
  }, []);

  // Dismiss toast after delay
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const handleFileSelect = (selectedFile) => {
    fileHandler.handleFile(selectedFile);
  }

  // Trigger EDA / Doc AI Summary generation
  const triggerPDFSummaryManual = async () => {
    if (ai.status !== 'ready') return;
    setPdfSummaryLoading(true);
    try {
      let summaryInput = '';
      if (fileType === 'csv' && parsedData?.edaResult) {
        const eda = parsedData.edaResult;
        summaryInput = `Dataset overview: ${eda.overview.totalRows} rows, ${eda.overview.totalCols} columns (${eda.overview.numericCount} numeric, ${eda.overview.categoricalCount} categorical). Missing values: ${eda.overview.totalMissing}. ` +
          Object.entries(eda.numericStats).map(([col, s]) => `${col}: mean=${s.mean.toFixed(2)}, stdDev=${s.stdDev.toFixed(2)}, ${s.outlierCount} outliers`).join('. ') + '. ' +
          Object.entries(eda.categoricalStats).map(([col, s]) => `${col}: ${s.uniqueCount} unique values`).join('. ');
      } else if (fileType === 'pdf' && parsedData?.fullText) {
        summaryInput = parsedData.fullText.length > 2500
          ? parsedData.fullText.substring(0, 2500) + '...'
          : parsedData.fullText;
      } else {
        throw new Error("No data available to summarize");
      }

      const result = await ai.summarizeText(summaryInput);
      setPdfSummary(result?.summary || result?.answer || 'Summary could not be generated.');
    } catch (err) {
      console.error('Summary error:', err);
      setToastMessage('Failed to generate summary.');
    } finally {
      setPdfSummaryLoading(false);
    }
  };


  const handleSendQuestion = async (forcedQuestion) => {
    const q = (forcedQuestion || chatInput).trim();
    if (!q) return;

    if (!forcedQuestion) setChatInput('');

    // Append user query with loading state
    const updatedHistory = [...chatHistory, { question: q, answer: 'Thinking...', loading: true }];
    setChatHistory(updatedHistory);

    try {
      if (fileType === 'csv') {
        // Determine chart type and data regardless of answer source
        const chartType = determineChartType(q);
        const chartData = extractChartData(chartType, parsedData.edaResult, parsedData.columns, parsedData.rows);

        // ── Step 1: Try local NLQ engine first (no AI needed) ──────────────
        const localResult = answerLocally(q, parsedData);
        if (localResult) {
          setChatHistory(prev => {
            const next = [...prev];
            next[next.length - 1] = {
              question: q,
              answer: localResult.answer,
              chartType: chartData ? chartType : null,
              chartData: chartData,
              loading: false
            };
            return next;
          });
          return;
        }

        // ── Step 2: Fall back to AI model if loaded ─────────────────────────
        if (ai.status !== 'ready') {
          setChatHistory(prev => {
            const next = [...prev];
            next[next.length - 1] = {
              question: q,
              answer: `I couldn't compute a direct answer to that question from the data.\n\nTip: Try asking things like:\n- "What is the average Revenue?"\n- "Show me the total Units"\n- "What are the top categories?"\n- "How many rows are there?"`,
              chartType: chartData ? chartType : null,
              chartData: chartData,
              loading: false
            };
            return next;
          });
          return;
        }

        // Use a richer context so the generative model can find answers
        const richContext = buildRichAIContext(parsedData);
        const result = await ai.answerQuestion(q, richContext);

        const answer = result?.answer || `I couldn't find a precise answer to "${q}".`;

        setChatHistory(prev => {
          const next = [...prev];
          next[next.length - 1] = {
            question: q,
            answer,
            chartType: chartData ? chartType : null,
            chartData: chartData,
            loading: false
          };
          return next;
        });
      } else if (fileType === 'pdf') {
        if (ai.status !== 'ready') {
          setChatHistory(prev => {
            const next = [...prev];
            next[next.length - 1] = {
              question: q,
              answer: "Load AI Models first to chat with your document.",
              loading: false
            };
            return next;
          });
          return;
        }

        const relevantContext = retrieveRelevantContext(q, parsedData.paragraphs);
        if (!relevantContext.trim()) {
          setChatHistory(prev => {
            const next = [...prev];
            next[next.length - 1] = {
              question: q,
              answer: "Could not retrieve any relevant text segments in this PDF.",
              loading: false
            };
            return next;
          });
          return;
        }

        const result = await ai.answerQuestion(q, relevantContext);
        const answer = result?.answer || "I couldn't find a clear answer in the document text for that question.";

        setChatHistory(prev => {
          const next = [...prev];
          next[next.length - 1] = {
            question: q,
            answer,
            loading: false
          };
          return next;
        });
      }
    } catch (err) {
      setChatHistory(prev => {
        const next = [...prev];
        next[next.length - 1] = {
          question: q,
          answer: "Sorry, I encountered an error: " + (err.message || ''),
          loading: false
        };
        return next;
      });
    }
  };

  // Explain single code cell
  const handleExplainCell = async (cellIdx) => {
    if (ai.status !== 'ready') {
      setToastMessage("Load AI Models first to explain code cells.");
      return;
    }
    setExplainingCellIdx(cellIdx);
    try {
      const currentCell = parsedData[cellIdx];
      // Collect previous imports
      const prevImports = [];
      parsedData.slice(0, cellIdx).forEach(c => {
        if (c.type === 'code') {
          c.source.split('\n').forEach(line => {
            if (line.trim().startsWith('import ') || line.trim().startsWith('from ')) {
              prevImports.push(line.trim());
            }
          });
        }
      });

      const promptContext = buildNotebookContext(currentCell.index, currentCell.source, currentCell.outputText, prevImports);
      
      const result = await ai.explainCell(promptContext);
      const explanation = result?.answer || "The AI could not find a clear answer. Try rephrasing your question.";
      
      setNotebookExplanations(prev => ({
        ...prev,
        [cellIdx]: explanation
      }));
    } catch (e) {
      console.error(e);
      setToastMessage("Failed to explain cell.");
    } finally {
      setExplainingCellIdx(null);
    }
  };

  // Explain all code cells sequentially
  const handleExplainAll = async () => {
    if (ai.status !== 'ready') {
      setToastMessage("Load AI Models first to explain code cells.");
      return;
    }

    const codeCells = parsedData.map((cell, idx) => ({ cell, idx })).filter(item => item.cell.type === 'code');
    if (codeCells.length === 0) return;

    setExplainAllProgress({ current: 0, total: codeCells.length });

    for (let i = 0; i < codeCells.length; i++) {
      const { cell, idx } = codeCells[i];
      // Skip if already explained
      if (notebookExplanations[idx]) {
        setExplainAllProgress(prev => ({ ...prev, current: i + 1 }));
        continue;
      }

      setExplainingCellIdx(idx);
      setExplainAllProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        const prevImports = [];
        parsedData.slice(0, idx).forEach(c => {
          if (c.type === 'code') {
            c.source.split('\n').forEach(line => {
              if (line.trim().startsWith('import ') || line.trim().startsWith('from ')) {
                prevImports.push(line.trim());
              }
            });
          }
        });

        const promptContext = buildNotebookContext(cell.index, cell.source, cell.outputText, prevImports);
        const result = await ai.explainCell(promptContext);
        const explanation = result?.answer || "The AI could not explain this cell clearly.";

        setNotebookExplanations(prev => ({
          ...prev,
          [idx]: explanation
        }));
      } catch (err) {
        console.error(`Error explaining cell ${idx}:`, err);
      }
    }

    setExplainingCellIdx(null);
    setExplainAllProgress(null);
    setToastMessage("Finished explaining all code cells! 🎉");
  };

  const handleExportPDF = async () => {
    if (!file) return;
    setToastMessage("Generating PDF report... 📄");
    
    // Package stats
    let stats = {};
    let sessionItems = [];

    if (fileType === 'csv') {
      stats = {
        totalRows: parsedData.edaResult?.overview?.totalRows,
        totalCols: parsedData.edaResult?.overview?.totalCols
      };
      sessionItems = chatHistory;
    } else if (fileType === 'pdf') {
      stats = {
        pageCount: parsedData.pageCount,
        wordCount: parsedData.wordCount,
        paragraphs: parsedData.paragraphs.length
      };
      sessionItems = chatHistory;
    } else if (fileType === 'ipynb') {
      stats = {
        totalCells: parsedData.length,
        codeCells: parsedData.filter(c => c.type === 'code').length
      };
      sessionItems = parsedData
        .filter(c => c.type === 'code')
        .map((c) => ({
          index: c.index,
          cellType: c.type,
          explanation: notebookExplanations[c.index]
        }))
        .filter(item => item.explanation);
    }

    // Get chart elements by referencing ref array
    const chartDoms = chatHistory.map((_, i) => messageRefs.current[i] || null);

    try {
      await exportSessionReport(file.name, fileType, stats, sessionItems, chartDoms);
      setToastMessage("Report downloaded successfully!");
    } catch (e) {
      setToastMessage("PDF Generation failed: " + e.message);
        }
  }

  const handleLoadSample = (type) => {
    if (type === 'csv') {
      const csvContent = "Month,Revenue,Profit,Units,Category,Region\n" +
        "Jan,1200,300,50,Hardware,East\n" +
        "Feb,1500,450,60,Software,East\n" +
        "Mar,2000,700,80,Hardware,West\n" +
        "Apr,1800,500,75,Software,West\n" +
        "May,2200,800,90,Hardware,North\n" +
        "Jun,2500,1000,110,Software,North\n" +
        "Jul,2100,650,85,Hardware,South\n" +
        "Aug,2800,1100,120,Software,South\n" +
        "Sep,2400,900,95,Hardware,East\n" +
        "Oct,2600,1050,105,Software,West\n" +
        "Nov,3100,1300,130,Hardware,North\n" +
        "Dec,3500,1600,150,Software,South";
      const mockFile = new File([csvContent], "sample_sales_report.csv", { type: "text/csv" });
      handleFileSelect(mockFile);
    } else if (type === 'pdf') {
      const mockFile = { name: "sample_ai_report.pdf", size: 4500 };
      const mockData = {
        fullText: "Title: Local AI RAG Architecture Analysis\n\nAbstract:\nThis study evaluates the latency and performance metrics of running large language models locally in web browsers using ONNX Runtime Web and WebAssembly. Modern browser sandboxes allow executing quantized transformer weights entirely on the client, removing server cost and keeping data 100% private.\n\nMethodology & Web Workers:\nTo prevent the main browser UI thread from freezing, the model execution pipeline is loaded inside an asynchronous Web Worker. Prompt context retrieval uses paragraph-level TF-IDF overlap scoring, selecting the top 3 highest-ranking text blocks (limited to 1500 characters) to pass to the generative Qwen1.5 model.\n\nResults & Metrics:\nInitial download latency ranges from 10 to 30 seconds to fetch the 350MB model. However, subsequent inference is instant due to local Web Cache API storage. Word generation rates range between 12 and 18 tokens per second on consumer CPUs, making local browser AI highly practical for text mining.\n\nKey Conclusions & Compliance:\nThe offline-first approach guarantees client-side data sovereignty and eliminates network latency bottlenecks. The system adheres fully to open-source guidelines by leveraging Apache-2.0 and MIT-licensed software frameworks.",
        paragraphs: [
          "Title: Local AI RAG Architecture Analysis",
          "Abstract:\nThis study evaluates the latency and performance metrics of running large language models locally in web browsers using ONNX Runtime Web and WebAssembly. Modern browser sandboxes allow executing quantized transformer weights entirely on the client, removing server cost and keeping data 100% private.",
          "Methodology & Web Workers:\nTo prevent the main browser UI thread from freezing, the model execution pipeline is loaded inside an asynchronous Web Worker. Prompt context retrieval uses paragraph-level TF-IDF overlap scoring, selecting the top 3 highest-ranking text blocks (limited to 1500 characters) to pass to the generative Qwen1.5 model.",
          "Results & Metrics:\nInitial download latency ranges from 10 to 30 seconds to fetch the 350MB model. However, subsequent inference is instant due to local Web Cache API storage. Word generation rates range between 12 and 18 tokens per second on consumer CPUs, making local browser AI highly practical for text mining.",
          "Key Conclusions & Compliance:\nThe offline-first approach guarantees client-side data sovereignty and eliminates network latency bottlenecks. The system adheres fully to open-source guidelines by leveraging Apache-2.0 and MIT-licensed software frameworks."
        ],
        pageCount: 2,
        wordCount: 218
      };
      fileHandler.loadSessionData(mockFile, 'pdf', mockData);
    } else if (type === 'ipynb') {
      const mockFile = { name: "sample_data_analysis.ipynb", size: 3000 };
      const mockData = [
        {
          index: 0,
          type: 'markdown',
          source: "# On-Device AI Heuristics Analysis\nThis notebook demonstrates local machine learning executions using Python pandas and numpy libraries.",
          outputs: [],
          hasOutputs: false,
          outputText: ''
        },
        {
          index: 1,
          type: 'code',
          source: "import numpy as np\nimport pandas as pd\n\n# Create a mock dataframe\ndata = np.random.randn(100, 3)\ndf = pd.DataFrame(data, columns=['A', 'B', 'C'])\nprint(df.describe())",
          outputs: [{ text: "                A           B           C\ncount  100.000000  100.000000  100.000000\nmean    -0.038102    0.052812   -0.012083\nstd      0.985102    1.023812    0.952901\nmin     -2.312940   -2.102381   -2.823901\nmax      2.502842    2.650284    2.190283" }],
          hasOutputs: true,
          outputText: "                A           B           C\ncount  100.000000  100.000000  100.000000\nmean    -0.038102    0.052812   -0.012083\nstd      0.985102    1.023812    0.952901\nmin     -2.312940   -2.102381   -2.823901\nmax      2.502842    2.650284    2.190283"
        },
        {
          index: 2,
          type: 'code',
          source: "correlation = df.corr()\nprint(correlation)",
          outputs: [{ text: "          A         B         C\nA  1.000000  0.082910 -0.119203\nB  0.082910  1.000000  0.052912\nC -0.119203  0.052912  1.000000" }],
          hasOutputs: true,
          outputText: "          A         B         C\nA  1.000000  0.082910 -0.119203\nB  0.082910  1.000000  0.052912\nC -0.119203  0.052912  1.000000"
        },
        {
          index: 3,
          type: 'code',
          source: "from sklearn.linear_model import LinearRegression\n\n# Fit simple regression\nX = df[['A', 'B']]\ny = df['C']\nmodel = LinearRegression().fit(X, y)\nprint(f'Intercept: {model.intercept_:.4f}')\nprint(f'Coefficients: {model.coef_}')",
          outputs: [{ text: "Intercept: -0.0142\nCoefficients: [-0.1182  0.0489]" }],
          hasOutputs: true,
          outputText: "Intercept: -0.0142\nCoefficients: [-0.1182  0.0489]"
        }
      ];
      fileHandler.loadSessionData(mockFile, 'ipynb', mockData);
    }
  }

  const handleClearSession = async () => {
    await clearSession()
    fileHandler.clearFile()
    setChatHistory([])
    setSuggestedQuestions([])
    setCsvSummary('')
    setNotebookExplanations({})
    setActiveTab('chat')
    setToastMessage("Session cleared successfully.")
  }

  const tabs = fileType === 'csv'
    ? [
        { id: 'chat', icon: MessageSquare, label: 'Data Chat' },
        { id: 'table', icon: Table, label: 'Data Explorer' },
        { id: 'eda', icon: Search, label: 'EDA Copilot' }
      ]
    : fileType === 'ipynb'
    ? [
        { id: 'notebook', icon: BookOpen, label: 'Notebook Explainer' }
      ]
    : fileType === 'pdf'
    ? [
        { id: 'pdf-chat', icon: MessageSquare, label: 'Doc Chat' },
        { id: 'pdf-summary', icon: FileText, label: 'Doc Summary' }
      ]
    : [];

    return (
    <div className="h-screen flex flex-col bg-white dark:bg-zinc-950 overflow-hidden font-sans">
      {/* Header: shows grid-pattern background only when transparent at top (no file, not scrolled)
           so the 32px grid tiles seamlessly into the scrollable body grid beneath it */}
      <header className={`flex-shrink-0 h-16 transition-all duration-300 relative z-20 ${
        !file && !scrolled
          ? 'grid-pattern opacity-100 border-b border-transparent'
          : 'border-b border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl shadow-sm'
      }`}>
        <div className={`h-full flex items-center justify-between w-full ${!file ? 'max-w-6xl mx-auto px-4 sm:px-6' : 'px-6'}`}>
          <div className="flex items-center gap-4">
            {/* Home Button */}
            <button
              onClick={() => navigate('/')}
              className={`flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors ${
                !file 
                  ? 'xl:absolute xl:left-8 xl:top-1/2 xl:-translate-y-1/2' 
                  : ''
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Home</span>
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                <svg className="w-7 h-7 text-zinc-900 dark:text-zinc-50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
                  <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" opacity="0.4" />
                  <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" opacity="0.75" />
                </svg>
              </div>
              <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50">DataSense</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {ai.status !== 'ready' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                <span>AI Loading</span>
              </div>
            )}

            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="w-9 h-9 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-300"
            >
              <div className={`transition-transform duration-500 ease-out ${theme === 'dark' ? 'rotate-90' : 'rotate-0'}`}>
                {theme === 'dark'
                  ? <Sun className="w-4 h-4" strokeWidth={1.5} />
                  : <Moon className="w-4 h-4" strokeWidth={1.5} />
                }
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Models Loading Status Banner */}
      <ModelStatusBanner status={ai.status} progress={ai.progress} error={ai.error} loadModels={ai.loadModels} modelCached={ai.modelCached} />

      {/* Main Panel Layout */}
      {fileParsing ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-zinc-950">
          <div className="p-4 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mb-4 animate-spin">
            <RefreshCw className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />
          </div>
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Parsing uploaded document...</p>
          <p className="text-xs text-zinc-400 mt-1">Analyzing schemas, text content structure, and metadata locally</p>
        </div>
            ) : !file ? (
        <EmptyDropZone onFileSelect={handleFileSelect} fileError={fileError} onLoadSample={handleLoadSample} onScroll={(e) => setScrolled(e.target.scrollTop > 10)} />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar with Premium Glassmorphism */}
          <aside className="w-72 flex-shrink-0 border-r border-zinc-200/80 dark:border-zinc-800/80 flex flex-col bg-zinc-50/40 dark:bg-zinc-950/40 backdrop-blur-2xl hidden md:flex relative z-10">
            <div className="p-5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/20 dark:bg-zinc-900/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-zinc-950 dark:bg-white flex items-center justify-center text-white dark:text-zinc-950 shadow-sm">
                  <Database className="w-3.5 h-3.5" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Active Workspace</span>
              </div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 truncate" title={file.name}>{file.name}</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              
              {fileType === 'csv' && parsedData?.columns && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Columns & Types</span>
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {parsedData.columns.map((col) => {
                      const type = parsedData.columnTypes[col];
                      return (
                        <div key={col} className="group flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/80 dark:bg-zinc-900/50 border border-zinc-150 dark:border-zinc-800/60 shadow-sm hover:shadow hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-default">
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white truncate max-w-[130px]" title={col}>{col}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-extrabold uppercase tracking-wider ${
                            type === 'numeric' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30' :
                            type === 'date' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30' :
                            'bg-zinc-50 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400 border border-zinc-150 dark:border-zinc-700/50'
                          }`}>{type === 'numeric' ? 'NUM' : type === 'date' ? 'DATE' : 'TEXT'}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {fileType === 'ipynb' && parsedData && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/70 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-800/80 shadow-sm space-y-3">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">Cells Overview</span>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                      <div className="flex justify-between py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-355">
                        <span>Total Cells</span>
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-50">{parsedData.length}</span>
                      </div>
                      <div className="flex justify-between py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-355">
                        <span>Code Cells</span>
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-50">{parsedData.filter(c => c.type === 'code').length}</span>
                      </div>
                      <div className="flex justify-between py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-355">
                        <span>Markdown Cells</span>
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-50">{parsedData.filter(c => c.type === 'markdown').length}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleExplainAll}
                    disabled={explainAllProgress !== null || ai.status !== 'ready'}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-850 dark:hover:bg-zinc-100 disabled:opacity-50 text-xs font-extrabold shadow hover:shadow-md transition-all hover:scale-[1.01]"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{explainAllProgress ? "Explaining..." : "Explain All Cells"}</span>
                  </button>

                  {explainAllProgress && (
                    <div className="space-y-1.5 bg-white/70 dark:bg-zinc-900/40 p-3 rounded-xl border border-zinc-150 dark:border-zinc-800/80">
                      <div className="flex justify-between text-[9px] font-black text-zinc-500 uppercase tracking-wider">
                        <span>Progress</span>
                        <span>{explainAllProgress.current} / {explainAllProgress.total}</span>
                      </div>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-zinc-900 dark:bg-white h-full transition-all" style={{ width: `${(explainAllProgress.current / explainAllProgress.total) * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {fileType === 'pdf' && parsedData && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/70 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-800/80 shadow-sm space-y-3">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">Document Stats</span>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                      <div className="flex justify-between py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-355">
                        <span>Pages</span>
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-50">{parsedData.pageCount}</span>
                      </div>
                      <div className="flex justify-between py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-355">
                        <span>Word Count</span>
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-50">{parsedData.wordCount?.toLocaleString() || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-355">
                        <span>Paragraphs</span>
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-50">{parsedData.paragraphs?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Clear and export CTA */}
            <div className="p-4 border-t border-zinc-200/85 dark:border-zinc-800/85 bg-zinc-50/20 dark:bg-zinc-900/20 space-y-2">
              <button
                onClick={handleExportPDF}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-extrabold rounded-full bg-zinc-900 hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 shadow hover:shadow-md transition-all hover:scale-[1.01]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF Report</span>
              </button>
              <button
                onClick={handleClearSession}
                className="w-full py-2.5 px-3 text-sm font-bold text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                Clear Session
              </button>
            </div>
          </aside>

          {/* Main workspace panels */}
          <main className="flex-1 flex flex-col overflow-hidden bg-transparent z-10 relative">
            
            {/* Tabs */}
            <div className="flex-shrink-0 border-b border-zinc-200 dark:border-zinc-850 px-4 flex items-center justify-between bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
              <div className="flex items-center gap-4">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-1.5 py-2.5 text-xs font-extrabold uppercase tracking-wider transition-all ${
                        activeTab === tab.id
                          ? 'text-zinc-900 dark:text-zinc-100'
                          : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                      {/* Active indicator */}
                      {activeTab === tab.id && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 dark:bg-white rounded-t-full shadow-[0_0_8px_rgba(0,0,0,0.3)] dark:shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Workspace file badge on the right of the tab row */}
              {file && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-[11px] font-medium text-zinc-700 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800/80 shadow-sm select-none my-1 flex-shrink-0 animate-fade-in">
                  <FileText className="w-3 h-3 text-zinc-400" />
                  <span className="truncate max-w-[140px] font-semibold">{file.name}</span>
                  <button
                    onClick={handleClearSession}
                    className="text-zinc-400 hover:text-zinc-750 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 p-0.5 rounded-full transition-colors ml-0.5"
                    title="Clear Session"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            
            {/* CSV & PDF: Data Chat Pane */}
            {(activeTab === 'chat' || activeTab === 'pdf-chat') && (fileType === 'csv' || fileType === 'pdf') && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {chatHistory.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center gap-6 max-w-xl mx-auto py-12 group">
                      <div className="icon-box glow group-hover:bg-zinc-900 dark:group-hover:bg-white transition-colors duration-300 w-16 h-16 rounded-2xl shadow-xl">
                        <MessageSquare className="w-7 h-7 text-zinc-600 dark:text-zinc-400 group-hover:text-white dark:group-hover:text-zinc-900 transition-colors duration-300" strokeWidth={1.5} />
                      </div>
                      <div className="text-center">
                        <h3 className="font-black text-zinc-900 dark:text-zinc-100 text-xl tracking-tight mb-2">Ask questions about your {fileType === 'pdf' ? 'document' : 'data'}</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                          AI processes metadata and paragraph summaries locally. Your raw values are never transmitted.
                        </p>
                      </div>

                      {(fileType === 'csv' || fileType === 'pdf') && suggestedQuestions.length > 0 && (
                        <div className="flex flex-wrap gap-2.5 justify-center mt-6 w-full max-w-2xl">
                          {suggestedQuestions.map((q) => (
                            <button
                              key={q}
                              onClick={() => handleSendQuestion(q)}
                              className="px-4 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 text-xs font-semibold hover:border-zinc-400 dark:hover:border-zinc-500 shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer text-left max-w-full truncate backdrop-blur-md"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {chatHistory.map((msg, i) => (
                    <div key={i} className="space-y-2.5 animate-fade-in">
                      {/* Question bubble */}
                      <div className="flex justify-end">
                        <div className="w-fit max-w-[80%] px-4 py-2.5 rounded-2xl text-[14px] sm:text-[15px] font-semibold leading-relaxed bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-tr-sm shadow-md">
                          {msg.question}
                        </div>
                      </div>

                      {/* Answer bubble */}
                      <div className="flex justify-start">
                        <div className="w-fit max-w-[90%] md:max-w-[580px] p-3.5 sm:p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl rounded-tl-sm text-[14px] sm:text-[15px] leading-relaxed space-y-3 shadow-sm">
                          {msg.loading ? (
                            <div className="flex items-center gap-2.5 text-zinc-400">
                              <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" />
                              <span className="font-semibold font-mono text-xs animate-pulse">Running local model inference...</span>
                            </div>
                          ) : (
                            <>
                              <div className="font-medium text-zinc-850 dark:text-zinc-200 whitespace-pre-wrap space-y-2">
                                {msg.answer.split('\n').map((line, li) => {
                                  const parts = line.split(/\*\*(.+?)\*\*/g);
                                  return (
                                    <p key={li} className={line.startsWith('-') ? 'ml-2' : ''}>
                                      {parts.map((part, pi) =>
                                        pi % 2 === 1
                                          ? <strong key={pi} className="text-zinc-950 dark:text-zinc-50">{part}</strong>
                                          : part
                                      )}
                                    </p>
                                  );
                                })}
                              </div>

                              {msg.chartType && msg.chartData && (
                                <div
                                  ref={el => messageRefs.current[i] = el}
                                  className="pt-4 border-t border-zinc-150 dark:border-zinc-800/80 space-y-2"
                                >
                                  <SVGChart type={msg.chartType} data={msg.chartData} />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div ref={chatEndRef} />
                </div>

                {/* Question submission panel */}
                <div className="flex-shrink-0 border-t border-zinc-200/80 dark:border-zinc-800/80 p-4 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md z-10">
                  <div className="max-w-4xl mx-auto flex gap-3.5 items-end">
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendQuestion()
                        }
                      }}
                      placeholder={fileType === 'pdf' ? "Ask anything about this document..." : "Ask anything about your data (e.g. what is the average revenue?)..."}
                      rows={1}
                      className="flex-1 resize-none rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 px-5 py-3.5 text-[15px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                    />
                    <button
                      onClick={() => handleSendQuestion()}
                      disabled={!chatInput.trim()}
                      className="w-12 h-12 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-20 disabled:cursor-not-allowed hover:scale-[1.03] active:scale-95 transition-all flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* CSV: Data Explorer Tab */}
            {activeTab === 'table' && fileType === 'csv' && parsedData && (
              <div className="flex-1 flex flex-col overflow-hidden bg-transparent p-6">
                <div className="panel-card !p-0 flex-1 flex flex-col overflow-hidden animate-fade-in shadow-xl">
                  <div className="flex-shrink-0 px-8 py-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
                    <div>
                      <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Interactive Data Explorer</h4>
                      <p className="text-sm font-medium text-zinc-500 mt-1">Displaying the first 50 rows of {file.name}</p>
                    </div>
                    <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
                      {parsedData.rows.length} rows x {parsedData.columns.length} columns
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto bg-white/70 dark:bg-zinc-950/70 backdrop-blur-sm">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-left font-mono">
                      <thead className="bg-zinc-50/90 dark:bg-zinc-900/90 sticky top-0 font-sans z-10 backdrop-blur-md">
                        <tr>
                          {parsedData.columns.map((col) => (
                            <th key={col} className="px-6 py-4 font-black text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800 whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
                        {parsedData.rows.slice(0, 50).map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors group">
                            {parsedData.columns.map((col) => {
                              const val = row[col];
                              return (
                                <td key={col} className="px-6 py-3.5 text-[13px] font-medium text-zinc-700 dark:text-zinc-400 truncate max-w-[220px] group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                                {val === null || val === undefined ? (
                                  <span className="text-red-400/80 dark:text-red-500/50 italic text-[10px]">null</span>
                                ) : (
                                  String(val)
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </div>
              </div>
            )}

            {/* CSV: EDA Copilot Tab */}
            {activeTab === 'eda' && fileType === 'csv' && parsedData?.edaResult && (
              <div className="flex-1 overflow-y-auto bg-zinc-50/30 dark:bg-zinc-950/30 grid-pattern-scroll font-sans">
                <div className="max-w-5xl mx-auto p-6 sm:p-8 space-y-8 animate-fade-in">
                  
                  {/* Page Header */}
                  <div className="flex items-start justify-between gap-4 flex-wrap pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">EDA Copilot</span>
                      </div>
                      <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Exploratory Data Analysis</h2>
                      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Automated statistical insights for <span className="font-semibold text-zinc-800 dark:text-zinc-300">{file.name}</span>
                      </p>
                    </div>
                    {!pdfSummary && !pdfSummaryLoading && (
                      <button
                        onClick={triggerPDFSummaryManual}
                        disabled={ai.status !== 'ready'}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        <span>Generate AI Summary</span>
                      </button>
                    )}
                  </div>

                  {/* AI Summary Banner */}
                  {pdfSummaryLoading && (
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-indigo-150 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-950/20 animate-pulse">
                      <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin flex-shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-indigo-800 dark:text-indigo-300">Synthesizing dataset insights...</p>
                        <p className="text-[11px] text-indigo-500/80 dark:text-indigo-400/60">Using local AI model to synthesize EDA tables</p>
                      </div>
                    </div>
                  )}
                  {pdfSummary && (
                    <div className="p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 bg-gradient-to-br from-indigo-50/20 via-violet-50/20 to-transparent dark:from-indigo-950/10 dark:via-violet-950/5 dark:to-transparent shadow-sm space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-indigo-500" />
                        <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">AI Executive Summary</span>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap">{pdfSummary}</p>
                    </div>
                  )}

                  {/* Overview Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Rows', value: parsedData.edaResult.overview.totalRows.toLocaleString(), color: 'from-blue-500 to-indigo-500', icon: '📋' },
                      { label: 'Total Columns', value: parsedData.edaResult.overview.totalCols, color: 'from-violet-500 to-purple-600', icon: '🗂️' },
                      { label: 'Numeric Features', value: parsedData.edaResult.overview.numericCount, color: 'from-amber-500 to-orange-500', icon: '🔢' },
                      { label: 'Categorical Features', value: parsedData.edaResult.overview.categoricalCount, color: 'from-emerald-500 to-teal-500', icon: '🏷️' }
                    ].map((kpi, idx) => (
                      <div key={idx} className="p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm cursor-default hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                        <span className="text-lg">{kpi.icon}</span>
                        <p className={`text-xl sm:text-2xl font-black bg-gradient-to-r ${kpi.color} bg-clip-text text-transparent mt-2`}>{kpi.value}</p>
                        <p className="text-[10px] sm:text-xs font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5">{kpi.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Data Health & Numeric stats two-column */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Missing Values Card */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                      <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/20 dark:bg-zinc-950/20">
                        <h4 className="text-xs sm:text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Missing Values Analysis</h4>
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">Total Missing: {parsedData.edaResult.overview.totalMissing}</span>
                      </div>
                      <div className="p-4 overflow-y-auto max-h-[300px] divide-y divide-zinc-100 dark:divide-zinc-850">
                        {Object.entries(parsedData.edaResult.missingAnalysis).map(([col, meta]) => (
                          <div key={col} className="py-2.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200 truncate">{col}</span>
                                {meta.flag && (
                                  <span className="text-[8px] font-extrabold px-1 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">HIGH</span>
                                )}
                              </div>
                              <div className="w-full bg-zinc-100 dark:bg-zinc-850 h-1 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${meta.percentage > 20 ? 'bg-red-500' : meta.percentage > 5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${Math.min(meta.percentage, 100)}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-mono">{meta.percentage.toFixed(1)}%</span>
                              <p className="text-[9px] text-zinc-400 font-mono">{meta.count} missing</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Numeric Statistics Card */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                      <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20">
                        <h4 className="text-xs sm:text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Descriptive Statistics</h4>
                      </div>
                      <div className="p-4 overflow-y-auto max-h-[300px] space-y-3">
                        {Object.keys(parsedData.edaResult.numericStats).length === 0 ? (
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 italic py-4 text-center">No numerical features found.</p>
                        ) : Object.entries(parsedData.edaResult.numericStats).map(([col, stats]) => (
                          <div key={col} className="p-3 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-150/60 dark:border-zinc-800/80 rounded-xl space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{col}</span>
                              {stats.outlierCount > 0 && (
                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400">
                                  {stats.outlierCount} outliers
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-4 gap-1 text-center font-mono">
                              {[
                                { l: 'MIN', v: stats.min !== undefined ? Number(stats.min).toFixed(1) : '—' },
                                { l: 'MEAN', v: stats.mean !== undefined ? Number(stats.mean).toFixed(1) : '—' },
                                { l: 'MED', v: stats.median !== undefined ? Number(stats.median).toFixed(1) : '—' },
                                { l: 'MAX', v: stats.max !== undefined ? Number(stats.max).toFixed(1) : '—' }
                              ].map((item, idx) => (
                                <div key={idx} className="p-1 rounded bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850">
                                  <span className="text-[8px] text-zinc-400 block">{item.l}</span>
                                  <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">{item.v}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Categorical Breakdown */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20">
                      <h4 className="text-xs sm:text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Categorical Distributions</h4>
                    </div>
                    <div className="p-5">
                      {Object.keys(parsedData.edaResult.categoricalStats).length === 0 ? (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 italic text-center">No categorical features found.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[360px] overflow-y-auto pr-1">
                          {Object.entries(parsedData.edaResult.categoricalStats).map(([col, stats]) => {
                            const barColors = ['bg-indigo-400', 'bg-blue-400', 'bg-cyan-400', 'bg-teal-400', 'bg-emerald-400'];
                            return (
                              <div key={col} className="p-4 bg-zinc-50/40 dark:bg-zinc-900/20 border border-zinc-100 dark:border-zinc-850 rounded-xl space-y-2.5">
                                <div className="flex justify-between items-center gap-2">
                                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{col}</span>
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">{stats.uniqueCount} val</span>
                                </div>
                                <div className="space-y-2">
                                  {stats.topValues.slice(0, 5).map((valMeta, idx) => {
                                    const pct = (valMeta.count / parsedData.rows.length) * 100;
                                    return (
                                      <div key={idx} className="space-y-1">
                                        <div className="flex justify-between items-center text-[10px] sm:text-xs">
                                          <span className="text-zinc-650 dark:text-zinc-300 truncate max-w-[120px]">{valMeta.value || 'null'}</span>
                                          <span className="font-bold text-zinc-500 dark:text-zinc-400 font-mono">{pct.toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                                          <div className={`h-full ${barColors[idx % barColors.length]}`} style={{ width: `${pct}%` }} />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Correlation Matrix */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20">
                      <h4 className="text-xs sm:text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Correlation Heatmap</h4>
                    </div>
                    <div className="p-5">
                      {Object.keys(parsedData.edaResult.correlationMatrix).length === 0 ? (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 italic text-center">Correlation matrix requires at least 2 numerical features.</p>
                      ) : (
                        <div className="space-y-4">
                          <div className="overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-1 text-xs font-mono text-center">
                              <thead>
                                <tr>
                                  <th className="text-left text-[10px] font-bold text-zinc-400 uppercase tracking-wider pb-2 pr-3 font-sans">Column</th>
                                  {Object.keys(parsedData.edaResult.correlationMatrix).map(col => (
                                    <th key={col} className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 pb-2 px-1 font-sans min-w-[50px] truncate max-w-[80px]" title={col}>
                                      {col.length > 7 ? col.slice(0, 6) + '…' : col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(parsedData.edaResult.correlationMatrix).map(([rowCol, targets]) => (
                                  <tr key={rowCol}>
                                    <td className="text-left text-[11px] font-bold text-zinc-700 dark:text-zinc-350 pr-3 font-sans truncate max-w-[110px] py-1.5">{rowCol}</td>
                                    {Object.keys(parsedData.edaResult.correlationMatrix).map(col => {
                                      const r = targets[col];
                                      const isSelf = rowCol === col;
                                      const absVal = Math.abs(r);
                                      const bgClass = isSelf ? 'bg-zinc-150 dark:bg-zinc-800'
                                        : r > 0.6 ? 'bg-emerald-100 dark:bg-emerald-950/40'
                                        : r < -0.6 ? 'bg-red-100 dark:bg-red-900/40'
                                        : absVal > 0.3 ? 'bg-amber-50 dark:bg-amber-900/20'
                                        : 'bg-zinc-50 dark:bg-zinc-900/30';
                                      const textClass = isSelf ? 'text-zinc-400 dark:text-zinc-500'
                                        : r > 0.6 ? 'text-emerald-700 dark:text-emerald-300 font-extrabold'
                                        : r < -0.6 ? 'text-red-600 dark:text-red-400 font-extrabold'
                                        : 'text-zinc-650 dark:text-zinc-400';
                                      return (
                                        <td key={col} className={`px-2 py-1.5 rounded-md ${bgClass} ${textClass} text-[11px] font-bold`} title={`${rowCol} × ${col}: ${r.toFixed(4)}`}>
                                          {r.toFixed(2)}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Legend */}
                          <div className="flex items-center gap-4 flex-wrap pt-2 text-[10px] text-zinc-400">
                            {[
                              { label: 'Positive (r > 0.6)', bg: 'bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200/50' },
                              { label: 'Negative (r < -0.6)', bg: 'bg-red-100 dark:bg-red-900/40 border border-red-200/50' },
                              { label: 'Moderate (|r| > 0.3)', bg: 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50' }
                            ].map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1">
                                <span className={`w-2.5 h-2.5 rounded-sm ${item.bg}`} />
                                <span>{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* PDF: Document Summary Tab */}
            {activeTab === 'pdf-summary' && fileType === 'pdf' && parsedData && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-transparent font-sans">
                {/* AI Summary Card */}
                {pdfSummaryLoading ? (
                  <div className="flex items-center gap-2.5 p-3.5 text-xs text-zinc-500 font-semibold bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-800/80 rounded-xl">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-450" />
                    <span>Synthesizing document text with local Qwen summary model...</span>
                  </div>
                ) : pdfSummary ? (
                  <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/50 pb-2 mb-1.5">
                      <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Document Summary</span>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap">
                      {pdfSummary}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-800/60">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-650 dark:text-zinc-400">
                      <Cpu className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                      <span>Generate an AI-powered plain English analysis of this document.</span>
                    </div>
                    <button
                      onClick={triggerPDFSummaryManual}
                      disabled={ai.status !== 'ready'}
                      className="px-4 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-extrabold shadow hover:scale-[1.01] active:scale-95 transition-all flex-shrink-0"
                    >
                      Generate Summary
                    </button>
                  </div>
                )}

                {/* Readable Document Paragraphs */}
                <div className="panel-card space-y-4">
                  <div>
                    <span className="section-label block mb-1">Document Content</span>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Extracted Text Segments</h3>
                  </div>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {parsedData.paragraphs.map((p, pIdx) => (
                      <div key={pIdx} className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/20 text-[14px] text-zinc-750 dark:text-zinc-300 leading-relaxed">
                        <span className="font-mono text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Paragraph {pIdx + 1}</span>
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notebook Explainer Tab */}
            {activeTab === 'notebook' && fileType === 'ipynb' && parsedData && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-transparent">
                {parsedData.map((cell, idx) => (
                  <div key={idx} className="panel-card !p-0 overflow-hidden animate-fade-in flex flex-col">
                    
                    {/* Cell Header */}
                    <div className="px-4 py-2 border-b border-zinc-200/80 dark:border-zinc-800/80 flex justify-between items-center bg-zinc-50/30 dark:bg-zinc-900/10 backdrop-blur-sm">
                      <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono">Cell [{cell.index + 1}] · {cell.type}</span>
                      
                      {cell.type === 'code' && (
                        <button
                          onClick={() => handleExplainCell(idx)}
                          disabled={explainingCellIdx === idx || ai.status !== 'ready'}
                          className="flex items-center gap-1.5 text-xs font-bold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-3.5 py-1 rounded-full hover:bg-zinc-850 dark:hover:bg-zinc-100 disabled:opacity-35 shadow-sm transition-all active:scale-95"
                        >
                          {explainingCellIdx === idx ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin text-zinc-300" />
                              <span>Thinking...</span>
                            </>
                          ) : notebookExplanations[idx] ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-550" />
                              <span className="text-emerald-600 dark:text-emerald-450 font-extrabold">Explained</span>
                            </>
                          ) : (
                            <>
                              <Cpu className="w-3 h-3 text-zinc-400" />
                              <span>Explain Cell</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Cell Content */}
                    <div className="p-4 space-y-3">
                      {cell.type === 'markdown' ? (
                        // Markdown Cell View with proper heading styles and font size
                        <div className="text-[13px] sm:text-sm text-zinc-650 dark:text-zinc-350 leading-relaxed font-sans">
                          {cell.source.split('\n').map((line, lIdx) => {
                            if (line.trim().startsWith('#')) {
                              const match = line.match(/^(#{1,6})\s+(.*)$/);
                              if (match) {
                                const level = match[1].length;
                                const text = match[2];
                                if (level === 1) {
                                  return <h1 key={lIdx} className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mt-2 mb-1.5 font-sans">{text}</h1>;
                                } else if (level === 2) {
                                  return <h2 key={lIdx} className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight mt-1.5 mb-1 font-sans">{text}</h2>;
                                } else {
                                  return <h3 key={lIdx} className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1 mb-1 font-sans">{text}</h3>;
                                }
                              }
                              const headingText = line.replace(/#/g, '').trim();
                              return <h3 key={lIdx} className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1 mb-1 font-sans">{headingText}</h3>;
                            }
                            return <p key={lIdx} className="mb-1.5 last:mb-0 leading-relaxed">{line}</p>;
                          })}
                        </div>
                      ) : (
                        // Code Cell View
                        <div className="space-y-4">
                          <pre className="p-4 rounded-xl bg-zinc-900 dark:bg-zinc-900/80 border border-zinc-800 text-[13px] text-zinc-100 dark:text-zinc-200 overflow-x-auto font-mono leading-relaxed shadow-inner">
                            <code>{cell.source}</code>
                          </pre>

                          {/* Cell Output if present */}
                          {cell.hasOutputs && cell.outputText && (
                            <div className="p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/25 border border-zinc-150 dark:border-zinc-800">
                              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-2">Terminal Output</span>
                              <pre className="text-[12px] text-zinc-700 dark:text-zinc-355 overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed">{cell.outputText}</pre>
                            </div>
                          )}

                          {/* Explanation Box */}
                          <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10">
                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-2">AI Explanation</span>
                            {notebookExplanations[idx] ? (
                              <p className="text-[14px] sm:text-[15px] font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed animate-fade-in">{notebookExplanations[idx]}</p>
                            ) : (
                              <p className="text-xs sm:text-sm text-zinc-400 italic">No explanation generated yet. Click "Explain Cell" or "Explain All Cells" to run analysis.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </main>
        </div>
      )}



    </div>
  )
}
