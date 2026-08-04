export default function Page() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <a href="/" className="hover:text-blue-600">Home</a>
        <span>/</span>
        <span>MOOE Expenses & Liquidation</span>
      </div>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4">📊</div>
        <h1 className="text-2xl font-black mb-2" style={{ color: 'var(--deped-blue)' }}>MOOE Expenses & Liquidation</h1>
        <p className="text-gray-500 max-w-md text-sm leading-relaxed">Budget utilization and liquidation reports will be published here.</p>
        <div className="mt-8 px-4 py-2 rounded-full text-xs font-semibold" style={{ backgroundColor: '#FDE68A', color: '#92400e' }}>
          🚧 Under Construction
        </div>
      </div>
    </div>
  )
}
