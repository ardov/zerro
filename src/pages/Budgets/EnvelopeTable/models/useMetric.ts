import { useState } from 'react'

export enum Metric {
  budgeted = 'budgeted',
  outcome = 'outcome',
  available = 'available',
}

const list: Metric[] = [Metric.available, Metric.budgeted, Metric.outcome]

export function useMetric() {
  const [metric, setMetric] = useState<Metric>(list[0])
  const toggleMetric = () => {
    const currIdx = list.indexOf(metric)
    const nextIdx = (currIdx + 1) % list.length
    setMetric(list[nextIdx])
  }
  return { metric, toggleMetric }
}
