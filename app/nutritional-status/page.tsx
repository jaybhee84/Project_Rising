'use client'

import { useState, useEffect } from 'react'
import {
  fetchNutritionalData,
  nsColors,
  nsLabels,
  getPct,
  FEEDING_PROGRAM,
  type NSCategory,
  type GradeLevelData,
  type Totals,
  type Meta,
} from '@/lib/nutritionalData'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts'

const NS_CATS: NSCategory[] = ['SW', 'W', 'N', 'OW', 'O']

const EMPTY_TOTALS: Totals = { total: 0, SW: 0, W: 0, N: 0, OW: 0, O: 0, sbfpBeneficiaries: 0 }
const EMPTY_META: Meta     = { schoolYear: '', quarter: '', feedingProgram: FEEDING_PROGRAM, schoolName: '' }

export default function NutritionalStatusPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [rows, setRows]           = useState<GradeLevelData[]>([])
  const [totals, setTotals]       = useState<Totals>(EMPTY_TOTALS)
  const [meta, setMeta]           = useState<Meta>(EMPTY_META)

  useEffect(() => {
    setIsMounted(true)
    fetchNutritionalData()
      .then(({ nutritionalData, totals, meta }) => {
        setRows(nutritionalData)
        setTotals(totals)
        setMeta(meta)
        setLoading(false)
      })
      .catch((err: unknown) => {
        console.error(err)
        setError('Failed to load nutritional data. Check your Supabase config.')
        setLoading(false)
      })
  }, [])

  const totalMalnourished = totals.SW + totals.W

  const pieData = NS_CATS.map(cat => ({
    name:  nsLabels[cat],
    value: totals[cat],
    color: nsColors[cat],
  }))

  const barData = rows.map(row => ({
    grade: row.grade,
    SW: row.SW, W: row.W, N: row.N, OW: row.OW, O: row.O,
  }))

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Banner */}
      <section
        style={{ background: 'linear-gradient(135deg, #7B1C1C 0%, #881337 50%, #4C0D15 100%)' }}
        className="text-white py-12 px-4 sm:px-6 lg:px-8 shadow-md"
      >
        <div className="max-w-6xl mx-auto">
          <div
            style={{ backgroundColor: 'var(--school-gold, #F59E0B)', color: '#0A192F' }}
            className="inline-block text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-4 shadow-sm"
          >
            SDO Isabela City · Basilan · BARMM
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-2">
            Nutritional Status Report
          </h1>
          <p className="text-rose-100 text-sm sm:text-base opacity-90 max-w-2xl leading-relaxed">
            {meta.feedingProgram} · {meta.schoolYear} · {meta.quarter}
          </p>
          <div
            className="inline-flex items-center gap-1.5 mt-4 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm"
            style={{ backgroundColor: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }}
          >
            ⚠️ Data shown is aggregated — no individual learner information is displayed
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {loading && (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm font-medium">
            <svg className="animate-spin mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading nutritional data…
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700 mb-8">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {([
                { label: 'Total Learners',      value: totals.total,             color: '#0A192F', bg: '#F8FAFC' },
                { label: 'SBFP Beneficiaries',  value: totals.sbfpBeneficiaries, color: '#D97706', bg: '#FFFBEB' },
                { label: 'Malnourished (SW+W)', value: totalMalnourished,        color: '#C0392B', bg: '#FEF2F2' },
                { label: 'Normal Status',        value: totals.N,                 color: '#27AE60', bg: '#F0FDF4' },
              ] as const).map(card => (
                <div key={card.label} className="rounded-2xl p-5 border border-slate-200/80 shadow-sm" style={{ backgroundColor: card.bg }}>
                  <div className="text-2xl md:text-3xl font-black" style={{ color: card.color }}>{card.value}</div>
                  <div className="text-xs text-slate-500 mt-1 font-semibold">{card.label}</div>
                  <div className="text-xs font-bold mt-1" style={{ color: card.color }}>
                    {getPct(card.value, totals.total)}%
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
                <h2 className="font-bold text-base mb-4" style={{ color: '#7B1C1C' }}>
                  Distribution by Grade Level
                </h2>
                {isMounted ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="grade" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {NS_CATS.map(cat => (
                        <Bar key={cat} dataKey={cat} stackId="a" fill={nsColors[cat]} name={nsLabels[cat]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] bg-slate-50 rounded-xl animate-pulse" />
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
                <h2 className="font-bold text-base mb-4" style={{ color: '#7B1C1C' }}>
                  Overall Nutritional Status
                </h2>
                {isMounted ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        label={({ name, percent }: { name?: string; percent?: number }) =>
                          name && percent !== undefined
                            ? `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`
                            : ''
                        }
                        labelLine={false}
                      >
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Learners']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] bg-slate-50 rounded-xl animate-pulse" />
                )}
              </div>
            </div>

            {/* Data table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-base" style={{ color: '#7B1C1C' }}>
                  Detailed Breakdown by Grade Level
                </h2>
                <span className="text-xs text-slate-400 font-medium">Official DepEd Aggregated Metrics</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: '#7B1C1C' }} className="text-white">
                      <th className="text-left px-4 py-3.5 font-bold text-xs uppercase tracking-wider">Grade Level</th>
                      <th className="text-center px-3 py-3.5 font-bold text-xs uppercase tracking-wider">Total</th>
                      {NS_CATS.map(cat => (
                        <th key={cat} className="text-center px-3 py-3.5 font-bold text-xs uppercase tracking-wider">{cat}</th>
                      ))}
                      <th className="text-center px-3 py-3.5 font-bold text-xs uppercase tracking-wider">SBFP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, i) => (
                      <tr key={row.grade} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="px-4 py-3 font-semibold text-slate-900">{row.grade}</td>
                        <td className="px-3 py-3 text-center font-extrabold text-slate-900">{row.total}</td>
                        {NS_CATS.map(cat => (
                          <td key={cat} className="px-3 py-3 text-center">
                            <span className="font-bold" style={{ color: nsColors[cat] }}>{row[cat]}</span>
                            <br />
                            <span className="text-[10px] text-slate-400 font-medium">{getPct(row[cat], row.total)}%</span>
                          </td>
                        ))}
                        <td className="px-3 py-3 text-center font-bold" style={{ color: '#D97706' }}>
                          {row.sbfpBeneficiaries}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-slate-200" style={{ backgroundColor: '#FFF5F5' }}>
                      <td className="px-4 py-3.5 font-black text-xs uppercase tracking-wider" style={{ color: '#7B1C1C' }}>TOTAL</td>
                      <td className="px-3 py-3.5 text-center font-black text-slate-900">{totals.total}</td>
                      {NS_CATS.map(cat => (
                        <td key={cat} className="px-3 py-3.5 text-center">
                          <span className="font-black" style={{ color: nsColors[cat] }}>{totals[cat]}</span>
                          <br />
                          <span className="text-[10px] text-slate-500 font-semibold">{getPct(totals[cat], totals.total)}%</span>
                        </td>
                      ))}
                      <td className="px-3 py-3.5 text-center font-black" style={{ color: '#D97706' }}>
                        {totals.sbfpBeneficiaries}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-4">
                {NS_CATS.map(cat => (
                  <div key={cat} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: nsColors[cat] }} />
                    <span className="font-bold">{cat}</span> — {nsLabels[cat]}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-8 text-center">
              Data as of {meta.quarter} · {meta.schoolYear} · Source: {meta.schoolName} School Records
            </p>
          </>
        )}
      </main>
    </div>
  )
}