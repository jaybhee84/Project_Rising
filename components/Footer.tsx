export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#7B1C1C' }} className="text-white mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-base mb-2" style={{ color: 'var(--school-gold)' }}>
              Isabela East Central Elementary School
            </h3>
            <p className="text-rose-100 text-sm leading-relaxed">
              DepEd Division of Isabela City, Basilan<br />
              Basilan Province, BARMM
            </p>
          </div>
          <div>
            <h3 className="font-bold text-base mb-2" style={{ color: 'var(--school-gold)' }}>Quick Links</h3>
            <ul className="text-rose-100 text-sm space-y-1">
              <li><a href="/enrolpage" className="hover:text-white transition-colors">Enrollment Data</a></li>
              <li><a href="/nspage" className="hover:text-white transition-colors">Nutritional Status</a></li>
              <li><a href="/activitiespage" className="hover:text-white transition-colors">News & Activities</a></li>
              <li><a href="/mooepage" className="hover:text-white transition-colors">MOOE Report</a></li>
              <li><a href="/orgchartpage" className="hover:text-white transition-colors">Directory</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-base mb-2" style={{ color: 'var(--school-gold)' }}>DepEd Links</h3>
            <ul className="text-rose-100 text-sm space-y-1">
              <li><a href="https://www.deped.gov.ph" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">DepEd Central Office</a></li>
              <li><a href="https://www.deped.gov.ph/barmm" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">DepEd BARMM</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/20 mt-8 pt-6 text-center text-xs text-rose-200">
          © {new Date().getFullYear()} Isabela East Central Elementary School · SDO Isabela City, Basilan
        </div>
      </div>
    </footer>
  )
}