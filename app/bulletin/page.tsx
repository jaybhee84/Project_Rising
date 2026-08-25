'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  fetchNewsArticles,
  formatNewsDate,
  getCachedNewsArticles,
  subscribeToNewsArticles,
  type NewsArticle,
} from '@/lib/newsData'

export default function BulletinPage() {
  const initialArticles = getCachedNewsArticles()
  const [articles, setArticles] = useState<NewsArticle[]>(initialArticles ?? [])
  const [loading, setLoading] = useState(!initialArticles)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const applyCachedArticles = () => {
      const cached = getCachedNewsArticles()
      if (!active || !cached) return
      setArticles(cached)
      setError(null)
      setLoading(false)
    }

    void fetchNewsArticles()
      .then(applyCachedArticles)
      .catch((reason: unknown) => {
        if (!active) return
        setError(reason instanceof Error ? reason.message : 'Unable to load announcements')
        setLoading(false)
      })

    const unsubscribe = subscribeToNewsArticles(applyCachedArticles)
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const featured = articles[0]
  const recent = articles.slice(1, 7)

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-3xl border border-amber-300/50 bg-[#0A192F] px-6 py-10 text-white shadow-xl sm:px-10 sm:py-12">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-3xl text-slate-950 shadow-lg sm:h-16 sm:w-16" aria-hidden="true">
                📣
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">Latest announcements</p>
                <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">School Bulletin</h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                  Important announcements, reminders, and timely updates for learners, families, personnel, and the IECES community.
                </p>
              </div>
            </div>
            <Link
              href="/activities"
              className="self-start rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-black transition hover:bg-white/20 sm:self-auto"
            >
              Visit School Gazette →
            </Link>
          </div>
        </section>

        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            <p className="font-black">The bulletin is temporarily unavailable.</p>
            <p className="mt-1">Please try again in a few moments.</p>
          </div>
        )}

        {loading ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="min-h-80 animate-pulse rounded-3xl bg-slate-200 lg:col-span-2" />
            <div className="min-h-80 animate-pulse rounded-3xl bg-slate-200" />
          </div>
        ) : !featured ? (
          <section className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
            <div className="text-5xl" aria-hidden="true">📌</div>
            <h2 className="mt-4 text-2xl font-black text-slate-900">No announcements posted</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              There are no new notices at this time. Please check back soon for official school updates.
            </p>
          </section>
        ) : (
          <>
            <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" aria-labelledby="latest-announcement">
              <div className={`grid ${featured.photos?.[0] ? 'lg:grid-cols-[1.1fr_0.9fr]' : ''}`}>
                <div className="flex min-h-80 flex-col justify-between p-7 sm:p-10">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-900">Newest announcement</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-rose-800">{featured.category}</span>
                    </div>
                    <h2 id="latest-announcement" className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">{featured.title}</h2>
                    {featured.description && (
                      <p className="mt-4 max-w-3xl whitespace-pre-line text-base leading-relaxed text-slate-600">{featured.description}</p>
                    )}
                  </div>
                  <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-5 text-xs font-semibold text-slate-500">
                    <span>{formatNewsDate(featured)}</span>
                    {featured.author && <span>Posted by {featured.author}</span>}
                  </div>
                </div>

                {featured.photos?.[0] && (
                  <div className="min-h-72 bg-slate-200 lg:min-h-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={featured.photos[0]} alt={featured.title} className="h-full min-h-72 w-full object-cover" />
                  </div>
                )}
              </div>
            </section>

            {recent.length > 0 && (
              <section className="mt-12" aria-labelledby="recent-announcements">
                <div className="mb-5 flex items-end justify-between border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-800">Stay informed</p>
                    <h2 id="recent-announcements" className="mt-1 text-3xl font-black text-slate-950">Earlier Announcements</h2>
                  </div>
                  <span className="text-xs font-bold text-slate-400">{recent.length} recent</span>
                </div>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {recent.map((article) => (
                    <article key={article.id} className="flex min-h-56 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-rose-800">{article.category}</span>
                        <h3 className="mt-3 text-xl font-black leading-snug text-slate-950">{article.title}</h3>
                        {article.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{article.description}</p>}
                      </div>
                      <p className="mt-5 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">{formatNewsDate(article)}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
