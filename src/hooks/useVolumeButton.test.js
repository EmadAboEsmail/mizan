import { describe, it, expect } from 'vitest'
import { extractVolumeKeyCode } from './useVolumeButton.js'

describe('extractVolumeKeyCode', () => {
  it('reads keyCode placed directly on Event by Capacitor native-bridge.js', () => {
    const upEvent = Object.assign(new Event('volumeButtonPress'), {
      keyCode: 24,
    })
    const downEvent = Object.assign(new Event('volumeButtonPress'), {
      keyCode: 25,
    })
    expect(extractVolumeKeyCode(upEvent)).toBe(24)
    expect(extractVolumeKeyCode(downEvent)).toBe(25)
  })

  it('reads keyCode from CustomEvent detail object or JSON string', () => {
    const objEvent = new CustomEvent('volumeButtonPress', {
      detail: { keyCode: 24 },
    })
    const jsonEvent = new CustomEvent('volumeButtonPress', {
      detail: JSON.stringify({ keyCode: 25 }),
    })
    expect(extractVolumeKeyCode(objEvent)).toBe(24)
    expect(extractVolumeKeyCode(jsonEvent)).toBe(25)
  })

  it('returns null for malformed or unrelated payloads', () => {
    expect(extractVolumeKeyCode(null)).toBeNull()
    expect(extractVolumeKeyCode(new Event('volumeButtonPress'))).toBeNull()
    expect(
      extractVolumeKeyCode(
        new CustomEvent('volumeButtonPress', { detail: '{invalid' })
      )
    ).toBeNull()
  })
})
