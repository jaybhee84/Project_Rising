import { supabase } from '@/lib/supabase'

export interface StaffMember {
  id: string
  family_name?: string
  first_name?: string
  middle_name?: string
  category: 'admin' | 'teaching' | 'non-teaching' | 'job-order'
  admin_position?: string
  teaching_position?: string
  teaching_type?: string
  is_designated?: boolean
  grade_level?: string
  is_grade_chairman?: boolean
  status: 'alive' | 'substitute'
  sub_expiry_start?: string
  sub_expiry_end?: string
  photo_url?: string
}

let cachedStaff: StaffMember[] | null = null
let pendingRequest: Promise<StaffMember[]> | null = null
let realtimeStarted = false
const listeners = new Set<() => void>()

export function getCachedOrgChart(): StaffMember[] | null {
  return cachedStaff
}

export async function fetchOrgChart(force = false): Promise<StaffMember[]> {
  if (!force && cachedStaff) return cachedStaff
  if (pendingRequest) return pendingRequest

  pendingRequest = (async () => {
    const { data, error } = await supabase
      .from('org_chart')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)
    cachedStaff = (data || []) as StaffMember[]
    listeners.forEach((listener) => listener())
    return cachedStaff
  })().finally(() => {
    pendingRequest = null
  })

  return pendingRequest
}

function ensureOrgChartRealtime() {
  if (realtimeStarted) return
  realtimeStarted = true

  supabase
    .channel('public-org-chart-cache')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'org_chart' },
      () => { void fetchOrgChart(true).catch(console.error) },
    )
    .subscribe()
}

export function subscribeToOrgChart(listener: () => void): () => void {
  listeners.add(listener)
  ensureOrgChartRealtime()
  return () => listeners.delete(listener)
}

export function preloadOrgChart(): void {
  ensureOrgChartRealtime()
  void fetchOrgChart().catch(console.error)
}
