import { describe, expect, it } from 'vitest'
import { resolveColumns, type Columns } from './columnLayout'

describe('column layout', () => {
  it('shares the surplus with the rail before redistributing past its max', () => {
    const definition: Columns = [
      { id: 'aside', min: 280, max: 360, collapseOrder: 1 },
      { id: 'main', min: 400 },
      { id: 'fixed', min: 360, max: 360, collapseOrder: 0 },
    ]
    expect(resolveColumns(1124, definition, false).sizes).toEqual({
      rail: 52,
      aside: 284,
      main: 404,
      fixed: 360,
    })
    expect(resolveColumns(1136, definition, false).sizes.rail).toBe(56)
    expect(resolveColumns(1200, definition, false).sizes).toEqual({
      rail: 56,
      aside: 320,
      main: 440,
      fixed: 360,
    })
    expect(resolveColumns(1400, definition, false).sizes).toEqual({
      rail: 56,
      aside: 360,
      main: 600,
      fixed: 360,
    })
  })

  it('caps each growing column and leaves the rest for centering', () => {
    const definition: Columns = [
      { id: 'main', min: 300, max: 400 },
      { id: 'aside', min: 200, max: 220, collapseOrder: 0 },
    ]
    expect(resolveColumns(604, definition, false).sizes).toEqual({
      rail: 56,
      main: 316,
      aside: 216,
    })
    expect(resolveColumns(1000, definition, false).sizes).toEqual({
      rail: 56,
      main: 400,
      aside: 220,
    })
  })

  it('keeps fixed elements at their minimum', () => {
    const definition: Columns = [{ id: 'main', min: 300, max: 300 }]
    expect(resolveColumns(1000, definition, false).sizes).toEqual({
      rail: 56,
      main: 300,
    })
  })

  it('fills the mobile width and compresses an oversized desktop primary', () => {
    const definition: Columns = [
      { id: 'main', min: 560 },
      { id: 'aside', min: 360, collapseOrder: 0 },
    ]
    expect(resolveColumns(599, definition, true)).toMatchObject({
      mobile: true,
      visible: ['main'],
      sizes: { rail: 0, main: 599 },
    })
    expect(resolveColumns(320, definition, true).sizes.main).toBe(320)
    const widePrimary: Columns = [{ id: 'main', min: 1000 }]
    expect(resolveColumns(600, widePrimary, false).sizes).toEqual({
      rail: 48,
      main: 544,
    })
  })
})
