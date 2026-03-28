import { describe, expect, it } from 'vitest'
import { mergeAgentConfig, validateRegistrationInput } from '@/lib/agent-registration'

describe('agent-registration', () => {
  it('accepts extended OpenClaw registration payloads', () => {
    const result = validateRegistrationInput({
      name: 'app-delivery',
      role: 'agent',
      framework: 'openclaw',
      capabilities: ['sessions_send', 'memory_search'],
      session_key: 'agent:app-delivery:main',
      identity: { name: 'App Delivery', emoji: '🛠️' },
      session: { channel: 'webchat', model: 'openai-codex/gpt-5.4' },
      metadata: { source: 'openclaw-gateway-sync' },
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.session_key).toBe('agent:app-delivery:main')
    expect(result.value.identity).toEqual({ name: 'App Delivery', emoji: '🛠️' })
    expect(result.value.session).toEqual({ channel: 'webchat', model: 'openai-codex/gpt-5.4' })
  })

  it('merges existing config with identity and session metadata', () => {
    const merged = mergeAgentConfig(JSON.stringify({
      tools: { allow: ['sessions_send'] },
      identity: { theme: 'builder' },
      registration: { source: 'manual' },
    }), {
      capabilities: ['sessions_send', 'memory_search'],
      framework: 'openclaw',
      identity: { name: 'App Delivery' },
      session: { key: 'agent:app-delivery:main', channel: 'webchat' },
      metadata: { source: 'openclaw-gateway-sync' },
    })

    expect(merged.tools).toEqual({ allow: ['sessions_send'] })
    expect(merged.capabilities).toEqual(['sessions_send', 'memory_search'])
    expect(merged.framework).toBe('openclaw')
    expect(merged.identity).toEqual({ theme: 'builder', name: 'App Delivery' })
    expect(merged.openclawSession).toEqual({ key: 'agent:app-delivery:main', channel: 'webchat' })
    expect(merged.registration).toEqual({ source: 'openclaw-gateway-sync' })
  })
})
