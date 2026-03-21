import { MissionControlPhase1A } from '@/components/phase1a/mission-control-phase1a'
import { getPhase1AViewModel } from '@/lib/phase1a-data'

interface HomePageProps {
  params: Promise<{ panel?: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function HomePage({ params, searchParams }: HomePageProps) {
  const [{ panel }, resolvedSearchParams] = await Promise.all([params, searchParams])
  const model = getPhase1AViewModel({
    panelSegment: panel?.[0] ?? null,
    searchParams: resolvedSearchParams,
  })

  return <MissionControlPhase1A model={model} />
}
