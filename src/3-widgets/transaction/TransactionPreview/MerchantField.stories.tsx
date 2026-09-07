import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { MerchantField } from './MerchantField'

const meta = {
  title: 'App/Transactions/MerchantField',
  component: MerchantField,
  parameters: {
    layout: 'centered',
    app: { scenario: 'demo', route: '/budget' },
  },
} satisfies Meta<typeof MerchantField>

export default meta
type Story = StoryObj<typeof meta>

/** A bare payee has not yet been made into a merchant. */
export const BarePayee: Story = {
  args: {
    merchant: null,
    payee: 'Temporary place',
    originalPayee: null,
    debt: false,
    placeholder: 'Place',
    onChange: () => {},
  },
  play: async ({ canvasElement }) => {
    const payee = within(canvasElement).getByText('Temporary place')
    expect(getComputedStyle(payee).fontStyle).toBe('italic')
    await document.fonts.ready
    expect(
      Array.from(document.fonts).some(
        face =>
          face.family.includes('IBM Plex Sans') &&
          face.style === 'italic' &&
          face.weight === '400'
      )
    ).toBe(true)
  },
}
