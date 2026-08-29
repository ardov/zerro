import type { Meta, StoryObj } from '@storybook/react-vite'
import { Link as MuiLink } from '@mui/material'
import { expect, within } from 'storybook/test'
import { Link } from './Link'

const meta = {
  title: 'UI/Link',
  parameters: { layout: 'padded' },
} satisfies Meta
export default meta
type Story = StoryObj

const modes = ['always', 'hover', 'none'] as const

const paint = (el: HTMLElement) => {
  const style = getComputedStyle(el)
  return {
    color: style.color,
    line: style.textDecorationLine,
    // The underline is a fainter shade of the link until the pointer is on
    // it, which is the whole of MUI's `Link` over a bare anchor.
    decorationColor: style.textDecorationColor,
    cursor: style.cursor,
  }
}

export const Parity: Story = {
  render: () => (
    <div className="flex gap-8">
      <div className="flex flex-col items-start gap-2" data-testid="owned">
        {modes.map(mode => (
          <Link key={mode} href="#" underline={mode}>
            {mode}
          </Link>
        ))}
      </div>
      <div className="flex flex-col items-start gap-2" data-testid="mui">
        {modes.map(mode => (
          <MuiLink key={mode} href="#" underline={mode}>
            {mode}
          </MuiLink>
        ))}
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const owned = within(canvas.getByTestId('owned'))
    const mui = within(canvas.getByTestId('mui'))
    for (const mode of modes) {
      await expect({ [mode]: paint(owned.getByText(mode)) }).toEqual({
        [mode]: paint(mui.getByText(mode)),
      })
    }
  },
}

export const DarkParity: Story = { ...Parity, globals: { theme: 'dark' } }
