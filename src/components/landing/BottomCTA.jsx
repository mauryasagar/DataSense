import { useNavigate } from 'react-router-dom'
import { ArrowRight, FileText } from 'lucide-react'

export default function BottomCTA() {
  const navigate = useNavigate()

  return (
    <section className="py-24 px-4 bg-zinc-50/50 dark:bg-zinc-900/10 border-t border-zinc-100 dark:border-zinc-800/60">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
        {/* Left column: messaging */}
        <div className="flex-1 text-left">
          <h2 className="text-4xl sm:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight mb-4">
            Total privacy. <br />
            Instant insights.
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-md mb-8 leading-relaxed">
            No registration, no API keys, and no subscriptions. Start analyzing your sensitive datasets safely in seconds.
          </p>
          <button
            onClick={() => navigate('/app')}
            className="btn-primary inline-flex items-center gap-2.5 px-8 py-4 text-base"
          >
            Start analysing
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right column: premium mock data card */}
        <div className="w-full md:w-[420px] flex-shrink-0 relative group">
          {/* Decorative glowing gradient behind the card */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-[2rem] blur-2xl opacity-70 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
          
          <div className="relative border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 backdrop-blur-md rounded-[2.25rem] p-8 shadow-xl shadow-zinc-200/30 dark:shadow-none overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
            
            {/* Header / File Info */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center shadow-md">
                  <FileText className="w-5.5 h-5.5 text-white dark:text-zinc-900" />
                </div>
                <div>
                  <div className="text-sm font-black text-zinc-900 dark:text-zinc-50 tracking-tight">customer_churn.csv</div>
                  <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-semibold tracking-wide">4.2 MB · 12,450 rows</div>
                </div>
              </div>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
              </span>
            </div>

            {/* Mock Visualisation Section */}
            <div className="border border-zinc-100 dark:border-zinc-800/80 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/40 p-4 mb-6 relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Churn Risk Trend</span>
                <span className="text-[11px] font-extrabold text-zinc-900 dark:text-zinc-100">-12.4% (Good)</span>
              </div>
              
              {/* Smooth SVG Area Chart */}
              <div className="h-24 w-full flex items-end overflow-visible">
                <svg className="w-full h-full text-orange-500 overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(249, 115, 22)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="rgb(249, 115, 22)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d="M2 27 Q16 13, 30 18 T58 7 T86 11 T98 5 L98 30 L2 30 Z" fill="url(#chart-grad)" />
                  <path d="M2 27 Q16 13, 30 18 T58 7 T86 11 T98 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3.5 border border-zinc-100 dark:border-zinc-800/60 rounded-2xl bg-zinc-50/30 dark:bg-zinc-950/20">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">Local Processing</div>
                <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">100% On-Device</div>
              </div>
              <div className="p-3.5 border border-zinc-100 dark:border-zinc-800/60 rounded-2xl bg-zinc-50/30 dark:bg-zinc-950/20">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">AI Insights</div>
                <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">Local LLM Active</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
