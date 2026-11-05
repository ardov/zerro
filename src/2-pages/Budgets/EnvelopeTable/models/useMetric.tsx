import { useBreakpointDown } from '@/6-shared/hooks/useBreakpointDown'
import type { FC, ReactNode } from 'react'
import React, { useContext, useState } from 'react'

export enum Metric {
  assigned = 'assigned',
  outcome = 'outcome',
  available = 'available',
}

const allColumns: Metric[] = [Metric.available, Metric.assigned, Metric.outcome]

export function useMetric() {
  const [metric, setMetric] = useState<Metric>(allColumns[0])
  const toggleMetric = () => {
    const currIdx = allColumns.indexOf(metric)
    const nextIdx = (currIdx + 1) % allColumns.length
    setMetric(allColumns[nextIdx])
  }
  return { metric, toggleMetric }
}

const RenderColumnContext = React.createContext<
  [Metric[], (metrics: Metric[]) => void]
>([[], () => {}])

export const RenderColumnsProvider: FC<{ children: ReactNode }> = props => {
  const isMobile = useBreakpointDown('sm')
  const [mobColumns, setMobColumns] = useState<Metric[]>([Metric.available])
  const renderColumns = isMobile ? mobColumns : allColumns
  return (
    <RenderColumnContext.Provider value={[renderColumns, setMobColumns]}>
      {props.children}
    </RenderColumnContext.Provider>
  )
}

export function useColumns() {
  const [columns, setMobColumns] = useContext(RenderColumnContext)
  const nextColumn = () => {
    const currIdx = allColumns.indexOf(columns[0])
    const nextIdx = (currIdx + 1) % allColumns.length
    setMobColumns([allColumns[nextIdx]])
  }
  return { columns, nextColumn }
}
