import { supabase } from '@/lib/supabase'

export interface BulletinAnnouncement {
  id: string
  title: string
  summary?: string
  body?: string
  priority: 'normal' | 'important' | 'urgent'
  is_published: boolean
  published_at?: string
  expires_at?: string
  attachment_url?: string
  attachment_name?: string
  created_at: string
}

const IMAGE_EXTENSION_RE = /\.(png|jpe?g|gif|webp|avif|svg)$/i

export function isImageAttachment(name?: string | null, url?: string | null): boolean {
  const source = name || url
  if (!source) return false
  return IMAGE_EXTENSION_RE.test(source.split(/[?#]/)[0])
}

let cachedAnnouncements: BulletinAnnouncement[] | null = null
let pendingRequest: Promise<BulletinAnnouncement[]> | null = null
let realtimeStarted = false
let lastFetchedAt = 0
let stopRefresh: (() => void) | null = null
const REFRESH_INTERVAL = 30_000
const listeners = new Set<() => void>()

export function getCachedBulletins(): BulletinAnnouncement[] | null {
  return cachedAnnouncements
}

export async function fetchBulletins(force = false): Promise<BulletinAnnouncement[]> {
  if (!force && cachedAnnouncements && Date.now() - lastFetchedAt < REFRESH_INTERVAL) return cachedAnnouncements
  if (pendingRequest) return pendingRequest

  pendingRequest = (async () => {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('bulletin_announcements')
      .select('*')
      .eq('is_published', true)
      .or(`expires_at.is.null,expires_at.gte.${now}`)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    cachedAnnouncements = (data || []) as BulletinAnnouncement[]
    lastFetchedAt = Date.now()
    listeners.forEach((listener) => listener())
    return cachedAnnouncements
  })().finally(() => {
    pendingRequest = null
  })

  return pendingRequest
}

function ensureBulletinRealtime() {
  if (realtimeStarted) return
  realtimeStarted = true
  supabase
    .channel('public-bulletin-cache')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bulletin_announcements' },
      () => { void fetchBulletins(true).catch(console.error) },
    )
    .subscribe()
}

export function subscribeToBulletins(listener: () => void): () => void {
  listeners.add(listener)
  ensureBulletinRealtime()
  // Realtime events can be missed during disconnects or when a notice becomes
  // private. Recheck periodically, on navigation, and when the tab regains focus.
  if (!stopRefresh && typeof window !== 'undefined') {
    const refresh = () => {
      if (document.visibilityState === 'visible') void fetchBulletins(true).catch(console.error)
    }
    const timer = window.setInterval(refresh, REFRESH_INTERVAL)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    stopRefresh = () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }
  void fetchBulletins(true).catch(console.error)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      stopRefresh?.()
      stopRefresh = null
    }
  }
}

export function preloadBulletins(): void {
  ensureBulletinRealtime()
  void fetchBulletins().catch(console.error)
}
