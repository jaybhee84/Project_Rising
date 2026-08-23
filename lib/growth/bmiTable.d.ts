type BmiThreshold = {
  sw_max: number
  w_from: number
  w_to: number
  n_from: number
  n_to: number
  ow_from: number
  ow_to: number
  ob_min: number
}
export const BMI_TABLE_BOYS: Record<number, BmiThreshold>
export const BMI_TABLE_GIRLS: Record<number, BmiThreshold>
