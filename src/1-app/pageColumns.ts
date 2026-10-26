import type { Columns } from '@/6-shared/ui/layout/columnLayout'

export const pageColumns = {
  transactions: [
    { id: 'accounts', min: 280, max: 360, collapseOrder: 1 },
    { id: 'transactions', min: 400 },
    { id: 'detail', min: 360, max: 360, collapseOrder: 0 },
  ],
  budget: [
    { id: 'accounts', min: 280, max: 360, collapseOrder: 0 },
    { id: 'envelopes', min: 560 },
    { id: 'overview', min: 360, max: 360, collapseOrder: 1 },
  ],
  accounts: [{ id: 'accounts', min: 280 }],
} satisfies Record<string, Columns>
