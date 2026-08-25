'use client'

/* Enrollment data refreshes after selections, focus changes, and a short polling interval. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  fetchEnrollmentData,
  getCachedEnrollmentData,
  shouldRefreshEnrollmentData,
  type DailyEnrollment,
  type EnrollmentSummary,
} from '@/lib/enrollmentData'

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
  const cachedEnrollment = getCachedEnrollmentData()
  const [data, setData] = useState<EnrollmentSummary | null>(cachedEnrollment)
  const [selectedSchoolYear, setSelectedSchoolYear] = useState(cachedEnrollment?.schoolYear.label || '')
  const [selectedDate, setSelectedDate] = useState(cachedEnrollment?.daily[0]?.date || '')
  const [loading, setLoading] = useState(!cachedEnrollment)
  const [error, setError] = useState<string | null>(null)

  const loadEnrollment = useCallback(async (schoolYear = '', quiet = false, force = false) => {
    if (!quiet) setLoading(true)
    try {
      const result = await fetchEnrollmentData(schoolYear, force)
      setData(result)
      setSelectedSchoolYear(result.schoolYear.label)
      setSelectedDate((current) => result.daily.some((row) => row.date === current) ? current : (result.daily[0]?.date || ''))
      setError(null)
    } catch (loadError) {
      if (getCachedEnrollmentData(schoolYear)) console.error('Unable to refresh enrollment data:', loadError)
      else setError(loadError instanceof Error ? loadError.message : 'Unable to synchronize enrollment data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const cached = getCachedEnrollmentData()
    void loadEnrollment(cached?.schoolYear.label || '', Boolean(cached), shouldRefreshEnrollmentData())
  }, [loadEnrollment])
  useEffect(() => {
    const timer = window.setInterval(() => void loadEnrollment(selectedSchoolYear, true, true), REFRESH_INTERVAL)
    const onFocus = () => {
      if (shouldRefreshEnrollmentData(selectedSchoolYear)) void loadEnrollment(selectedSchoolYear, true, true)
    }
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [loadEnrollment, selectedSchoolYear])

  const changeSchoolYear = (schoolYear: string) => {
    const cached = getCachedEnrollmentData(schoolYear)
    setSelectedSchoolYear(schoolYear)
    setError(null)
    if (cached) {
      setData(cached)
      setSelectedDate(cached.daily[0]?.date || '')
      void loadEnrollment(schoolYear, true, shouldRefreshEnrollmentData(schoolYear))
    } else {
      void loadEnrollment(schoolYear)
    }
  }

  const selectedDaily = useMemo<DailyEnrollment | undefined>(
    () => data?.daily.find((row) => row.date === selectedDate), [data, selectedDate],
  )
  const adviserGroups = useMemo(() => data?.grades.map((grade) => ({
    ...grade, advisers: data.advisers.filter((adviser) => adviser.gradeKey === grade.key),
  })) || [], [data])

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#f5e7df,_transparent_35%),linear-gradient(#f8fafc,#f1f5f9)]">
    <section
      style={{ background: 'linear-gradient(135deg, #7B1C1C 0%, #881337 50%, #4C0D15 100%)' }}
      className="overflow-hidden px-4 py-10 text-white shadow-md sm:px-6 sm:py-12 lg:px-8"
    >
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <div className="mb-4 inline-block rounded-full bg-amber-500 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-slate-950 shadow-sm">
            Enrollment Monitoring
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">Learner Enrollment</h1>
          <p className="mt-3 max-w-2xl text-sm text-rose-100/85">Live, privacy-safe summaries synchronized from the IECES Portal and BMI baseline records.</p>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-semibold text-amber-900 shadow-sm">
            Data shown is aggregated — no individual learner information is displayed
          </div>
        </div>
        <div className="min-w-52 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-xl backdrop-blur-sm">
          <label className="block">
            <span className="mb-2 block text-[10px] font-black uppercase tracking-wider text-white/70">School year</span>
            <select value={selectedSchoolYear} disabled={!data || loading}
              onChange={(event) => changeSchoolYear(event.target.value)}
              className="w-full min-w-44 cursor-pointer rounded-full border-0 bg-amber-500 px-4 py-2 text-sm font-black text-slate-950 outline-none disabled:opacity-60">
              {data?.schoolYears.map((year) => <option key={year.label} value={year.label}>{year.label}</option>)}
            </select>
          </label>
          {data && <div className="mt-3 space-y-1 text-[11px] text-rose-100/80">
            <p>{formatDate(data.schoolYear.startDate)} to {formatDate(data.schoolYear.endDate)}</p>
            <p>Updated {new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila' }).format(new Date(data.syncedAt))}</p>
          </div>}
        </div>
      </div>
    </section>

    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
          <div className="mb-5"><h2 className="text-xl font-black text-slate-900">Reading Level Assessment</h2><p className="mt-1 text-xs text-slate-500">Awaiting the official assessment source; all values remain at zero for now.</p></div>
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
