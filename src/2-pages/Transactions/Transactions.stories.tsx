import type { Meta, StoryObj } from '@storybook/react-vite'
import { Route, Routes, useLocation } from 'react-router-dom'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import { Layout } from '@/1-app/Layout'
import { pageColumns } from '@/1-app/pageColumns'
import Budgets from '@/2-pages/Budgets'
import TransactionsView from './index'
const meta = {
  title: 'App/Transactions/Page',
  component: TransactionsView,
} satisfies Meta<typeof TransactionsView>
export default meta
type Story = StoryObj<typeof meta>
export const PageSurface: Story = {
  parameters: {
    layout: 'fullscreen',
    app: { scenario: 'demo', route: '/transactions' },
  },
  render: () => (
    <Layout navigation columns={pageColumns.transactions}>
      <TransactionsView />
    </Layout>
  ),
}

function NavigationExample() {
  const { pathname } = useLocation()
  return (
    <Layout
      navigation
      columns={
        pathname === '/budget' ? pageColumns.budget : pageColumns.transactions
      }
    >
      <Routes>
        <Route path="/transactions" element={<TransactionsView />} />
        <Route path="/budget" element={<Budgets />} />
      </Routes>
    </Layout>
  )
}

export const PreservesPageOnReturn: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: {
    ...PageSurface.parameters,
    app: { scenario: 'transaction-navigation', route: '/transactions' },
  },
  globals: { viewport: { value: 'desktop' } },
  render: () => <NavigationExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }))
    await userEvent.click(await body.findByText('Account', { exact: true }))
    await userEvent.click(
      await body.findByRole('option', { name: /^HSBC USD/ })
    )
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('listbox')).toBeNull())
    await userEvent.click(
      canvas.getByRole('button', { name: 'Search transactions' })
    )
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Search transactions' }),
      'purchase'
    )
    await userEvent.keyboard('{Enter}')

    const list = await canvas.findByRole('list', { name: 'Transactions' })
    const checkboxes = within(list).getAllByRole('checkbox').slice(0, 5)
    expect(checkboxes).toHaveLength(5)
    const selectedKeys = checkboxes.map(
      checkbox =>
        checkbox.closest<HTMLElement>('[data-row-key]')!.dataset.rowKey!
    )
    for (const checkbox of checkboxes) await userEvent.click(checkbox)
    await expect(canvas.getByText('Selected 5 transactions')).toBeVisible()

    const viewport = list.closest<HTMLElement>('.kit-scroll-viewport')!
    const originalFirstRow = list
      .querySelector('[data-row-key]')!
      .getAttribute('data-row-key')
    viewport.scrollTop = 1477
    await waitFor(() =>
      expect(
        list.querySelector('[data-row-key]')!.getAttribute('data-row-key')
      ).not.toBe(originalFirstRow)
    )
    expect(viewport.scrollTop).toBe(1477)
    // A one-pixel movement within the same virtual range need not rerender
    // the list. Leave immediately, before the scroll debounce can settle.
    viewport.scrollTop = 1478
    fireEvent.scroll(viewport)
    await userEvent.click(canvas.getByRole('link', { name: 'Budget' }))
    await waitFor(() =>
      expect(canvas.queryByRole('list', { name: 'Transactions' })).toBeNull()
    )
    await userEvent.click(canvas.getByRole('link', { name: 'Transactions' }))

    const restoredList = await canvas.findByRole('list', {
      name: 'Transactions',
    })
    const restoredViewport = restoredList.closest<HTMLElement>(
      '.kit-scroll-viewport'
    )!
    await waitFor(() => expect(restoredViewport.scrollTop).toBe(1478))
    await expect(
      canvas.getByRole('combobox', { name: 'HSBC USD' })
    ).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'purchase' })).toBeVisible()
    await expect(canvas.getByText('Selected 5 transactions')).toBeVisible()

    restoredViewport.scrollTop = 0
    for (const key of selectedKeys) {
      await waitFor(() =>
        expect(
          within(
            restoredList.querySelector<HTMLElement>(`[data-row-key="${key}"]`)!
          ).getByRole('checkbox')
        ).toBeChecked()
      )
    }
    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove Selected 5 transactions' })
    )
    await userEvent.click(canvas.getByRole('link', { name: 'Budget' }))
    await userEvent.click(canvas.getByRole('link', { name: 'Transactions' }))
    await waitFor(() =>
      expect(canvas.queryByText('Selected 5 transactions')).toBeNull()
    )
    await expect(
      within(canvas.getByRole('list', { name: 'Transactions' })).queryAllByRole(
        'checkbox',
        { checked: true }
      )
    ).toHaveLength(0)
  },
}

export const PreservesPageOnReturnMobile: Story = {
  ...PreservesPageOnReturn,
  globals: { viewport: { value: 'iphone13' } },
}
