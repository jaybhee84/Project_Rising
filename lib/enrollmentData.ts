export interface EnrollmentCount {
  total: number
  male: number
  female: number
}

export interface GradeEnrollment extends EnrollmentCount {
  key: string
  label: string
  beneficiaries: number
}

export interface ReadingAssessment {
  category: string
  grades: Record<string, number>
  total: number
}

export interface DailyEnrollment extends EnrollmentCount {
  date: string
  grades: GradeEnrollment[]
}

export interface AdviserSummary extends EnrollmentCount {
  id: string
  name: string
  gradeKey: string
  gradeLabel: string
  section: string
  isChairman: boolean
}

export interface SchoolYearOption {
  label: string
  startDate: string
  endDate: string
}

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

interface EnrollmentCacheEntry {
  data: EnrollmentSummary
  fetchedAt: number
}

const enrollmentCache = new Map<string, EnrollmentCacheEntry>()
const pendingRequests = new Map<string, Promise<EnrollmentSummary>>()
let latestSchoolYear = ''

export function getCachedEnrollmentData(schoolYear = ''): EnrollmentSummary | null {
  const key = schoolYear || latestSchoolYear
  return key ? enrollmentCache.get(key)?.data ?? null : null
}

export function shouldRefreshEnrollmentData(schoolYear = '', maxAgeMs = 30_000): boolean {
  const key = schoolYear || latestSchoolYear
  const entry = key ? enrollmentCache.get(key) : undefined
  return !entry || Date.now() - entry.fetchedAt > maxAgeMs
}

export async function fetchEnrollmentData(schoolYear = '', force = false): Promise<EnrollmentSummary> {
  const key = schoolYear || latestSchoolYear || 'latest'
  const cached = schoolYear ? enrollmentCache.get(schoolYear)?.data ?? null : getCachedEnrollmentData()
  if (!force && cached) return cached

  const pending = pendingRequests.get(key)
  if (pending) return pending

  const request = (async () => {
    const query = schoolYear ? `?schoolYear=${encodeURIComponent(schoolYear)}` : ''
    const response = await fetch(`/api/enrollment${query}`, { cache: 'no-store' })
    const body: unknown = await response.json()
    if (!response.ok) {
      const message = body && typeof body === 'object' && 'error' in body
        ? String(body.error)
        : 'Unable to synchronize enrollment data.'
      throw new Error(message)
    }

    const data = body as EnrollmentSummary
    latestSchoolYear ||= data.schoolYears[0]?.label || data.schoolYear.label
    enrollmentCache.set(data.schoolYear.label, { data, fetchedAt: Date.now() })
    return data
  })().finally(() => pendingRequests.delete(key))

  pendingRequests.set(key, request)
  return request
}

export function preloadEnrollmentData(): void {
  void fetchEnrollmentData().catch(console.error)
}
