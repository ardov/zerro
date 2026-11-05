const smooth = (t: number) => t * t * (3 - 2 * t)
const mix = (a: number, b: number, t: number) => a + (b - a) * t

/** Expanding weak spots with noisy edges release nearby glyphs together. */
export function createReleaseDelays(
  points: readonly { x: number; y: number }[],
  width: number,
  height: number,
  releaseDuration = 1800
) {
  const seed = Math.random() * 10000
  const patchSize = Math.max(90, Math.min(200, Math.min(width, height) * 0.24))
  const spots = Array.from({ length: 3 }, (_, i) => ({
    x: width * (0.1 + Math.random() * 0.8),
    y: height * (0.1 + Math.random() * 0.8),
    delay: i * 0.12,
  }))
  const hash = (x: number, y: number) => {
    const value = Math.sin(x * 127.1 + y * 311.7 + seed) * 43758.5453
    return value - Math.floor(value)
  }
  const noise = (x: number, y: number) => {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    const tx = smooth(x - ix)
    const ty = smooth(y - iy)
    return mix(
      mix(hash(ix, iy), hash(ix + 1, iy), tx),
      mix(hash(ix, iy + 1), hash(ix + 1, iy + 1), tx),
      ty
    )
  }
  const scores = points.map(({ x, y }) => {
    const wave = Math.min(
      ...spots.map(
        spot =>
          Math.hypot(x - spot.x, y - spot.y) / Math.max(width, height) +
          spot.delay
      )
    )
    return wave + (noise(x / patchSize, y / patchSize) - 0.5) * 0.4
  })
  const first = Math.min(...scores)
  const range = Math.max(...scores) - first || 1
  return scores.map(score => ((score - first) / range) * releaseDuration)
}
