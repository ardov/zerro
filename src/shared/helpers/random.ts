/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 */
export function randomInt(min: number, max: number): number {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}
