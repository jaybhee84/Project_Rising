'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Article {
  id: string | number
  title: string
  description?: string
  category: string
  photos?: string[]
  day?: string | number
  month?: string
  year?: string | number
  created_at: string
}

const CATEGORIES = [
  { name: 'Campus Journalism', icon: '✍️', tag: 'Journalism', bgColor: 'bg-amber-100 text-amber-900', borderColor: 'border-amber-200' },
  { name: 'Health & Nutrition', icon: '🥗', tag: 'Nutrition', bgColor: 'bg-emerald-100 text-emerald-900', borderColor: 'border-emerald-200' },
  { name: 'Sports & Culture', icon: '🏆', tag: 'Sports', bgColor: 'bg-blue-100 text-blue-900', borderColor: 'border-blue-200' },
  { name: 'Community Engagement', icon: '🤝', tag: 'Community', bgColor: 'bg-purple-100 text-purple-900', borderColor: 'border-purple-200' },
  { name: 'Academic & Literacy', icon: '📚', tag: 'Literacy', bgColor: 'bg-rose-100 text-rose-900', borderColor: 'border-rose-200' },
  { name: 'Safety & Preparedness', icon: '🚨', tag: 'Safety Drive', bgColor: 'bg-amber-100 text-amber-900', borderColor: 'border-amber-200' },
]

export default function ActivitiesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchArticles = async () => {
    try {
      setLoading(true)
      setErrorMessage(null)

      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase Query Error:', error)
        setErrorMessage(error.message)
        throw error
      }

      console.log('Successfully fetched articles from Supabase:', data)
      setArticles((data as Article[]) || [])
    } catch (err: unknown) {
      const errorObj = err as Error
      console.error('Error in fetchArticles:', errorObj)
      setErrorMessage(errorObj.message || 'Failed to fetch articles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArticles()

    const channel = supabase
      .channel('public:news_articles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'news_articles' },
        (payload: Record<string, unknown>) => {
          console.log('Realtime payload received:', payload)
          fetchArticles()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filteredArticles = selectedCategory
    ? articles.filter((item) => item.category === selectedCategory)
    : articles

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Hero Banner */}
        <div
          style={{
            background:
              'linear-gradient(135deg, #7B1C1C 0%, #881337 50%, #4C0D15 100%)',
          }}
          className="rounded-3xl p-8 sm:p-12 text-white shadow-xl mb-12 relative overflow-hidden"
        >
          <div className="relative z-10 max-w-3xl">
            <div
              style={{
                backgroundColor: 'var(--school-gold, #F59E0B)',
                color: '#0A192F',
              }}
              className="inline-block text-xs font-black uppercase tracking-widest px-3.5 py-1 rounded-full mb-4 shadow-sm"
            >
              School Announcements & Events
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
              News, Activities & Campus Journalism
            </h1>

            <p className="text-rose-100 text-sm sm:text-base leading-relaxed opacity-90 max-w-2xl">
              Highlights from student journalism competitions, campus events,
              sports meets, and community engagement projects at Isabela East
              Central Elementary School.
            </p>
          </div>
        </div>

        {/* Category Cards Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Browse Categories
            </h2>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-xs font-bold text-rose-900 hover:underline"
              >
                Clear Filter (Show All)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.name
              const count = articles.filter((a) => a.category === cat.name).length

              return (
                <button
                  key={cat.name}
                  onClick={() =>
                    setSelectedCategory(isSelected ? null : cat.name)
                  }
                  className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#7B1C1C] border-[#7B1C1C] text-white shadow-lg'
                      : 'bg-white border-slate-200/80 hover:border-rose-300 hover:bg-rose-50/30 text-slate-800 shadow-sm'
                  }`}
                >
                  <span
                    className={`text-3xl p-3 rounded-xl ${
                      isSelected ? 'bg-white/10' : 'bg-slate-100/80'
                    }`}
                  >
                    {cat.icon}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-bold text-base leading-tight">
                      {cat.name}
                    </span>
                    <span
                      className={`text-xs mt-1 ${
                        isSelected ? 'text-rose-200' : 'text-slate-400'
                      }`}
                    >
                      {count} {count === 1 ? 'article' : 'articles'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-slate-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Campus Updates
            </span>
            <h2
              className="text-3xl font-black tracking-tight mt-1"
              style={{ color: '#7B1C1C' }}
            >
              {selectedCategory ? selectedCategory : 'Recent School Highlights'}
            </h2>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-2 md:mt-0">
            Showcasing academic, cultural, and sports achievements across all
            grade levels.
          </p>
        </div>

        {/* Error State Notice */}
        {errorMessage && (
          <div className="p-4 mb-8 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
            <p className="font-bold">Database Error:</p>
            <p>{errorMessage}</p>
            <p className="text-xs mt-2 text-red-600">
              Please check your Supabase Row Level Security (RLS) policies or Vercel Environment Variables.
            </p>
          </div>
        )}

        {/* Content View */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 font-medium">
            Loading announcements...
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
            No articles or activities published in{' '}
            {selectedCategory || 'this section'} yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((item) => {
              const catInfo = CATEGORIES.find(
                (c) => c.name === item.category
              ) || {
                icon: '📰',
                tag: 'News',
                bgColor: 'bg-emerald-100 text-emerald-900',
                borderColor: 'border-emerald-200',
              }

              const coverImage =
                item.photos && item.photos.length > 0 ? item.photos[0] : null

              const dateString =
                item.day && item.month && item.year
                  ? `${item.day} ${item.month} ${item.year}`
                  : item.month && item.year
                  ? `${item.month} ${item.year}`
                  : new Date(item.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })

              return (
                <article
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-5">
                    <div className="w-full h-52 rounded-xl mb-4 border border-slate-100 overflow-hidden relative bg-slate-100">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                          <span className="text-5xl mb-2">{catInfo.icon}</span>
                          <span className="text-xs font-semibold uppercase tracking-wider">
                            {catInfo.tag}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`text-[11px] font-bold px-3 py-1 rounded-full ${catInfo.bgColor} ${catInfo.borderColor} border`}
                      >
                        {item.category}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        {dateString}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2 leading-snug group-hover:text-rose-900 transition-colors">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}

        <div className="mt-16 text-center">
          <Link
            href="/"
            style={{ backgroundColor: '#0A192F' }}
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-white font-bold text-sm shadow-md transition-all hover:bg-slate-800 hover:scale-[1.01]"
          >
            ← Back to Home Page
          </Link>
        </div>
      </div>
    </div>
  )
}