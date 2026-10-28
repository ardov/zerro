import type { Meta, StoryObj } from '@storybook/react-vite'
import { useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import { makeStoryStore } from 'stories/fixtures/storyStore'
import { getBackupContent } from '@/4-features/export/exportJSON'
import { MenuButton } from './MenuButton'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'

const meta = {
  title: 'App/Navigation/Settings',
  component: MenuButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    historyShortcuts: true,
    app: { scenario: 'demo', globalWidgets: true },
  },
} satisfies Meta<typeof MenuButton>

export default meta
type Story = StoryObj

function Harness() {
  const currency = useAppSelector(core.currency.selectDisplayCurrency)
  const pending = useAppSelector(state => state.data.outbox.length)
  const result = useAppSelector(state => state.sync.lastResult)
  const { pathname } = useLocation()
  return (
    <>
      <MenuButton />
      <output hidden aria-label="Display currency value">
        {currency}
      </output>
      <output hidden aria-label="Pending changes">
        {pending}
      </output>
      <output hidden aria-label="Reload attempted">
        {String(result !== null)}
      </output>
      <output hidden aria-label="Route">
        {pathname}
      </output>
    </>
  )
}

async function openSettings(canvasElement: HTMLElement, name = 'Settings') {
  const body = within(canvasElement.ownerDocument.body)
  await userEvent.click(within(canvasElement).getByRole('button', { name }))
  const screen = await body.findByRole('dialog', { name })
  await waitFor(() => expect(screen).toBeVisible())
  return screen
}

const checkScreen: Story['play'] = async ({ canvasElement, globals }) => {
  const screen = await openSettings(canvasElement)
  expect(screen).toHaveAttribute(
    'data-side',
    window.innerWidth < 500 ? 'bottom' : 'left'
  )
  if (window.innerWidth >= 500) {
    const bounds = screen.getBoundingClientRect()
    expect(bounds.left).toBeLessThan(window.innerWidth / 4)
    expect(bounds.height).toBeGreaterThan(window.innerHeight * 0.95)
  }
  await expect(
    within(screen).getByRole('button', { name: 'Full backup' })
  ).toBeVisible()
  await expect(
    within(screen).getByRole('button', { name: 'Change history' })
  ).toBeVisible()
  await expect(
    within(screen).getByRole('button', { name: 'Advanced' })
  ).toBeVisible()
  expect(
    within(screen).queryByRole('button', { name: 'Restore from backup' })
  ).toBeNull()
  await expect(
    within(screen).getByRole('button', { name: 'Language: EN' })
  ).toHaveTextContent('EN')
  await expect(
    within(screen).getByRole('button', {
      name: globals.theme === 'dark' ? 'Dark Mode' : 'Light Mode',
    })
  ).toBeVisible()
  await expect(
    within(screen).getByRole('button', { name: /^Display currency:/ })
  ).toBeVisible()
}

export const Desktop: Story = { render: () => <Harness />, play: checkScreen }
export const Mobile: Story = {
  globals: { viewport: { value: 'iphone13' } },
  render: () => <Harness />,
  play: checkScreen,
}

const checkClosingMotion: Story['play'] = async ({ canvasElement }) => {
  const screen = await openSettings(canvasElement)
  await Promise.allSettled(
    screen.getAnimations().map(animation => animation.finished)
  )
  if (window.innerWidth < 500) await userEvent.keyboard('{Escape}')
  else
    await userEvent.click(within(screen).getByRole('button', { name: 'Close' }))
  await waitFor(() => expect(screen).toHaveAttribute('data-ending-style'))
  const animations = screen.getAnimations()
  try {
    for (const animation of animations) {
      animation.pause()
      animation.currentTime = Number(animation.effect!.getTiming().duration) / 2
    }
    const style = getComputedStyle(screen)
    expect(screen.isConnected).toBe(true)
    expect(Number(style.opacity)).toBeGreaterThan(0)
    expect(Number(style.opacity)).toBeLessThan(1)
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      expect(style.scale).toBe('none')
      expect(style.filter).toBe('none')
    } else {
      expect(Number(style.scale)).toBeGreaterThan(1)
      expect(Number(style.scale)).toBeLessThan(1.04)
      const blur = Number.parseFloat(style.filter.slice(5))
      expect(blur).toBeGreaterThan(0)
      expect(blur).toBeLessThan(1)
    }
  } finally {
    for (const animation of animations) animation.finish()
  }
  await waitFor(() => expect(screen).not.toBeInTheDocument())
}

export const ClosingMotion: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness />,
  play: checkClosingMotion,
}
export const ClosingMotionMobile: Story = {
  ...ClosingMotion,
  globals: { viewport: { value: 'iphone13' } },
}

export const Russian: Story = {
  globals: { locale: 'ru' },
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const screen = await openSettings(canvasElement, 'Настройки')
    await expect(
      within(screen).getByRole('button', { name: 'Язык: RU' })
    ).toHaveTextContent('RU')
    await expect(
      within(screen).getByRole('button', { name: /^Валюта отображения:/ })
    ).toBeVisible()
  },
}

const checkHistory: Story['play'] = async ({ canvasElement }) => {
  const body = within(canvasElement.ownerDocument.body)
  await openSettings(canvasElement)
  await userEvent.click(body.getByRole('button', { name: 'Change history' }))
  await body.findByRole('dialog', { name: 'Change history' })
  await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}')
  await waitFor(() =>
    expect(body.queryByRole('dialog', { name: 'Change history' })).toBeNull()
  )
  await expect(body.getByRole('button', { name: 'Full backup' })).toBeVisible()
  // One further Back reaches the page; Forward reconstructs settings from
  // the same history value.
  await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}')
  await waitFor(() =>
    expect(body.queryByRole('button', { name: 'Full backup' })).toBeNull()
  )
  await userEvent.keyboard('{Alt>}{ArrowRight}{/Alt}')
  await body.findByRole('button', { name: 'Full backup' })
  await userEvent.keyboard('{Escape}')
  await waitFor(() =>
    expect(body.queryByRole('button', { name: 'Full backup' })).toBeNull()
  )
  await waitFor(() =>
    expect(
      within(canvasElement).getByRole('button', { name: 'Settings' })
    ).toHaveFocus()
  )
}

export const BackAndForward: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness />,
  play: checkHistory,
}
export const BackAndForwardMobile: Story = {
  ...BackAndForward,
  globals: { viewport: { value: 'iphone13' } },
}

const checkControls: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const body = within(canvasElement.ownerDocument.body)
  const screen = await openSettings(canvasElement)
  const controls = within(screen)
  const advanced = controls.getByRole('button', { name: 'Advanced' })
  expect(advanced).toHaveAttribute('aria-expanded', 'false')
  advanced.focus()
  await userEvent.keyboard('{Enter}')
  expect(advanced).toHaveAttribute('aria-expanded', 'true')
  await expect(
    await controls.findByRole('button', { name: 'Restore from backup' })
  ).toBeVisible()
  await userEvent.keyboard(' ')
  expect(advanced).toHaveAttribute('aria-expanded', 'false')
  await waitFor(() =>
    expect(
      controls.queryByRole('button', { name: 'Restore from backup' })
    ).toBeNull()
  )
  await userEvent.click(advanced)

  const budgets = controls.getByRole('switch', { name: 'Zenmoney budgets' })
  await userEvent.click(budgets)
  await expect(budgets).toBeChecked()
  await waitFor(() =>
    expect(
      controls.queryByRole('button', { name: 'Convert budgets from Zenmoney' })
    ).toBeNull()
  )
  await expect(canvas.getByLabelText('Pending changes')).not.toHaveTextContent(
    '0'
  )
  await userEvent.click(budgets)
  await expect(
    controls.getByRole('button', { name: 'Convert budgets from Zenmoney' })
  ).toBeVisible()

  const before = canvas.getByLabelText('Display currency value').textContent
  await userEvent.click(
    controls.getByRole('button', { name: /^Display currency:/ })
  )
  await waitFor(() =>
    expect(
      canvas.getByLabelText('Display currency value').textContent
    ).not.toBe(before)
  )

  await userEvent.click(controls.getByRole('button', { name: 'Language: EN' }))
  await expect(
    await body.findByRole('button', { name: 'Язык: RU' })
  ).toHaveTextContent('RU')
  await userEvent.click(
    within(screen).getByRole('button', { name: 'Язык: RU' })
  )
  await body.findByRole('button', { name: 'Full backup' })
}

export const Controls: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness />,
  play: checkControls,
}
export const ControlsMobile: Story = {
  ...Controls,
  globals: { viewport: { value: 'iphone13' } },
}

export const CheckAppUpdates: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const screen = await openSettings(canvasElement)
    await userEvent.click(
      within(screen).getByRole('button', { name: 'Check for updates' })
    )
    // Storybook has no production worker. The toast proves the version button
    // invokes the updater while the settings screen stays open.
    await within(canvasElement.ownerDocument.body).findByText(
      'Update checks are unavailable'
    )
    await expect(screen).toBeVisible()
  },
}

export const CurrencyCycle: Story = {
  tags: ['!dev', '!autodocs'],
  render: function Render() {
    const [, setCurrency] = core.currency.useDisplayCurrency()
    return (
      <>
        <button type="button" onClick={() => setCurrency('JPY')}>
          Use JPY
        </button>
        <Harness />
      </>
    )
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Use JPY' })
    )
    const screen = await openSettings(canvasElement)
    const currency = within(screen).getByRole('button', {
      name: 'Display currency: JPY',
    })
    for (const next of ['USD', 'EUR', 'JPY']) {
      await userEvent.click(currency)
      await expect(currency).toHaveTextContent(next)
    }
  },
}

const checkClearIconCache: Story['play'] = async ({ canvasElement }) => {
  const cacheName = 'zerro-favicons-v1'
  const unrelatedName = 'settings-story-unrelated'
  const cache = await caches.open(cacheName)
  await cache.put('/cached-icon', new Response('icon'))
  const unrelated = await caches.open(unrelatedName)
  await unrelated.put('/unrelated', new Response('keep'))
  try {
    const screen = await openSettings(canvasElement)
    await userEvent.click(
      within(screen).getByRole('button', { name: 'Advanced' })
    )
    await userEvent.click(
      within(screen).getByRole('button', { name: 'Clear icon cache' })
    )
    await within(canvasElement.ownerDocument.body).findByText(
      'Icon cache cleared'
    )
    expect(await caches.has(cacheName)).toBe(false)
    expect(await (await unrelated.match('/unrelated'))?.text()).toBe('keep')
  } finally {
    await caches.delete(cacheName)
    await caches.delete(unrelatedName)
  }
}

export const ClearIconCache: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness />,
  play: checkClearIconCache,
}
export const ClearIconCacheMobile: Story = {
  ...ClearIconCache,
  globals: { viewport: { value: 'iphone13' } },
}

export const ReloadImmediately: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const screen = await openSettings(canvasElement)
    await userEvent.click(
      within(screen).getByRole('button', { name: 'Advanced' })
    )
    await userEvent.click(
      within(screen).getByRole('button', { name: 'Reload data' })
    )
    // No token in this fixture: the resulting sync status proves the action
    // was invoked without a network request or confirmation.
    await waitFor(() =>
      expect(
        within(canvasElement).getByLabelText('Reload attempted')
      ).toHaveTextContent('true')
    )
  },
}

export const MobilePanelNavigation: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { viewport: { value: 'iphone13' } },
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const screen = await openSettings(canvasElement)
    await userEvent.click(
      within(screen).getByRole('link', { name: 'Accounts' })
    )
    await waitFor(() =>
      expect(within(canvasElement).getByLabelText('Route')).toHaveTextContent(
        '/accounts'
      )
    )
    await waitFor(() => expect(screen).not.toBeInTheDocument())
  },
}

export const BackupConfirmation: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const screen = await openSettings(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      within(screen).getByRole('button', { name: 'Advanced' })
    )
    await userEvent.click(
      within(screen).getByRole('switch', { name: 'Zenmoney budgets' })
    )
    await userEvent.click(
      within(screen).getByRole('button', { name: 'Full backup' })
    )
    const confirm = await body.findByRole('dialog', {
      name: 'Unsynced changes will not be included',
    })
    await userEvent.click(
      within(confirm).getByRole('button', { name: 'Cancel' })
    )
    await waitFor(() => expect(confirm).not.toBeInTheDocument())
    await expect(
      within(screen).getByRole('button', { name: 'Full backup' })
    ).toBeVisible()
  },
}

export const ImportConfirmation: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const screen = await openSettings(canvasElement)
    await userEvent.click(
      within(screen).getByRole('button', { name: 'Advanced' })
    )
    const input = screen.querySelector<HTMLInputElement>('input[type="file"]')!
    const backup = JSON.parse(getBackupContent(makeStoryStore().getState()))
    backup.transaction.find(
      (row: { deleted: boolean }) => !row.deleted
    ).comment = 'Restored comment'
    const file = new File([JSON.stringify(backup)], 'backup.json', {
      type: 'application/json',
    })
    fireEvent.change(input, { target: { files: [file] } })
    const body = within(canvasElement.ownerDocument.body)
    const confirm = await body.findByRole('dialog', {
      name: 'Restore from backup',
    })
    await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}')
    await waitFor(() => expect(confirm).not.toBeInTheDocument())
    await expect(
      within(screen).getByRole('button', { name: 'Restore from backup' })
    ).toBeVisible()
    expect(input.value).toBe('')
  },
}

export const ImportConfirmationMobile: Story = {
  ...ImportConfirmation,
  globals: { viewport: { value: 'iphone13' } },
}
