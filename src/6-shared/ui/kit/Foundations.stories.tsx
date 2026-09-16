import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'

const meta = {
  tags: ['autodocs'],
  title: 'UI Kit/Foundations',
  parameters: {
    docs: {
      description: {
        component:
          'The visual foundation of the UI Kit: surfaces, text roles, spacing and emphasis. Switch between light and dark with the toolbar. Browse Actions, Inputs and Overlays for interactive examples; Building blocks documents the pieces used to compose them.',
      },
    },
    controls: { disable: true },
    layout: 'fullscreen',
  },
} satisfies Meta
export default meta

export const ShowcaseView: StoryObj<typeof meta> = {
  name: 'Showcase',
  render: () => (
    <main className="min-h-screen bg-ui-base p-6 font-sans text-ui-16 text-ui-primary">
      <div className="mx-auto grid max-w-lg gap-6">
        <h1 className="m-0 text-ui-16 font-normal">Surface and text</h1>
        <section className="grid gap-4 rounded-xl bg-ui-card p-6 shadow-ui-card">
          <p className="m-0">Main text · 16 px</p>
          <p className="m-0 text-ui-secondary">Secondary text · 16 px</p>
          <p className="m-0 text-ui-placeholder">Placeholder · 16 px</p>
          <p className="m-0 text-ui-14">Main text · 14 px</p>
          <p className="m-0 text-ui-14 text-ui-secondary">
            Secondary text · 14 px
          </p>
          <p className="m-0 text-ui-14 text-ui-placeholder">
            Placeholder · 14 px
          </p>
          <a className="text-ui-link" href="#amount">
            Link
          </a>
          <p
            id="amount"
            className="m-0 border-0 border-t border-solid border-ui-border pt-4"
          >
            1 248,50 Kč
          </p>
          <Button>Button</Button>
        </section>
      </div>
    </main>
  ),
}
