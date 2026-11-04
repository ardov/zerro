import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { core } from '@/zerro-core/redux'
import { useAppSelector } from '@/store'
import { HistoryControls } from '@/3-widgets/History/HistoryControls'
import { AppearancePicker } from './index'

function Demo() {
  const envelopes = useAppSelector(core.envelopes.selectAll)
  const food = Object.values(envelopes).find(e => e.name === 'Food')!
  const icon = useAppSelector(
    state => core.tags.selectAll(state)[food.entityId].icon
  )
  return (
    <>
      <AppearancePicker envelope={food} size="m" />
      <output aria-label="Appearance">
        {food.colorHex} / {icon}
      </output>
      <HistoryControls />
    </>
  )
}
const meta = {
  title: 'Widgets/AppearancePicker',
  component: Demo,
  parameters: { layout: 'centered', app: { scenario: 'demo' } },
} satisfies Meta<typeof Demo>
export default meta
type Story = StoryObj<typeof meta>

export const LiveSelection: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const output = canvas.getByLabelText('Appearance')
    const before = output.textContent
    const trigger = canvas.getByRole('button', { name: 'Color and icon' })
    await userEvent.click(trigger)
    const dialog = await body.findByRole('dialog', { name: 'Color and icon' })
    const picker = within(dialog)
    expect(
      picker.getAllByRole('button', { name: /^#[0-9a-f]{6}$/i })
    ).toHaveLength(18)
    const plus = picker.getByRole('button', { name: 'Custom color' })
    const first = picker.getByRole('button', { name: '#F35239' })
    first.focus()
    await userEvent.keyboard('{ArrowRight}{ArrowDown}')
    await expect(picker.getByRole('button', { name: '#2CCA94' })).toHaveFocus()
    await userEvent.keyboard('{End}{ArrowDown}{ArrowRight}')
    await expect(picker.getByRole('button', { name: 'Cutlery' })).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}')
    await expect(plus).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    const custom = await body.findByRole('dialog', { name: 'Custom color' })
    const palette = dialog.querySelector('[data-picker-grid]')!
    const samples = () =>
      Array.from(palette.querySelectorAll('button[aria-pressed]'))
    expect(samples()).toHaveLength(19)
    const input = within(custom).getByRole('textbox')
    const plane = within(custom).getByRole('slider', {
      name: 'Saturation and value',
    })
    plane.focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(output.textContent).not.toBe(before)
    await userEvent.clear(input)
    await userEvent.type(input, '32')
    await expect(output).toHaveTextContent('#323232')
    await expect(input).toHaveValue('32')
    expect(samples().at(-1)).toHaveAttribute('aria-label', '#323232')
    expect(samples()).toHaveLength(19)
    const marker = plane.querySelector('span[aria-hidden]')!
    expect(marker).toHaveStyle({
      width: '48px',
      height: '48px',
      color: 'rgb(255, 255, 255)',
    })
    expect(marker.querySelector('[style*="mask-image"]')).toBeTruthy()
    await userEvent.clear(input)
    await userEvent.type(input, 'fff')
    expect(marker).toHaveStyle({ color: 'rgb(0, 0, 0)' })
    await userEvent.clear(input)
    await userEvent.type(input, '32')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(custom).not.toBeVisible())
    const pizza = picker.getByRole('button', { name: 'Pizza' })
    await userEvent.click(pizza)
    await expect(output).toHaveTextContent('#323232 / 1006_pizza')
    await expect(trigger).toHaveStyle({ width: '40px', height: '40px' })
    await userEvent.click(pizza)
    await expect(pizza).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(pizza)
    await userEvent.click(picker.getByRole('button', { name: '#323232' }))
    await expect(output).toHaveTextContent('/ 1006_pizza')
    await userEvent.click(picker.getByRole('button', { name: '#CC3077' }))
    await expect(output).toHaveTextContent('#cc3077 / 1006_pizza')
    await userEvent.click(canvasElement.ownerDocument.elementFromPoint(1, 1)!)
    await waitFor(() => expect(dialog).not.toBeVisible())
    await waitFor(() => expect(trigger).toHaveFocus())
    await userEvent.click(canvas.getByRole('button', { name: 'Undo' }))
    await expect(output.textContent).toBe(before)
    await userEvent.click(canvas.getByRole('button', { name: 'Redo' }))
    await expect(output).toHaveTextContent('#cc3077 / 1006_pizza')
  },
}
export const Mobile: Story = {
  ...LiveSelection,
  globals: { viewport: { value: 'zerro499' } },
}

export const PointerFeedback: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    if (!('__vitest_browser_runner__' in window)) return
    const { page } = await import('vitest/browser')
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Color and icon' })
    const surface = trigger.querySelector<HTMLElement>('.colored-surface')!
    const gradient = () => getComputedStyle(surface).backgroundImage
    await page.elementLocator(canvas.getByLabelText('Appearance')).hover()
    const resting = gradient()
    expect(resting).toContain('linear-gradient')
    await page.elementLocator(trigger).hover()
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    await waitFor(() => {
      expect(gradient()).not.toBe(resting)
      expect(trigger.getBoundingClientRect().width).toBe(reduced ? 40 : 44)
    })
  },
}
