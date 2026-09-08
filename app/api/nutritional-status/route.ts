import { getNutritionalSummary } from '@/lib/nutritionalData.server'
import { QUARTERS, getSchoolYears } from '@/lib/nutritionalData'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const schoolYears = getSchoolYears()
  const schoolYear = params.get('schoolYear') || schoolYears[0]
  const quarter = params.get('quarter') || QUARTERS[0]

  if (!schoolYears.includes(schoolYear) || !QUARTERS.includes(quarter)) {
    return Response.json({ error: 'Invalid school year or period.' }, { status: 400 })
  }

  try {
    return Response.json(await getNutritionalSummary(schoolYear, quarter), {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load nutritional summary.'
    return Response.json({ error: message }, { status: 500 })
  }
}
