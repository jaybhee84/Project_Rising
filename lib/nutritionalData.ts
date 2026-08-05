import { supabase as nsSupabase } from '@/lib/nssupabase'

export const SCHOOL_YEAR = '2024-2025'
export const QUARTER = 'Q1 (June - August 2024)'
export const FEEDING_PROGRAM = 'School-Based Feeding Program (SBFP)'

export type NSCategory = 'SW' | 'W' | 'N' | 'OW' | 'O'

export interface GradeLevelData {
  grade: string
  total: number
  SW: number  // Severely Wasted
  W: number   // Wasted
  N: number   // Normal
  OW: number  // Overweight
  O: number   // Obese
  sbfpBeneficiaries: number
}

export interface Totals {
  total: number
  SW: number
  W: number
  N: number
  OW: number
  O: number
  sbfpBeneficiaries: number
}

export interface Meta {
  schoolYear: string
  quarter: string
  feedingProgram: string
  schoolName: string
}

export const nsLabels: Record<NSCategory, string> = {
  SW: 'Severely Wasted',
  W:  'Wasted',
  N:  'Normal',
  OW: 'Overweight',
  O:  'Obese',
}

export const nsColors: Record<NSCategory, string> = {
  SW: '#C0392B',
  W:  '#E67E22',
  N:  '#27AE60',
  OW: '#0891B2',
  O:  '#8E44AD',
}

export function getPct(count: number, total: number) {
  if (total === 0) return '0.0'
  return ((count / total) * 100).toFixed(1)
}

export function getTotals(data: GradeLevelData[]): Totals {
  return data.reduce(
    (acc, row) => ({
      total: acc.total + row.total,
      SW: acc.SW + row.SW,
      W: acc.W + row.W,
      N: acc.N + row.N,
      OW: acc.OW + row.OW,
      O: acc.O + row.O,
      sbfpBeneficiaries: acc.sbfpBeneficiaries + row.sbfpBeneficiaries,
    }),
    { total: 0, SW: 0, W: 0, N: 0, OW: 0, O: 0, sbfpBeneficiaries: 0 }
  )
}

const TARGET_SCHOOL_ID = '126001'
const GRADE_LEVELS = ['Kinder', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']

export async function fetchNutritionalData(
  schoolYear = SCHOOL_YEAR,
  quarter = QUARTER
): Promise<{ nutritionalData: GradeLevelData[]; totals: Totals; meta: Meta }> {
  // 1. Fetch students and nutritional records for target school ID 126001
  const { data: students, error: studentError } = await nsSupabase
    .from('students')
    .select(`
      id,
      lrn,
      name,
      sex,
      section,
      school_id,
      nutritional_status (
        status,
        sy,
        q
      )
    `)
    .eq('school_id', TARGET_SCHOOL_ID)

  if (studentError) {
    throw new Error(`Supabase query error: ${studentError.message}`)
  }

  // 2. Fetch school name
  const { data: school } = await nsSupabase
    .from('schools')
    .select('name, school_name')
    .eq('school_id', TARGET_SCHOOL_ID)
    .maybeSingle()

  const schoolName = school?.school_name || school?.name || 'Isabela East Central Elementary School'

  // 3. Initialize Grade Buckets
  const gradeBuckets: Record<string, GradeLevelData> = {}
  GRADE_LEVELS.forEach((grade) => {
    gradeBuckets[grade] = {
      grade,
      total: 0,
      SW: 0,
      W: 0,
      N: 0,
      OW: 0,
      O: 0,
      sbfpBeneficiaries: 0,
    }
  })

  // 4. Aggregate data directly from Supabase student records
  ;(students || []).forEach((student: any) => {
    const matchedGrade = GRADE_LEVELS.find((g) => student.section?.startsWith(g)) || 'Kinder'
    const bucket = gradeBuckets[matchedGrade]

    const records = student.nutritional_status || []
    const currentRecord = records.find(
      (r: any) => r.sy === schoolYear && r.q === quarter
    )

    if (!currentRecord) return

    bucket.total++

    // Map status string directly from DB (e.g., 'Severely Wasted', 'Wasted', 'Normal', 'Overweight', 'Obese')
    const status = currentRecord.status

    if (status === 'Severely Wasted' || status === 'SW') {
      bucket.SW++
      bucket.sbfpBeneficiaries++
    } else if (status === 'Wasted' || status === 'W') {
      bucket.W++
      bucket.sbfpBeneficiaries++
    } else if (status === 'Normal' || status === 'N') {
      bucket.N++
    } else if (status === 'Overweight' || status === 'OW') {
      bucket.OW++
    } else if (status === 'Obese' || status === 'O') {
      bucket.O++
    }
  })

  const nutritionalData = Object.values(gradeBuckets)
  const totals = getTotals(nutritionalData)

  return {
    nutritionalData,
    totals,
    meta: {
      schoolYear,
      quarter,
      feedingProgram: FEEDING_PROGRAM,
      schoolName,
    },
  }
}