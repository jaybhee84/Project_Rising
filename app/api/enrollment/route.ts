import { getEnrollmentSummary } from '@/lib/enrollmentData.server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const schoolYear = new URL(request.url).searchParams.get('schoolYear')
  try {
    return Response.json(await getEnrollmentSummary(schoolYear), {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to synchronize enrollment data.'
    return Response.json({ error: message }, { status: 500 })
  }
}
