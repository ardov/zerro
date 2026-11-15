import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within, waitFor } from 'storybook/test'
import { wcagContrast } from 'culori'
import { useAppDispatch } from '@/store'
import { core } from '@/zerro-core/redux'
import { syncStatusChanged, syncFinished } from '@/store/sync'
import RefreshButton from './RefreshButton'

function StateHarness() {
  const dispatch = useAppDispatch()
  return (
    <div>
      <div data-testid="refresh">
        <RefreshButton />
      </div>
      <button
        onClick={() => dispatch(core.accounts.setInBalance('HSBC USD', false))}
      >
        Edit
      </button>
      <button
        onClick={() =>
          dispatch(syncStatusChanged({ status: { kind: 'pulling' } }))
        }
      >
        Load
      </button>
      <button
        onClick={() =>
          dispatch(
            syncStatusChanged({
              status: {
                kind: 'pushing',
                phase: 'sending',
                rows: [{ key: 'transaction', confirmed: 1, total: 2 }],
                retryAt: null,
                errorMessage: null,
                errorStatus: null,
              },
            })
          )
        }
      >
        Push
      </button>
      <button
        onClick={() =>
          dispatch(
            syncFinished({
              finishedAt: Date.now(),
              isSuccessful: true,
              errorMessage: null,
            })
          )
        }
      >
        Finish
      </button>
    </div>
  )
}

const meta = {
  title: 'App/Sync/RefreshButton',
  component: StateHarness,
  parameters: { app: { scenario: 'demo' }, layout: 'centered' },
} satisfies Meta<typeof StateHarness>
export default meta
type Story = StoryObj<typeof meta>

export const StableSize: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = within(canvas.getByTestId('refresh')).getByRole('button')
    const initial = button.getBoundingClientRect()
    const checkIconSize = () => {
      const icon = button.querySelector('svg')!
      expect(getComputedStyle(icon).width).toBe('24px')
      expect(getComputedStyle(icon).height).toBe('24px')
    }
    checkIconSize()
    for (const action of ['Load', 'Push', 'Finish']) {
      await userEvent.click(canvas.getByRole('button', { name: action }))
      const current = button.getBoundingClientRect()
      expect(current.width, `${action}: width`).toBe(initial.width)
      expect(current.height, `${action}: height`).toBe(initial.height)
      checkIconSize()
    }
  },
}

// The same SVG and checkmark must survive completion for their CSS transitions.
export const Completion: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = within(canvas.getByTestId('refresh')).getByRole('button')
    for (const action of ['Load', 'Push']) {
      await userEvent.click(canvas.getByRole('button', { name: action }))
      const indicator = button.querySelector('svg')
      const checkmark = indicator?.querySelector('path')
      expect(checkmark).not.toBeNull()
      expect(checkmark).not.toHaveAttribute('data-completed')
      await userEvent.click(canvas.getByRole('button', { name: 'Finish' }))
      expect(button.querySelector('svg')).toBe(indicator)
      expect(button.querySelector('path')).toBe(checkmark)
      expect(checkmark).toHaveAttribute('data-completed')
    }
  },
}

export const PendingChangesContrast: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Edit' }))
    const refresh = canvas.getByTestId('refresh')
    await expect(within(refresh).getByText('1')).toBeVisible()
    const button = within(refresh).getByRole('button')
    for (const action of ['Load', 'Push']) {
      await userEvent.click(canvas.getByRole('button', { name: action }))
      const orbit = button.querySelector('circle')!
      await waitFor(() =>
        expect(
          wcagContrast(
            getComputedStyle(orbit).stroke,
            getComputedStyle(button).backgroundColor
          ),
          `${action}: progress must remain visible on the pending-changes button`
        ).toBeGreaterThanOrEqual(3)
      )
    }
  },
}
