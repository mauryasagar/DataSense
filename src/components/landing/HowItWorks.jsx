import { FileUp, Cpu, MessageSquare, BarChart3 } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: FileUp,
    title: 'Drop your CSV.',
    description: 'Drag and drop any CSV file. Your data is parsed instantly in the browser — it never touches a server.',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'AI loads locally.',
    description: 'A compact language model (Qwen2.5-Coder) downloads once and runs entirely in your browser via WebAssembly.',
  },
  {
    number: '03',
    icon: MessageSquare,
    title: 'Ask in plain English.',
    description: 'Type any question — "What\'s the average salary by department?" — and the AI translates it to SQL that runs locally.',
  },
  {
    number: '04',
    icon: BarChart3,
    title: 'Get charts + answers.',
    description: 'Results appear instantly as beautiful charts with plain English explanations. Export your session as a PDF.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <p className="section-label mb-4">HOW IT WORKS</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Four steps, total insight.
          </h2>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.number} className="relative group">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-5 border-t border-dashed border-zinc-200 dark:border-zinc-700 z-10" />
                )}

                <div className="h-full p-6 rounded-2xl border border-zinc-100 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/40 hover:border-zinc-200 dark:hover:border-zinc-600">
                  {/* Step number */}
                  <div className="text-5xl font-black text-zinc-100 dark:text-zinc-700 mb-4 leading-none select-none">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="icon-box mb-4">
                    <Icon className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
