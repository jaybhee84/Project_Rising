'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

// Slideshow images array with landmark.png first, followed by s1.jpg, s2.jpg, s3.jpg
const LANDMARK_IMAGES = [
  { src: '/landmark.png', alt: 'Isabela East Central Elementary School Landmark' },
  { src: '/s1.jpg', alt: 'IECES Campus Feature 1' },
  { src: '/s2.jpg', alt: 'IECES Campus Feature 2' },
  { src: '/s3.jpg', alt: 'IECES Campus Feature 3' },
]

export default function HomePage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Automatically cycle through images every 5 seconds
  useEffect(() => {
    if (LANDMARK_IMAGES.length <= 1) return

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % LANDMARK_IMAGES.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#5C1313] text-white py-12 lg:py-20 border-b-4 border-[#F5A623]">
        
        {/* Right Side: Landmark Slideshow with Diagonal Cut */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-full lg:w-[48%] hidden lg:block z-0 pointer-events-none overflow-hidden"
          style={{
            clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)',
          }}
        >
          <div className="relative w-full h-full">
            {/* Crossfade Slideshow Stack */}
            {LANDMARK_IMAGES.map((image, index) => (
              <div
                key={image.src}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover object-center brightness-90"
                  priority={index === 0}
                />
              </div>
            ))}

            {/* Edge Fade Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#5C1313] via-transparent to-black/30 z-10" />

            {/* Slide Navigation Indicator Dots */}
            {LANDMARK_IMAGES.length > 1 && (
              <div className="absolute bottom-4 right-8 z-20 flex gap-2">
                {LANDMARK_IMAGES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all pointer-events-auto ${
                      idx === currentImageIndex 
                        ? 'bg-amber-400 w-6' 
                        : 'bg-white/50 hover:bg-white'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Far Left: Enlarged IECES Logo Watermark behind Principal */}
        <div className="absolute -left-20 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none hidden lg:block z-0">
          <Image 
            src="/ieceslogo.png" 
            alt="" 
            width={700} 
            height={700} 
            priority 
          />
        </div>

        {/* Full Width Grid Layout */}
        <div className="w-full px-6 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            {/* Far Left: Principal Glass Card */}
            <div className="hidden lg:flex lg:col-span-4 xl:col-span-3 justify-start">
              <div className="p-6 rounded-3xl bg-white/5 border border-white/20 backdrop-blur-md shadow-2xl flex flex-col items-center text-center w-full max-w-xs">
                
                {/* Principal Photo */}
                <div className="relative w-48 h-48 mb-4 rounded-full overflow-hidden border-4 border-amber-400 shadow-2xl">
                  <Image 
                    src="/principal.png" 
                    alt="Jocelyn R. Buenaventura, MaEd" 
                    fill
                    className="object-cover object-top"
                    priority
                  />
                </div>

                {/* Name & Title */}
                <h3 className="text-base sm:text-lg font-bold text-amber-300 leading-snug">
                  Jocelyn R. Buenaventura, MaEd
                </h3>
                <span className="text-[11px] text-slate-200 mt-1 font-semibold tracking-wider uppercase">
                  Principal I
                </span>
              </div>
            </div>

            {/* Middle Content Section */}
            <div className="lg:col-span-8 xl:col-span-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-amber-400 leading-[1.15] drop-shadow-md">
                Isabela East Central <br />
                Elementary School
              </h1>

              <p className="mt-6 text-slate-200 text-base sm:text-lg max-w-xl font-light leading-relaxed">
                Nurturing learners with excellence, integrity, and a commitment to holistic development in service of God, community, and country.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/enrollment"
                  className="px-6 py-3.5 rounded-lg bg-[#F5A623] hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-xl transition-all hover:scale-[1.02]"
                >
                  Enrollment Data →
                </Link>
                <Link
                  href="/nutritional-status"
                  className="px-6 py-3.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs uppercase tracking-wider backdrop-blur-md border border-white/20 transition-all"
                >
                  Nutritional Status
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="w-full px-6 lg:px-12 py-20">
        <div className="grid md:grid-cols-2 gap-10">
          
          {/* Mission Card */}
          <div className="p-10 bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-xl transition-shadow flex flex-col justify-center">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#7B1C1C] mb-5 border-b-2 border-amber-400/40 pb-3">
              Our Mission
            </h2>
            <p className="text-slate-700 text-base sm:text-lg leading-relaxed font-normal">
              To protect and promote the right of every Filipino to quality, equitable, culture-based, and complete basic education where students learn in a child-friendly, gender-sensitive, safe, and motivating environment.
            </p>
          </div>

          {/* Vision Card */}
          <div className="p-10 bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-xl transition-shadow flex flex-col justify-center">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0A192F] mb-5 border-b-2 border-amber-400/40 pb-3">
              Our Vision
            </h2>
            <p className="text-slate-700 text-base sm:text-lg leading-relaxed font-normal">
              We dream of Filipinos who passionately love their country and whose values and competencies enable them to realize their full potential and contribute meaningfully to building the nation.
            </p>
          </div>

        </div>
      </section>
    </div>
  )
}