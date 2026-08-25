'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  fetchBulletins,
  getCachedBulletins,
  subscribeToBulletins,
  type BulletinAnnouncement,
} from '@/lib/bulletinData'

const dismissedKey = (id: string) => `ieces-urgent-bulletin-seen:${id}`

export default function UrgentBulletinAlert() {
  const [announcement, setAnnouncement] = useState<BulletinAnnouncement | null>(null)

  useEffect(() => {
    let active = true

    const showLatestUrgent = () => {
      if (!active) return
      const urgent = getCachedBulletins()?.find((item) => item.priority === 'urgent')
      if (!urgent || window.localStorage.getItem(dismissedKey(urgent.id))) {
        setAnnouncement(null)
        return
      }
      setAnnouncement(urgent)
    }

    void fetchBulletins().then(showLatestUrgent).catch(() => {})
    const unsubscribe = subscribeToBulletins(showLatestUrgent)
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const dismiss = () => {
    if (announcement) window.localStorage.setItem(dismissedKey(announcement.id), 'true')
    setAnnouncement(null)
  }

  if (!announcement) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="urgent-bulletin-title">
      <section className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border-2 border-amber-400 bg-white shadow-2xl">
        <header className="bg-[#7B1C1C] px-6 py-5 text-white sm:px-8">
          <div className="flex items-start justify-between gap-5">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-400 text-2xl" aria-hidden="true">⚠️</span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[.2em] text-amber-300">Urgent school notice</p>
                <h2 id="urgent-bulletin-title" className="mt-1 text-2xl font-black leading-tight">{announcement.title}</h2>
              </div>
            </div>
            <button type="button" onClick={dismiss} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-xl font-bold hover:bg-white/20" aria-label="Close urgent notice">×</button>
          </div>
        </header>

        <div className="px-6 py-6 sm:px-8">
          {announcement.summary && <p className="text-base font-bold leading-relaxed text-slate-800">{announcement.summary}</p>}
          {announcement.body && <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{announcement.body}</p>}
          {announcement.attachment_url && (
            <a href={announcement.attachment_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-900 hover:bg-red-100">
              <span aria-hidden="true">📎</span>
              {announcement.attachment_name || 'View attachment'}
            </a>
          )}
          <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
            <button type="button" onClick={dismiss} className="rounded-full border border-slate-300 px-5 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50">Close</button>
            <Link href="/bulletin" onClick={dismiss} className="rounded-full bg-[#7B1C1C] px-5 py-2.5 text-xs font-black text-white hover:bg-[#5C1313]">View School Bulletin</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
