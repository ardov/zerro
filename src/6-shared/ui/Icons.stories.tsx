import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import * as Icons from './Icons'
import type { TIconProps } from './Icons'

const meta = {
  title: 'Foundations/Icons',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const entries = Object.entries(Icons).filter(([name]) =>
  name.endsWith('Icon')
) as [string, (props: TIconProps) => ReactNode][]

export const Showcase: Story = {
  tags: ['!test'],
  render: () => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
      {entries.map(([name, Icon]) => (
        <div
          key={name}
          className="flex flex-col items-center gap-2 rounded-lg py-3"
        >
          <div className="flex items-end gap-3">
            <Icon size={16} />
            <Icon />
            <Icon size={24} />
          </div>
          <span className="text-caption text-ui-secondary">
            {name.replace(/Icon$/, '')}
          </span>
        </div>
      ))}
    </div>
  ),
}

export const StrokeWeights: Story = {
  tags: ['!test'],
  render: () => (
    <div className="flex flex-col gap-4">
      {[1, 1.5, 2, 2.5].map(strokeWidth => (
        <div key={strokeWidth} className="flex items-center gap-4">
          <span className="w-10 text-caption text-ui-secondary">
            {strokeWidth}
          </span>
          {(
            [
              Icons.SyncIcon,
              Icons.AddIcon,
              Icons.DeleteIcon,
              Icons.AccountIcon,
              Icons.CalendarIcon,
              Icons.SettingsIcon,
            ] as const
          ).map((Icon, index) => (
            <Icon key={index} strokeWidth={strokeWidth} />
          ))}
        </div>
      ))}
    </div>
  ),
}
