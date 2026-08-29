import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tooltip as MuiTooltip } from '@mui/material'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Tooltip } from './Tooltip'

const meta = {
  title: 'UI/Tooltip',
  parameters: { layout: 'centered' },
} satisfies Meta
export default meta
type Story = StoryObj

/** MUI's own tooltip, styled the way this app styled it: 14px type rather
 * than the 11px MUI ships. That override was the only reason the app wrapped
 * `Tooltip` at all, so the reference has to carry it. */
const muiSx = { '& .MuiTooltip-tooltip': { fontSize: 14 } }

function Harness({ placement }: { placement?: 'top' | 'bottom' }) {
  return (
    <div className="flex flex-col items-center gap-24 py-24">
      <Tooltip title="A label" placement={placement}>
        <button data-testid="owned-trigger">Owned</button>
      </Tooltip>
      <MuiTooltip
        title="A label"
        placement={placement}
        enterDelay={300}
        slotProps={{ popper: { sx: muiSx } }}
      >
        <button data-testid="mui-trigger">MUI</button>
      </MuiTooltip>
    </div>
  )
}

const paint = (el: HTMLElement) => {
  const style = getComputedStyle(el)
  return {
    background: style.backgroundColor,
    color: style.color,
    padding: style.padding,
    radius: style.borderRadius,
    font: style.font,
    maxWidth: style.maxWidth,
  }
}

/** The label's look, and the 14px it keeps clear of what it describes. */
const compare: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const doc = canvasElement.ownerDocument
  const body = within(doc.body)

  const shots = []
  for (const which of ['owned', 'mui'] as const) {
    const trigger = canvas.getByTestId(`${which}-trigger`)
    await userEvent.hover(trigger)
    const label = await body.findByText('A label', {}, { timeout: 3000 })
    const popup = label.closest<HTMLElement>(
      '[data-slot="tooltip"], .MuiTooltip-tooltip'
    )!
    await waitFor(() =>
      expect(popup.getAnimations().some(a => a.playState === 'running')).toBe(
        false
      )
    )
    const triggerBox = trigger.getBoundingClientRect()
    const popupBox = popup.getBoundingClientRect()
    shots.push({
      ...paint(popup),
      // Above the trigger, and how far above it.
      gap: Math.round(triggerBox.top - popupBox.bottom),
      centred: Math.round(
        popupBox.left +
          popupBox.width / 2 -
          (triggerBox.left + triggerBox.width / 2)
      ),
    })
    await userEvent.unhover(trigger)
    await waitFor(() =>
      expect(body.queryByText('A label')).not.toBeInTheDocument()
    )
  }
  expect(shots[0]).toEqual(shots[1])
}

export const Parity: Story = { render: () => <Harness />, play: compare }
export const DarkParity: Story = { ...Parity, globals: { theme: 'dark' } }

/** Nothing at all without a title, so a call site can pass a value that may
 * be empty and not branch around it. */
export const NoTitle: Story = {
  render: () => (
    <Tooltip title={undefined}>
      <button>Bare</button>
    </Tooltip>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Bare' })
    await userEvent.hover(trigger)
    await expect(trigger).not.toHaveAttribute('aria-describedby')
  },
}

/** MUI named its child rather than describing it, and an icon-only button has
 * no other name to fall back on. */
export const NamesItsChild: Story = {
  render: () => (
    <div className="flex gap-8">
      <Tooltip title="Settings">
        <button data-testid="owned">
          <span aria-hidden>⚙</span>
        </button>
      </Tooltip>
      <MuiTooltip title="Settings">
        <button data-testid="mui">
          <span aria-hidden>⚙</span>
        </button>
      </MuiTooltip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByTestId('owned')).toHaveAccessibleName(
      canvas.getByTestId('mui').getAttribute('aria-label')!
    )
    await expect(
      canvas.getAllByRole('button', { name: 'Settings' })
    ).toHaveLength(2)
  },
}
