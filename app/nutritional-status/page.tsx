'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import Image from 'next/image'
import {
  fetchNutritionalData,
  getCachedNutritionalData,
  shouldRefreshNutritionalData,
  nsColors, nsLabels,
  hazColors, hazLabels,
  getPct, FEEDING_PROGRAM,
  SCHOOL_YEARS, QUARTERS,
  type NSCategory, type HAZCategory,
  type GradeLevelData, type Totals, type Meta,
} from '@/lib/nutritionalData'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts'

type ChartTooltipItem = {
  color?: string
  name?: string
  value?: number | string
}

function ModernTooltip({ active, payload, label }: {
  active?: boolean
  payload?: ChartTooltipItem[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const visible = payload.filter((item) => Number(item.value) > 0)
  if (!visible.length) return null

  return (
    <div className="min-w-44 rounded-2xl border border-white/70 bg-white/95 p-3 shadow-xl shadow-slate-900/15 backdrop-blur-md">
      {label && <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">{label}</p>}
      <div className="space-y-1.5">
        {visible.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-5 text-xs">
            <span className="flex items-center gap-2 font-semibold text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-black tabular-nums text-slate-950">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PieHoverTooltip({ item }: { item?: { name: string; value: number; color: string } }) {
  if (!item) return null
  return (
    <div className="pointer-events-none absolute right-5 top-14 z-20 rounded-xl border border-white/70 bg-white/95 px-3 py-2 shadow-lg shadow-slate-900/15 backdrop-blur-md">
      <div className="flex items-center gap-3 text-xs">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
        <span className="font-semibold text-slate-600">{item.name}</span>
        <span className="font-black tabular-nums text-slate-950">{item.value}</span>
      </div>
    </div>
  )
}

const NS_CATS: NSCategory[] = ['SW', 'W', 'N', 'OW', 'O']
const BAZ_CHART_CATS: NSCategory[] = ['SW', 'W', 'N', 'O', 'OW']
const HAZ_CHART_CATS: HAZCategory[] = ['S', 'SS', 'N', 'T']
const BAZ_LEGEND = BAZ_CHART_CATS.map((cat) => ({
  id: cat, value: nsLabels[cat], color: nsColors[cat], type: 'square' as const,
}))
const HAZ_LEGEND = HAZ_CHART_CATS.map((cat) => ({
  id: cat, value: hazLabels[cat], color: hazColors[cat], type: 'square' as const,
}))

function ChartLegend({ items }: { items: { id: string; value: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-2 text-[10px]">
      {items.map((item) => (
        <span key={item.id} className="flex items-center gap-1 text-slate-600">
          <span className="h-2.5 w-2.5" style={{ backgroundColor: item.color }} />
          {item.value}
        </span>
      ))}
    </div>
  )
}

const EMPTY_TOTALS: Totals = {
  total: 0, SW: 0, W: 0, N: 0, OW: 0, O: 0, sbfpBeneficiaries: 0,
  SS: 0, HS: 0, HN: 0, HT: 0,
}
const EMPTY_META: Meta = { schoolYear: '', quarter: '', feedingProgram: FEEDING_PROGRAM, schoolName: '' }

const BANNER_IMAGES = ['/nsimage.png', '/nsimage2.png']

function SelectPill({
  label, value, options, onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-white/70 uppercase tracking-wider">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm font-bold rounded-full px-4 py-1.5 border-0 outline-none cursor-pointer"
        style={{ backgroundColor: '#F59E0B', color: '#0A192F' }}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

export default function NutritionalStatusPage() {
  const initialData = getCachedNutritionalData(SCHOOL_YEARS[0], QUARTERS[0])
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [schoolYear, setSchoolYear] = useState(SCHOOL_YEARS[0])
  const [quarter, setQuarter] = useState(QUARTERS[0])
  const [rows, setRows] = useState<GradeLevelData[]>(initialData?.nutritionalData ?? [])
  const [totals, setTotals] = useState<Totals>(initialData?.totals ?? EMPTY_TOTALS)
  const [meta, setMeta] = useState<Meta>(initialData?.meta ?? EMPTY_META)
  const [currentImgIndex, setCurrentImgIndex] = useState(0)
  const [hoveredBazIndex, setHoveredBazIndex] = useState<number | null>(null)
  const [hoveredHazIndex, setHoveredHazIndex] = useState<number | null>(null)

  // ── Slideshow Timer (Swaps image every 3 seconds) ──
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImgIndex((prevIdx) => (prevIdx + 1) % BANNER_IMAGES.length)
    }, 3000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let active = true

    const load = (force = false) => fetchNutritionalData(schoolYear, quarter, force)
      .then(({ nutritionalData, totals, meta }) => {
        if (!active) return
        setRows(nutritionalData)
        setTotals(totals)
        setMeta(meta)
        setError(null)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!active) return
        if (getCachedNutritionalData(schoolYear, quarter)) {
          console.error('Unable to refresh nutritional data:', err)
          return
        }
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
        setLoading(false)
      })

    void load(shouldRefreshNutritionalData(schoolYear, quarter))

    const refreshTimer = window.setInterval(() => { void load(true) }, 60_000)
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible' && shouldRefreshNutritionalData(schoolYear, quarter)) {
        void load(true)
      }
    }
    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      active = false
      window.clearInterval(refreshTimer)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [schoolYear, quarter])

  const changeSchoolYear = (value: string) => {
    setError(null)
    setLoading(!getCachedNutritionalData(value, quarter))
    setSchoolYear(value)
  }

  const changeQuarter = (value: string) => {
    setError(null)
    setLoading(!getCachedNutritionalData(schoolYear, value))
    setQuarter(value)
  }

  const bazPieData = BAZ_CHART_CATS.map((cat) => ({
    name: nsLabels[cat], value: totals[cat], color: nsColors[cat],
  }))
  const hazPieData = [
    { name: hazLabels['S'], value: totals.HS, color: hazColors['S'] },
    { name: hazLabels['SS'], value: totals.SS, color: hazColors['SS'] },
    { name: hazLabels['N'], value: totals.HN, color: hazColors['N'] },
    { name: hazLabels['T'], value: totals.HT, color: hazColors['T'] },
  ]
  const bazBarData = rows.map((r) => ({
    grade: r.grade, SW: r.SW, W: r.W, N: r.N, OW: r.OW, O: r.O,
  }))
  const hazBarData = rows.map((r) => ({
    grade: r.grade, SS: r.SS ?? 0, S: r.HS ?? 0, N: r.HN ?? 0, T: r.HT ?? 0,
  }))

  const summaryCards = [
    { label: 'Total Learners', value: totals.total, color: '#0F172A', borderColor: '#3B82F6' },
    { label: 'SBFP Beneficiaries', value: totals.sbfpBeneficiaries, color: '#D97706', borderColor: '#F59E0B' },
    { label: 'Normal BMI', value: totals.N, color: nsColors['N'], borderColor: nsColors['N'] },
    { label: 'Wasted', value: totals.W, color: nsColors['W'], borderColor: nsColors['W'] },
    { label: 'Severely Wasted', value: totals.SW, color: nsColors['SW'], borderColor: nsColors['SW'] },
    { label: 'Overweight', value: totals.OW, color: nsColors['OW'], borderColor: nsColors['OW'] },
    { label: 'Obese', value: totals.O, color: nsColors['O'], borderColor: nsColors['O'] },
    { label: 'Normal Height', value: totals.HN, color: hazColors['N'], borderColor: hazColors['N'] },
    { label: 'Stunted', value: totals.HS, color: hazColors['S'], borderColor: hazColors['S'] },
    { label: 'Severely Stunted', value: totals.SS, color: hazColors['SS'], borderColor: hazColors['SS'] },
    { label: 'Tall', value: totals.HT, color: hazColors['T'], borderColor: hazColors['T'] },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Banner */}
      <section
        style={{ background: 'linear-gradient(135deg, #7B1C1C 0%, #881337 50%, #4C0D15 100%)' }}
        className="text-white py-12 px-4 sm:px-6 lg:px-8 shadow-md overflow-hidden"
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <div
              style={{ backgroundColor: '#F59E0B', color: '#0A192F' }}
              className="inline-block text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-4 shadow-sm"
            >
              SDO Isabela City · Basilan · BARMM
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4">
              Nutritional Status Report
            </h1>

            {/* Dropdowns */}
            <div className="flex flex-wrap gap-4 mb-4">
              <SelectPill label="School Year" value={schoolYear} options={SCHOOL_YEARS} onChange={changeSchoolYear} />
              <SelectPill label="Period" value={quarter} options={QUARTERS} onChange={changeQuarter} />
            </div>

            <p className="text-rose-100 text-sm opacity-80">
              {FEEDING_PROGRAM} · {meta.schoolName || 'Isabela East Central Elementary School'}
            </p>
            <div
              className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm"
              style={{ backgroundColor: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }}
            >
              ⚠️ Data shown is aggregated — no individual learner information is displayed
            </div>
          </div>

          {/* Right Side Slideshow Container */}
          <div className="flex-shrink-0 flex justify-center items-center relative w-64 sm:w-80 md:w-[380px] lg:w-[440px] h-[300px] sm:h-[350px] md:h-[380px]">
            {BANNER_IMAGES.map((src, index) => (
              <div
                key={src}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out flex justify-center items-center ${
                  index === currentImgIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                <Image
                  src={src}
                  alt={`Nutritional Status Banner Slide ${index + 1}`}
                  width={600}
                  height={600}
                  className="w-full h-full object-contain drop-shadow-xl"
                  priority={index === 0}
                />
              </div>
            ))}
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
            {/* ── Metric Cards Grid ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-10">
              {summaryCards.map((card) => (
                <div
                  key={card.label}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative overflow-hidden"
                  style={{ borderTop: `4px solid ${card.borderColor}` }}
                >
                  <div className="text-2xl md:text-3xl font-black" style={{ color: card.color }}>
                    {card.value}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-semibold leading-tight">
                    {card.label}
                  </div>
                  {totals.total > 0 && card.label !== 'Total Learners' && (
                    <div className="text-[11px] font-bold mt-1.5 text-slate-400">
                      {getPct(card.value, totals.total)}%
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ── BAZ Charts ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/60">
                <h3 className="font-bold text-sm mb-4" style={{ color: '#7B1C1C' }}>BMI Status by Grade Level</h3>
                {isMounted ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={bazBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="grade" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip content={<ModernTooltip />} cursor={{ fill: '#F1F5F9', radius: 10 }} />
                      <Legend content={() => <ChartLegend items={BAZ_LEGEND} />} />
                      {BAZ_CHART_CATS.map((cat) => (
                        <Bar key={cat} dataKey={cat} stackId="a" fill={nsColors[cat]} name={nsLabels[cat]} radius={cat === 'OW' ? [6, 6, 0, 0] : 0} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-[240px] bg-slate-50 rounded-xl animate-pulse" />}
              </div>

              <div className="relative rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/60">
                <h3 className="font-bold text-sm mb-4" style={{ color: '#7B1C1C' }}>Overall BMI Status</h3>
                <PieHoverTooltip item={hoveredBazIndex === null ? undefined : bazPieData[hoveredBazIndex]} />
                {isMounted ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={bazPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={84} paddingAngle={2} cornerRadius={5} isAnimationActive={false}
                        onMouseEnter={(_, index) => setHoveredBazIndex(index)}
                        onMouseLeave={() => setHoveredBazIndex(null)}
                        label={({ name, percent }) =>
                          name && percent ? `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%` : ''
                        }
                        labelLine={false}
                      >
                        {bazPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-950 text-2xl font-black" style={{ pointerEvents: 'none' }}>
                        {totals.total.toLocaleString()}
                      </text>
                      <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-400 text-[10px] font-bold uppercase tracking-wider" style={{ pointerEvents: 'none' }}>
                        Learners
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-[240px] bg-slate-50 rounded-xl animate-pulse" />}
              </div>
            </div>

            {/* ── HAZ Charts ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/60">
                <h3 className="font-bold text-sm mb-4" style={{ color: '#7B1C1C' }}>Height Status by Grade Level</h3>
                {isMounted ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={hazBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="grade" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip content={<ModernTooltip />} cursor={{ fill: '#F1F5F9', radius: 10 }} />
                      <Legend content={() => <ChartLegend items={HAZ_LEGEND} />} />
                      <Bar dataKey="S" stackId="a" fill={hazColors['S']} name={hazLabels['S']} />
                      <Bar dataKey="SS" stackId="a" fill={hazColors['SS']} name={hazLabels['SS']} />
                      <Bar dataKey="N" stackId="a" fill={hazColors['N']} name={hazLabels['N']} />
                      <Bar dataKey="T" stackId="a" fill={hazColors['T']} name={hazLabels['T']} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-[240px] bg-slate-50 rounded-xl animate-pulse" />}
              </div>

              <div className="relative rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/60">
                <h3 className="font-bold text-sm mb-4" style={{ color: '#7B1C1C' }}>Overall Height Status</h3>
                <PieHoverTooltip item={hoveredHazIndex === null ? undefined : hazPieData[hoveredHazIndex]} />
                {isMounted ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={hazPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={84} paddingAngle={2} cornerRadius={5} isAnimationActive={false}
                        onMouseEnter={(_, index) => setHoveredHazIndex(index)}
                        onMouseLeave={() => setHoveredHazIndex(null)}
                        label={({ name, percent }) =>
                          name && percent ? `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%` : ''
                        }
                        labelLine={false}
                      >
                        {hazPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-950 text-2xl font-black" style={{ pointerEvents: 'none' }}>
                        {totals.total.toLocaleString()}
                      </text>
                      <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-400 text-[10px] font-bold uppercase tracking-wider" style={{ pointerEvents: 'none' }}>
                        Learners
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-[240px] bg-slate-50 rounded-xl animate-pulse" />}
              </div>
            </div>

            {/* ── Detailed Table ── */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-sm" style={{ color: '#7B1C1C' }}>Detailed Breakdown by Grade Level</h3>
                <span className="text-xs text-slate-400 font-medium">Official DepEd Aggregated Metrics</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#5C1313] text-white">
                      <th rowSpan={2} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Grade</th>
                      <th rowSpan={2} className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider">Total</th>
                      <th colSpan={5} className="border-x border-white/20 bg-[#8F1D2C] px-3 py-2 text-center text-xs font-black uppercase tracking-[0.14em]">BMI-for-Age Status</th>
                      <th rowSpan={2} className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider">SBFP</th>
                      <th colSpan={4} className="border-l border-white/20 bg-emerald-900 px-3 py-2 text-center text-xs font-black uppercase tracking-[0.14em]">Height-for-Age Status (HFA)</th>
                    </tr>
                    <tr className="bg-[#7B1C1C] text-white">
                      {NS_CATS.map((c) => (
                        <th key={c} className="border-t border-white/15 px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wider">{c}</th>
                      ))}
                      {(['SS', 'S', 'N', 'T'] as HAZCategory[]).map((cat) => (
                        <th key={cat} className="border-l border-t border-white/15 bg-emerald-800 px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wider">{cat}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, i) => (
                      <tr key={row.grade} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="px-4 py-3 font-semibold text-slate-900">{row.grade}</td>
                        <td className="px-3 py-3 text-center font-extrabold text-slate-900">{row.total}</td>
                        {NS_CATS.map((cat) => (
                          <td key={cat} className="px-3 py-3 text-center">
                            <span className="font-bold" style={{ color: nsColors[cat] }}>{row[cat]}</span>
                            <br />
                            <span className="text-[10px] text-slate-400">{getPct(row[cat], row.total)}%</span>
                          </td>
                        ))}
                        <td className="px-3 py-3 text-center font-bold" style={{ color: '#D97706' }}>{row.sbfpBeneficiaries}</td>
                        <td className="px-3 py-3 text-center border-l border-slate-200">
                          <span className="font-bold" style={{ color: hazColors['SS'] }}>{row.SS ?? 0}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-bold" style={{ color: hazColors['S'] }}>{row.HS ?? 0}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-bold" style={{ color: hazColors['N'] }}>{row.HN ?? 0}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-bold" style={{ color: hazColors['T'] }}>{row.HT ?? 0}</span>
                        </td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr className="border-t-2 border-slate-200" style={{ backgroundColor: '#FFF5F5' }}>
                      <td className="px-4 py-3 font-black text-xs uppercase tracking-wider" style={{ color: '#7B1C1C' }}>TOTAL</td>
                      <td className="px-3 py-3 text-center font-black text-slate-900">{totals.total}</td>
                      {NS_CATS.map((cat) => (
                        <td key={cat} className="px-3 py-3 text-center">
                          <span className="font-black" style={{ color: nsColors[cat] }}>{totals[cat]}</span>
                          <br />
                          <span className="text-[10px] text-slate-500">{getPct(totals[cat], totals.total)}%</span>
                        </td>
                      ))}
                      <td className="px-3 py-3 text-center font-black" style={{ color: '#D97706' }}>{totals.sbfpBeneficiaries}</td>
                      <td className="px-3 py-3 text-center border-l border-slate-200 font-black" style={{ color: hazColors['SS'] }}>{totals.SS}</td>
                      <td className="px-3 py-3 text-center font-black" style={{ color: hazColors['S'] }}>{totals.HS}</td>
                      <td className="px-3 py-3 text-center font-black" style={{ color: hazColors['N'] }}>{totals.HN}</td>
                      <td className="px-3 py-3 text-center font-black" style={{ color: hazColors['T'] }}>{totals.HT}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {/* Separate legends prevent duplicate status codes from being confused. */}
              <div className="grid gap-3 border-t border-slate-200 bg-slate-50/70 px-6 py-5 lg:grid-cols-2">
                <section className="rounded-xl border border-rose-200 bg-white p-4" aria-label="BMI-for-Age status legend">
                  <h4 className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-[#7B1C1C]">BMI-for-Age Status</h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {NS_CATS.map((cat) => (
                      <div key={cat} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: nsColors[cat] }} />
                        <span className="font-bold">{cat}</span> — {nsLabels[cat]}
                      </div>
                    ))}
                  </div>
                </section>
                <section className="rounded-xl border border-emerald-200 bg-white p-4" aria-label="Height-for-Age status legend">
                  <h4 className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-800">Height-for-Age Status (HFA)</h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {(['SS', 'S', 'N', 'T'] as HAZCategory[]).map((cat) => (
                      <div key={cat} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hazColors[cat] }} />
                        <span className="font-bold">{cat}</span> — {hazLabels[cat]}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center">
              {quarter} · {schoolYear} · Source: {meta.schoolName || 'Isabela East Central Elementary School'} School Records
            </p>
          </>
        )}
      </main>
    </div>
  )
}
