import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Menu, MenuItem } from './Menu'
import { Button } from './Button'

const meta = {
  title: 'Library/Overlays/Menu',
  component: Menu,
  tags: ['autodocs'],
  args: { 'aria-label': 'Demo menu', open: false, placement: 'bottom-start' },
} satisfies Meta<typeof Menu>

export default meta
type Story = StoryObj<typeof meta>

function Harness(props: {
  placement?: 'bottom-start' | 'top-end'
  atPoint?: boolean
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [picked, setPicked] = useState('')
  const [closed, setClosed] = useState(0)
  return (
    <div className="p-[300px]">
      <Button onClick={e => setAnchorEl(e.currentTarget)}>Open menu</Button>
      <output data-testid="picked">{picked}</output>
      <output data-testid="closed">{closed}</output>
      <Menu
        open={Boolean(anchorEl)}
        anchorEl={props.atPoint ? null : anchorEl}
        anchorPosition={props.atPoint ? { left: 200, top: 240 } : undefined}
        placement={props.placement}
        onClose={() => setAnchorEl(null)}
        onCloseComplete={() => setClosed(n => n + 1)}
        aria-label="Demo menu"
      >
        <MenuItem
          onClick={() => {
            setPicked('alpha')
            setAnchorEl(null)
          }}
        >
          Alpha
        </MenuItem>
        <MenuItem
          onClick={() => {
            setPicked('beta')
            setAnchorEl(null)
          }}
        >
          Beta
        </MenuItem>
        <MenuItem disabled>Disabled</MenuItem>
      </Menu>
    </div>
  )
}

const open = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  const body = within(canvasElement.ownerDocument.body)
  const trigger = canvas.getByRole('button', { name: 'Open menu' })
  await userEvent.click(trigger)
  return { canvas, body, trigger }
}

/** One component instance, with its visual props supplied by Args. */
export const Bench: Story = {
  render: args => <Harness placement={args.placement} />,
}

export const Anchored: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const { canvas, body, trigger } = await open(canvasElement)
    const menu = await body.findByRole('menu', { name: 'Demo menu' })

    // Menu semantics, unlike ActionList: this popup was opened by something
    // and can be dismissed.
    await expect(within(menu).getAllByRole('menuitem')).toHaveLength(3)
    // The default placement lays the menu's top-left over the anchor's.
    const anchor = trigger.getBoundingClientRect()
    await waitFor(() =>
      expect(
        Math.abs(menu.getBoundingClientRect().left - anchor.left)
      ).toBeLessThan(2)
    )

    // Base UI's own close-on-click is off, so exactly one close runs: these
    // menus sit on the history stack and a second one would pop it twice.
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Beta' }))
    await waitFor(() =>
      expect(canvas.getByTestId('picked')).toHaveTextContent('beta')
    )
    await waitFor(() =>
      expect(canvas.getByTestId('closed')).toHaveTextContent('1')
    )
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}

export const KeyboardAndDismissal: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const { canvas, body, trigger } = await open(canvasElement)
    const menu = await body.findByRole('menu', { name: 'Demo menu' })

    const alpha = within(menu).getByRole('menuitem', { name: 'Alpha' })
    alpha.focus()
    await expect(alpha).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() =>
      expect(within(menu).getByRole('menuitem', { name: 'Beta' })).toHaveFocus()
    )

    // A menu keeps disabled rows reachable, so they are
    // still announced. They are dimmed through `aria-disabled` rather than
    // `:disabled`: Base UI renders a menu row as a div, not a button.
    await userEvent.keyboard('{ArrowDown}')
    const off = within(menu).getByRole('menuitem', { name: 'Disabled' })
    await waitFor(() => expect(off).toHaveFocus())
    await expect(getComputedStyle(off).opacity).not.toBe('1')
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByTestId('picked')).toHaveTextContent('')

    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(body.queryByRole('menu', { name: 'Demo menu' })).toBeNull()
    )
    await expect(canvas.getByTestId('picked')).toHaveTextContent('')
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}

/** A context menu opened by a right click has a point, not an element. */
export const AtAPoint: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness atPoint />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await open(canvasElement)
    const menu = await body.findByRole('menu', { name: 'Demo menu' })
    await waitFor(() => {
      const rect = menu.getBoundingClientRect()
      expect(Math.abs(rect.left - 200)).toBeLessThan(2)
      expect(Math.abs(rect.top - 240)).toBeLessThan(2)
    })
  },
}

/** The transaction action bar sits at the bottom and opens upward. */
export const OpensUpward: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness placement="top-end" />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const { trigger } = await open(canvasElement)
    const menu = await body.findByRole('menu', { name: 'Demo menu' })
    const anchor = trigger.getBoundingClientRect()
    await waitFor(() => {
      const rect = menu.getBoundingClientRect()
      expect(rect.bottom).toBeLessThanOrEqual(anchor.top + 2)
      expect(Math.abs(rect.right - anchor.right)).toBeLessThan(2)
    })
  },
}
