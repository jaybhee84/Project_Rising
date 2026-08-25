'use client'

/* Enrollment data refreshes after selections, focus changes, and a short polling interval. */
/* eslint-disable react-hooks/set-state-in-effect */

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { DailyEnrollment, EnrollmentSummary } from '@/lib/enrollmentData.server'

const REFRESH_INTERVAL = 60_000

function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila', year: 'numeric', month: 'short', day: 'numeric', ...options,
  }).format(new Date(`${value}T00:00:00+08:00`))
}

function StatCard({ label, value, tone = 'maroon' }: {
  label: string
  value: number
  tone?: 'maroon' | 'blue' | 'rose' | 'gold'
}) {
  const colors = {
    maroon: 'from-[#7B1C1C] to-[#9b3030]', blue: 'from-sky-700 to-sky-500',
    rose: 'from-rose-700 to-rose-500', gold: 'from-amber-600 to-amber-400',
  }
  return <div className={`rounded-2xl bg-gradient-to-br ${colors[tone]} p-5 text-white shadow-lg shadow-slate-900/10`}>
    <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/75">{label}</p>
    <p className="mt-2 text-3xl font-black tabular-nums">{value.toLocaleString()}</p>
  </div>
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">{children}</div>
}

export default function EnrollmentPage() {
  const [data, setData] = useState<EnrollmentSummary | null>(null)
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadEnrollment = useCallback(async (schoolYear?: string, quiet = false) => {
    if (quiet) setRefreshing(true)
    else setLoading(true)
    try {
      const query = schoolYear ? `?schoolYear=${encodeURIComponent(schoolYear)}` : ''
      const response = await fetch(`/api/enrollment${query}`, { cache: 'no-store' })
      const result = await response.json() as EnrollmentSummary & { error?: string }
      if (!response.ok) throw new Error(result.error || 'Unable to synchronize enrollment data.')
      setData(result)
      setSelectedSchoolYear(result.schoolYear.label)
      setSelectedDate((current) => result.daily.some((row) => row.date === current) ? current : (result.daily[0]?.date || ''))
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to synchronize enrollment data.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { void loadEnrollment() }, [loadEnrollment])
  useEffect(() => {
    const timer = window.setInterval(() => void loadEnrollment(selectedSchoolYear, true), REFRESH_INTERVAL)
    const onFocus = () => void loadEnrollment(selectedSchoolYear, true)
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [loadEnrollment, selectedSchoolYear])

  const selectedDaily = useMemo<DailyEnrollment | undefined>(
    () => data?.daily.find((row) => row.date === selectedDate), [data, selectedDate],
  )
  const adviserGroups = useMemo(() => data?.grades.map((grade) => ({
    ...grade, advisers: data.advisers.filter((adviser) => adviser.gradeKey === grade.key),
  })) || [], [data])

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#f5e7df,_transparent_35%),linear-gradient(#f8fafc,#f1f5f9)] px-4 py-10">
    <div className="mx-auto max-w-7xl">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <Link href="/" className="text-sm font-bold text-slate-500 transition-colors hover:text-[#7B1C1C]">&larr; Home</Link>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-[#9b3030]">School ID {data?.schoolId || '126001'}</p>
          <h1 className="mt-1 text-3xl font-black text-[#5f1717] sm:text-4xl">Learner Enrollment</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Live, privacy-safe summaries synchronized from the IECES Portal and BMI baseline records.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm backdrop-blur">
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">School year</span>
            <select value={selectedSchoolYear} disabled={!data || loading}
              onChange={(event) => { setSelectedSchoolYear(event.target.value); void loadEnrollment(event.target.value) }}
              className="min-w-40 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-[#7B1C1C]">
              {data?.schoolYears.map((year) => <option key={year.label} value={year.label}>{year.label}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => void loadEnrollment(selectedSchoolYear, true)} disabled={loading || refreshing}
            className="rounded-xl bg-[#7B1C1C] px-4 py-2 text-sm font-black text-white transition hover:bg-[#641616] disabled:opacity-60">
            {refreshing ? 'Syncing...' : 'Sync now'}
          </button>
        </div>
      </div>

      {data && <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
        <span><strong>SY {data.schoolYear.label}</strong> &middot; {formatDate(data.schoolYear.startDate)} to {formatDate(data.schoolYear.endDate)}</span>
        <span>Last synced {new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila' }).format(new Date(data.syncedAt))}</span>
      </div>}

      {loading && !data && <div className="rounded-2xl border bg-white p-14 text-center text-slate-500 shadow-sm">Synchronizing enrollment data...</div>}
      {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"><strong>Enrollment sync failed.</strong> {error}</div>}

      {data && <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total Learners" value={data.totals.total} />
          <StatCard label="Enrolled Today" value={data.totals.enrolledToday} tone="gold" />
          <StatCard label="Male" value={data.totals.male} tone="blue" />
          <StatCard label="Female" value={data.totals.female} tone="rose" />
          <StatCard label="4Ps Beneficiaries" value={data.totals.beneficiaries} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5"><h2 className="text-xl font-black text-slate-900">Enrollment by Grade Level</h2><p className="mt-1 text-xs text-slate-500">Live totals for the selected school year.</p></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.grades.map((grade) => <div key={grade.key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3"><span className="text-sm font-black text-slate-700">{grade.label}</span><strong className="text-2xl text-[#7B1C1C]">{grade.total}</strong></div>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-500"><span>{grade.male} Male</span><span>{grade.female} Female</span><span>{grade.beneficiaries} 4Ps</span></div>
            </div>)}
          </div>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5"><h2 className="text-xl font-black text-slate-900">Advisers</h2><p className="mt-1 text-xs text-slate-500">Current advisory assignments with learner totals for SY {data.schoolYear.label}.</p></div>
          {data.advisers.length === 0 ? <EmptyState>No adviser assignments are available.</EmptyState> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {adviserGroups.map((group) => <div key={group.key} className="overflow-hidden rounded-xl border border-slate-200">
              <div className="flex items-center justify-between bg-[#7B1C1C] px-4 py-3 text-white"><h3 className="text-sm font-black">{group.label}</h3><span className="text-xs font-bold text-white/75">{group.total} learners</span></div>
              <div className="divide-y divide-slate-100">
                {group.advisers.length === 0 ? <p className="p-4 text-xs italic text-slate-400">No adviser assigned</p> : group.advisers.map((adviser) => <div key={adviser.id} className="p-4">
                  <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-800">{adviser.name}</p>{adviser.section && <p className="mt-0.5 text-[11px] text-slate-500">Section {adviser.section}</p>}{adviser.isChairman && <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase text-amber-800">Grade chairman</span>}</div><strong className="text-xl text-[#7B1C1C]">{adviser.total}</strong></div>
                  <p className="mt-2 text-[10px] font-semibold text-slate-500">{adviser.male} Male &middot; {adviser.female} Female</p>
                </div>)}
              </div>
            </div>)}
          </div>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5"><h2 className="text-xl font-black text-slate-900">Reading Level Assessment</h2><p className="mt-1 text-xs text-slate-500">Phil-IRI classifications for Grades 1 to 6.</p></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] border-collapse text-sm">
            <thead><tr className="bg-slate-100 text-[11px] uppercase tracking-wide text-slate-600"><th className="border border-slate-200 p-3 text-left">Reading category</th>{data.readingGrades.map((grade) => <th key={grade.key} className="border border-slate-200 p-3 text-center">{grade.label}</th>)}<th className="border border-slate-200 p-3 text-center">Total</th></tr></thead>
            <tbody>{data.reading.map((row) => <tr key={row.category} className="hover:bg-slate-50"><td className="border border-slate-200 p-3 font-bold text-slate-700">{row.category}</td>{data.readingGrades.map((grade) => <td key={grade.key} className="border border-slate-200 p-3 text-center tabular-nums">{row.grades[grade.key]}</td>)}<td className="border border-slate-200 p-3 text-center font-black">{row.total}</td></tr>)}</tbody>
            <tfoot><tr className="bg-[#7B1C1C] text-white"><th className="border border-[#641616] p-3 text-left">Grand Total</th>{data.readingGrades.map((grade) => <th key={grade.key} className="border border-[#641616] p-3 text-center">{grade.total}</th>)}<th className="border border-[#641616] p-3 text-center">{data.readingGrades.reduce((sum, grade) => sum + grade.total, 0)}</th></tr></tfoot>
          </table></div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5"><h2 className="text-xl font-black text-slate-900">Daily Enrollment</h2><p className="mt-1 text-xs text-slate-500">Select a submission date to view its grade-level breakdown.</p></div>
          {data.daily.length === 0 ? <EmptyState>{data.totals.total ? 'These learner records do not have enrollment dates yet.' : 'No learner enrollment has been recorded for this school year.'}</EmptyState> : <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="max-h-[430px] overflow-auto rounded-xl border border-slate-200"><table className="w-full border-collapse text-sm"><thead className="sticky top-0 bg-slate-100"><tr><th className="p-3 text-left text-xs uppercase text-slate-500">Date enrolled</th><th className="p-3 text-center text-xs uppercase text-slate-500">M</th><th className="p-3 text-center text-xs uppercase text-slate-500">F</th><th className="p-3 text-center text-xs uppercase text-slate-500">Total</th></tr></thead><tbody>{data.daily.map((row) => <tr key={row.date} onClick={() => setSelectedDate(row.date)} className={`cursor-pointer border-t border-slate-100 ${selectedDate === row.date ? 'bg-amber-50 text-[#7B1C1C]' : 'hover:bg-slate-50'}`}><td className="p-3 font-bold">{formatDate(row.date)}</td><td className="p-3 text-center">{row.male}</td><td className="p-3 text-center">{row.female}</td><td className="p-3 text-center font-black">{row.total}</td></tr>)}</tbody></table></div>
            {selectedDaily && <div><h3 className="mb-3 font-black text-slate-800">Breakdown for {formatDate(selectedDaily.date, { month: 'long' })}</h3><div className="grid gap-2 sm:grid-cols-2">{selectedDaily.grades.map((grade) => <div key={grade.key} className="flex items-center justify-between rounded-xl border border-slate-200 p-3"><div><p className="text-sm font-bold text-slate-700">{grade.label}</p><p className="text-[10px] text-slate-500">{grade.male} Male &middot; {grade.female} Female</p></div><strong className="text-xl text-[#7B1C1C]">{grade.total}</strong></div>)}</div></div>}
          </div>}
        </section>
      </div>}
    </div>
  </main>
}
