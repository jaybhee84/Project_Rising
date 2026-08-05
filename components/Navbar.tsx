'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

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
      {/* Full-width container across the screen */}
      <div className="w-full px-6 lg:px-12 flex items-center justify-between h-20 sm:h-24">
        
        {/* Far Left: Logo & School Name */}
        <Link href="/" className="flex items-center gap-3 sm:gap-4 group transition-all">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 drop-shadow-md group-hover:scale-105 transition-transform">
            <Image 
              src="/ieceslogo.png" 
              alt="IECES Seal" 
              fill 
              className="object-contain" 
              priority 
            />
          </div>

          <div className="flex flex-col">
            <span className="font-serif font-bold text-base sm:text-xl tracking-normal text-white group-hover:text-amber-200 transition-colors leading-tight">
              Isabela East Central Elementary School
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-semibold tracking-widest text-amber-300 uppercase mt-0.5">
              <span>East District I</span>
              <span className="text-amber-400/50">•</span>
              <span>Division of Isabela City, Basilan</span>
            </div>
          </div>
        </Link>

        {/* Far Right: Nav Menu Links */}
        <nav className="hidden lg:flex items-center space-x-2 text-xs font-bold uppercase tracking-wider">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-4 py-2 rounded-lg transition-all ${
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

      </div>
    </header>
  )
}