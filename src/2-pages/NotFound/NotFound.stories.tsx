import type { Meta, StoryObj } from '@storybook/react-vite'
import { NotFound } from './index'

const meta = {
  title: 'App/Not Found',
  component: NotFound,
  parameters: { layout: 'fullscreen' },
  decorators: [
    Story => (
      <main className="flex min-h-dvh">
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof NotFound>
export default meta

export const Page: StoryObj<typeof meta> = {
  tags: ['!test'],
}
