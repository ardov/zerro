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
          'Palette and color input without an overlay. Supports abbreviated HEX and CSS color literals, normalized through culori to opaque HEX. Empty input removes the color; unrecognized input is silently ignored. Pass value, onChange, colors, draft and onDraftChange. Swatch selection, Enter and Remove return values. The containing surface applies a valid draft on close. Selecting the current swatch confirms it. Keep draft above adaptive surfaces through the required draft props; invalid drafts must not be committed.',
      },
    },
  },
  args: {
    value: '#CC3077',
    onChange: () => {},
    draft: '#CC3077',
    onDraftChange: () => {},
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
    const [draft, setDraft] = useState(args.draft)
    return (
      <div className="w-80">
        <ColorPickerPanel
          {...args}
          value={value}
          onChange={setValue}
          draft={draft}
          onDraftChange={setDraft}
        />
        <output aria-label="Selected color">{value ?? 'none'}</output>
      </div>
    )
  },
} satisfies Meta<typeof ColorPickerPanel>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const Empty: Story = { args: { value: null, draft: '' } }
export const Custom: Story = { args: { value: '#123456', draft: '#123456' } }
export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox', { name: 'HEX color' })
    await userEvent.clear(input)
    await userEvent.type(input, '#12')
    await expect(canvas.getByLabelText('Selected color')).toHaveTextContent(
      '#CC3077'
    )
    await userEvent.type(input, '3456{Enter}')
    await expect(canvas.getByLabelText('Selected color')).toHaveTextContent(
      '#123456'
    )
    await userEvent.click(canvas.getByRole('button', { name: 'No color' }))
    await expect(canvas.getByLabelText('Selected color')).toHaveTextContent(
      'none'
    )
    const swatch = canvas.getByRole('button', { name: '#ffffff' })
    swatch.focus()
    await userEvent.keyboard('{Enter}')
    await expect(swatch).toHaveAttribute('aria-pressed', 'true')
  },
}
