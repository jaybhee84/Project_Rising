'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  fetchBulletins,
  getCachedBulletins,
  subscribeToBulletins,
  type BulletinAnnouncement,
} from '@/lib/bulletinData'

const priorityStyles = {
  normal: 'bg-slate-100 text-slate-700',
  important: 'bg-amber-100 text-amber-900',
  urgent: 'bg-red-100 text-red-800',
}

export default function BulletinPage() {
  const initialAnnouncements = getCachedBulletins()
  const [announcements, setAnnouncements] = useState<BulletinAnnouncement[]>(initialAnnouncements ?? [])
  const [loading, setLoading] = useState(!initialAnnouncements)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    const applyCached = () => {
      const cached = getCachedBulletins()
      if (!active || !cached) return
      setAnnouncements(cached)
      setError(false)
      setLoading(false)
    }

    void fetchBulletins()
      .then(applyCached)
      .catch(() => {
        if (!active) return
        setError(true)
        setLoading(false)
      })

    const unsubscribe = subscribeToBulletins(applyCached)
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-3xl border border-[#F59E0B]/50 bg-[#7B1C1C] px-6 py-10 text-white shadow-xl sm:px-10 sm:py-12">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-3xl text-slate-950 shadow-lg sm:h-16 sm:w-16" aria-hidden="true">📣</div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">Latest announcements</p>
                <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">School Bulletin</h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
                  Official announcements, reminders, and timely notices for learners, families, personnel, and the IECES community.
                </p>
              </div>
            </div>
            <Link href="/activities" className="self-start rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-xs font-black transition hover:bg-white/20 sm:self-auto">
              Visit School Gazette →
            </Link>
          </div>
        </section>

        {error ? (
          <section className="mt-8 rounded-3xl border border-red-200 bg-red-50 px-6 py-16 text-center">
            <h2 className="text-xl font-black text-red-900">Bulletin temporarily unavailable</h2>
            <p className="mt-2 text-sm text-red-700">Please try again in a few moments.</p>
          </section>
        ) : loading ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {[0, 1].map((item) => <div key={item} className="h-64 animate-pulse rounded-3xl bg-slate-200" />)}
          </div>
        ) : announcements.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-24 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-4xl" aria-hidden="true">📌</div>
            <h2 className="mt-5 text-2xl font-black text-slate-900">No announcements posted</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-500">
              There are no active notices on the school bulletin at this time. Please check back soon for official announcements.
            </p>
          </section>
        ) : (
          <section className="mt-8 grid gap-5 md:grid-cols-2">
            {announcements.map((announcement, index) => (
              <article key={announcement.id} className={`rounded-3xl border bg-white p-7 shadow-sm ${index === 0 ? 'border-amber-300 md:col-span-2' : 'border-slate-200'}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {index === 0 && <span className="rounded-full bg-[#7B1C1C] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">Latest</span>}
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${priorityStyles[announcement.priority]}`}>
                      {announcement.priority}
                    </span>
                  </div>
                  <time className="text-xs font-semibold text-slate-400">
                    {new Date(announcement.published_at || announcement.created_at).toLocaleDateString('en-PH', { dateStyle: 'long' })}
                  </time>
                </div>
                <h2 className="mt-5 text-2xl font-black leading-tight text-slate-950">{announcement.title}</h2>
                {announcement.summary && <p className="mt-3 text-base font-semibold leading-relaxed text-slate-600">{announcement.summary}</p>}
                {announcement.body && <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{announcement.body}</p>}
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}
