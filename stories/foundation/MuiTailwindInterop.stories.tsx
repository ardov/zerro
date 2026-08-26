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

type ComputedProperty =
  | 'fontSize'
  | 'lineHeight'
  | 'fontWeight'
  | 'fontFamily'
  | 'letterSpacing'
  | 'textTransform'
  | 'color'
  | 'marginTop'
  | 'marginRight'
  | 'marginBottom'
  | 'marginLeft'
  | 'backgroundColor'
  | 'backgroundImage'
  | 'borderRadius'
  | 'borderWidth'
  | 'borderStyle'
  | 'borderColor'
  | 'boxShadow'
  | 'overflow'

async function waitForFonts() {
  await document.fonts.ready
}

async function expectMatchingStyles(
  reference: Element,
  candidate: Element,
  properties: ComputedProperty[]
) {
  const referenceStyle = getComputedStyle(reference)
  const candidateStyle = getComputedStyle(candidate)
  for (const property of properties) {
    await expect(candidateStyle[property]).toBe(referenceStyle[property])
  }
}

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

export const TypographyUtilities: Story = {
  render: () => (
    <div className="grid gap-4">
      <h2 className="m-0 type-title font-normal leading-6">Local overrides</h2>
      <p className="m-0 type-body md:type-title">Responsive recipe</p>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const local = getComputedStyle(canvas.getByText('Local overrides'))
    await expect(local.fontSize).toBe('20px')
    await expect(local.fontWeight).toBe('400')
    await expect(local.lineHeight).toBe('24px')

    const wide = window.matchMedia('(min-width: 900px)').matches
    const responsive = getComputedStyle(canvas.getByText('Responsive recipe'))
    await expect(responsive.fontSize).toBe(wide ? '20px' : '16px')
    await expect(responsive.lineHeight).toBe(wide ? '32px' : '24px')
  },
}

function TypographyMatrix() {
  return (
    <div className="grid gap-3 p-4">
      <div className="grid gap-1">
        <Typography data-testid="mui-body" component="p" variant="body1">
          English and русский body text
        </Typography>
        <p data-testid="tailwind-body" className="m-0 type-body">
          English and русский body text
        </p>
      </div>
      <div className="grid gap-1">
        <Typography data-testid="mui-body-sm" component="p" variant="body2">
          Large amount -123 456,78
        </Typography>
        <p data-testid="tailwind-body-sm" className="m-0 type-body-sm">
          Large amount -123 456,78
        </p>
      </div>
      <div className="grid gap-1">
        <Typography
          data-testid="mui-caption"
          component="span"
          variant="caption"
        >
          Caption
        </Typography>
        <span data-testid="tailwind-caption" className="type-caption">
          Caption
        </span>
      </div>
      <div className="grid gap-1">
        <Typography
          data-testid="mui-overline"
          component="span"
          variant="overline"
        >
          Overline
        </Typography>
        <span data-testid="tailwind-overline" className="type-overline">
          Overline
        </span>
      </div>
      <div className="grid gap-1">
        <Typography data-testid="mui-title" component="h6" variant="h6">
          Title
        </Typography>
        <h2 data-testid="tailwind-title" className="m-0 type-title">
          Title
        </h2>
      </div>
      <div className="grid gap-1">
        <Typography data-testid="mui-title-lg" component="h5" variant="h5">
          Title large
        </Typography>
        <h2 data-testid="tailwind-title-lg" className="m-0 type-title-lg">
          Title large
        </h2>
      </div>
      <div className="grid gap-1">
        <Typography data-testid="mui-display" component="h4" variant="h4">
          Display
        </Typography>
        <h2 data-testid="tailwind-display" className="m-0 type-display">
          Display
        </h2>
      </div>
    </div>
  )
}

const typographyProperties: ComputedProperty[] = [
  'fontSize',
  'lineHeight',
  'fontWeight',
  'fontFamily',
  'letterSpacing',
  'textTransform',
  'color',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
]

const checkTypographyMatrix: Story['play'] = async ({ canvasElement }) => {
  await waitForFonts()
  const canvas = within(canvasElement)
  const pairs = [
    ['mui-body', 'tailwind-body'],
    ['mui-body-sm', 'tailwind-body-sm'],
    ['mui-caption', 'tailwind-caption'],
    ['mui-overline', 'tailwind-overline'],
    ['mui-title', 'tailwind-title'],
    ['mui-title-lg', 'tailwind-title-lg'],
    ['mui-display', 'tailwind-display'],
  ] as const
  for (const [reference, candidate] of pairs) {
    await expectMatchingStyles(
      canvas.getByTestId(reference),
      canvas.getByTestId(candidate),
      typographyProperties
    )
  }
}

export const TypographyMatrixLight: Story = {
  render: () => <TypographyMatrix />,
  play: checkTypographyMatrix,
}

export const TypographyMatrixDark: Story = {
  globals: { theme: 'dark' },
  render: () => <TypographyMatrix />,
  play: checkTypographyMatrix,
}

function ResponsiveTypography() {
  return (
    <p data-testid="responsive-recipe" className="m-0 type-body md:type-title">
      Responsive recipe
    </p>
  )
}

export const TypographyResponsiveNarrow: Story = {
  parameters: { viewport: { defaultViewport: 'zerro899' } },
  render: () => <ResponsiveTypography />,
  play: async ({ canvasElement }) => {
    await waitForFonts()
    const style = getComputedStyle(
      within(canvasElement).getByTestId('responsive-recipe')
    )
    await expect(style.fontSize).toBe('16px')
    await expect(style.lineHeight).toBe('24px')
  },
}

export const TypographyResponsiveWide: Story = {
  parameters: { viewport: { defaultViewport: 'zerro900' } },
  render: () => <ResponsiveTypography />,
  play: async ({ canvasElement }) => {
    await waitForFonts()
    const style = getComputedStyle(
      within(canvasElement).getByTestId('responsive-recipe')
    )
    await expect(style.fontSize).toBe('20px')
    await expect(style.lineHeight).toBe('32px')
  },
}

function SurfaceMatrix() {
  return (
    <div className="grid w-[320px] gap-3 p-4">
      <Paper data-testid="mui-default" elevation={1}>
        Default
      </Paper>
      <div
        data-testid="tailwind-default"
        className="surface-card shadow-elevation-1"
      >
        Default
      </div>
      <Paper data-testid="mui-square" square elevation={0}>
        Square
      </Paper>
      <div
        data-testid="tailwind-square"
        className="rounded-none bg-card text-card-foreground shadow-none"
      >
        Square
      </div>
      <Paper data-testid="mui-outlined" variant="outlined">
        Outlined
      </Paper>
      <div
        data-testid="tailwind-outlined"
        className="surface-card border border-border shadow-none"
      >
        Outlined
      </div>
      <Paper data-testid="mui-elevated" elevation={10}>
        Elevated
      </Paper>
      <div
        data-testid="tailwind-elevated"
        className="surface-card shadow-elevation-10"
      >
        Elevated
      </div>
    </div>
  )
}

const surfaceProperties: ComputedProperty[] = [
  'backgroundColor',
  'backgroundImage',
  'color',
  'borderRadius',
  'borderWidth',
  'borderStyle',
  'borderColor',
  'boxShadow',
  'overflow',
]

const checkSurfaceMatrix: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const pairs = [
    ['mui-default', 'tailwind-default'],
    ['mui-square', 'tailwind-square'],
    ['mui-outlined', 'tailwind-outlined'],
    ['mui-elevated', 'tailwind-elevated'],
  ] as const
  for (const [reference, candidate] of pairs) {
    await expectMatchingStyles(
      canvas.getByTestId(reference),
      canvas.getByTestId(candidate),
      surfaceProperties
    )
  }
}

export const SurfaceMatrixLight: Story = {
  render: () => <SurfaceMatrix />,
  play: checkSurfaceMatrix,
}

export const SurfaceMatrixDark: Story = {
  globals: { theme: 'dark' },
  render: () => <SurfaceMatrix />,
  play: checkSurfaceMatrix,
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
