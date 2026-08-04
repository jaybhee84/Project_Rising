'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navLinks = [
  { href: '/',                    label: 'Home' },
  { href: '/nutritional-status',  label: 'Nutritional Status' },
  { href: '/enrollment',          label: 'Enrollment' },
  { href: '/org-chart',           label: 'Directory' },
  { href: '/mooe',                label: 'MOOE' },
  { href: '/teachers',            label: 'Teachers' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <nav style={{ backgroundColor: 'var(--deped-blue)' }} className="sticky top-0 z-50 shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / School name */}
          <Link href="/" className="flex items-center gap-2 group">
            <div style={{ backgroundColor: 'var(--deped-gold)' }}
              className="w-9 h-9 rounded-full flex items-center justify-center font-black text-white text-sm flex-shrink-0">
              IE
            </div>
            <span className="text-white font-bold text-sm leading-tight hidden sm:block">
              Isabela East Central<br />
              <span className="font-normal text-xs opacity-80">Elementary School</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-white'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
                }`}
                style={pathname === link.href ? { backgroundColor: 'var(--deped-gold)', color: '#1a1a2e' } : {}}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <div className={`w-5 h-0.5 bg-white mb-1 transition-all ${open ? 'rotate-45 translate-y-1.5' : ''}`} />
            <div className={`w-5 h-0.5 bg-white mb-1 transition-all ${open ? 'opacity-0' : ''}`} />
            <div className={`w-5 h-0.5 bg-white transition-all ${open ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-3 border-t border-white/20 pt-2">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 rounded text-sm font-medium mb-1 ${
                  pathname === link.href
                    ? 'text-yellow-900'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
                style={pathname === link.href ? { backgroundColor: 'var(--deped-gold)' } : {}}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
