import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor, within } from 'storybook/test'
import { Layout } from './Layout'
import { CanvasPage } from '@/6-shared/ui/layout/CanvasPage'
import { Columns } from '@/6-shared/ui/layout/Columns'
import { PanelScrollable } from '@/6-shared/ui/layout/Panel'
import { pageColumns } from '@/1-app/pageColumns'

const meta = {
  title: 'App/Layout',
  parameters: {
    layout: 'fullscreen',
    app: { scenario: 'demo', route: '/accounts' },
  },
} satisfies Meta
export default meta
type Story = StoryObj

const content = Array.from({ length: 80 }, (_, index) => (
  <p key={index} className="p-4">
    Row {index + 1}: content that reaches the edge of its scrolling surface.
  </p>
))

function PanelPage({ toolbar = false }: { toolbar?: boolean }) {
  return (
    <Layout
      navigation
      columns={pageColumns.accounts}
      toolbar={
        toolbar ? <div style={{ height: 40 }}>History toolbar</div> : undefined
      }
    >
      <Columns>
        <PanelScrollable>{content}</PanelScrollable>
      </Columns>
    </Layout>
  )
}

export const MobilePanel: Story = {
  globals: { viewport: { value: 'iphone13' } },
  render: () => <PanelPage />,
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole('navigation')
    const panel = canvasElement.querySelector<HTMLElement>('.layout-panel')!
    const viewport = panel.querySelector<HTMLElement>('.kit-scroll-viewport')!
    expect(nav.getBoundingClientRect().height).toBe(64)
    expect(panel.getBoundingClientRect().bottom).toBe(
      nav.getBoundingClientRect().top
    )
    expect(getComputedStyle(panel).borderRadius).toBe('16px')
    expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight)
    viewport.scrollTop = viewport.scrollHeight
    await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0))
    expect(document.documentElement.scrollHeight).toBe(window.innerHeight)
    const shell = canvasElement.querySelector<HTMLElement>('.app-layout')!
    shell.style.setProperty('--mobile-panel-top', '8px')
    shell.style.setProperty('--mobile-panel-sides', '4px')
    expect(panel.getBoundingClientRect().top).toBe(8)
    expect(panel.getBoundingClientRect().left).toBe(4)
    shell.style.removeProperty('--mobile-panel-top')
    shell.style.removeProperty('--mobile-panel-sides')
  },
}

export const MobileCanvas: Story = {
  globals: { viewport: { value: 'iphone13' } },
  parameters: { app: { route: '/about' } },
  render: () => (
    <Layout navigation>
      <CanvasPage>
        <div className="mx-auto max-w-[640px]">{content}</div>
      </CanvasPage>
    </Layout>
  ),
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole('navigation')
    const viewport = canvasElement.querySelector<HTMLElement>(
      '.kit-scroll-viewport'
    )!
    expect(viewport.getBoundingClientRect().top).toBe(0)
    expect(viewport.getBoundingClientRect().bottom).toBe(window.innerHeight)
    expect(nav.getBoundingClientRect().height).toBe(64)
    const blur = nav.querySelector<HTMLElement>('.mobile-navigation-blur')!
    expect(getComputedStyle(blur).backdropFilter).toBe('blur(2px)')
    viewport.scrollTop = viewport.scrollHeight
    await waitFor(() => {
      const last = within(canvasElement).getByText(/^Row 80:/)
      expect(last.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        nav.getBoundingClientRect().top + 1
      )
    })
    expect(document.documentElement.scrollHeight).toBe(window.innerHeight)
  },
}

export const DesktopCanvas: Story = {
  ...MobileCanvas,
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '.kit-scroll-viewport'
    )!
    expect(viewport.getBoundingClientRect().top).toBe(0)
    expect(viewport.getBoundingClientRect().bottom).toBe(window.innerHeight)
    expect(viewport.getBoundingClientRect().left).toBe(56)
  },
}

export const ToolbarAboveRail: Story = {
  globals: { viewport: { value: 'desktop' } },
  render: () => <PanelPage toolbar />,
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole('navigation')
    const panel = canvasElement.querySelector<HTMLElement>('.layout-panel')!
    expect(nav.getBoundingClientRect().top).toBe(40)
    expect(panel.getBoundingClientRect().top).toBe(48)
    expect(panel.getBoundingClientRect().bottom).toBe(window.innerHeight - 8)
  },
}

export const MobileToolbar: Story = {
  globals: { viewport: { value: 'iphone13' } },
  render: () => <PanelPage toolbar />,
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole('navigation')
    const panel = canvasElement.querySelector<HTMLElement>('.layout-panel')!
    expect(panel.getBoundingClientRect().top).toBe(40)
    expect(panel.getBoundingClientRect().bottom).toBe(
      nav.getBoundingClientRect().top
    )
    expect(nav.getBoundingClientRect().bottom).toBe(window.innerHeight)
  },
}

function CappedPage() {
  const columns = [
    { id: 'main', min: 200, max: 400 },
    { id: 'aside', min: 200, max: 240, collapseOrder: 0 },
  ]
  return (
    <Layout navigation columns={columns}>
      <Columns>
        <PanelScrollable>Main</PanelScrollable>
        <PanelScrollable>Aside</PanelScrollable>
      </Columns>
    </Layout>
  )
}

export const CenteredColumns: Story = {
  globals: { viewport: { value: 'desktop' } },
  render: () => <CappedPage />,
  play: async ({ canvasElement }) => {
    const panels = canvasElement.querySelectorAll<HTMLElement>('.layout-panel')
    const first = panels[0].getBoundingClientRect()
    const last = panels[1].getBoundingClientRect()
    expect(first.width).toBe(400)
    expect(last.width).toBe(240)
    expect(last.left - first.right).toBe(8)
    // Center in the content area after the rail and the right canvas margin.
    expect(first.left - 56).toBeCloseTo(window.innerWidth - 8 - last.right)
  },
}

export const MobileSafeAreas: Story = {
  globals: { viewport: { value: 'iphone13' } },
  render: () => <PanelPage />,
  play: async ({ canvasElement }) => {
    const root = document.documentElement
    const values = {
      '--layout-safe-top': '24px',
      '--layout-safe-left': '20px',
      '--layout-safe-right': '12px',
      '--layout-safe-bottom': '34px',
      '--mobile-panel-top': '8px',
      '--mobile-panel-sides': '4px',
    }
    try {
      for (const [name, value] of Object.entries(values))
        root.style.setProperty(name, value)
      const nav = within(canvasElement).getByRole('navigation')
      const panel = canvasElement.querySelector<HTMLElement>('.layout-panel')!
      await waitFor(() => {
        expect(nav.getBoundingClientRect().height).toBe(98)
        expect(panel.getBoundingClientRect().top).toBe(32)
        expect(panel.getBoundingClientRect().left).toBe(24)
        expect(panel.getBoundingClientRect().right).toBe(window.innerWidth - 16)
        expect(panel.getBoundingClientRect().bottom).toBe(
          nav.getBoundingClientRect().top
        )
      })
      const firstLink = within(nav).getAllByRole('link')[0]
      expect(firstLink.getBoundingClientRect().left).toBe(28)
    } finally {
      for (const name of Object.keys(values)) root.style.removeProperty(name)
    }
  },
}

export const DesktopSafeAreas: Story = {
  globals: { viewport: { value: 'desktop' } },
  render: () => <PanelPage toolbar />,
  play: async ({ canvasElement }) => {
    const root = document.documentElement
    const values = {
      '--layout-safe-top': '24px',
      '--layout-safe-left': '44px',
      '--layout-safe-right': '44px',
      '--layout-safe-bottom': '21px',
    }
    try {
      for (const [name, value] of Object.entries(values))
        root.style.setProperty(name, value)
      const nav = within(canvasElement).getByRole('navigation')
      const panel = canvasElement.querySelector<HTMLElement>('.layout-panel')!
      await waitFor(() => {
        expect(nav.getBoundingClientRect().left).toBe(44)
        expect(nav.getBoundingClientRect().top).toBe(64)
        expect(panel.getBoundingClientRect().left).toBe(100)
        expect(panel.getBoundingClientRect().right).toBe(window.innerWidth - 52)
        expect(panel.getBoundingClientRect().bottom).toBe(
          window.innerHeight - 29
        )
      })
    } finally {
      for (const name of Object.keys(values)) root.style.removeProperty(name)
    }
  },
}
