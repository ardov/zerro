import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Button } from './Button'
import { Tooltip, TooltipProvider } from './Tooltip'

const meta = {
  title: 'UI Kit/Tooltip',
  component: Tooltip,
  parameters: { layout: 'centered' },
  args: {
    content: 'Подсказка',
    children: <Button>Наведи или нажми Tab</Button>,
  },
  argTypes: {
    side: { control: 'select', options: ['top', 'bottom', 'left', 'right'] },
    align: { control: 'select', options: ['start', 'center', 'end'] },
  },
  decorators: [
    Story => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof Tooltip>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Showcase: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4 p-12">
      {(['top', 'bottom', 'left', 'right'] as const).map(side => (
        <Tooltip key={side} side={side} content={`Подсказка: ${side}`}>
          <Button variant="secondary">{side}</Button>
        </Tooltip>
      ))}
      <Tooltip
        content={
          <>
            <strong>Курс обмена</strong>
            <br />1 EUR = 25 CZK
            <br />
            Сумма в исходной валюте операции
          </>
        }
      >
        <Button variant="outline">€120</Button>
      </Tooltip>
      <Tooltip disabled content="Скрыто">
        <Button>Без подсказки</Button>
      </Tooltip>
    </div>
  ),
}

export const Interaction: Story = {
  render: () => (
    <div className="flex gap-6">
      <Tooltip content="First tooltip">
        <Button>First</Button>
      </Tooltip>
      <Tooltip content="Second tooltip">
        <Button>Second</Button>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const first = canvas.getByRole('button', { name: 'First' })
    const second = canvas.getByRole('button', { name: 'Second' })
    await userEvent.hover(first)
    await expect(body.queryByText('First tooltip')).not.toBeInTheDocument()
    await body.findByText('First tooltip')
    await userEvent.unhover(first)
    await userEvent.hover(second)
    const popup = await body.findByText('Second tooltip')
    await expect(popup).toHaveAttribute('data-instant', 'delay')
    await userEvent.hover(popup)
    await expect(popup).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(body.queryByText('Second tooltip')).not.toBeInTheDocument()
    )
    await userEvent.unhover(popup)
    first.focus()
    const focused = await body.findByText('First tooltip')
    await expect(focused).toHaveAttribute('data-instant')
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(body.queryByText('First tooltip')).not.toBeInTheDocument()
    )
    await expect(first).toHaveFocus()
  },
}
