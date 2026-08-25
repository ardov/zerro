import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'
import { Stack, Typography } from '@mui/material'
import { core } from 'zerro-core/redux'
import { useAppSelector } from 'store'
import { Transaction } from './Transaction'

const meta = {
  title: 'Finance/Transaction',
  component: Transaction,
  parameters: {
    layout: 'centered',
    app: { scenario: 'demo', globalWidgets: true, route: '/transactions' },
  },
  args: {
    isChecked: false,
    isOpened: false,
    isInSelectionMode: false,
  },
} satisfies Meta<typeof Transaction>

export default meta
type Story = StoryObj<Partial<ComponentProps<typeof Transaction>>>

export const Showcase: Story = {
  render: args => {
    const transactions = useAppSelector(core.transactions.selectAll)
    const ids = Object.keys(transactions).slice(0, 8)
    return (
      <Stack spacing={0.5} sx={{ width: 560, maxWidth: '100%' }}>
        <Typography variant="caption" color="text.secondary">
          Generated demo operations
        </Typography>
        {ids.map((id, index) => (
          <Transaction
            key={id}
            {...args}
            id={id}
            isOpened={index === 1}
            isInSelectionMode={index === 2}
            isChecked={index === 2}
          />
        ))}
      </Stack>
    )
  },
}

export const SelectionMode: Story = {
  args: { id: 'missing', isInSelectionMode: true, isChecked: true },
  render: args => {
    const id = Object.keys(useAppSelector(core.transactions.selectAll))[0]
    return (
      <Transaction
        isChecked={false}
        isOpened={false}
        isInSelectionMode={false}
        {...args}
        id={id}
      />
    )
  },
}
