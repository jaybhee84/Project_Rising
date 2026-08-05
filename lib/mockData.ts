// TODO: Replace with Supabase query when DB schema is ready
// Query pattern will be:
// supabase.from('bmi_records').select('grade_level, nutritional_status')
//   .eq('school_year', currentSY).then(aggregate by grade)

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

export const nsLabels: Record<NSCategory, string> = {
  SW: 'Severely Wasted',
  W: 'Wasted',
  N: 'Normal',
  OW: 'Overweight',
  O: 'Obese',
}

export const nsColors: Record<NSCategory, string> = {
  SW: '#C0392B',
  W:  '#E67E22',
  N:  '#27AE60',
  OW: '#0891B2',
  O:  '#8E44AD',
}

export const mockNutritionalData: GradeLevelData[] = [
  { grade: 'Kinder',  total: 42, SW: 5,  W: 8,  N: 24, OW: 3, O: 2, sbfpBeneficiaries: 13 },
  { grade: 'Grade 1', total: 55, SW: 6,  W: 10, N: 31, OW: 5, O: 3, sbfpBeneficiaries: 16 },
  { grade: 'Grade 2', total: 50, SW: 4,  W: 9,  N: 29, OW: 5, O: 3, sbfpBeneficiaries: 13 },
  { grade: 'Grade 3', total: 48, SW: 3,  W: 7,  N: 30, OW: 5, O: 3, sbfpBeneficiaries: 10 },
  { grade: 'Grade 4', total: 52, SW: 4,  W: 8,  N: 32, OW: 5, O: 3, sbfpBeneficiaries: 12 },
  { grade: 'Grade 5', total: 49, SW: 3,  W: 6,  N: 31, OW: 6, O: 3, sbfpBeneficiaries: 9  },
  { grade: 'Grade 6', total: 45, SW: 2,  W: 5,  N: 29, OW: 6, O: 3, sbfpBeneficiaries: 7  },
]

export function getPct(count: number, total: number) {
  if (total === 0) return '0.0'
  return ((count / total) * 100).toFixed(1)
}

export function getTotals(data: GradeLevelData[]) {
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
