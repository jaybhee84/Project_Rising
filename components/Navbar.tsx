'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Activities', href: '/activities' },
    { name: 'Enrollment', href: '/enrollment' },
    { name: 'Nutritional Status', href: '/nutritional-status' },
    { name: 'MOOE', href: '/mooe' },
    { name: 'Org Chart', href: '/org-chart' },
  ]

  return (
    <header className="bg-[#7B1C1C] text-white shadow-xl sticky top-0 z-50 border-b-2 border-[#F5A623]/40 w-full">
      {/* Rainbow color-cycling glow keyframes matching the exact image outline */}
      <style jsx global>{`
        @keyframes rainbowGlow {
          0% {
            filter: drop-shadow(0 0 8px #F5A623) drop-shadow(0 0 16px #F5A623);
          }
          20% {
            filter: drop-shadow(0 0 8px #10B981) drop-shadow(0 0 16px #10B981);
          }
          40% {
            filter: drop-shadow(0 0 8px #38BDF8) drop-shadow(0 0 16px #38BDF8);
          }
          60% {
            filter: drop-shadow(0 0 8px #8B5CF6) drop-shadow(0 0 16px #8B5CF6);
          }
          80% {
            filter: drop-shadow(0 0 8px #F43F5E) drop-shadow(0 0 16px #F43F5E);
          }
          100% {
            filter: drop-shadow(0 0 8px #F5A623) drop-shadow(0 0 16px #F5A623);
          }
        }
        .flower-rainbow-glow {
          animation: rainbowGlow 5s infinite ease-in-out;
        }
      `}</style>

      <div className="w-full px-4 sm:px-6 lg:px-12 flex items-center justify-between h-20 sm:h-24">
        
        {/* Logo & School Title */}
        <Link href="/" className="flex items-center gap-3 sm:gap-4 group transition-all">
          
          {/* Logo with Rainbow Edge Glow */}
          <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 group-hover:scale-105 transition-transform">
            <div className="relative w-full h-full flower-rainbow-glow">
              <Image 
                src="/ieceslogo.png" 
                alt="IECES Seal" 
                fill 
                className="object-contain" 
                priority 
              />
            </div>
          </div>

          <div className="flex flex-col">
            <span className="font-serif font-bold text-sm sm:text-lg lg:text-xl tracking-normal text-white group-hover:text-amber-200 transition-colors leading-tight">
              Isabela East Central Elementary School
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[8px] sm:text-[10px] font-semibold tracking-widest text-amber-300 uppercase mt-0.5">
              <span>East District I</span>
              <span className="text-amber-400/50">•</span>
              <span>Division of Isabela City, Basilan</span>
            </div>
          </div>
        </Link>

        {/* Desktop Nav Navigation Menu */}
        <nav className="hidden md:flex items-center space-x-1.5 lg:space-x-2 text-xs font-bold uppercase tracking-wider">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-3 lg:px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                    : 'text-slate-100 hover:bg-white/10 hover:text-amber-300'
                }`}
              >
                {link.name}
              </Link>
            )
          })}
        </nav>

        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-lg text-amber-300 hover:bg-white/10 focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            {isOpen ? (
              <path fillRule="evenodd" clipRule="evenodd" d="M18.278 16.864a1 1 0 01-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 01-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 011.414-1.414l4.829 4.828 4.828-4.828a1 1 0 111.414 1.414l-4.828 4.829 4.828 4.828z" />
            ) : (
              <path fillRule="evenodd" d="M4 5h16a1 1 0 010 2H4a1 1 0 110-2zm0 6h16a1 1 0 010 2H4a1 1 0 010-2zm0 6h16a1 1 0 010 2H4a1 1 0 010-2z" />
            )}
          </svg>
        </button>

      </div>

      {/* Mobile Nav Menu Dropdown */}
      {isOpen && (
        <nav className="md:hidden bg-[#5C1313] px-4 pt-2 pb-4 space-y-1 border-t border-amber-400/20">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider ${
                  isActive
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-white hover:bg-white/10 hover:text-amber-300'
                }`}
              >
                {link.name}
              </Link>
            )
          })}
        </nav>
      )}
    </header>
  )
}