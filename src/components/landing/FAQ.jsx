import { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: 'Is my data safe?',
    a: 'Absolutely. DataSense runs 100% in your browser. Your CSV is parsed locally using JavaScript — it never leaves your device, never touches a server, and is never sent to any AI API. You can verify this yourself by opening DevTools → Network tab and watching zero AI requests get made as you interact with your data.',
  },
  {
    q: 'Does it work offline?',
    a: 'Yes! Once the AI model has been downloaded (a one-time ~300MB download), DataSense works entirely offline. The SQL engine (DuckDB-WASM) is also fully local. You can turn off your Wi-Fi and everything keeps working — perfect for fieldwork, travel, or air-gapped environments.',
  },
  {
    q: 'What file formats are supported?',
    a: 'Currently DataSense supports CSV files. We are working on adding Excel (.xlsx), JSON, and TSV support. Any CSV exported from Excel, Google Sheets, pandas, R, or any database tool will work perfectly.',
  },
  {
    q: 'How is this different from ChatGPT or Claude?',
    a: 'ChatGPT and Claude send your data to cloud servers for processing — a serious concern for sensitive or proprietary datasets. DataSense runs entirely locally in your browser. Additionally, DataSense runs real SQL queries via DuckDB-WASM on your actual data, so answers are always accurate — not hallucinated.',
  },
  {
    q: 'Is it free and open source?',
    a: 'Yes — completely. DataSense is MIT-licensed open source software built for OSDHack 2026. There are no subscriptions, no API keys required, and no sign-up. Fork it, modify it, deploy it — it\'s yours.',
  },
]

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <div className={`border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-800/60 transition-all duration-200 ${isOpen ? 'border-zinc-300 dark:border-zinc-600' : ''}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors duration-150"
      >
        <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100 pr-4">
          {item.q}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-zinc-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-zinc-900 dark:text-zinc-100' : ''}`}
        />
      </button>
      <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
        <div className="px-6 pb-5 text-zinc-500 dark:text-zinc-300 text-sm leading-relaxed">
          {item.a}
        </div>
      </div>
    </div>
  )
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)
  const faqRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (faqRef.current && !faqRef.current.contains(event.target)) {
        setOpenIndex(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <section id="faq" className="py-28 px-4 bg-zinc-50/60 dark:bg-zinc-900/40">
      <div className="max-w-3xl mx-auto" ref={faqRef}>
        <div className="text-center mb-16">
          <p className="section-label mb-4">FAQ</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Questions, answered.
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map((item, i) => (
            <FAQItem
              key={i}
              item={item}
              isOpen={openIndex === i}
              onToggle={(e) => {
                e.stopPropagation()
                setOpenIndex(openIndex === i ? null : i)
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
