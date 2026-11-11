import { describe, expect, it } from 'vitest'
import { fitWithin, MAX_PHOTO_SIDE } from './photo'

describe('fitWithin', () => {
  it('shrinks a landscape photo so its long side is the limit and keeps the ratio', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 800, height: 600 })
  })

  it('shrinks a portrait photo so its long side is the limit', () => {
    expect(fitWithin(3000, 4000)).toEqual({ width: 600, height: 800 })
  })

  it('shrinks a square photo to the limit on both sides', () => {
    expect(fitWithin(1600, 1600)).toEqual({ width: 800, height: 800 })
  })

  it('leaves a photo that is already small untouched', () => {
    expect(fitWithin(640, 480)).toEqual({ width: 640, height: 480 })
    expect(fitWithin(MAX_PHOTO_SIDE, 300)).toEqual({ width: 800, height: 300 })
  })

  it('never returns a zero-sized side for a very thin photo', () => {
    expect(fitWithin(10000, 1)).toEqual({ width: 800, height: 1 })
  })

  it('accepts a custom limit', () => {
    expect(fitWithin(1000, 500, 250)).toEqual({ width: 250, height: 125 })
  })
})
