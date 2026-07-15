import { X, Check } from 'lucide-react'

const rows = [
  { label: 'Data Privacy' },
  { label: 'Works Offline' },
  { label: 'No API Key Required' },
  { label: 'Safe for Sensitive Data' },
  { label: 'No Subscription' },
  { label: 'No File Upload' },
  { label: 'Instant — No Wait' },
  { label: 'Fully Open Source' },
]

export default function Comparison() {
  return (
    <section className="py-28 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="section-label mb-4">WHY DATASENSE</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Unlike cloud AI tools.
          </h2>
          <p className="mt-4 text-zinc-500 dark:text-zinc-400 text-lg max-w-lg mx-auto">
            Your data analyst that respects your privacy — because it never sees your data.
          </p>
        </div>

        {/* Comparison table */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm dark:shadow-zinc-950/60">
          {/* Header row */}
          <div className="grid grid-cols-3 bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700">
            <div className="py-4 px-6 text-sm font-semibold text-zinc-500 dark:text-zinc-300">
              Feature
            </div>
            <div className="py-4 px-6 text-sm font-semibold text-zinc-400 dark:text-zinc-400 text-center border-l border-zinc-200 dark:border-zinc-700">
              Cloud AI Tools
            </div>
            <div className="py-4 px-6 text-sm font-bold text-zinc-900 dark:text-zinc-50 text-center border-l border-zinc-200 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-700/50">
              DataSense ✦
            </div>
          </div>

          {/* Data rows */}
          {rows.map((row) => (
            <div
              key={row.label}
              className={`grid grid-cols-3 border-b border-zinc-100 dark:border-zinc-700/60 last:border-0 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/50 transition-colors duration-150`}
            >
              <div className="py-4 px-6 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                {row.label}
              </div>
              <div className="py-4 px-6 flex items-center justify-center border-l border-zinc-100 dark:border-zinc-700/60">
                <div className="cross-badge">
                  <X className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                </div>
              </div>
              <div className="py-4 px-6 flex items-center justify-center border-l border-zinc-100 dark:border-zinc-700/60 bg-zinc-50/50 dark:bg-zinc-700/20">
                <div className="check-badge">
                  <Check className="w-3.5 h-3.5 text-white dark:text-zinc-900" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500 mt-6">
          ✦ DataSense uses on-device AI via{' '}
          <span className="font-mono text-zinc-700 dark:text-zinc-300">Transformers.js</span> and{' '}
          <span className="font-mono text-zinc-700 dark:text-zinc-300">DuckDB-WASM</span>
        </p>
      </div>
    </section>
  )
}
