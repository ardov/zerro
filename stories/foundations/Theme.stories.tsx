import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box, Stack, Typography } from '@mui/material'
import { useAppTheme } from '6-shared/ui/theme'
import { Logo } from '6-shared/ui/Logo'

const meta = {
  title: 'Foundations/Theme',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj

function ThemeCatalog() {
  const theme = useAppTheme()
  const colors = [
    ['primary', theme.palette.primary.main],
    ['secondary', theme.palette.secondary.main],
    ['success', theme.palette.success.main],
    ['warning', theme.palette.warning.main],
    ['error', theme.palette.error.main],
    ['background', theme.palette.background.default],
  ] as const

  return (
    <Stack spacing={3} sx={{ p: 4 }}>
      <Logo fill={theme.palette.primary.main} width={220} />
      <Box>
        <Typography variant="h4">Typography</Typography>
        <Typography variant="h6">Envelope budgeting with clarity</Typography>
        <Typography variant="body1" color="text.secondary">
          Long labels, secondary text and monetary values should remain legible.
        </Typography>
      </Box>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
        {colors.map(([name, color]) => (
          <Box
            key={name}
            sx={{
              width: 112,
              height: 72,
              p: 1,
              borderRadius: 1,
              backgroundColor: color,
              color: theme.palette.getContrastText(color),
            }}
          >
            <Typography variant="caption">{name}</Typography>
          </Box>
        ))}
      </Stack>
    </Stack>
  )
}

export const Catalog: Story = { render: () => <ThemeCatalog /> }
