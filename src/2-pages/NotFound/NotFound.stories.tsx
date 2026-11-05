import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { i18n } from '@/6-shared/localization'
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: '404' })).toBeVisible()
    const home = canvas.getByRole('link', { name: i18n.t('returnToApp') })
    await expect(home).toHaveAttribute('href', '/')
    home.focus()
    await expect(home).toHaveFocus()
  },
}
