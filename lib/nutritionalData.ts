import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = process.env.NEXT_PUBLIC_BMI_SUPABASE_URL     || 'https://usbqwedfhmceasrepjnb.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_BMI_SUPABASE_ANON_KEY || 'sb_publishable_SsMtcj2eu7PZnSRg3geAXQ_X425usO5'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const FEEDING_PROGRAM = 'School-Based Feeding Program (SBFP)'
export const SCHOOL_YEARS = ['2026–2027', '2027–2028', '2028–2029']
export const QUARTERS = ['Baseline', 'Midline', 'Endline']

export type NSCategory  = 'SW' | 'W' | 'N' | 'OW' | 'O'
export type HAZCategory = 'SS' | 'S' | 'N' | 'T'

export interface GradeLevelData {
  grade: string
  total: number
  // BAZ
  SW: number; W: number; N: number; OW: number; O: number
  sbfpBeneficiaries: number
  // HAZ
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
  if (total === 0) return '0.0'
  return ((count / total) * 100).toFixed(1)
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
    { total: 0, SW: 0, W: 0, N: 0, OW: 0, O: 0, sbfpBeneficiaries: 0, SS: 0, HS: 0, HN: 0, HT: 0 }
  )
}

// ── WHO BMI-for-Age simplified thresholds (school-age fallback) ───────────
function computeBAZ(weight: number, height: number): NSCategory | null {
  if (!weight || !height || height <= 0) return null
  const h = height / 100
  const bmi = weight / (h * h)
  if (bmi < 14)  return 'SW'
  if (bmi < 16)  return 'W'
  if (bmi < 23)  return 'N'
  if (bmi < 27)  return 'OW'
  return 'O'
}

// ── WHO Height-for-Age simplified thresholds (school-age fallback) ────────
function computeHAZ(height: number, ageYears: number): HAZCategory | null {
  if (!height || !ageYears) return null
  // Rough WHO -3SD / -2SD / +2SD boundaries by age
  const thresholds: Record<number, { ss: number; s: number; t: number }> = {
    5:  { ss: 99,  s: 103, t: 119 },
    6:  { ss: 104, s: 108, t: 125 },
    7:  { ss: 109, s: 114, t: 131 },
    8:  { ss: 114, s: 119, t: 137 },
    9:  { ss: 119, s: 124, t: 143 },
    10: { ss: 124, s: 129, t: 149 },
    11: { ss: 129, s: 134, t: 155 },
    12: { ss: 134, s: 140, t: 162 },
  }
  const age = Math.min(12, Math.max(5, Math.round(ageYears)))
  const t = thresholds[age]
  if (!t) return null
  if (height <= t.ss) return 'SS'
  if (height <= t.s)  return 'S'
  if (height >= t.t)  return 'T'
  return 'N'
}

const TARGET_SCHOOL_ID = '126001'
const GRADE_ORDER = ['Kinder', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']

export async function fetchNutritionalData(
  schoolYear: string,
  quarter: string
): Promise<{ nutritionalData: GradeLevelData[]; totals: Totals; meta: Meta }> {

  const { data: students, error } = await supabase
    .from('students')
    .select('section, age, records')
    .eq('school_id', TARGET_SCHOOL_ID)

  if (error) throw new Error(error.message)

  const buckets: Record<string, GradeLevelData> = {}
  GRADE_ORDER.forEach((g) => {
    buckets[g] = { grade: g, total: 0, SW: 0, W: 0, N: 0, OW: 0, O: 0, sbfpBeneficiaries: 0, SS: 0, HS: 0, HN: 0, HT: 0 }
  })

  ;(students || []).forEach((student: any) => {
    const grade = GRADE_ORDER.find((g) => student.section?.startsWith(g)) ?? 'Kinder'
    const bucket = buckets[grade]

    const record = (student.records || []).find(
      (r: any) => r.sy === schoolYear && r.q === quarter
    )
    if (!record) return
    if (!record.weight && !record.height) return

    bucket.total++

    // BAZ — use stored status if available, otherwise compute from weight/height
    const bazLabel: NSCategory | null =
      record.status
        ? (record.status === 'Severely Wasted' ? 'SW'
          : record.status === 'Wasted'          ? 'W'
          : record.status === 'Normal'           ? 'N'
          : record.status === 'Overweight'       ? 'OW'
          : record.status === 'Obese'            ? 'O'
          : record.status as NSCategory)
        : computeBAZ(record.weight, record.height)

    if (bazLabel) {
      bucket[bazLabel]++
      if (bazLabel === 'SW' || bazLabel === 'W') bucket.sbfpBeneficiaries++
    }

    // HAZ — compute from height + age
    const haz = computeHAZ(record.height, student.age)
    if (haz === 'SS')      bucket.SS++
    else if (haz === 'S')  bucket.HS++
    else if (haz === 'N')  bucket.HN++
    else if (haz === 'T')  bucket.HT++
  })

  const { data: schoolRow } = await supabase
    .from('schools')
    .select('school_name, name')
    .eq('school_id', TARGET_SCHOOL_ID)
    .maybeSingle()

  const schoolName = schoolRow?.school_name || schoolRow?.name || 'Isabela East Central Elementary School'
  const nutritionalData = GRADE_ORDER.map((g) => buckets[g])
  const totals = getTotals(nutritionalData)

  return { nutritionalData, totals, meta: { schoolYear, quarter, feedingProgram: FEEDING_PROGRAM, schoolName } }
}