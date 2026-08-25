import Image from 'next/image'

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#7B1C1C' }} className="text-white mt-16">
      <div className="w-full px-6 lg:px-12 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
          
          {/* Column 1: School Information */}
          <div>
            <h3 className="font-bold text-base mb-2" style={{ color: 'var(--school-gold)' }}>
              Isabela East Central Elementary School
            </h3>
            <p className="text-rose-100 text-sm leading-relaxed">
              DepEd Division of Isabela City<br />
              Region IX – Zamboanga Peninsula
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-bold text-base mb-2" style={{ color: 'var(--school-gold)' }}>Quick Links</h3>
            <ul className="text-rose-100 text-sm space-y-1">
              <li><a href="/enrolpage" className="hover:text-white transition-colors">Enrollment Data</a></li>
              <li><a href="/nspage" className="hover:text-white transition-colors">Nutritional Status</a></li>
              <li><a href="/activities" className="hover:text-white transition-colors">News &amp; Events</a></li>
              <li><a href="/mooepage" className="hover:text-white transition-colors">MOOE Report</a></li>
              <li><a href="/orgchartpage" className="hover:text-white transition-colors">Directory</a></li>
            </ul>
          </div>

          {/* Column 3: DepEd Links */}
          <div>
            <h3 className="font-bold text-base mb-2" style={{ color: 'var(--school-gold)' }}>DepEd Links</h3>
            <ul className="text-rose-100 text-sm space-y-1">
              <li>
                <a 
                  href="https://www.deped.gov.ph" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-white transition-colors whitespace-nowrap"
                >
                  DepEd Central Office
                </a>
              </li>
              <li>
                <a 
                  href="https://region9.deped.gov.ph" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-white transition-colors whitespace-nowrap"
                >
                  DepEd Region IX (RO IX)
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Pulsating Glowing Logo Badges */}
          <div className="flex items-center gap-4 lg:justify-end">
            
            {/* DepEd Logo */}
            <div className="relative group flex items-center justify-center">
              {/* Pulsating Glowing Aura */}
              <div className="absolute inset-0 rounded-full bg-amber-400/40 blur-md animate-pulse group-hover:bg-amber-300/80 group-hover:blur-lg transition-all duration-500" />
              
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                <Image 
                  src="/deped.png" 
                  alt="DepEd Logo" 
                  fill 
                  className="object-contain drop-shadow-[0_0_10px_rgba(245,166,35,0.7)]" 
                />
              </div>
            </div>

            {/* SDO Logo */}
            <div className="relative group flex items-center justify-center">
              {/* Pulsating Glowing Aura with Staggered Pulse */}
              <div className="absolute inset-0 rounded-full bg-amber-400/40 blur-md animate-pulse [animation-delay:400ms] group-hover:bg-amber-300/80 group-hover:blur-lg transition-all duration-500" />
              
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                <Image 
                  src="/sdo.png" 
                  alt="SDO Isabela City Logo" 
                  fill 
                  className="object-contain drop-shadow-[0_0_10px_rgba(245,166,35,0.7)]" 
                />
              </div>
            </div>

            {/* Swabe Logo */}
            <div className="relative group flex items-center justify-center">
              {/* Pulsating Glowing Aura with Staggered Pulse */}
              <div className="absolute inset-0 rounded-full bg-amber-400/40 blur-md animate-pulse [animation-delay:800ms] group-hover:bg-amber-300/80 group-hover:blur-lg transition-all duration-500" />
              
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                <Image 
                  src="/swabe.png" 
                  alt="Swabe Logo" 
                  fill 
                  className="object-contain drop-shadow-[0_0_10px_rgba(245,166,35,0.7)]" 
                />
              </div>
            </div>

          </div>

        </div>

        <div className="border-t border-white/20 mt-8 pt-6 text-center text-xs text-rose-200">
          © {new Date().getFullYear()} Isabela East Central Elementary School · SDO Isabela City
        </div>
      </div>
    </footer>
  )
}
