import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import Budgets from './index'
import { Layout } from '@/1-app/Layout'
import { pageColumns } from '@/1-app/pageColumns'

const meta = {
  title: 'App/Budgets/Page',
  component: Budgets,
  parameters: {
    layout: 'fullscreen',
    app: { scenario: 'demo', route: '/budget' },
    viewport: {
      options: {
        belowAccounts: {
          name: 'Before accounts panel (1279px)',
          styles: { width: '1279px', height: '900px' },
          type: 'desktop',
        },
        withAccounts: {
          name: 'With accounts panel (1280px)',
          styles: { width: '1280px', height: '900px' },
          type: 'desktop',
        },
      },
    },
  },
  render: () => (
    <Layout navigation columns={pageColumns.budget}>
      <Budgets />
    </Layout>
  ),
} satisfies Meta<typeof Budgets>
export default meta
type Story = StoryObj<typeof meta>

export const BeforeAccountsPanel: Story = {
  globals: { viewport: { value: 'belowAccounts' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(window.innerWidth).toBe(1279)
    expect(canvas.queryByRole('button', { name: /HSBC USD/ })).toBeNull()
    const panels = canvasElement.querySelector<HTMLElement>('.layout-columns')!
    // DnD also renders visually hidden announcement nodes beside the panels.
    const columns = Array.from(panels.children).filter(
      child =>
        child.getBoundingClientRect().width > 1 &&
        child.getBoundingClientRect().height > 1
    )
    expect(columns).toHaveLength(2)
    expect(panels.scrollWidth).toBeLessThanOrEqual(panels.clientWidth)
    expect(columns[columns.length - 1].getBoundingClientRect().width).toBe(360)
  },
}

export const WithAccountsPanel: Story = {
  globals: { viewport: { value: 'withAccounts' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(window.innerWidth).toBe(1280)
    const account = canvas.getByRole('button', { name: /HSBC USD/ })
    expect(account.getBoundingClientRect().height).toBe(40)
    const panels = canvasElement.querySelector<HTMLElement>('.layout-columns')!
    // DnD also renders visually hidden announcement nodes beside the panels.
    const columns = Array.from(panels.children).filter(
      child =>
        child.getBoundingClientRect().width > 1 &&
        child.getBoundingClientRect().height > 1
    )
    expect(columns).toHaveLength(3)
    expect(columns[0].getBoundingClientRect().width).toBe(280)
    expect(columns[1].getBoundingClientRect().width).toBe(560)
    expect(columns[2].getBoundingClientRect().width).toBe(360)
    expect(panels.scrollWidth).toBeLessThanOrEqual(panels.clientWidth)
  },
}

export const SelectedCategory: Story = {
  globals: { viewport: { value: 'belowAccounts' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const rows = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-envelope-id]')
    )
    const first = rows[0]
    const second = rows.find(
      row => row.dataset.envelopeId !== first.dataset.envelopeId
    )!
    const name = (row: HTMLElement) =>
      row.querySelector<HTMLElement>('[title]')!
    const background = (row: HTMLElement) =>
      getComputedStyle(row, '::before').backgroundColor

    if ('__vitest_browser_runner__' in window) {
      const { page } = await import('vitest/browser')
      const target = page.elementLocator(name(first))
      await target.hover()
      const hover = background(first)
      let pressed = ''
      first.addEventListener(
        'mousedown',
        () => {
          pressed = background(first)
        },
        { once: true }
      )
      await target.click()
      expect(pressed).toBe(hover)
    } else {
      await userEvent.click(name(first))
    }
    await waitFor(() => expect(first).toHaveAttribute('data-selected'))
    const selected = background(first)
    expect(getComputedStyle(first, '::before').transitionDuration).toBe('0s')
    expect(getComputedStyle(first, '::before').animationName).toBe('none')
    expect(getComputedStyle(first, '::after').content).toBe('none')

    if ('__vitest_browser_runner__' in window) {
      const { page } = await import('vitest/browser')
      await page
        .elementLocator(canvas.getByRole('button', { name: 'Close' }))
        .hover()
      expect(background(first)).toBe(selected)
      const target = page.elementLocator(name(first))
      await target.hover()
      expect(background(first)).toBe(selected)
      let pressed = ''
      first.addEventListener(
        'mousedown',
        () => {
          pressed = background(first)
        },
        { once: true }
      )
      await target.click()
      expect(pressed).toBe(selected)
      expect(background(first)).toBe(selected)
    }

    await userEvent.click(name(second))
    expect(first).not.toHaveAttribute('data-selected')
    expect(second).toHaveAttribute('data-selected')
    await userEvent.click(canvas.getByRole('button', { name: 'Close' }))
    expect(second).not.toHaveAttribute('data-selected')
  },
}

export const MoveMoneyAfterDrag: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { viewport: { value: 'belowAccounts' } },
  play: async ({ canvasElement }) => {
    const { page, server } = await import('vitest/browser')
    const body = within(canvasElement.ownerDocument.body)
    // The native release click and its propagation are part of the regression.
    await server.commands.dragPointer(
      '[data-envelope-id="tag#Transportation"] [aria-roledescription="draggable"]',
      '[data-envelope-id="tag#Entertainment"]'
    )
    const dialog = await body.findByRole('dialog', {
      name: 'Transportation → Entertainment',
    })
    const input = within(dialog).getByRole('textbox', { name: 'Amount' })
    await page.elementLocator(input).click()

    // A wrongly dismissed dialog remains visible during its exit transition.
    await new Promise(resolve => setTimeout(resolve, 400))
    expect(dialog).toBeVisible()
    expect(input).toHaveFocus()
    await page.elementLocator(input).fill('3.60')
    expect(input).toHaveValue('3,60')

    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(dialog).not.toBeVisible())
  },
}
