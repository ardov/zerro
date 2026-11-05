import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
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
          'A dark popover for a custom colour: an OKHSV saturation/value plane, a hue slider and a field for pasting CSS colours. Drags preview locally and call `onChange` on release; cancelled drags restore the previous preview. Keyboard and text changes apply at once; an empty field clears the colour. Pass `icon` to show it inside the plane thumb. Arrow keys move the focused control, and the popover keeps them from page hotkeys.',
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
        <ColorPickerDropdown
          {...args}
          value={value}
          onChange={next => {
            setValue(next)
            args.onChange(next)
          }}
        />
        <output aria-label="Selected color">{value}</output>
      </>
    )
  },
} satisfies Meta<typeof ColorPickerDropdown>
export default meta
type Story = StoryObj<typeof meta>
export const Bench: Story = {}
const dragChange = fn()
export const DragCommit: Story = {
  tags: ['check'],
  args: { onChange: dragChange },
  play: async ({ canvasElement, args }) => {
    if (!('__vitest_browser_runner__' in window)) return
    const { server } = await import('vitest/browser')
    const canvas = within(canvasElement)
    const doc = canvasElement.ownerDocument
    await userEvent.click(canvas.getByRole('button', { name: 'Choose color' }))
    const picker = within(
      await within(doc.body).findByRole('dialog', { name: 'Custom color' })
    )
    const input = picker.getByRole('textbox') as HTMLInputElement
    const selected = canvas.getByLabelText('Selected color')
    let commits = 0
    for (const [name, endX] of [
      ['Saturation and value', 0.75],
      ['Hue', 0.75],
      ['Hue', 1.15],
    ] as const) {
      const before = selected.textContent
      let atRelease: { value: string | null; preview: string; calls: number }
      const captureRelease = () => {
        atRelease = {
          value: selected.textContent,
          preview: input.value,
          calls: dragChange.mock.calls.length,
        }
      }
      doc.addEventListener('pointerup', captureRelease, {
        capture: true,
        once: true,
      })
      const selector = `[role="slider"][aria-label="${name}"]`
      try {
        await server.commands.dragPointer(selector, selector, {
          from: { x: 0.25, y: 0.75 },
          to: { x: endX, y: 0.25 },
        })
      } finally {
        doc.removeEventListener('pointerup', captureRelease, true)
      }
      await expect(atRelease!.value).toBe(before)
      await expect(atRelease!.preview).not.toBe(before)
      await expect(atRelease!.calls).toBe(commits)
      await expect(args.onChange).toHaveBeenCalledTimes(++commits)
      await expect(selected).toHaveTextContent(input.value)
    }
  },
}
export const CancelDrag: Story = {
  tags: ['check'],
  args: { onChange: fn() },
  play: async ({ canvasElement, args }) => {
    if (!('__vitest_browser_runner__' in window)) return
    const { server } = await import('vitest/browser')
    const canvas = within(canvasElement)
    const doc = canvasElement.ownerDocument
    await userEvent.click(canvas.getByRole('button', { name: 'Choose color' }))
    const picker = within(
      await within(doc.body).findByRole('dialog', { name: 'Custom color' })
    )
    const plane = picker.getByRole('slider', { name: 'Saturation and value' })
    const input = picker.getByRole('textbox') as HTMLInputElement
    const before = input.value
    for (const interrupted of ['pointercancel', 'lostpointercapture']) {
      let cancelled = false
      const interrupt = (event: globalThis.PointerEvent) => {
        if (cancelled || !plane.hasPointerCapture(event.pointerId)) return
        cancelled = true
        if (interrupted === 'pointercancel') {
          plane.dispatchEvent(
            new PointerEvent('pointercancel', {
              bubbles: true,
              pointerId: event.pointerId,
            })
          )
        }
        plane.releasePointerCapture(event.pointerId)
      }
      doc.addEventListener('pointermove', interrupt, true)
      try {
        const selector = '[role="slider"][aria-label="Saturation and value"]'
        await server.commands.dragPointer(selector, selector, {
          from: { x: 0.25, y: 0.75 },
          to: { x: 0.75, y: 0.25 },
        })
      } finally {
        doc.removeEventListener('pointermove', interrupt, true)
      }
      await expect(cancelled).toBe(true)
      await expect(args.onChange).not.toHaveBeenCalled()
      await expect(input).toHaveValue(before)
      await expect(canvas.getByLabelText('Selected color')).toHaveTextContent(
        before
      )
    }
  },
}
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
