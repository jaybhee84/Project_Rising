import Link from 'next/link'

export default function BulletinPage() {
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
                  Official announcements, reminders, and timely notices for learners, families, personnel, and the IECES community.
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

        <section className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-24 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-4xl" aria-hidden="true">📌</div>
          <h2 className="mt-5 text-2xl font-black text-slate-900">No announcements posted</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-500">
            There are no active notices on the school bulletin at this time. Please check back soon for official announcements.
          </p>
        </section>
      </main>
    </div>
  )
}
