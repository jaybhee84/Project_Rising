export const FEEDING_PROGRAM = 'School-Based Feeding Program (SBFP)'
const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1
const currentSchoolYearStart = currentMonth >= 6 ? currentYear : currentYear - 1

export const SCHOOL_YEARS = Array.from({ length: 4 }, (_, offset) => {
  const start = currentSchoolYearStart + offset
  return `${start}–${start + 1}`
})
export const QUARTERS = ['Baseline', 'Midline', 'Endline']

export type NSCategory = 'SW' | 'W' | 'N' | 'OW' | 'O'
export type HAZCategory = 'SS' | 'S' | 'N' | 'T'

export interface GradeLevelData {
  grade: string
  total: number
  SW: number; W: number; N: number; OW: number; O: number
  sbfpBeneficiaries: number
  SS: number; HS: number; HN: number; HT: number
}

export interface Totals {
  total: number
  SW: number; W: number; N: number; OW: number; O: number
  sbfpBeneficiaries: number
  SS: number; HS: number; HN: number; HT: number
}

export interface Meta {
  schoolYear: string
  quarter: string
  feedingProgram: string
  schoolName: string
}

export interface NutritionalSummary {
  nutritionalData: GradeLevelData[]
  totals: Totals
  meta: Meta
}

export const nsLabels: Record<NSCategory, string> = {
  SW: 'Severely Wasted', W: 'Wasted', N: 'Normal', OW: 'Overweight', O: 'Obese',
}
export const nsColors: Record<NSCategory, string> = {
  SW: '#C0392B', W: '#E67E22', N: '#27AE60', OW: '#0891B2', O: '#8E44AD',
}
export const hazLabels: Record<HAZCategory, string> = {
  SS: 'Severely Stunted', S: 'Stunted', N: 'Normal', T: 'Tall',
}
export const hazColors: Record<HAZCategory, string> = {
  SS: '#7C2D12', S: '#B45309', N: '#15803D', T: '#1D4ED8',
}

export function getPct(count: number, total: number): string {
  return total === 0 ? '0.0' : ((count / total) * 100).toFixed(1)
}

export function getTotals(data: GradeLevelData[]): Totals {
  return data.reduce(
    (acc, row) => ({
      total: acc.total + row.total,
      SW: acc.SW + row.SW, W: acc.W + row.W, N: acc.N + row.N,
      OW: acc.OW + row.OW, O: acc.O + row.O,
      sbfpBeneficiaries: acc.sbfpBeneficiaries + row.sbfpBeneficiaries,
      SS: acc.SS + row.SS, HS: acc.HS + row.HS, HN: acc.HN + row.HN, HT: acc.HT + row.HT,
    }),
    { total: 0, SW: 0, W: 0, N: 0, OW: 0, O: 0, sbfpBeneficiaries: 0, SS: 0, HS: 0, HN: 0, HT: 0 },
  )
}

export async function fetchNutritionalData(schoolYear: string, quarter: string): Promise<NutritionalSummary> {
  const params = new URLSearchParams({ schoolYear, quarter })
  const response = await fetch(`/api/nutritional-status?${params.toString()}`, { cache: 'no-store' })
  const body: unknown = await response.json()
  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body
      ? String(body.error)
      : 'Unable to load nutritional summary.'
    throw new Error(message)
  }
  return body as NutritionalSummary
}
