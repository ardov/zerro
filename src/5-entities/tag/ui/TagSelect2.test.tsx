import '@testing-library/jest-dom'
import type { TTag } from '6-shared/types'
import { configureStore } from '@reduxjs/toolkit'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { Provider } from 'react-redux'
import dataReducer from 'store/data'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { TagSelect2 } from './TagSelect2'

vi.mock('i18next', () => ({
  t: (key: string) => key,
}))

function makeOutcomeTag(id: string, title: string): TTag {
  return {
    id,
    title,
    user: 0,
    changed: Date.now(),
    parent: null,
    icon: null,
    staticId: null,
    picture: null,
    color: null,
    showIncome: false,
    showOutcome: true,
    budgetIncome: false,
    budgetOutcome: false,
    required: null,
  }
}

const createTestStore = () =>
  configureStore({
    reducer: {
      data: dataReducer,
    },
    preloadedState: {
      data: {
        current: {
          serverTimestamp: 0,
          instrument: {},
          country: {},
          company: {},
          user: {},
          merchant: {},
          account: {},
          tag: {
            tag1: makeOutcomeTag('tag1', '🍔 Food'),
            tag2: makeOutcomeTag('tag2', '🚗 Transport'),
            tag3: makeOutcomeTag('tag3', '🎮 Entertainment'),
          },
          budget: {},
          reminder: {},
          reminderMarker: {},
          transaction: {},
        },
      },
    },
  })

describe('TagSelect2 keyboard navigation', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const mount = (component: React.ReactElement) =>
    render(<Provider store={store}>{component}</Provider>)

  async function popoverOpened() {
    const button = screen.getByRole('button')
    await userEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Entertainment')).toBeInTheDocument()
    })
  }

  test('first tag is focused by default when popover opens', async () => {
    mount(<TagSelect2 onChange={vi.fn()} />)
    await popoverOpened()

    expect(
      screen.getByText('Entertainment').closest('div[role="button"]')
    ).toHaveClass('Mui-selected')
  })

  test('arrow down key moves focus to next tag', async () => {
    mount(<TagSelect2 onChange={vi.fn()} />)
    await popoverOpened()

    const searchInput = screen.getByPlaceholderText('selectCategory')
    await userEvent.type(searchInput, '{ArrowDown}')

    await waitFor(() => {
      expect(screen.getByText('Food')).toBeInTheDocument()
    })

    const foodItem = screen.getByText('Food').closest('div[role="button"]')
    expect(foodItem).toHaveClass('Mui-selected')
  })

  test('arrow up key moves focus to previous tag', async () => {
    mount(<TagSelect2 onChange={vi.fn()} />)
    await popoverOpened()

    const searchInput = screen.getByPlaceholderText('selectCategory')
    await userEvent.type(searchInput, '{ArrowDown}{ArrowDown}')
    await userEvent.type(searchInput, '{ArrowUp}')

    await waitFor(() => {
      expect(screen.getByText('Food')).toBeInTheDocument()
    })

    expect(screen.getByText('Food').closest('div[role="button"]')).toHaveClass(
      'Mui-selected'
    )
  })

  test('arrow keys do not move beyond list boundaries', async () => {
    mount(<TagSelect2 onChange={vi.fn()} />)
    await popoverOpened()

    const searchInput = screen.getByPlaceholderText('selectCategory')
    await userEvent.type(searchInput, '{ArrowUp}')

    expect(
      screen.getByText('Entertainment').closest('div[role="button"]')
    ).toHaveClass('Mui-selected')

    await userEvent.type(searchInput, '{ArrowDown}{ArrowDown}')
    await userEvent.type(searchInput, '{ArrowDown}')

    await waitFor(() => {
      expect(screen.getByText('Transport')).toBeInTheDocument()
    })

    expect(
      screen.getByText('Transport').closest('div[role="button"]')
    ).toHaveClass('Mui-selected')
  })

  test('enter key selects the focused tag', async () => {
    const onChange = vi.fn()

    mount(<TagSelect2 onChange={onChange} />)
    await popoverOpened()

    const searchInput = screen.getByPlaceholderText('selectCategory')
    await userEvent.type(searchInput, '{ArrowDown}')
    await userEvent.type(searchInput, '{Enter}')

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('tag1')
    })
  })

  test('scrollIntoView is called when focused item changes', async () => {
    const scrollIntoViewSpy = vi.spyOn(Element.prototype, 'scrollIntoView')

    mount(<TagSelect2 onChange={vi.fn()} />)
    await popoverOpened()

    scrollIntoViewSpy.mockClear()
    const searchInput = screen.getByPlaceholderText('selectCategory')
    await userEvent.type(searchInput, '{ArrowDown}')

    await waitFor(() => {
      expect(scrollIntoViewSpy).toHaveBeenCalled()
    })
  })

  test('focus resets to first item when search changes', async () => {
    mount(<TagSelect2 onChange={vi.fn()} />)
    await popoverOpened()

    const searchInput = screen.getByPlaceholderText('selectCategory')
    await userEvent.type(searchInput, '{ArrowDown}')
    await userEvent.type(searchInput, 'n')

    await waitFor(() => {
      const entertainmentItem = screen
        .getByText('Entertainment')
        .closest('div[role="button"]')
      expect(entertainmentItem).toHaveClass('Mui-selected')
    })
  })

  test('arrow down from last tag reaches show all categories button', async () => {
    mount(<TagSelect2 onChange={vi.fn()} tagType="outcome" />)
    await popoverOpened()

    const searchInput = screen.getByPlaceholderText('selectCategory')
    await userEvent.type(searchInput, '{ArrowDown}{ArrowDown}')
    await userEvent.type(searchInput, '{ArrowDown}')

    await waitFor(() => {
      expect(
        screen.getByText('showAllCategories').closest('div[role="button"]')
      ).toHaveClass('Mui-selected')
    })
  })

  test('enter key on show all categories button clears tag type filter', async () => {
    mount(<TagSelect2 onChange={vi.fn()} tagType="outcome" />)
    await popoverOpened()

    const searchInput = screen.getByPlaceholderText('selectCategory')
    await userEvent.type(searchInput, '{ArrowDown}{ArrowDown}{ArrowDown}')
    await userEvent.type(searchInput, '{Enter}')

    await waitFor(() => {
      expect(screen.queryByText('showAllCategories')).not.toBeInTheDocument()
    })
  })

  test('arrow up from show all categories button goes to last tag', async () => {
    mount(<TagSelect2 onChange={vi.fn()} tagType="outcome" />)
    await popoverOpened()

    const searchInput = screen.getByPlaceholderText('selectCategory')
    await userEvent.type(searchInput, '{ArrowDown}{ArrowDown}{ArrowDown}')
    await userEvent.type(searchInput, '{ArrowUp}')

    await waitFor(() => {
      const transportItem = screen
        .getByText('Transport')
        .closest('div[role="button"]')
      expect(transportItem).toHaveClass('Mui-selected')
    })
  })

  test('show all categories button does not appear when searching', async () => {
    mount(<TagSelect2 onChange={vi.fn()} />)
    await popoverOpened()

    const searchInput = screen.getByPlaceholderText('selectCategory')
    await userEvent.type(searchInput, 'F')

    expect(screen.queryByText('showAllCategories')).not.toBeInTheDocument()
  })
})
