import type { Meta, StoryObj } from '@storybook/react-vite'

import { SyncProgressDialogView } from './SyncProgressDialog'

const meta = {
  title: 'App/Sync/ProgressDialog',
  component: SyncProgressDialogView,
  tags: ['autodocs'],
  args: {
    open: true,
    onClose: () => {},
    onContinue: () => {},
    onRetry: () => {},
    progress: {
      kind: 'pushing',
      phase: 'sending',
      rows: [
        { key: 'user', confirmed: 1, total: 1 },
        { key: 'account', confirmed: 40, total: 40 },
        { key: 'merchant', confirmed: 100, total: 100 },
        { key: 'transaction', confirmed: 700, total: 1000 },
      ],
      errorMessage: null,
      errorStatus: null,
      retryAt: null,
    },
  },
} satisfies Meta<typeof SyncProgressDialogView>

export default meta
type Story = StoryObj<typeof meta>

/** One dialog instance, controlled entirely through args. */
export const Bench: Story = {}

export const Waiting: Story = {
  args: {
    progress: {
      ...meta.args.progress,
      phase: 'waiting',
      errorMessage: 'Network unavailable',
      retryAt: Date.now() + 30_000,
    },
  },
}

export const Stopped: Story = {
  args: {
    progress: {
      kind: 'stopped',
      rows: meta.args.progress.rows,
      errorMessage: 'Invalid transaction',
      errorStatus: null,
      maxBytes: 2 * 1024 * 1024,
    },
  },
}

export const Mobile: Story = {
  globals: { viewport: { value: 'iphone13' } },
}
