import { MessageSquare, BarChart3, Search, ShieldOff, Download, WifiOff, Plane, Lock } from 'lucide-react'

const features = [
  {
    icon: MessageSquare,
    fn: 'askData()',
    title: 'Plain English Q&A',
    description: 'Ask any question about your data in natural language. No SQL knowledge needed. DataSense figures it out.',
    preview: (
      <div className="mt-3 space-y-2">
        <div className="text-[11px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-3 py-2">
          "Which city has the most sales?"
        </div>
        <div className="text-[11px] text-zinc-900 dark:text-zinc-100 font-medium bg-zinc-900/5 dark:bg-white/5 rounded-lg px-3 py-2 border border-zinc-200 dark:border-zinc-700">
          → Mumbai leads with 2,341 orders
        </div>
      </div>
    ),
  },
  {
    icon: BarChart3,
    fn: 'autoChart()',
    title: 'Smart Chart Generation',
    description: 'Charts appear automatically based on your question. Bar, line, scatter, pie — DataSense picks the right one.',
    preview: (
      <div className="mt-3 flex items-end gap-1.5 h-12">
        {[60, 85, 45, 70, 55, 90, 40].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm bg-zinc-900 dark:bg-zinc-100 transition-all"
            style={{
              height: `${h}%`,
              opacity: 0.2 + (h / 100) * 0.8
            }}
          />
        ))}
      </div>
    ),
  },
  {
    icon: Search,
    fn: 'exploreEDA()',
    title: 'Instant EDA Summary',
    description: 'On file load, get an automatic Exploratory Data Analysis — missing values, distributions, outliers, correlations.',
    preview: (
      <div className="mt-3 space-y-1.5">
        {[
          { label: 'Missing values', val: '2.3%' },
          { label: 'Outliers found', val: '14' },
          { label: 'Completeness', val: '97.7%' },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">{row.label}</span>
            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{row.val}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: ShieldOff,
    fn: 'stayPrivate()',
    title: 'Zero Data Exposure',
    description: 'Everything runs in your browser tab. Your CSV never touches a server. Open DevTools — zero outbound AI requests.',
    preview: (
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2 text-[11px] text-zinc-700 dark:text-zinc-300 font-mono bg-zinc-100 dark:bg-zinc-800/50 rounded-lg px-3 py-2 border border-zinc-200 dark:border-zinc-700/50">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
          0 network requests
        </div>
        <div className="flex items-center gap-2 text-[11px] text-zinc-700 dark:text-zinc-300 font-mono bg-zinc-100 dark:bg-zinc-800/50 rounded-lg px-3 py-2 border border-zinc-200 dark:border-zinc-700/50">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
          AI runs in WebAssembly
        </div>
      </div>
    ),
  },
  {
    icon: Download,
    fn: 'exportPDF()',
    title: 'PDF Export',
    description: 'Export your entire analysis session — questions, answers, and charts — as a polished PDF report.',
    preview: (
      <div className="mt-3 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 bg-zinc-50 dark:bg-zinc-800/50">
        <div className="text-[10px] text-zinc-500 mb-1.5 font-semibold">DataSense Report.pdf</div>
        <div className="space-y-1">
          {['Q&A Summary', 'Charts (3)', 'EDA Overview'].map(item => (
            <div key={item} className="flex items-center gap-1.5 text-[10px] text-zinc-500">
              <div className="w-4 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-sm" />
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: WifiOff,
    fn: 'goOffline()',
    title: 'Works Offline',
    description: 'Once the model loads, turn off your Wi-Fi. DataSense keeps working. Built for field work, travel, and air-gapped environments.',
    preview: (
      <div className="mt-3 flex items-center gap-3">
        {[
          { icon: Plane, l: 'Airplane mode' },
          { icon: WifiOff, l: 'No internet' },
          { icon: Lock, l: 'Air-gapped' }
        ].map((item, i) => {
          const Icon = item.icon
          return (
            <div key={i} className="flex-1 flex flex-col items-center">
              <Icon className="w-5 h-5 text-zinc-400 dark:text-zinc-500 mb-1" strokeWidth={1.5} />
              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center">{item.l}</div>
            </div>
          )
        })}
      </div>
    ),
  },
]

export default function FeatureCards() {
  return (
    <section id="features" className="py-28 px-4 bg-zinc-50/60 dark:bg-zinc-900/40">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <p className="section-label mb-4">FEATURES</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Everything your data needs.
          </h2>
          <p className="mt-4 text-zinc-500 dark:text-zinc-300 max-w-xl mx-auto text-lg">
            Six capabilities, zero cloud dependency.
          </p>
        </div>

        {/* 3×2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feat) => {
            const Icon = feat.icon
            return (
              <div key={feat.fn} className="feature-card group">
                {/* Icon */}
                <div className="icon-box mb-4 group-hover:bg-zinc-900 dark:group-hover:bg-white transition-colors duration-300">
                  <Icon className="w-5 h-5 text-zinc-600 dark:text-zinc-400 group-hover:text-white dark:group-hover:text-zinc-900 transition-colors duration-300" />
                </div>

                {/* Function name */}
                <div className="fn-name mb-1">{feat.fn}</div>

                {/* Title */}
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  {feat.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-zinc-500 dark:text-zinc-300 leading-relaxed">
                  {feat.description}
                </p>

                {/* Preview */}
                {feat.preview}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
