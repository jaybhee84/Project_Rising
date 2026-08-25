import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SCHOOL_ID = process.env.ENROLLMENT_SCHOOL_ID || process.env.BMI_SCHOOL_ID || '126001'
const SUPABASE_URL = process.env.ENROLLMENT_SUPABASE_URL
  || process.env.BMI_SUPABASE_URL
  || process.env.NEXT_PUBLIC_WEBSITE_SUPABASE_URL
  || process.env.NEXT_PUBLIC_SUPABASE_URL
  || 'https://joilvslvsioayrjshuxg.supabase.co'
const PAGE_SIZE = 1000

const GRADES = [
  { key: '0', label: 'Kinder' }, { key: '1', label: 'Grade 1' },
  { key: '2', label: 'Grade 2' }, { key: '3', label: 'Grade 3' },
  { key: '4', label: 'Grade 4' }, { key: '5', label: 'Grade 5' },
  { key: '6', label: 'Grade 6' }, { key: 'SNED', label: 'SNED' },
] as const
const READING_CATEGORIES = ['Non-Reader', 'Frustration', 'Instructional', 'Independent', 'Not Yet Assessed'] as const
type DataRow = Record<string, unknown>

export interface EnrollmentCount { total: number; male: number; female: number }
export interface GradeEnrollment extends EnrollmentCount { key: string; label: string; beneficiaries: number }
export interface ReadingAssessment { category: string; grades: Record<string, number>; total: number }
export interface DailyEnrollment extends EnrollmentCount { date: string; grades: GradeEnrollment[] }
export interface AdviserSummary extends EnrollmentCount {
  id: string; name: string; gradeKey: string; gradeLabel: string; section: string; isChairman: boolean
}
export interface SchoolYearOption { label: string; startDate: string; endDate: string }
export interface EnrollmentSummary {
  schoolId: string
  schoolYear: SchoolYearOption
  schoolYears: SchoolYearOption[]
  totals: EnrollmentCount & { beneficiaries: number; enrolledToday: number }
  grades: GradeEnrollment[]
  reading: ReadingAssessment[]
  readingGrades: { key: string; label: string; total: number }[]
  daily: DailyEnrollment[]
  advisers: AdviserSummary[]
  syncedAt: string
}

function text(value: unknown): string { return String(value ?? '').trim() }
function normalizedText(value: unknown): string {
  return text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
}
function normalizedName(value: unknown): string { return normalizedText(value).replace(/[^A-Z0-9]/g, '') }
function nameTokens(value: unknown): string[] {
  return normalizedText(value).split(/[^A-Z0-9]+/).filter((token) => token.length > 1)
}
function namesLikelyMatch(left: unknown, right: unknown): boolean {
  if (!left || !right) return false
  if (normalizedName(left) === normalizedName(right)) return true
  const leftTokens = nameTokens(left)
  const rightTokens = nameTokens(right)
  const smaller = leftTokens.length <= rightTokens.length ? leftTokens : rightTokens
  const larger = leftTokens.length <= rightTokens.length ? rightTokens : leftTokens
  return smaller.length >= 2 && smaller.every((token) => larger.includes(token))
}
function gradeKey(value: unknown): string {
  const grade = normalizedText(value)
  if (grade === '0' || grade.startsWith('KINDER')) return '0'
  if (grade.startsWith('SNED') || grade.startsWith('SPED')) return 'SNED'
  return grade.match(/[1-6]/)?.[0] || grade
}
function learnerGradeKey(learner: DataRow): string {
  return gradeKey(learner.grade_level || learner.grade || learner.gradeLevel || learner.section)
}
function gender(learner: DataRow): 'male' | 'female' | '' {
  const value = normalizedText(learner.gender || learner.sex)
  if (['M', 'MALE', 'BOY'].includes(value)) return 'male'
  if (['F', 'FEMALE', 'GIRL'].includes(value)) return 'female'
  return ''
}
function summarize(learners: DataRow[]): EnrollmentCount {
  return {
    total: learners.length,
    male: learners.filter((learner) => gender(learner) === 'male').length,
    female: learners.filter((learner) => gender(learner) === 'female').length,
  }
}
function isBeneficiary(learner: DataRow): boolean { return Boolean(learner.is_4ps || learner.is_4ps_beneficiary) }
function dateKey(value: unknown): string | null {
  const date = new Date(text(value))
  if (Number.isNaN(date.getTime())) return null
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date)
  const part = (type: string) => parts.find((item) => item.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}
function enrollmentTimestamp(learner: DataRow): unknown {
  return learner.created_at || learner.enrolled_at || learner.enrollment_date || learner.date_enrolled
}
function currentSchoolYearStart(now = new Date()): number {
  const year = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', year: 'numeric' }).format(now))
  const month = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: 'numeric' }).format(now))
  return month >= 6 ? year : year - 1
}
function normalizeSchoolYear(value: unknown): string | null {
  const years = text(value).match(/(20\d{2})\D+(20\d{2})/)
  if (!years) return null
  const start = Number(years[1])
  return Number(years[2]) === start + 1 ? `${start}\u2013${start + 1}` : null
}
function schoolYearFromTimestamp(value: unknown): string | null {
  const key = dateKey(value)
  if (!key) return null
  const [year, month] = key.split('-').map(Number)
  const start = month >= 6 ? year : year - 1
  return `${start}\u2013${start + 1}`
}
function schoolYearDetails(label: string): SchoolYearOption {
  const start = Number(label.slice(0, 4))
  return { label, startDate: `${start}-06-01`, endDate: `${start + 1}-05-31` }
}
function schoolYearFor(learner: DataRow, current: string): string {
  return normalizeSchoolYear(learner.school_year || learner.schoolYear || learner.sy)
    || schoolYearFromTimestamp(enrollmentTimestamp(learner)) || current
}
function readingCategory(learner: DataRow): typeof READING_CATEGORIES[number] {
  const raw = normalizedText(learner.reading_level || learner.reading_category)
  if (['FF', 'FE'].includes(raw) || raw.startsWith('FRUSTRATION')) return 'Frustration'
  if (['IF', 'IE'].includes(raw) || raw.startsWith('INSTRUCTIONAL')) return 'Instructional'
  if (['INDF', 'INDE'].includes(raw) || raw.startsWith('INDEPENDENT')) return 'Independent'
  if (raw === 'NA' || raw.includes('NOT YET ASSESSED')) return 'Not Yet Assessed'
  return 'Non-Reader'
}
function personName(person: DataRow): string {
  const parts = [person.first_name, person.middle_name || person.middle_initial, person.family_name || person.last_name]
    .map(text).filter(Boolean)
  return parts.join(' ') || text(person.full_name || person.name || person.username || person.adviser_name) || 'Unnamed adviser'
}
function personNameKey(person: DataRow): string { return normalizedName(personName(person)) }
function baselineTeacherName(learner: DataRow): string {
  if (learner.adviser_id || !learner.section) return ''
  const section = text(learner.section)
  const kinder = section.match(/^KINDER(?:GARTEN)?\s*[-\u2013\u2014]\s*(.+?)(?:\s*[-\u2013\u2014]\s*(?:MORNING|AFTERNOON))?$/i)
  if (kinder) return kinder[1].trim()
  return section.match(/^(?:GRADE\s*[1-6]|SNED|SPED)\s*[-\u2013\u2014]\s*(.+)$/i)?.[1]?.trim() || ''
}

async function fetchAllLearners(client: SupabaseClient): Promise<DataRow[]> {
  const learners: DataRow[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client.from('students').select('*')
      .eq('school_id', SCHOOL_ID).order('id', { ascending: true }).range(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(`Unable to load enrollment records: ${error.message}`)
    learners.push(...((data || []) as DataRow[]))
    if (!data || data.length < PAGE_SIZE) return learners
  }
}

function buildAdvisers(learners: DataRow[], orgRows: DataRow[], profiles: DataRow[], portalProfiles: DataRow[]): AdviserSummary[] {
  const orgAdvisers = orgRows.filter((person) => normalizedText(person.category) === 'TEACHING'
    && (normalizedText(person.teaching_type) === 'ADVISER' || Boolean(person.is_grade_chairman)))
  const profileAdvisers = profiles.filter((person) => normalizedText(person.role) === 'ADVISER'
    || person.grade_level_assigned != null || person.adviser_grade != null)
  const portalAdvisers = portalProfiles.filter((person) => ['ADVISER', 'GRADE_CHAIRMAN'].includes(normalizedText(person.role))
    || person.grade_level_assigned != null)
  const sources: DataRow[] = orgAdvisers.length ? orgAdvisers.map((teacher) => {
    const profile = profileAdvisers.find((candidate) => personNameKey(candidate) === personNameKey(teacher))
    const portal = portalAdvisers.find((candidate) => personNameKey(candidate) === personNameKey(teacher))
    return {
      ...teacher,
      assignment_ids: [teacher.id, profile?.id, portal?.id].filter(Boolean),
      grade_level_assigned: teacher.grade_level || portal?.grade_level_assigned || profile?.grade_level_assigned || profile?.adviser_grade,
      section_assigned: portal?.section_assigned || profile?.section_assigned || profile?.adviser_section || teacher.section || teacher.section_assigned,
    }
  }) : (portalAdvisers.length ? portalAdvisers : profileAdvisers).map((person) => ({
    ...person,
    assignment_ids: [person.id].filter(Boolean),
    grade_level_assigned: person.grade_level_assigned || person.adviser_grade,
    section_assigned: person.section_assigned || person.adviser_section,
  }))
  return sources.map((adviser, index) => {
    const assignmentIds = ((adviser.assignment_ids || []) as unknown[]).map(text)
    const adviserGrade = gradeKey(adviser.grade_level_assigned || adviser.grade_level)
    const adviserSection = normalizedName(adviser.section_assigned)
    const adviserName = personName(adviser)
    const adviserSurname = text(adviser.family_name || adviser.last_name) || nameTokens(adviserName).at(-1) || ''
    const assigned = learners.filter((learner) => {
      if (learner.adviser_id && assignmentIds.includes(text(learner.adviser_id))) return true
      const baselineName = baselineTeacherName(learner)
      if (baselineName) return learnerGradeKey(learner) === adviserGrade
        && (normalizedName(baselineName) === normalizedName(adviserSurname) || namesLikelyMatch(baselineName, adviserName))
      return !learner.adviser_id && Boolean(adviserSection) && learnerGradeKey(learner) === adviserGrade
        && normalizedName(learner.section || learner.section_assigned) === adviserSection
    })
    return {
      id: text(adviser.id) || `adviser-${index}`,
      name: adviserName,
      gradeKey: adviserGrade,
      gradeLabel: GRADES.find((grade) => grade.key === adviserGrade)?.label || text(adviser.grade_level_assigned),
      section: text(adviser.section_assigned),
      isChairman: Boolean(adviser.is_grade_chairman) || normalizedText(adviser.role) === 'GRADE_CHAIRMAN',
      ...summarize(assigned),
    }
  }).sort((left, right) => left.gradeKey.localeCompare(right.gradeKey, undefined, { numeric: true })
    || Number(right.isChairman) - Number(left.isChairman) || left.name.localeCompare(right.name))
}

export async function getEnrollmentSummary(requestedSchoolYear?: string | null): Promise<EnrollmentSummary> {
  const serviceRoleKey = process.env.ENROLLMENT_SUPABASE_SERVICE_ROLE_KEY || process.env.BMI_SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) throw new Error('Server configuration is missing ENROLLMENT_SUPABASE_SERVICE_ROLE_KEY or BMI_SUPABASE_SERVICE_ROLE_KEY.')
  const client = createClient(SUPABASE_URL, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const [allLearners, orgResult, profileResult, portalResult] = await Promise.all([
    fetchAllLearners(client), client.from('org_chart').select('*'), client.from('profiles').select('*'), client.from('portal_profile').select('*'),
  ])
  const currentStart = currentSchoolYearStart()
  const currentLabel = `${currentStart}\u2013${currentStart + 1}`
  const labels = new Set(allLearners.map((learner) => schoolYearFor(learner, currentLabel)))
  // Keep a useful history selector even before an older year has imported rows.
  for (let offset = 0; offset < 5; offset++) {
    const start = currentStart - offset
    labels.add(`${start}\u2013${start + 1}`)
  }
  const schoolYears = [...labels].sort((a, b) => Number(b.slice(0, 4)) - Number(a.slice(0, 4))).map(schoolYearDetails)
  const requested = normalizeSchoolYear(requestedSchoolYear)
  const selectedLabel = requested && labels.has(requested) ? requested : schoolYears[0].label
  const learners = allLearners.filter((learner) => schoolYearFor(learner, currentLabel) === selectedLabel)
  const grades = GRADES.map((grade) => {
    const rows = learners.filter((learner) => learnerGradeKey(learner) === grade.key)
    return { ...grade, ...summarize(rows), beneficiaries: rows.filter(isBeneficiary).length }
  })
  const readingGrades = GRADES.filter((grade) => ['1', '2', '3', '4', '5', '6'].includes(grade.key))
  const reading = READING_CATEGORIES.map((category) => {
    const counts = Object.fromEntries(readingGrades.map((grade) => [grade.key,
      learners.filter((learner) => learnerGradeKey(learner) === grade.key && readingCategory(learner) === category).length]))
    return { category, grades: counts, total: Object.values(counts).reduce((sum, count) => sum + count, 0) }
  })
  const dailyGroups = new Map<string, DataRow[]>()
  for (const learner of learners) {
    const key = dateKey(enrollmentTimestamp(learner))
    if (key) dailyGroups.set(key, [...(dailyGroups.get(key) || []), learner])
  }
  const daily = [...dailyGroups.entries()].map(([date, rows]) => ({
    date, ...summarize(rows), grades: GRADES.map((grade) => {
      const gradeRows = rows.filter((learner) => learnerGradeKey(learner) === grade.key)
      return { ...grade, ...summarize(gradeRows), beneficiaries: gradeRows.filter(isBeneficiary).length }
    }),
  })).sort((left, right) => right.date.localeCompare(left.date))
  const today = dateKey(new Date())
  return {
    schoolId: SCHOOL_ID,
    schoolYear: schoolYearDetails(selectedLabel), schoolYears,
    totals: { ...summarize(learners), beneficiaries: learners.filter(isBeneficiary).length,
      enrolledToday: daily.find((row) => row.date === today)?.total || 0 },
    grades, reading,
    readingGrades: readingGrades.map((grade) => ({ ...grade,
      total: learners.filter((learner) => learnerGradeKey(learner) === grade.key).length })),
    daily,
    advisers: buildAdvisers(learners, (orgResult.data || []) as DataRow[], (profileResult.data || []) as DataRow[], (portalResult.data || []) as DataRow[]),
    syncedAt: new Date().toISOString(),
  }
}
