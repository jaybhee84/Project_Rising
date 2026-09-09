import { supabase } from '@/lib/supabase'

export interface HomepageSlide {
  id: string
  image_url: string
  storage_path?: string
  sort_order?: number
  focal_x?: number
  focal_y?: number
  zoom?: number
  created_at: string
}

let cachedSlides: HomepageSlide[] | null = null
let pendingRequest: Promise<HomepageSlide[]> | null = null
let realtimeStarted = false
const listeners = new Set<() => void>()

export function getCachedHomepageSlides(): HomepageSlide[] | null {
  return cachedSlides
}

export async function fetchHomepageSlides(force = false): Promise<HomepageSlide[]> {
  if (!force && cachedSlides) return cachedSlides
  if (pendingRequest) return pendingRequest

  pendingRequest = (async () => {
    const { data, error } = await supabase
      .from('homepage_slides')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)
    cachedSlides = (data || []) as HomepageSlide[]
    listeners.forEach((listener) => listener())
    return cachedSlides
  })().finally(() => {
    pendingRequest = null
  })

  return pendingRequest
}

function ensureHomepageSlidesRealtime() {
  if (realtimeStarted) return
  realtimeStarted = true

  supabase
    .channel('public-homepage-slides-cache')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'homepage_slides' },
      () => { void fetchHomepageSlides(true).catch(console.error) },
    )
    .subscribe()
}

export function subscribeToHomepageSlides(listener: () => void): () => void {
  listeners.add(listener)
  ensureHomepageSlidesRealtime()
  return () => listeners.delete(listener)
}

export function preloadHomepageSlides(): void {
  ensureHomepageSlidesRealtime()
  void fetchHomepageSlides().catch(console.error)
}
