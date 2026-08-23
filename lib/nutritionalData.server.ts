import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { BMI_TABLE_BOYS, BMI_TABLE_GIRLS } from './growth/bmiTable.js'
import { HAZ_TABLE_BOYS, HAZ_TABLE_GIRLS } from './growth/hazTable.js'
import {
  FEEDING_PROGRAM,
  getTotals,
  type GradeLevelData,
  type HAZCategory,
  type Meta,
  type NSCategory,
  type Totals,
} from './nutritionalData'

const BMI_SUPABASE_URL = process.env.BMI_SUPABASE_URL || 'https://joilvslvsioayrjshuxg.supabase.co'
const GRADE_ORDER = ['Kinder', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'SNED']

interface BmiRecord {
  sy?: string
  q?: string
  date?: string
  weight?: number
  height?: number
  status?: string
}

interface StudentRow {
  section?: string
  age?: number
  birthdate?: string
  sex?: string
  records?: BmiRecord[] | BmiRecord | string
  previous_sbfp_beneficiary?: string
}

interface SbfpConfig {
  grades?: string[]
  criteria?: string[]
  criterionGradeRestrictions?: Record<string, string[]>
}

function isOfficialBeneficiary(
  grade: string,
  bazLabel: string | null,
  hazLabel: string | null,
  config: SbfpConfig,
): boolean {
  if (config.grades?.includes(grade)) return true
  for (const label of [bazLabel, hazLabel]) {
    if (!label || !config.criteria?.includes(label)) continue
    const allowedGrades = config.criterionGradeRestrictions?.[label]
    if (allowedGrades === undefined || allowedGrades.includes(grade)) return true
  }
  return false
}

function normalizeRecords(value: StudentRow['records']): BmiRecord[] {
  if (Array.isArray(value)) return value
  if (!value) return []
  if (typeof value === 'object') return [value]
  try {
    const parsed: unknown = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed as BmiRecord[]
    return parsed && typeof parsed === 'object' ? [parsed as BmiRecord] : []
  } catch {
    return []
  }
}

function ageInMonths(birthdate?: string, measurementDate?: string): number | null {
  if (!birthdate || !measurementDate) return null
  const birth = new Date(birthdate)
  const measured = new Date(measurementDate)
  if (Number.isNaN(birth.getTime()) || Number.isNaN(measured.getTime())) return null
  let months = (measured.getFullYear() - birth.getFullYear()) * 12 + measured.getMonth() - birth.getMonth()
  if (measured.getDate() < birth.getDate()) months--
  return months >= 0 ? months : null
}

function computeBAZ(weight: number, height: number, sex?: string, birthdate?: string, measurementDate?: string): NSCategory | null {
  if (!weight || !height || height <= 0) return null
  const heightMeters = height > 3 ? height / 100 : height
  const bmi = weight / (heightMeters * heightMeters)
  const months = ageInMonths(birthdate, measurementDate)
  if (months === null) return null
  const row = (sex === 'F' ? BMI_TABLE_GIRLS : BMI_TABLE_BOYS)[Math.max(72, Math.min(228, months))]
  if (!row) return null
  if (bmi <= row.sw_max) return 'SW'
  if (bmi >= row.w_from && bmi <= row.w_to) return 'W'
  if (bmi >= row.n_from && bmi <= row.n_to) return 'N'
  if (bmi >= row.ow_from && bmi <= row.ow_to) return 'OW'
  if (bmi >= row.ob_min) return 'O'

  // Keep this fallback aligned with the BMI app. The source tables contain
  // small boundary gaps for some ages; the app classifies those learners with
  // these thresholds instead of dropping them from the BMI totals.
  if (bmi < 14) return 'SW'
  if (bmi < 16) return 'W'
  if (bmi < 23) return 'N'
  if (bmi < 27) return 'OW'
  return 'O'
}

function computeHAZ(heightValue: number, sex?: string, birthdate?: string, measurementDate?: string): HAZCategory | null {
  if (!heightValue) return null
  const height = heightValue <= 3 ? heightValue * 100 : heightValue
  const months = ageInMonths(birthdate, measurementDate)
  if (months === null) return null
  const row = (sex === 'F' ? HAZ_TABLE_GIRLS : HAZ_TABLE_BOYS)[Math.max(36, Math.min(228, months))]
  if (!row) return null
  if (height <= row.ss_max) return 'SS'
  if (height >= row.s_from && height <= row.s_to) return 'S'
  if (height >= row.n_from && height <= row.n_to) return 'N'
  if (height >= row.tall_min) return 'T'
  return null
}

export async function getNutritionalSummary(
  schoolYear: string,
  quarter: string,
): Promise<{ nutritionalData: GradeLevelData[]; totals: Totals; meta: Meta }> {
  const serviceRoleKey = process.env.BMI_SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('Server configuration is missing BMI_SUPABASE_SERVICE_ROLE_KEY.')
  }

  const schoolId = process.env.BMI_SCHOOL_ID || '126001'
  const supabase = createClient(BMI_SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const students: StudentRow[] = []
  const pageSize = 1000
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('students')
      .select('section, age, birthdate, sex, records, previous_sbfp_beneficiary')
      .eq('school_id', schoolId)
      .order('name', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) throw new Error(`Unable to load BMI records: ${error.message}`)
    const page = (data || []) as StudentRow[]
    students.push(...page)
    if (page.length < pageSize) break
  }
  const { data: configRow, error: configError } = await supabase
    .from('sbfp_config')
    .select('config')
    .eq('id', 'official')
    .maybeSingle()
  if (configError) throw new Error(`Unable to load SBFP settings: ${configError.message}`)
  const sbfpConfig = (configRow?.config || {}) as SbfpConfig

  const buckets = Object.fromEntries(GRADE_ORDER.map((grade) => [grade, {
    grade, total: 0, SW: 0, W: 0, N: 0, OW: 0, O: 0, sbfpBeneficiaries: 0,
    SS: 0, HS: 0, HN: 0, HT: 0,
  }])) as Record<string, GradeLevelData>
  const schoolYearDigits = schoolYear.replace(/\D/g, '')
  const aliases: Record<string, string[]> = {
    Baseline: ['baseline', 'q1', '1st', '1st quarter', 'quarter 1', 'b'],
    Midline: ['midline', 'q2', '2nd', '2nd quarter'],
    Endline: ['endline', 'q4', '4th', '4th quarter'],
  }

  for (const student of students) {
    const section = String(student.section || '').trim()
    const grade = section.toUpperCase().includes('SNED')
      ? 'SNED'
      : GRADE_ORDER.find((item) => section.startsWith(item)) || 'Kinder'
    const bucket = buckets[grade]
    const matchingRecords = normalizeRecords(student.records).filter((item) =>
      String(item.sy || '').replace(/\D/g, '') === schoolYearDigits
      && aliases[quarter].includes(String(item.q || '').toLowerCase().replace(/[–—]/g, '-').trim()),
    )
    if (!matchingRecords.length) continue
    bucket.total++
    const record = matchingRecords[matchingRecords.length - 1]
    const beneficiaryRecord = matchingRecords[0]
    const baz = record
      ? computeBAZ(Number(record.weight), Number(record.height), student.sex, student.birthdate, record.date)
      : null
    const haz = record ? computeHAZ(Number(record.height), student.sex, student.birthdate, record.date) : null
    const beneficiaryBaz = computeBAZ(
      Number(beneficiaryRecord.weight),
      Number(beneficiaryRecord.height),
      student.sex,
      student.birthdate,
      beneficiaryRecord.date,
    )
    const beneficiaryHaz = computeHAZ(
      Number(beneficiaryRecord.height),
      student.sex,
      student.birthdate,
      beneficiaryRecord.date,
    )
    const bazLabel = beneficiaryBaz ? ({ SW: 'Severely Wasted', W: 'Wasted', N: 'Normal', OW: 'Overweight', O: 'Obese' } as const)[beneficiaryBaz] : null
    const hazLabel = beneficiaryHaz ? ({ SS: 'Severely Stunted', S: 'Stunted', N: 'Normal', T: 'Tall' } as const)[beneficiaryHaz] : null
    if (isOfficialBeneficiary(grade, bazLabel, hazLabel, sbfpConfig)) bucket.sbfpBeneficiaries++

    if (!record || (!record.weight && !record.height)) continue
    if (baz) {
      bucket[baz]++
    }
    if (haz === 'SS') bucket.SS++
    else if (haz === 'S') bucket.HS++
    else if (haz === 'N') bucket.HN++
    else if (haz === 'T') bucket.HT++
  }

  const { data: school } = await supabase.from('schools').select('name').eq('school_id', schoolId).maybeSingle()
  const nutritionalData = GRADE_ORDER.map((grade) => buckets[grade])
  return {
    nutritionalData,
    totals: getTotals(nutritionalData),
    meta: {
      schoolYear,
      quarter,
      feedingProgram: FEEDING_PROGRAM,
      schoolName: school?.name || 'Isabela East Central Elementary School',
    },
  }
}
