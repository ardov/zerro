import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { ButtonBase, IconButton, Paper, Typography } from '@mui/material'
import { ChevronRightIcon } from '6-shared/ui/Icons'
import { TagIcon } from '6-shared/ui/TagIcon'
import { TableRow } from '2-pages/Budgets/EnvelopeTable/shared/shared'
import { RenderColumnsProvider } from '2-pages/Budgets/EnvelopeTable/models/useMetric'
import { SlideReveal } from '2-pages/Budgets/EnvelopeTable/SlideReveal'

const meta = {
  title: 'Foundation/MUI Tailwind interop',
  parameters: { layout: 'centered' },
} satisfies Meta

export default meta
type Story = StoryObj

function InteropFixture() {
  return (
    <div className="grid w-80 gap-4">
      <div data-testid="native-card" className="bg-background p-4" />
      <ButtonBase className="flex flex-col items-stretch rounded-lg bg-background p-4">
        Monthly activity
      </ButtonBase>
      <Paper data-testid="paper" elevation={0} className="bg-background p-4">
        Surface
      </Paper>
      <div className="relative h-12">
        <IconButton aria-label="Expand" className="absolute left-0 top-2">
          <ChevronRightIcon />
        </IconButton>
      </div>
      <div className="flex leading-[48px]">
        <Typography className="grow leading-[inherit]">Accounts</Typography>
        <span>100</span>
      </div>
      <TagIcon symbol="🍎" showCheckBox size="m" onChange={() => {}} />
    </div>
  )
}

const checkInterop: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const nativeBackground = getComputedStyle(
    canvas.getByTestId('native-card')
  ).backgroundColor
  const card = getComputedStyle(
    canvas.getByRole('button', { name: 'Monthly activity' })
  )
  await expect(card.backgroundColor).toBe(nativeBackground)
  await expect(card.padding).toBe('16px')
  await expect(card.borderRadius).toBe('8px')
  await expect(card.alignItems).toBe('stretch')
  await expect(card.display).toBe('flex')
  await expect(card.flexDirection).toBe('column')
  await expect(
    getComputedStyle(canvas.getByTestId('paper')).backgroundColor
  ).toBe(nativeBackground)
  await expect(
    getComputedStyle(canvas.getByRole('button', { name: 'Expand' })).position
  ).toBe('absolute')
  await expect(getComputedStyle(canvas.getByText('Accounts')).lineHeight).toBe(
    '48px'
  )
  const checkbox = canvas.getByRole('checkbox').closest('.MuiCheckbox-root')!
  await expect(getComputedStyle(checkbox).position).toBe('absolute')
  const icon = canvas.getByText('🍎').getBoundingClientRect()
  const wrapper = checkbox.parentElement!.getBoundingClientRect()
  await expect(
    Math.abs(icon.x + icon.width / 2 - wrapper.x - wrapper.width / 2)
  ).toBeLessThan(1)
  await expect(
    Math.abs(icon.y + icon.height / 2 - wrapper.y - wrapper.height / 2)
  ).toBeLessThan(1)
}

export const Light: Story = { render: InteropFixture, play: checkInterop }
export const Dark: Story = {
  globals: { theme: 'dark' },
  render: InteropFixture,
  play: checkInterop,
}

export const BudgetRows: Story = {
  render: () => (
    <RenderColumnsProvider>
      <div className="w-[700px] max-w-full">
        {['Categories', 'A longer category name', 'Short'].map(
          (name, index) => (
            <TableRow
              key={name}
              data-testid="budget-row"
              className={index === 0 ? 'items-baseline' : undefined}
              name={<span className="min-w-0 truncate">{name}</span>}
              assigned={<span>10</span>}
              outcome={<span>20</span>}
              available={<span>30</span>}
              goal={null}
            />
          )
        )}
      </div>
    </RenderColumnsProvider>
  ),
  play: async ({ canvasElement }) => {
    const rows = within(canvasElement).getAllByTestId('budget-row')
    await expect(getComputedStyle(rows[0]).alignItems).toBe('baseline')
    await expect(getComputedStyle(rows[1]).alignItems).toBe('center')
    const columns = getComputedStyle(rows[0]).gridTemplateColumns
    for (const row of rows.slice(1)) {
      await expect(getComputedStyle(row).gridTemplateColumns).toBe(columns)
    }
  },
}

export const MobileRevealColors: Story = {
  render: () => (
    <div className="w-80">
      <span data-testid="disabled-color" className="text-disabled-foreground">
        Reference
      </span>
      <SlideReveal
        enabled
        items={[
          {
            key: 'assigned',
            label: 'Assigned',
            value: 0,
            color: 'text.disabled',
          },
        ]}
      >
        <div className="h-12">Envelope</div>
      </SlideReveal>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const value = canvas.getByText('0').closest('p')!
    await expect(getComputedStyle(value).color).toBe(
      getComputedStyle(canvas.getByTestId('disabled-color')).color
    )
  },
}
