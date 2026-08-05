import Link from 'next/link'

const newsAndActivities = [
  {
    id: 1,
    title: 'Division Schools Press Conference (DSPC) Victories',
    category: 'Campus Journalism',
    date: 'August 2026',
    desc: 'Student journalists from Isabela East Central Elementary School earned top spots in News Writing, Editorial Writing, and Photojournalism during the annual Division Press Conference.',
    bgColor: 'bg-amber-100 text-amber-900',
    borderColor: 'border-amber-200',
    icon: '✍️',
    tag: 'Journalism',
  },
  {
    id: 2,
    title: 'School-Based Feeding Program (SBFP) Launch',
    category: 'Health & Nutrition',
    date: 'July 2026',
    desc: 'Official kickoff of the SBFP daily hot-meal distribution aimed at improving the health and academic engagement of targeted severely wasted and wasted learners.',
    bgColor: 'bg-emerald-100 text-emerald-900',
    borderColor: 'border-emerald-200',
    icon: '🥗',
    tag: 'Nutrition',
  },
  {
    id: 3,
    title: 'Annual Intramurals & Traditional Games',
    category: 'Sports & Culture',
    date: 'June 2026',
    desc: 'Pupils demonstrated teamwork, discipline, and sportsmanship across track and field events, volleyball, basketball, and traditional Larong Pinoy activities.',
    bgColor: 'bg-blue-100 text-blue-900',
    borderColor: 'border-blue-200',
    icon: '🏆',
    tag: 'Sports',
  },
  {
    id: 4,
    title: 'Brigada Eskwela & School Readiness Drive',
    category: 'Community Engagement',
    date: 'May 2026',
    desc: 'Teachers, parents, and community stakeholders collaborated to clean, repair, and prepare classroom facilities ahead of the new academic school year.',
    bgColor: 'bg-purple-100 text-purple-900',
    borderColor: 'border-purple-200',
    icon: '🧹',
    tag: 'Community',
  },
  {
    id: 5,
    title: 'National Reading Month Celebration',
    category: 'Academic & Literacy',
    date: 'April 2026',
    desc: 'Students engaged in book parades, storytelling sessions, and reading marathon challenges to promote early childhood literacy and comprehension skills.',
    bgColor: 'bg-rose-100 text-rose-900',
    borderColor: 'border-rose-200',
    icon: '📚',
    tag: 'Literacy',
  },
  {
    id: 6,
    title: 'Disaster Risk Reduction & Earthquake Drill',
    category: 'Safety & Preparedness',
    date: 'March 2026',
    desc: 'Facilitated quarterly evacuation and duck-cover-and-hold exercises in partnership with local emergency response units for campus safety.',
    bgColor: 'bg-amber-100 text-amber-900',
    borderColor: 'border-amber-200',
    icon: '🚨',
    tag: 'Safety Drive',
  },
]

export default function ActivitiesPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Hero Banner */}
        <div 
          style={{ background: 'linear-gradient(135deg, #7B1C1C 0%, #881337 50%, #4C0D15 100%)' }}
          className="rounded-3xl p-8 sm:p-12 text-white shadow-xl mb-12 relative overflow-hidden"
        >
          <div className="relative z-10 max-w-3xl">
            {/* Pill Badge */}
            <div 
              style={{ backgroundColor: 'var(--school-gold)', color: '#0A192F' }}
              className="inline-block text-xs font-black uppercase tracking-widest px-3.5 py-1 rounded-full mb-4 shadow-sm"
            >
              School Announcements & Events
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
              News, Activities & Campus Journalism
            </h1>

            <p className="text-rose-100 text-sm sm:text-base leading-relaxed opacity-90 max-w-2xl">
              Highlights from student journalism competitions, campus events, sports meets, and community engagement projects at Isabela East Central Elementary School.
            </p>
          </div>
        </div>

        {/* Featured Section Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-slate-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Campus Updates</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1" style={{ color: '#7B1C1C' }}>
              Recent School Highlights
            </h2>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-2 md:mt-0">
            Showcasing academic, cultural, and sports achievements across all grade levels.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {newsAndActivities.map((item) => (
            <article 
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
            >
              <div className="p-6">
                {/* Photo Placeholder Card */}
                <div 
                  style={{ backgroundColor: '#FFF5F5' }}
                  className="w-full h-48 rounded-xl mb-6 border border-rose-100 flex flex-col items-center justify-center text-slate-400 relative overflow-hidden group-hover:bg-rose-100/50 transition-colors"
                >
                  <span className="text-5xl mb-2 transition-transform group-hover:scale-110 duration-300">
                    {item.icon}
                  </span>
                  <span className="text-xs font-semibold text-rose-900/70 uppercase tracking-wider">
                    {item.tag} Photo Gallery
                  </span>
                </div>

                {/* Meta details */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${item.bgColor} ${item.borderColor} border`}>
                    {item.category}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    {item.date}
                  </span>
                </div>

                {/* Card Title */}
                <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug group-hover:text-rose-900 transition-colors">
                  {item.title}
                </h3>

                {/* Card Description */}
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  {item.desc}
                </p>
              </div>

              {/* Action Link Footer */}
              <div className="px-6 pb-6 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 group-hover:underline inline-flex items-center cursor-pointer">
                  Read Announcement 
                  <svg className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">SDO Isabela City</span>
              </div>
            </article>
          ))}
        </div>

        {/* Back to Home CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/"
            style={{ backgroundColor: '#0A192F' }}
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-white font-bold text-sm shadow-md transition-all hover:bg-slate-800 hover:scale-[1.01]"
          >
            ← Back to Home Page
          </Link>
        </div>

      </div>
    </div>
  )
}