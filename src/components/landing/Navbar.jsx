import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Sun, Moon, Menu, X, ArrowRight } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function Navbar() {
  const { theme, toggle } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const navLinks = [
    { label: 'How it works', sectionId: 'how-it-works' },
    { label: 'Features', sectionId: 'features' },
    { label: 'FAQ', sectionId: 'faq' },
    { label: 'GitHub ↗', href: 'https://github.com/mauryasagar/DataSense', external: true },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800/70'
        : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
            <svg className="w-7 h-7 text-zinc-900 dark:text-zinc-50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
              <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" opacity="0.4" />
              <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" opacity="0.75" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50">
            DataSense
          </span>
        </Link>

        {/* Center nav — desktop */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link pb-0.5"
              >
                {link.label}
              </a>
            ) : (
              <button
                key={link.label}
                onClick={() => scrollToSection(link.sectionId)}
                className="nav-link pb-0.5 bg-transparent border-none cursor-pointer"
              >
                {link.label}
              </button>
            )
          )}
        </div>

        {/* Right: theme toggle + CTA */}
        <div className="hidden md:flex items-center gap-3">
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
          <button
            onClick={() => navigate('/app')}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            Try it free
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile: theme + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggle}
            className="w-9 h-9 flex items-center justify-center text-zinc-500 dark:text-zinc-400"
          >
            <div className={`transition-transform duration-500 ease-out ${theme === 'dark' ? 'rotate-90' : 'rotate-0'}`}>
              {theme === 'dark' ? <Sun className="w-4 h-4" strokeWidth={1.5} /> : <Moon className="w-4 h-4" strokeWidth={1.5} />}
            </div>
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 flex items-center justify-center text-zinc-500 dark:text-zinc-400"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-4 flex flex-col gap-3 animate-fade-in">
          {navLinks.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 py-2"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ) : (
              <button
                key={link.label}
                onClick={() => { scrollToSection(link.sectionId); setMenuOpen(false) }}
                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 py-2 text-left bg-transparent border-none cursor-pointer"
              >
                {link.label}
              </button>
            )
          )}
          <button
            onClick={() => { setMenuOpen(false); navigate('/app') }}
            className="btn-primary flex items-center justify-center gap-2 px-5 py-3 text-sm mt-2"
          >
            Try it free <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </nav>
  )
}
