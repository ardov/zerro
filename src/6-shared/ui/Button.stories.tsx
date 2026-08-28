import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Button as MuiButton, IconButton as MuiIconButton } from '@mui/material'
import { Button, IconButton, buttonPalettes } from './Button'
import { AddIcon } from './feather'

const meta = { title: 'UI/Button' } satisfies Meta

export default meta
type Story = StoryObj

/** Every implemented pair, at every size, read off the component's own table.
 * A pair added to `buttonPalettes` is compared against MUI here without anyone
 * having to remember to list it. */
const cases = Object.entries(buttonPalettes).flatMap(([variant, colors]) =>
  Object.keys(colors).flatMap(color =>
    (['small', 'medium', 'large'] as const).map(size => ({
      variant,
      color,
      size,
    }))
  )
)

const iconCases = [
  { color: 'default', size: 'medium', edge: undefined },
  { color: 'default', size: 'small', edge: undefined },
  { color: 'inherit', size: 'small', edge: undefined },
  { color: 'primary', size: 'small', edge: undefined },
  { color: 'default', size: 'medium', edge: 'end' },
] as const

const id = (c: { variant?: string; color: string; size: string }) =>
  `${c.variant || 'icon'}-${c.color}-${c.size}`

function Matrix() {
  return (
    <div className="flex flex-col gap-4 text-info">
      {cases.map(c => (
        <div key={id(c)} className="flex items-center gap-4">
          <div data-testid={`mui-${id(c)}`}>
            <MuiButton {...(c as any)} startIcon={<AddIcon />}>
              Label
            </MuiButton>
          </div>
          <div data-testid={`owned-${id(c)}`}>
            <Button {...(c as any)} startIcon={<AddIcon />}>
              Label
            </Button>
          </div>
        </div>
      ))}
      {iconCases.map(c => (
        <div key={id(c) + c.edge} className="flex items-center gap-4">
          <div data-testid={`mui-icon-${id(c)}-${c.edge}`}>
            <MuiIconButton color={c.color} size={c.size} edge={c.edge}>
              <AddIcon />
            </MuiIconButton>
          </div>
          <div data-testid={`owned-icon-${id(c)}-${c.edge}`}>
            <IconButton color={c.color} size={c.size} edge={c.edge}>
              <AddIcon />
            </IconButton>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-4">
        <div data-testid="mui-disabled">
          <MuiButton variant="contained" disabled>
            Label
          </MuiButton>
        </div>
        <div data-testid="owned-disabled">
          <Button variant="contained" disabled>
            Label
          </Button>
        </div>
      </div>
    </div>
  )
}

const measure = (root: HTMLElement) => {
  const button = root.querySelector('button')!
  const s = getComputedStyle(button)
  const rect = button.getBoundingClientRect()
  return {
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    padding: s.padding,
    margin: s.margin,
    fontSize: s.fontSize,
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing,
    fontWeight: s.fontWeight,
    fontFamily: s.fontFamily,
    textTransform: s.textTransform,
    color: s.color,
    background: s.backgroundColor,
    radius: s.borderRadius,
    borderWidth: s.borderTopWidth,
    // Only where a border is painted. At zero width MUI leaves the colour at
    // `currentColor` and Tailwind's `border-0` resolves it differently, which
    // is a difference nothing can see.
    borderColor: s.borderTopWidth === '0px' ? null : s.borderTopColor,
    shadow: s.boxShadow,
    minWidth: s.minWidth,
  }
}

const compare: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const check = (key: string) => {
    const owned = measure(canvas.getByTestId(`owned-${key}`))
    const legacy = measure(canvas.getByTestId(`mui-${key}`))
    expect(owned, key).toEqual(legacy)
  }
  cases.forEach(c => check(id(c)))
  iconCases.forEach(c => check(`icon-${id(c)}-${c.edge}`))
  check('disabled')

  // `duration-250` is not one of Tailwind's stock durations. If the bare value
  // ever stops being generated the class is silently dropped, and the only
  // visible sign is that the transition snaps.
  const owned = canvas
    .getByTestId(`owned-${id(cases[0])}`)
    .querySelector('button')!
  await expect(getComputedStyle(owned).transitionDuration).toBe('0.25s')
}

export const Parity: Story = { render: () => <Matrix />, play: compare }

export const DarkParity: Story = {
  ...Parity,
  globals: { theme: 'dark' },
}
