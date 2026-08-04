import Link from 'next/link'

const modules = [
  {
    href: '/nutritional-status',
    icon: '🥗',
    title: 'Nutritional Status',
    desc: 'View aggregated BMI and nutritional status data per grade level. Includes SBFP feeding program coverage.',
    color: '#27AE60',
  },
  {
    href: '/enrollment',
    icon: '📋',
    title: 'Enrollment',
    desc: 'Current enrollment data by grade level and school year.',
    color: '#2980B9',
  },
  {
    href: '/org-chart',
    icon: '👥',
    title: 'Directory & Org Chart',
    desc: 'School organizational structure, administration, and teaching staff directory.',
    color: '#8E44AD',
  },
  {
    href: '/mooe',
    icon: '📊',
    title: 'MOOE Expenses',
    desc: 'Maintenance and Other Operating Expenses — liquidation reports and budget utilization.',
    color: '#E67E22',
  },
  {
    href: '/teachers',
    icon: '🎓',
    title: 'Teachers App',
    desc: 'Teacher portal for viewing class nutritional status and generating learner school IDs.',
    color: '#C0392B',
  },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section
        style={{ background: 'linear-gradient(135deg, var(--deped-blue) 0%, #2352A0 60%, #1a5276 100%)' }}
        className="relative overflow-hidden"
      >
        {/* Decorative sun watermark */}
        <div
          className="absolute right-0 top-0 w-96 h-96 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle, white 2px, transparent 2px)`,
            backgroundSize: '20px 20px',
            borderRadius: '50%',
            transform: 'translate(30%, -30%)',
          }}
        />

        <div className="max-w-6xl mx-auto px-4 py-20 relative z-10">
          <div className="max-w-3xl">
            <div
              className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
              style={{ backgroundColor: 'var(--deped-gold)', color: '#1a1a2e' }}
            >
              SDO Isabela City · Basilan · BARMM
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4">
              Isabela East Central<br />
              <span style={{ color: 'var(--deped-gold)' }}>Elementary School</span>
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed mb-8 max-w-xl">
              Nurturing learners with excellence, integrity, and a commitment to holistic development
              in service of God, community, and country.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/nutritional-status"
                className="px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--deped-gold)', color: '#1a1a2e' }}
              >
                View Nutritional Status →
              </Link>
              <Link
                href="/enrollment"
                className="px-5 py-2.5 rounded-lg font-semibold text-sm border border-white/30 text-white hover:bg-white/10 transition-all"
              >
                Enrollment Data
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section style={{ backgroundColor: 'var(--bg-soft)' }} className="py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm mb-4"
                style={{ backgroundColor: 'var(--deped-blue)' }}
              >
                M
              </div>
              <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--deped-blue)' }}>Mission</h2>
              <p className="text-gray-600 leading-relaxed text-sm">
                To protect and promote the right of every Filipino to quality, equitable, culture-based,
                and complete basic education where students learn in a child-friendly, gender-sensitive,
                safe, and motivating environment.
              </p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm mb-4"
                style={{ backgroundColor: 'var(--deped-gold)', color: '#1a1a2e' }}
              >
                V
              </div>
              <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--deped-blue)' }}>Vision</h2>
              <p className="text-gray-600 leading-relaxed text-sm">
                We dream of Filipinos who passionately love their country and whose values and competencies
                enable them to realize their full potential and contribute meaningfully to building the nation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-10">
            <h2 className="text-2xl font-black" style={{ color: 'var(--deped-blue)' }}>
              School Information Portal
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Transparent data and resources for the IECES community
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map(mod => (
              <Link
                key={mod.href}
                href={mod.href}
                className="group bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{ backgroundColor: mod.color + '15' }}
                >
                  {mod.icon}
                </div>
                <h3 className="font-bold text-base mb-2 group-hover:text-blue-700 transition-colors">
                  {mod.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{mod.desc}</p>
                <div
                  className="mt-4 text-xs font-semibold"
                  style={{ color: mod.color }}
                >
                  View →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
