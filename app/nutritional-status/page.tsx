'use client'
import { mockNutritionalData, nsColors, nsLabels, getPct, getTotals, SCHOOL_YEAR, QUARTER, FEEDING_PROGRAM, NSCategory } from '@/lib/mockData'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'

const NS_CATS: NSCategory[] = ['SW', 'W', 'N', 'OW', 'O']

export default function NutritionalStatusPage() {
  const totals = getTotals(mockNutritionalData)
  const totalMalnourished = totals.SW + totals.W

  // Pie chart data (overall)
  const pieData = NS_CATS.map(cat => ({
    name: nsLabels[cat],
    value: totals[cat],
    color: nsColors[cat],
  }))

  // Bar chart data per grade
  const barData = mockNutritionalData.map(row => ({
    grade: row.grade,
    SW: row.SW,
    W: row.W,
    N: row.N,
    OW: row.OW,
    O: row.O,
  }))

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <a href="/" className="hover:text-blue-600">Home</a>
          <span>/</span>
          <span>Nutritional Status</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black" style={{ color: 'var(--deped-blue)' }}>
          Nutritional Status Report
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {FEEDING_PROGRAM} · {SCHOOL_YEAR} · {QUARTER}
        </p>
        <div
          className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ backgroundColor: '#FDE68A', color: '#92400e' }}
        >
          ⚠️ Data shown is aggregated — no individual learner information is displayed
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total Learners', value: totals.total, color: 'var(--deped-blue)', bg: '#EFF6FF' },
          { label: 'SBFP Beneficiaries', value: totals.sbfpBeneficiaries, color: '#D97706', bg: '#FFFBEB' },
          { label: 'Malnourished (SW+W)', value: totalMalnourished, color: '#C0392B', bg: '#FEF2F2' },
          { label: 'Normal', value: totals.N, color: '#27AE60', bg: '#F0FDF4' },
        ].map(card => (
          <div key={card.label} className="rounded-xl p-5 border" style={{ backgroundColor: card.bg }}>
            <div className="text-2xl font-black" style={{ color: card.color }}>{card.value}</div>
            <div className="text-xs text-gray-500 mt-1 font-medium">{card.label}</div>
            <div className="text-xs font-semibold mt-1" style={{ color: card.color }}>
              {getPct(card.value, totals.total)}%
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Bar chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--deped-blue)' }}>
            Distribution by Grade Level
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="grade" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {NS_CATS.map(cat => (
                <Bar key={cat} dataKey={cat} stackId="a" fill={nsColors[cat]} name={nsLabels[cat]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--deped-blue)' }}>
            Overall Nutritional Status
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  name && percent !== undefined ? `${name.split(' ')[0]} ${(percent * 100).toFixed(1)}%` : ''
                }
                labelLine={false}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Learners']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-sm" style={{ color: 'var(--deped-blue)' }}>
            Detailed Breakdown by Grade Level
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--deped-blue)' }} className="text-white">
                <th className="text-left px-4 py-3 font-semibold text-xs">Grade Level</th>
                <th className="text-center px-3 py-3 font-semibold text-xs">Total</th>
                {NS_CATS.map(cat => (
                  <th key={cat} className="text-center px-3 py-3 font-semibold text-xs">
                    {cat}
                  </th>
                ))}
                <th className="text-center px-3 py-3 font-semibold text-xs">SBFP</th>
              </tr>
            </thead>
            <tbody>
              {mockNutritionalData.map((row, i) => (
                <tr key={row.grade} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-medium">{row.grade}</td>
                  <td className="px-3 py-3 text-center font-bold">{row.total}</td>
                  {NS_CATS.map(cat => (
                    <td key={cat} className="px-3 py-3 text-center">
                      <span className="font-semibold" style={{ color: nsColors[cat] }}>
                        {row[cat]}
                      </span>
                      <br />
                      <span className="text-xs text-gray-400">{getPct(row[cat], row.total)}%</span>
                    </td>
                  ))}
                  <td className="px-3 py-3 text-center">
                    <span className="font-semibold" style={{ color: '#D97706' }}>
                      {row.sbfpBeneficiaries}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr className="border-t-2 border-gray-300" style={{ backgroundColor: '#EFF6FF' }}>
                <td className="px-4 py-3 font-black text-xs uppercase tracking-wide" style={{ color: 'var(--deped-blue)' }}>
                  TOTAL
                </td>
                <td className="px-3 py-3 text-center font-black">{totals.total}</td>
                {NS_CATS.map(cat => (
                  <td key={cat} className="px-3 py-3 text-center">
                    <span className="font-bold" style={{ color: nsColors[cat] }}>
                      {totals[cat]}
                    </span>
                    <br />
                    <span className="text-xs text-gray-400">{getPct(totals[cat], totals.total)}%</span>
                  </td>
                ))}
                <td className="px-3 py-3 text-center font-bold" style={{ color: '#D97706' }}>
                  {totals.sbfpBeneficiaries}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Legend */}
        <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap gap-4">
          {NS_CATS.map(cat => (
            <div key={cat} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: nsColors[cat] }} />
              <span className="font-semibold">{cat}</span> — {nsLabels[cat]}
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        Data as of {QUARTER} · {SCHOOL_YEAR} · Source: IECES School Records
      </p>
    </div>
  )
}
