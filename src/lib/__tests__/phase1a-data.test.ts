import { describe, expect, it } from 'vitest'
import { buildPhase1aHref, getPhase1AViewModel, getPhase1APanel } from '@/lib/phase1a-data'

describe('phase1a-data', () => {
  it('normalizes the allowed phase 1A panels', () => {
    expect(getPhase1APanel('runs')).toBe('runs')
    expect(getPhase1APanel('artifacts')).toBe('artifacts')
    expect(getPhase1APanel('health')).toBe('health')
    expect(getPhase1APanel('activity')).toBe('activity')
    expect(getPhase1APanel('tasks')).toBe('overview')
    expect(getPhase1APanel(undefined)).toBe('overview')
  })

  it('selects records from the approved query params', () => {
    const runsModel = getPhase1AViewModel({
      panelSegment: 'runs',
      searchParams: { run: 'run-lighthouse' },
    })
    expect(runsModel.selectedRun?.id).toBe('run-lighthouse')

    const artifactModel = getPhase1AViewModel({
      panelSegment: 'artifacts',
      searchParams: { artifact: 'artifact-echo-plan' },
    })
    expect(artifactModel.selectedArtifact?.id).toBe('artifact-echo-plan')

    const healthModel = getPhase1AViewModel({
      panelSegment: 'health',
      searchParams: { alert: 'alert-gateway-saturation' },
    })
    expect(healthModel.selectedAlert?.id).toBe('alert-gateway-saturation')

    const activityModel = getPhase1AViewModel({
      panelSegment: 'activity',
      searchParams: { event: 'event-meridian-diff' },
    })
    expect(activityModel.selectedEvent?.id).toBe('event-meridian-diff')
  })

  it('falls back to the first record when the query selection is invalid', () => {
    const runsModel = getPhase1AViewModel({
      panelSegment: 'runs',
      searchParams: { run: 'missing' },
    })

    expect(runsModel.selectedRun?.id).toBe(runsModel.runs[0]?.id)
  })

  it('builds the approved detail URLs', () => {
    expect(buildPhase1aHref('overview')).toBe('/')
    expect(buildPhase1aHref('runs', { key: 'run', value: 'run-atlas' })).toBe('/runs?run=run-atlas')
    expect(buildPhase1aHref('artifacts', { key: 'artifact', value: 'artifact-cutover-brief' })).toBe(
      '/artifacts?artifact=artifact-cutover-brief'
    )
  })
})
