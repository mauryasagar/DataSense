import { Link } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'

const REPO_URL = 'https://github.com/mauryasagar/DataSense'

const exploreLinks = [
  { label: 'How it works', sectionId: 'how-it-works' },
  { label: 'Features', sectionId: 'features' },
  { label: 'FAQ', sectionId: 'faq' },
]

const resourceLinks = [
  { label: 'GitHub Repository ↗', href: REPO_URL, external: true },
  { label: 'README ↗', href: `${REPO_URL}#readme`, external: true },
  { label: 'License (MIT) ↗', href: 'https://opensource.org/licenses/MIT', external: true },
]


export default function Footer() {
  const scrollToTop = () => {
    // Try the app page scrollable container first, then fall back to window
    const scrollContainer = document.querySelector('[data-scroll-container]') || document.querySelector('.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex-shrink-0 relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand column — spans 2 of 4 */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group w-fit">
              <div className="w-8 h-8 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                <svg className="w-6 h-6 text-zinc-900 dark:text-zinc-50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
                  <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" opacity="0.4" />
                  <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" opacity="0.75" />
                </svg>
              </div>
              <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50">
                DataSense
              </span>
            </Link>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-5">
              A browser-based, on-device AI data analysis tool. No cloud. No API keys. No sign-up.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-900/50 text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <span>MIT License</span>
              <span className="w-1 h-1 rounded-full bg-zinc-400" />
              <span>Open Source</span>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="section-label mb-4">EXPLORE</h4>
            <ul className="space-y-3">
              {exploreLinks.map(link => (
                <li key={link.label}>
                  <Link
                    to={`/#${link.sectionId}`}
                    onClick={(e) => {
                      const el = document.getElementById(link.sectionId)
                      if (el) {
                        e.preventDefault()
                        el.scrollIntoView({ behavior: 'smooth' })
                      }
                    }}
                    className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="section-label mb-4">RESOURCES</h4>
            <ul className="space-y-3">
              {resourceLinks.map(link => (
                <li key={link.label}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-150">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-center relative">
          <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
            © 2026 DataSense · Built for OSDHack 2026 Hackathon by OSDC
          </p>
          <button
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="absolute right-0 p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 hover:-translate-y-0.5"
          >
            <ArrowUp className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </footer>
  )
}
