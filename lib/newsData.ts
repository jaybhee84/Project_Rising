import { supabase } from '@/lib/supabase'

export interface NewsArticle {
  id: string | number
  author?: string
  title: string
  description?: string
  category: string
  photos?: string[]
  day?: string | number
  month?: string
  year?: string | number
  created_at: string
}

let cachedArticles: NewsArticle[] | null = null
let pendingRequest: Promise<NewsArticle[]> | null = null
let realtimeStarted = false
const listeners = new Set<() => void>()

export function formatNewsDate(article: NewsArticle): string {
  if (article.day && article.month && article.year) {
    return `${article.day} ${article.month} ${article.year}`
  }
  if (article.month && article.year) return `${article.month} ${article.year}`
  return new Date(article.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function getCachedNewsArticles(): NewsArticle[] | null {
  return cachedArticles
}

export async function fetchNewsArticles(force = false): Promise<NewsArticle[]> {
  if (!force && cachedArticles) return cachedArticles
  if (pendingRequest) return pendingRequest

  pendingRequest = (async () => {
    const { data, error } = await supabase
      .from('news_articles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    cachedArticles = (data || []) as NewsArticle[]
    listeners.forEach((listener) => listener())
    return cachedArticles
  })().finally(() => {
    pendingRequest = null
  })

  return pendingRequest
}

function ensureNewsRealtime() {
  if (realtimeStarted) return
  realtimeStarted = true

  supabase
    .channel('public-news-cache')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'news_articles' },
      () => { void fetchNewsArticles(true).catch(console.error) },
    )
    .subscribe()
}

export function subscribeToNewsArticles(listener: () => void): () => void {
  listeners.add(listener)
  ensureNewsRealtime()
  return () => listeners.delete(listener)
}

export function preloadNewsArticles(): void {
  ensureNewsRealtime()
  void fetchNewsArticles().catch(console.error)
}
