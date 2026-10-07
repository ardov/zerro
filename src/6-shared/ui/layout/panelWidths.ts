import { useMediaQueryValue } from '@/6-shared/hooks/useMediaQueryValue'

/** Minimum widths of the rail, the canvas gap and every panel, in pixels.
 *
 * The only place a page's layout thresholds come from: a page asks whether
 * the window fits the rail and a set of panels side by side, and the answer
 * moves whenever one of these numbers does. */
export const panelWidths = {
  rail: 48,
  /** The canvas padding above, below and after panels, and the gap between them. */
  gap: 8,
  accounts: 240,
  transactionList: 400,
  transactionDetail: 360,
  envelopeList: 480,
  monthOverview: 360,
} as const

/** The narrowest window that holds the rail and these panels side by side. */
function windowWidthFor(...panels: number[]) {
  const { rail, gap } = panelWidths
  // The first panel touches the rail; each panel has a gap on its right.
  return panels.reduce((sum, panel) => sum + panel + gap, rail)
}

/** True while the window holds the rail and these panels side by side. */
export function useWindowFits(...panels: number[]) {
  return useMediaQueryValue(`(min-width: ${windowWidthFor(...panels)}px)`)
}

/** Whether the accounts panel fits beside the transaction list. */
export function useAccountsPanelFits() {
  return useWindowFits(panelWidths.accounts, panelWidths.transactionList)
}
