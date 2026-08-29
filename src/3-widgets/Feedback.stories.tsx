import type { Meta, StoryObj } from '@storybook/react-vite'
import { JournalRecoveryNotice } from './JournalRecoveryNotice'
import { PersistenceWarningNotice } from './PersistenceWarningNotice'
import { ErrorMessage } from './ErrorBoundary/ErrorMessage'

const meta = {
  title: 'Feedback/Messages',
  parameters: {
    layout: 'fullscreen',
    app: { scenario: 'demo', globalWidgets: true },
  },
} satisfies Meta

export default meta
type Story = StoryObj

export const JournalRecovery: Story = {
  parameters: { app: { scenario: 'recovery', globalWidgets: true } },
  render: () => <JournalRecoveryNotice />,
}

export const PersistenceWarning: Story = {
  parameters: { app: { scenario: 'persistence-warning' } },
  render: () => <PersistenceWarningNotice />,
}

export const ErrorBoundaryMessage: Story = {
  render: () => (
    <ErrorMessage
      message="Cannot replay local commands after the last accepted checkpoint."
      onLogOut={() => undefined}
    />
  ),
}
