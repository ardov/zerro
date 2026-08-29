import type { Meta, StoryObj } from '@storybook/react-vite'
import { ActionList, ActionListItem } from './ActionList'
import { Divider } from './Divider'
import { ListRowIcon, ListRowSubheader, ListRowText } from './ListRow'
import { AddIcon } from './Icons'

const meta = { title: 'UI/Action list' } satisfies Meta

export default meta
type Story = StoryObj

/** The shapes `SettingsMenu` is built from: a plain row, a row with a trailing
 * control, and a row whose label wraps onto a second line. */
function Showcase() {
  return (
    <div className="w-[320px] bg-card">
      <ActionList aria-label="Actions">
        <ListRowSubheader>Section</ListRowSubheader>
        <ActionListItem>
          <ListRowIcon>
            <AddIcon />
          </ListRowIcon>
          <ListRowText>Plain row</ListRowText>
        </ActionListItem>
        <Divider className="opacity-60" />
        <ActionListItem>
          <ListRowIcon>
            <AddIcon />
          </ListRowIcon>
          <ListRowText
            className="whitespace-normal"
            secondary="A second line of explanation"
          >
            With description
          </ListRowText>
        </ActionListItem>
      </ActionList>
    </div>
  )
}

export const Default: Story = { render: () => <Showcase /> }

export const Dark: Story = { ...Default, globals: { theme: 'dark' } }
