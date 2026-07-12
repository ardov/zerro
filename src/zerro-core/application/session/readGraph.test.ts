import { describe, expect, it } from 'vitest'

import { readDependencies } from './readGraph'

describe('readDependencies', () => {
  it('only points to known session nodes', () => {
    const nodes = new Set(Object.keys(readDependencies))
    const unknownDependencies = Object.entries(readDependencies).flatMap(
      ([node, dependencies]) =>
        dependencies
          .filter(dependency => !nodes.has(dependency))
          .map(dependency => `${node} -> ${dependency}`)
    )

    expect(unknownDependencies).toEqual([])
  })

  it('keeps the documented projection graph acyclic', () => {
    const nodes = new Set(Object.keys(readDependencies))
    const visited = new Set<string>()
    const active = new Set<string>()

    const visit = (node: string) => {
      if (active.has(node)) throw new Error(`Read graph cycle at ${node}`)
      if (visited.has(node)) return

      active.add(node)
      const dependencies = readDependencies[
        node as keyof typeof readDependencies
      ] as readonly string[]
      dependencies.forEach(visit)
      active.delete(node)
      visited.add(node)
    }

    expect(() => Object.keys(readDependencies).forEach(visit)).not.toThrow()
  })
})
