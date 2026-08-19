'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const LANDMARK_IMAGES = [
  { src: '/landmark.png', alt: 'Isabela East Central Elementary School Landmark' },
  { src: '/s1.jpg', alt: 'IECES Campus Feature 1' },
  { src: '/s2.jpg', alt: 'IECES Campus Feature 2' },
  { src: '/s3.jpg', alt: 'IECES Campus Feature 3' },
]

export default function HomePage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

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
      <section className="relative overflow-hidden bg-[#5C1313] text-white py-8 sm:py-12 lg:py-16 border-b-4 border-[#F5A623]">
        
        {/* Left Side: Background Video directly behind Principal */}
        <div className="absolute left-0 top-0 bottom-0 w-full lg:w-[52%] z-0 pointer-events-none overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover brightness-75 opacity-50"
          >
            <source src="https://nv3z9cmjl8zrr0z1.public.blob.vercel-storage.com/video.mp4" type="video/mp4" />
          </video>
          {/* Subtle gradient to seamlessly fade video into the center maroon background */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-[#5C1313]/40 to-[#5C1313]" />
        </div>

        {/* Right Side: Landmark Slideshow */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-full lg:w-[48%] hidden lg:block z-0 pointer-events-none overflow-hidden"
          style={{
            clipPath: 'polygon(12% 0, 100% 0, 100% 100%, 0% 100%)',
          }}
        >
          <div className="relative w-full h-full">
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

            <div className="absolute inset-0 bg-gradient-to-r from-[#5C1313] via-transparent to-black/30 z-10" />

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

        {/* Hero Main Content Container */}
        <div className="w-full px-4 sm:px-6 lg:px-12 relative z-10">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 lg:gap-6 max-w-full">
            
            {/* Principal Glass Card (Translucent & Unblurred) */}
            <div className="flex-shrink-0 w-full sm:w-72 lg:w-64">
              <div className="p-5 rounded-2xl bg-black/20 sm:bg-white/10 border border-white/25 shadow-2xl flex flex-col items-center text-center w-full">
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 mb-3 rounded-full overflow-hidden border-4 border-amber-400 shadow-xl">
                  <Image 
                    src="/principal.png" 
                    alt="Jocelyn R. Buenaventura, EdD" 
                    fill
                    className="object-cover object-top"
                    priority
                  />
                </div>

                <h3 className="text-xs sm:text-sm lg:text-base font-bold text-amber-300 leading-snug whitespace-nowrap">
                  Jocelyn R. Buenaventura, Ed.D.
                </h3>
                <span className="text-[10px] sm:text-[11px] text-slate-200 mt-0.5 font-semibold tracking-wider uppercase">
                  Principal I
                </span>
              </div>
            </div>

            {/* School Name & Mission Text Block */}
            <div className="flex-1 text-center lg:text-left min-w-0">
              <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-[2.25rem] xl:text-[2.65rem] font-serif font-bold tracking-tight text-amber-400 leading-none whitespace-nowrap drop-shadow-md">
                Isabela East Central Elementary School
              </h1>

              <p className="mt-3 text-slate-200 text-xs sm:text-sm lg:text-base font-light leading-relaxed max-w-xl mx-auto lg:mx-0 text-justify">
                Nurturing learners with excellence, integrity, and a commitment to holistic development in service of God, community, and country.
              </p>

              <div className="mt-5 flex flex-wrap justify-center lg:justify-start gap-3">
                <Link
                  href="/enrollment"
                  className="px-5 py-2.5 sm:py-3 rounded-lg bg-[#F5A623] hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-xl transition-all hover:scale-[1.02]"
                >
                  Enrollment Data →
                </Link>
                <Link
                  href="/nutritional-status"
                  className="px-5 py-2.5 sm:py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs uppercase tracking-wider border border-white/20 transition-all"
                >
                  Nutritional Status
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* Mobile Slideshow Banner (Below 1024px) */}
        <div className="mt-8 lg:hidden relative w-full h-56 sm:h-72 overflow-hidden border-t-2 border-amber-400/30">
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
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-[#5C1313] via-transparent to-transparent" />
        </div>

      </section>

      {/* Mission, Vision, & Core Values Section */}
      <section className="w-full px-4 sm:px-6 lg:px-12 py-12 sm:py-16">
        <div className="grid lg:grid-cols-3 gap-8 items-stretch">
          
          {/* Mission Card */}
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-xl transition-shadow flex flex-col justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#7B1C1C] mb-4 border-b-2 border-amber-400/40 pb-3">
                Our Mission
              </h2>
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-normal text-justify hyphens-auto">
                To protect and promote the right of every Filipino to quality, equitable, culture-based, and complete basic education where:
              </p>
              <ul className="mt-3 space-y-2 text-slate-700 text-sm leading-relaxed list-disc list-inside font-normal">
                <li>Students learn in a child-friendly, gender-sensitive, safe, and motivating environment.</li>
                <li>Teachers facilitate learning and constantly nurture every learner.</li>
                <li>Administrators and staff as stewards ensure an enabling environment.</li>
                <li>Family and stakeholders actively share responsibility for life-long learners.</li>
              </ul>
            </div>
          </div>

          {/* Vision Card */}
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-xl transition-shadow flex flex-col justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0A192F] mb-4 border-b-2 border-amber-400/40 pb-3">
                Our Vision
              </h2>
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-normal text-justify hyphens-auto">
                We dream of Filipinos who passionately love their country and whose values and competencies enable them to realize their full potential and contribute meaningfully to building the nation.
              </p>
              <p className="mt-4 text-slate-700 text-sm sm:text-base leading-relaxed font-normal text-justify hyphens-auto">
                As a learner-centered public institution, the Department of Education continuously improves itself to better serve its stakeholders.
              </p>
            </div>
          </div>

          {/* Core Values Card */}
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-xl transition-shadow flex flex-col justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#7B1C1C] mb-4 border-b-2 border-amber-400/40 pb-3">
                Our Core Values
              </h2>
              <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-4">
                DepEd National Standard
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
                <div className="p-3.5 bg-amber-50/60 border border-amber-200/60 rounded-xl text-center font-bold text-[#7B1C1C] text-sm sm:text-base">
                  Maka-Diyos
                </div>
                <div className="p-3.5 bg-amber-50/60 border border-amber-200/60 rounded-xl text-center font-bold text-[#7B1C1C] text-sm sm:text-base">
                  Maka-Tao
                </div>
                <div className="p-3.5 bg-amber-50/60 border border-amber-200/60 rounded-xl text-center font-bold text-[#7B1C1C] text-sm sm:text-base">
                  Makakalikasan
                </div>
                <div className="p-3.5 bg-amber-50/60 border border-amber-200/60 rounded-xl text-center font-bold text-[#7B1C1C] text-sm sm:text-base">
                  Makabansa
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  )
}
