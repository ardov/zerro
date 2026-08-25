import type { Meta, StoryObj } from '@storybook/react-vite'
import { Alert, AlertTitle, Stack } from '@mui/material'
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

export const InlineStates: Story = {
  render: () => (
    <Stack spacing={1} sx={{ p: 3, maxWidth: 760 }}>
      <Alert severity="info">
        <AlertTitle>Changes are ready</AlertTitle>
        The local state is valid and can be synchronized.
      </Alert>
      <Alert severity="warning">
        <AlertTitle>Persistence warning</AlertTitle>
        The session remains usable, but local persistence needs attention.
      </Alert>
      <Alert severity="error" variant="filled">
        <AlertTitle>Recovery required</AlertTitle>
        The accepted replica could not be replayed safely.
      </Alert>
    </Stack>
  ),
}

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
