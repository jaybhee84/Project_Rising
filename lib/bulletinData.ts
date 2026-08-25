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

let cachedAnnouncements: BulletinAnnouncement[] | null = null
let pendingRequest: Promise<BulletinAnnouncement[]> | null = null
let realtimeStarted = false
const listeners = new Set<() => void>()

export function getCachedBulletins(): BulletinAnnouncement[] | null {
  return cachedAnnouncements
}

export async function fetchBulletins(force = false): Promise<BulletinAnnouncement[]> {
  if (!force && cachedAnnouncements) return cachedAnnouncements
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
  return () => listeners.delete(listener)
}

export function preloadBulletins(): void {
  ensureBulletinRealtime()
  void fetchBulletins().catch(console.error)
}
