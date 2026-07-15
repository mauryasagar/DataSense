import {
  FileSpreadsheet, FileText, Briefcase, Users, HeartPulse, DollarSign,
  Microscope, ClipboardList, GraduationCap, Box, Globe, LineChart,
  ShoppingCart, Dna, Cpu, Newspaper
} from 'lucide-react'

const items = [
  { icon: FileText, label: 'CSV Files' },
  { icon: FileSpreadsheet, label: 'Excel Sheets' },
  { icon: Briefcase, label: 'Sales Data' },
  { icon: Users, label: 'HR Reports' },
  { icon: HeartPulse, label: 'Medical Records' },
  { icon: DollarSign, label: 'Financial Data' },
  { icon: Microscope, label: 'Research Data' },
  { icon: ClipboardList, label: 'Survey Results' },
  { icon: GraduationCap, label: 'Student Grades' },
  { icon: Box, label: 'Product Inventory' },
  { icon: Globe, label: 'Web Analytics' },
  { icon: LineChart, label: 'Time Series' },
  { icon: ShoppingCart, label: 'Retail Data' },
  { icon: Dna, label: 'Genomics Data' },
  { icon: Cpu, label: 'IoT Sensor Data' },
  { icon: Newspaper, label: 'News Archives' },
]

function MarqueeRow({ reverse = false }) {
  const doubled = [...items, ...items]

  return (
    <div className="relative overflow-hidden">
      <div
        className={`flex gap-3 ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}
        style={{ width: 'max-content' }}
      >
        {doubled.map((item, i) => {
          const Icon = item.icon
          return (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-700/70 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap shadow-sm hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors duration-200 cursor-default select-none"
            >
              <Icon className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
              <span>{item.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Marquee() {
  return (
    <section className="py-16 overflow-hidden border-y border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/20">
      <div className="mb-3">
        <MarqueeRow />
      </div>
      <div>
        <MarqueeRow reverse />
      </div>

      {/* Fade edges */}
      <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-zinc-50 dark:from-zinc-950 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-zinc-50 dark:from-zinc-950 to-transparent pointer-events-none" />
    </section>
  )
}
