import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { ColorPickerDropdown } from './ColorPickerDropdown'
import { Button } from './Button'

const meta = {
  title: 'UI Kit/ColorPickerDropdown',
  component: ColorPickerDropdown,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A dark popover for a custom colour: an OKHSV saturation/value plane, a hue slider and a field for pasting CSS colours. Every change calls `onChange` at once; an empty field clears the colour. Pass `icon` to show it inside the plane thumb. Arrow keys move the focused control, and the popover keeps them from page hotkeys.',
      },
    },
  },
  args: {
    value: '#2a00f7',
    onChange: () => {},
    trigger: <Button>Choose color</Button>,
  },
  render: function Demo(args) {
    const [value, setValue] = useState(args.value)
    return (
      <>
        <ColorPickerDropdown {...args} value={value} onChange={setValue} />
        <output aria-label="Selected color">{value}</output>
      </>
    )
  },
} satisfies Meta<typeof ColorPickerDropdown>
export default meta
type Story = StoryObj<typeof meta>
export const Bench: Story = {}
export const KeyboardAndPaste: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Choose color' }))
    const picker = within(
      await within(canvasElement.ownerDocument.body).findByRole('dialog', {
        name: 'Custom color',
      })
    )
    const input = picker.getByRole('textbox')
    await userEvent.click(input)
    await userEvent.paste('rgb(255 0 0)')
    await expect(canvas.getByLabelText('Selected color')).toHaveTextContent(
      '#ff0000'
    )
    const plane = picker.getByRole('slider', { name: 'Saturation and value' })
    plane.focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(input).not.toHaveValue('#ff0000')
  },
}
