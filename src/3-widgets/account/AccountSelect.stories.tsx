import { useState, type ReactNode } from 'react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within, waitFor } from 'storybook/test'
import { rootReducer } from '@/store/rootReducer'
import { makeTestRootState } from '@/store/testing'
import {
  makeStore,
  makeAccount,
} from '@/zerro-core/support/testing/zenmoneyTestData'
import { ZERRO_DATA_ACCOUNT_NAME } from '@/zerro-core/constants'
import { Button } from '@/6-shared/ui/kit/Button'
import { AccountSelect } from './AccountSelect'
import { AccountMultiSelect } from './AccountMultiSelect'
const meta = {
  title: 'App/Accounts/Selectors',
  parameters: { app: { scenario: 'demo' }, layout: 'centered' },
} satisfies Meta
export default meta
type Story = StoryObj
function Fixtures({ children }: { children: ReactNode }) {
  const [store] = useState(() =>
    configureStore({
      reducer: rootReducer,
      preloadedState: makeTestRootState(
        makeStore({
          account: {
            cash: makeAccount({ id: 'cash', title: 'Cash', archive: false }),
            bank: makeAccount({ id: 'bank', title: 'Bank', archive: false }),
            service: makeAccount({
              id: 'service',
              title: ZERRO_DATA_ACCOUNT_NAME,
              archive: true,
            }),
            old: makeAccount({ id: 'old', title: 'Old bank', archive: true }),
          },
        })
      ),
      middleware: getDefault =>
        getDefault({ serializableCheck: false, immutableCheck: false }),
    })
  )
  return <Provider store={store}>{children}</Provider>
}
function Demo({
  multiple = false,
  service = false,
}: {
  multiple?: boolean
  service?: boolean
}) {
  const [value, setValue] = useState(service ? 'service' : 'cash')
  const [values, setValues] = useState([service ? 'service' : 'old'])
  return (
    <Fixtures>
      {multiple ? (
        <AccountMultiSelect
          value={values}
          onChange={setValues}
          trigger={<Button>Accounts</Button>}
        />
      ) : (
        <AccountSelect
          label="From account"
          value={value}
          onChange={setValue}
          excludeIds={['bank']}
          trigger={<Button>Choose account</Button>}
        />
      )}
      <output aria-label="Selection">
        {multiple ? values.join(',') : value}
      </output>
    </Fixtures>
  )
}
export const Single: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('combobox', { name: 'Choose account' })
    await userEvent.click(trigger)
    const search = await body.findByRole('combobox', { name: 'From account' })
    await step('Expand archived accounts and reset on close', async () => {
      await expect(
        body.queryByRole('option', { name: /^Old bank/ })
      ).not.toBeInTheDocument()
      await userEvent.click(body.getByRole('button', { name: 'Show archived' }))
      await expect(search).toHaveFocus()
      const archived = body.getByRole('group', { name: 'Archived' })
      await expect(
        within(archived).getByRole('option', { name: /^Old bank/ })
      ).toBeVisible()
      await expect(
        within(archived).queryByRole('option', { name: /^Cash/ })
      ).not.toBeInTheDocument()
      await expect(
        body.getByRole('option', { name: /^Old bank/ })
      ).toBeVisible()
      await expect(
        body.queryByRole('option', { name: /^Bank/ })
      ).not.toBeInTheDocument()
      await userEvent.keyboard('{Escape}')
      await waitFor(() =>
        expect(body.queryByRole('listbox')).not.toBeInTheDocument()
      )
      await userEvent.click(trigger)
      await expect(
        body.queryByRole('option', { name: /^Old bank/ })
      ).not.toBeInTheDocument()
    })
    await step('Search archives and retain a selected archive', async () => {
      const input = body.getByRole('combobox', { name: 'From account' })
      await userEvent.type(input, 'Old')
      await expect(body.getByRole('group', { name: 'Archived' })).toBeVisible()
      await userEvent.click(body.getByRole('option', { name: /^Old bank/ }))
      await expect(canvas.getByLabelText('Selection')).toHaveTextContent('old')
      await userEvent.click(trigger)
      await expect(
        body.getByRole('option', { name: /^Old bank/ })
      ).toHaveAttribute('aria-selected', 'true')
    })
  },
}
export const Multiple: Story = {
  render: () => <Demo multiple />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('combobox', { name: 'Accounts' }))
    await expect(
      await body.findByRole('option', { name: /^Old bank/ })
    ).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(body.getByRole('option', { name: /^Cash/ }))
    await expect(canvas.getByLabelText('Selection')).toHaveTextContent(
      'old,cash'
    )
    await userEvent.click(body.getByRole('option', { name: /^Old bank/ }))
    await expect(canvas.getByLabelText('Selection')).toHaveTextContent(/^cash$/)
    await expect(body.getByRole('listbox')).toBeVisible()
  },
}

export const SelectedServiceAccount: Story = {
  render: () => <Demo service />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('combobox', { name: 'Choose account' })
    await userEvent.click(trigger)
    await expect(
      await body.findByRole('option', { name: /Zerro Data/ })
    ).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(body.getByRole('option', { name: /^Cash/ }))
    await userEvent.click(trigger)
    await userEvent.click(body.getByRole('button', { name: 'Show archived' }))
    await expect(
      body.queryByRole('option', { name: /Zerro Data/ })
    ).not.toBeInTheDocument()
    await userEvent.type(
      body.getByRole('combobox', { name: 'From account' }),
      'Zerro'
    )
    await expect(
      body.queryByRole('option', { name: /Zerro Data/ })
    ).not.toBeInTheDocument()
  },
}
export const SelectedServiceAccountMultiple: Story = {
  render: () => <Demo multiple service />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('combobox', { name: 'Accounts' }))
    const option = await body.findByRole('option', { name: /Zerro Data/ })
    await expect(option).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(option)
    await expect(
      body.queryByRole('option', { name: /Zerro Data/ })
    ).not.toBeInTheDocument()
    await expect(canvas.getByLabelText('Selection')).toBeEmptyDOMElement()
  },
}
