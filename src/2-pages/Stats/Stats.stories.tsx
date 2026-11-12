import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import Stats from './index'

const meta = {
  title: 'App/Stats/Page',
  component: Stats,
  parameters: {
    layout: 'fullscreen',
    app: { scenario: 'demo', route: '/stats' },
  },
} satisfies Meta<typeof Stats>
export default meta
type Story = StoryObj<typeof meta>

/** One period drives both headings; pressing either moves both on. */
export const PageSurface: Story = {
  tags: ['check'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const periods = await canvas.findAllByRole('button', {
      name: 'for the year',
    })
    expect(periods).toHaveLength(2)
    await userEvent.click(periods[0])
    expect(
      await canvas.findAllByRole('button', { name: 'for three years' })
    ).toHaveLength(2)
  },
}
