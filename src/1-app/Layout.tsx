import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { MobileNavigation, Rail } from '@/3-widgets/Navigation'
import { resolveColumns, type Columns } from '@/6-shared/ui/layout/columnLayout'
import { ColumnsContext } from '@/6-shared/ui/layout/useColumns'
import { useMobileLayout } from '@/6-shared/ui/layout/useMobileLayout'
import { pageColumns } from './pageColumns'
import './Layout.css'

export function Layout({
  navigation,
  columns,
  toolbar,
  children,
}: {
  navigation: boolean
  columns?: Columns
  toolbar?: ReactNode
  children: ReactNode
}) {
  const mobile = useMobileLayout()
  const content = useRef<HTMLElement>(null)
  const [width, setWidth] = useState(() => window.innerWidth)
  useLayoutEffect(() => {
    const element = content.current!
    const measure = () => setWidth(element.getBoundingClientRect().width)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const layout = useMemo(
    () => resolveColumns(width, columns, mobile),
    [width, columns, mobile]
  )
  // Navigation keeps Accounts available at the transaction page's collapse
  // threshold, regardless of the current route. It shares this measurement.
  const transactionLayout =
    columns === pageColumns.transactions
      ? layout
      : resolveColumns(width, pageColumns.transactions, mobile)
  const accountsPanelFits = transactionLayout.visible.includes('accounts')

  return (
    <ColumnsContext value={layout}>
      <div
        className="app-layout"
        data-navigation={navigation || undefined}
        data-mobile={mobile || undefined}
      >
        {toolbar && <div className="shrink-0">{toolbar}</div>}
        <div className="flex min-h-0 min-w-0 flex-1">
          {navigation && !mobile && (
            <Rail accountsPanelFits={accountsPanelFits} />
          )}
          <main ref={content} className="flex min-h-0 min-w-0 flex-1">
            {children}
          </main>
        </div>
        {navigation && mobile && <MobileNavigation />}
      </div>
    </ColumnsContext>
  )
}
