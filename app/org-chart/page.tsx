import Link from 'next/link'

export default function DirectoryPage() {
  return (
    <div className="min-h-[80vh] bg-slate-50 flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full text-center p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xl">
        {/* Construction Icon Badge */}
        <div 
          style={{ backgroundColor: '#FFF5F5', color: '#7B1C1C' }}
          className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-4xl mb-6 shadow-inner border border-rose-100"
        >
          🚧
        </div>

        {/* Status Badge */}
        <div 
          style={{ backgroundColor: 'var(--school-gold)', color: '#0A192F' }}
          className="inline-block text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-4 shadow-sm"
        >
          Under Construction
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
          Directory & Organizational Chart
        </h1>

        {/* Description */}
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          We are currently updating the official staff directory and administrative organizational chart for Isabela East Central Elementary School. Please check back soon!
        </p>

        {/* Back to Home CTA */}
        <Link
          href="/"
          style={{ backgroundColor: '#0A192F' }}
          className="inline-flex items-center justify-center w-full py-3 px-6 rounded-xl text-white font-bold text-sm shadow-md transition-all hover:bg-slate-800 hover:scale-[1.01]"
        >
          ← Return to Home
        </Link>
      </div>
    </div>
  )
}