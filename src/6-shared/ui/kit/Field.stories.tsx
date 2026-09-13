import { useRef, useState } from 'react'
import { expect, userEvent, waitFor } from 'storybook/test'
import { SearchIcon } from 'lucide-react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { CalendarIcon, CloseIcon } from '@/6-shared/ui/Icons'
import { Button } from './Button'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { FieldSurface, FieldAddon, fieldControlClass } from './Field'
import { Input } from './Input'
import { Textarea } from './Textarea'

const meta = {
  title: 'UI Kit/Field',
  component: Input,
  parameters: { layout: 'fullscreen' },
  args: { label: 'Название', labelMode: 'floating' },
  decorators: [
    Story => (
      <main className="min-h-screen bg-ui-base p-6 font-sans text-ui-16 text-ui-primary">
        <div className="mx-auto max-w-3xl rounded-ui-card bg-ui-card p-6 shadow-ui-card">
          <Story />
        </div>
      </main>
    ),
  ],
} satisfies Meta<typeof Input>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

function SearchExample() {
  const [value, setValue] = useState('Продукты')
  return (
    <Input
      label="Поиск"
      placeholder="Поиск"
      value={value}
      onChange={event => setValue(event.target.value)}
      start={
        <FieldAddon kind="icon">
          <SearchIcon size={20} />
        </FieldAddon>
      }
      end={
        <FieldAddon kind="action">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Очистить поиск"
            onClick={() => setValue('')}
          >
            <CloseIcon />
          </Button>
        </FieldAddon>
      }
    />
  )
}

function DateTimeExample() {
  const dateRef = useRef<HTMLInputElement>(null)
  return (
    <FieldSurface
      start={
        <FieldAddon kind="action">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Открыть календарь"
            onClick={() => {
              dateRef.current?.focus()
              dateRef.current?.showPicker?.()
            }}
          >
            <CalendarIcon />
          </Button>
        </FieldAddon>
      }
    >
      <input
        ref={dateRef}
        type="date"
        aria-label="Дата"
        defaultValue="2026-09-12"
        className={cn(
          fieldControlClass,
          'flex-1 [&::-webkit-calendar-picker-indicator]:hidden'
        )}
      />
      <input
        type="time"
        aria-label="Время"
        defaultValue="18:56"
        className={cn(
          fieldControlClass,
          'w-24 shrink-0 text-ui-secondary [&::-webkit-calendar-picker-indicator]:hidden'
        )}
      />
    </FieldSurface>
  )
}

export const Showcase: Story = {
  render: () => (
    <div className="grid gap-8">
      <section className="grid gap-4">
        <h2 className="m-0 text-ui-16 font-medium">Геометрия · 48 px</h2>
        <Input label="Без иконки" placeholder="Комментарий" />
        <Input
          label="С иконкой"
          placeholder="Комментарий"
          start={
            <FieldAddon kind="icon">
              <SearchIcon size={20} />
            </FieldAddon>
          }
        />
        <Input
          label="С кнопкой-иконкой"
          placeholder="Комментарий"
          start={
            <FieldAddon kind="action">
              <Button variant="ghost" size="icon-sm" aria-label="Поиск">
                <SearchIcon />
              </Button>
            </FieldAddon>
          }
        />
        <Input
          label="С текстовым аддоном"
          placeholder="Комментарий"
          end={<FieldAddon>Addon</FieldAddon>}
        />
        <Input
          label="С текстовой кнопкой"
          placeholder="Комментарий"
          end={
            <FieldAddon kind="action">
              <Button variant="ghost" size="sm">
                Text Button
              </Button>
            </FieldAddon>
          }
        />
      </section>
      <section className="grid gap-4">
        <h2 className="m-0 text-ui-20 font-medium">Поля</h2>
        <p className="m-0 text-ui-14 text-ui-secondary">
          Живые поля: ввод, Tab, кнопка очистки и нативный календарь.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Комментарий" placeholder="Комментарий" />
          <Input
            label="Поиск по операциям"
            placeholder="Поиск по операциям"
            start={
              <FieldAddon kind="icon">
                <SearchIcon size={20} />
              </FieldAddon>
            }
          />
          <SearchExample />
          <DateTimeExample />
        </div>
      </section>
      <section className="grid gap-4">
        <h2 className="m-0 text-ui-16 font-medium">Label внутри</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Название конверта" labelMode="floating" />
          <Input
            label="Название конверта"
            labelMode="floating"
            defaultValue="Продукты"
          />
          <Input
            label="Поиск"
            labelMode="floating"
            start={
              <FieldAddon kind="icon">
                <SearchIcon size={20} />
              </FieldAddon>
            }
          />
          <Input
            label="Поиск"
            labelMode="floating"
            start={
              <FieldAddon kind="icon">
                <SearchIcon size={20} />
              </FieldAddon>
            }
            defaultValue="Кофе"
          />
        </div>
      </section>
      <section className="grid gap-4">
        <h2 className="m-0 text-ui-16 font-medium">Состояния</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Обязательное поле"
            placeholder="Название"
            error="Это поле обязательное"
          />
          <Input
            label="Название"
            labelMode="floating"
            defaultValue="Продукты"
            error="Такое название уже есть"
          />
          <Input
            label="Только чтение"
            labelMode="floating"
            defaultValue="Можно выделить и скопировать"
            readOnly
          />
          <Input
            label="Недоступное поле"
            labelMode="floating"
            defaultValue="Недоступно"
            disabled
          />
        </div>
      </section>
      <section className="grid gap-4">
        <h2 className="m-0 text-ui-16 font-medium">Несколько строк</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Textarea label="Комментарий" placeholder="Комментарий" />
          <Textarea
            label="Комментарий"
            labelMode="floating"
            defaultValue={'Покупки на неделю\nОвощи, фрукты и кофе'}
            description="Label остаётся сверху при изменении высоты."
          />
        </div>
      </section>
    </div>
  ),
}

function FloatingLabelExample() {
  const [value, setValue] = useState('')
  return (
    <>
      <Input
        label="Floating label"
        labelMode="floating"
        value={value}
        onChange={event => setValue(event.target.value)}
      />
      <Button onClick={() => setValue('Updated')}>Set value</Button>
      <Button onClick={() => setValue('')}>Clear value</Button>
    </>
  )
}

export const FloatingLabelInteraction: Story = {
  render: () => <FloatingLabelExample />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Floating label' })
    const label = canvas.getByText('Floating label', { selector: 'label' })
    const raised = () =>
      label.getBoundingClientRect().bottom <= input.getBoundingClientRect().top
    await expect(input).not.toHaveAttribute('placeholder')
    await waitFor(() => expect(raised()).toBe(false))
    await userEvent.click(input)
    await waitFor(() => expect(raised()).toBe(true))
    await userEvent.type(input, 'Typed')
    await userEvent.tab()
    await waitFor(() => expect(raised()).toBe(true))
    await userEvent.click(canvas.getByRole('button', { name: 'Clear value' }))
    await waitFor(() => expect(raised()).toBe(false))
    await userEvent.click(canvas.getByRole('button', { name: 'Set value' }))
    await expect(input).toHaveValue('Updated')
    await waitFor(() => expect(raised()).toBe(true))
  },
}

export const GrowingTextarea: Story = {
  render: () => (
    <div className="grid gap-4">
      <Input label="Single line" />
      <Textarea label="Growing" maxRows={3} />
      <Textarea label="Two lines minimum" minRows={2} />
    </div>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Single line' })
    const textarea = canvas.getByRole('textbox', { name: 'Growing' })
    const minimum = canvas.getByRole('textbox', { name: 'Two lines minimum' })
    const height = (element: HTMLElement) =>
      element.getBoundingClientRect().height
    const initial = height(textarea)
    await expect(initial).toBe(height(input))
    await expect(height(minimum)).toBeCloseTo(initial * 2, 0)
    await userEvent.type(textarea, 'First{Enter}Second')
    await waitFor(() => expect(height(textarea)).toBeGreaterThan(initial))
    await userEvent.type(textarea, '{Enter}Third{Enter}Fourth{Enter}Fifth')
    await waitFor(() => {
      expect(height(textarea)).toBeCloseTo(initial * 3, 0)
      expect(textarea.scrollHeight).toBeGreaterThan(textarea.clientHeight)
    })
    await userEvent.clear(textarea)
    await waitFor(() => expect(height(textarea)).toBe(initial))
  },
}
