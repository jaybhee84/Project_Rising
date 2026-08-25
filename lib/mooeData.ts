import { MOOE_TABLE, supabase } from '@/lib/supabase'

export interface ExpenseItem {
  objectCode: string
  amount: number
}

export interface ReceiptItem {
  url: string
  path: string
}

export interface MooeRecord {
  id?: string
  cy?: string
  sy?: string
  month: string
  allocation: number
  total: number
  balance: number
  items: ExpenseItem[]
  liquidated_by?: string
  liquidatedBy?: string
  date_received?: string
  date_liquidated?: string
  remarks?: string
  receipts?: ReceiptItem[]
}

export const MONTHS: string[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

let cachedRecords: MooeRecord[] | null = null
let pendingRequest: Promise<MooeRecord[]> | null = null
let realtimeStarted = false
const listeners = new Set<() => void>()

export function getCachedMooeRecords(): MooeRecord[] | null {
  return cachedRecords
}

export async function fetchMooeRecords(force = false): Promise<MooeRecord[]> {
  if (!force && cachedRecords) return cachedRecords
  if (pendingRequest) return pendingRequest

  pendingRequest = (async () => {
    const { data, error } = await supabase.from(MOOE_TABLE).select('*')
    if (error) throw new Error(error.message)

    const records = ((data || []) as MooeRecord[])
      .map((record) => ({
        ...record,
        cy: record.cy || record.sy || 'CY 2026',
        receipts: record.receipts || [],
      }))
      .sort((a, b) => {
        if (a.cy !== b.cy) return (b.cy || '').localeCompare(a.cy || '')
        return MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month)
      })

    cachedRecords = records
    listeners.forEach((listener) => listener())
    return records
  })().finally(() => {
    pendingRequest = null
  })

  return pendingRequest
}

function ensureMooeRealtime() {
  if (realtimeStarted) return
  realtimeStarted = true

  supabase
    .channel('public-mooe-cache')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: MOOE_TABLE },
      () => { void fetchMooeRecords(true).catch(console.error) },
    )
    .subscribe()
}

export function subscribeToMooeRecords(listener: () => void): () => void {
  listeners.add(listener)
  ensureMooeRealtime()
  return () => listeners.delete(listener)
}

export function preloadMooeRecords(): void {
  ensureMooeRealtime()
  void fetchMooeRecords().catch(console.error)
}
