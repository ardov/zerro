import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { ColorPickerPanel } from './ColorPickerPanel'

const meta = {
  title: 'UI Kit/ColorPicker',
  component: ColorPickerPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A six-column swatch grid for an optional colour. Selecting the current swatch again clears it. The plus button adds a swatch for the current colour (white when none) and opens `ColorPickerDropdown`; matching swatches merge when it closes. Arrow keys follow the six columns and continue into a sibling `[data-picker-grid]` inside a `[data-picker-grids]` container.',
      },
    },
  },
  args: {
    value: '#CC3077',
    onChange: () => {},
    colors: [
      '#CC3077',
      '#FB8D00',
      '#44A649',
      '#28B6F6',
      '#1764BC',
      '#9C26B0',
      '#ffffff',
      '#616161',
    ],
  },
  render: function Demo(args) {
    const [value, setValue] = useState(args.value)
    return (
      <div className="w-80">
        <ColorPickerPanel {...args} value={value} onChange={setValue} />
        <output aria-label="Selected color">{value ?? 'none'}</output>
      </div>
    )
  },
} satisfies Meta<typeof ColorPickerPanel>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const Empty: Story = { args: { value: null } }
export const Custom: Story = { args: { value: '#123456' } }
export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '#CC3077' }))
    await expect(canvas.getByLabelText('Selected color')).toHaveTextContent(
      'none'
    )
    const swatch = canvas.getByRole('button', { name: '#ffffff' })
    swatch.focus()
    await userEvent.keyboard('{Enter}')
    await expect(swatch).toHaveAttribute('aria-pressed', 'true')
  },
}
