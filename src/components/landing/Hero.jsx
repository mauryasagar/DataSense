import { useNavigate } from 'react-router-dom'
import { Upload, Play, ShieldOff } from 'lucide-react'
export default function Hero() {
  const navigate = useNavigate()

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 grid-pattern opacity-60 dark:opacity-100 pointer-events-none" />

      {/* Subtle radial gradient */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-zinc-100 dark:bg-zinc-900/60 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="badge mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-fast-pulse" />
          100% On-Device AI · No Cloud · No API Keys
        </div>

        {/* H1 */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.05] mb-6 animate-slide-up">
          Talk to your data, <br className="hidden sm:block" />
          <span className="gradient-text">not to the cloud.</span>
        </h1>

        {/* Subtext */}
        <p className="text-lg sm:text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          DataSense runs lightweight AI models locally in your browser. Drop any CSV to get instant charts and SQL-powered answers with absolute privacy.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => navigate('/app')}
            className="btn-primary flex items-center gap-2.5 px-8 py-4 text-base"
          >
            <Upload className="w-4 h-4" />
            Upload your CSV
          </button>
          <button
            onClick={() => navigate('/app')}
            className="btn-ghost flex items-center gap-2.5 px-8 py-4 text-base"
          >
            <Play className="w-4 h-4" />
            Watch demo
          </button>
        </div>

        {/* Privacy proof */}
        <div className="inline-flex items-center gap-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <ShieldOff className="w-4 h-4 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-mono text-zinc-600 dark:text-zinc-400">
            Open DevTools → Network → Ask anything → Zero AI requests to any server
          </span>
        </div>      {/* Schematic On-Device Flow Pipeline */}
      <div className="relative z-10 mt-16 w-full max-w-6xl mx-auto px-4 animate-float">
        <div className="flex flex-col lg:flex-row items-stretch justify-center gap-6">
          
          {/* 1. INPUT CARD */}
          <div className="flex-1 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white/50 dark:bg-zinc-900/30 p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 dark:bg-white flex items-center justify-center">
                  <svg className="w-5 h-5 text-white dark:text-zinc-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Local CSV File</h3>
                  <p className="text-xs text-zinc-500 font-sans">Input data stream</p>
                </div>
              </div>
              
              <div className="space-y-3.5 text-sm text-zinc-600 dark:text-zinc-400">
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
                  <span className="text-zinc-400 dark:text-zinc-500">File Name</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">sales_report.csv</span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
                  <span className="text-zinc-400 dark:text-zinc-500">Total Rows</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">15,240 rows</span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
                  <span className="text-zinc-400 dark:text-zinc-500">Columns</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">8 headers</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 dark:text-zinc-500">File Size</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">4.8 MB</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              100% Client-side parsing
            </div>
          </div>
          
          {/* Connector 1 */}
          <div className="hidden lg:flex items-center justify-center">
            <svg className="w-6 h-6 text-zinc-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          
          {/* 2. COMPUTE BLOCK */}
          <div className="flex-1 border border-zinc-300 dark:border-zinc-700 rounded-2xl bg-zinc-950 dark:bg-zinc-900/60 p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between glow">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 to-transparent pointer-events-none" />
            
            <div>
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-mono font-bold tracking-wider text-white/50 dark:text-zinc-500 uppercase">Client-Side Runtime</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-[10px] font-mono text-orange-400 font-bold uppercase animate-pulse">
                  Sandbox Active
                </span>
              </div>
              
              <h3 className="text-sm font-bold text-white mb-2">WebAssembly Engine</h3>
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                Compiles data operations & runs local neural layers inside your browser tab's CPU sandbox.
              </p>
              
              <div className="space-y-3 font-sans text-xs">
                <div className="flex items-center gap-3 text-zinc-300">
                  <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-[10px] font-bold text-white font-mono">DB</div>
                  <div>
                    <div className="font-semibold text-white">DuckDB-WASM</div>
                    <div className="text-[10px] text-zinc-500 font-mono">In-memory column SQL at 1.2 GB/s</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-zinc-300">
                  <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-[10px] font-bold text-white font-mono">AI</div>
                  <div>
                    <div className="font-semibold text-white">Transformers.js</div>
                    <div className="text-[10px] text-zinc-500 font-mono font-sans">Local LLM executing text models</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-white/10 text-xs text-zinc-400 font-sans flex items-center justify-between">
              <span>Security: Sandbox isolation</span>
              <span className="text-orange-450 font-semibold">Zero Cloud Requests</span>
            </div>
          </div>
          
          {/* Connector 2 */}
          <div className="hidden lg:flex items-center justify-center">
            <svg className="w-6 h-6 text-zinc-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          
          {/* 3. OUTPUT BLOCK */}
          <div className="flex-1 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white/50 dark:bg-zinc-900/30 p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Local Output</h3>
                  <p className="text-xs text-zinc-400 font-sans">Rendered SQL results</p>
                </div>
              </div>
              
              <div className="border border-zinc-200 dark:border-zinc-800/80 rounded-xl bg-white dark:bg-zinc-900/80 p-3 shadow-md mb-3">
                <div className="text-[9px] font-mono text-zinc-500 dark:text-zinc-500 mb-2 pb-1.5 border-b border-zinc-100 dark:border-zinc-800/60">
                  SQL QUERY: SELECT dept, AVG(salary) ...
                </div>
                
                {/* Micro Chart */}
                <div className="flex items-end gap-2.5 h-16 mb-2">
                  {[
                    { label: 'Eng', val: 40 },
                    { label: 'Ops', val: 32 },
                    { label: 'Fin', val: 48 },
                    { label: 'Mkt', val: 24 },
                  ].map((bar) => (
                    <div key={bar.label} className="flex-1 flex flex-col items-center justify-end h-full">
                      <div
                        className="w-full bg-zinc-900 dark:bg-zinc-100 rounded-t-sm transition-all"
                        style={{ height: `${bar.val}px`, opacity: 0.3 + bar.val / 80 }}
                      />
                      <span className="text-[8px] text-zinc-400 font-mono mt-1">{bar.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans">
              ⚡ Output compiled locally in <span className="font-semibold text-zinc-900 dark:text-zinc-100">8.4ms</span>
            </div>
          </div>
          
        </div>
      </div>    </div>
    </section>
  )
}
