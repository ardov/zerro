import type { Decorator, Preview } from '@storybook/react-vite'
import { INITIAL_VIEWPORTS } from 'storybook/viewport'
import {
  LibraryStoryProviders,
  StoryProviders,
  type AppStoryParameters,
} from './StoryProviders'
import './tailwind.css'
import './preview.css'

const viewports = {
  ...INITIAL_VIEWPORTS,
  zerro899: {
    name: 'Zerro 899px',
    styles: { width: '899px', height: '800px' },
    type: 'desktop',
  },
  zerro900: {
    name: 'Zerro 900px',
    styles: { width: '900px', height: '800px' },
    type: 'desktop',
  },
}

const withStoryProviders: Decorator = (Story, context) => {
  const props = { context: context as typeof context & AppStoryParameters }
  return context.parameters.app ? (
    <StoryProviders {...props}>
      <Story />
    </StoryProviders>
  ) : (
    <LibraryStoryProviders {...props}>
      <Story />
    </LibraryStoryProviders>
  )
}

const preview: Preview = {
  decorators: [withStoryProviders],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
    viewport: {
      options: viewports,
    },
    options: {
      storySort: {
        order: [
          'Library',
          {
            Input: [
              'Button',
              'IconButton',
              'Checkbox',
              'Switch',
              'InputBase',
              'OutlinedField',
              'AmountInput',
              'Select',
              'MultiSelect',
              'DatePicker',
              'Calendar',
              'MonthSelect',
            ],
            Overlays: [
              'Popover',
              'AdaptivePopover',
              'SideDrawer',
              'Dialog',
              'Menu',
              'Tooltip',
              'Confirm',
              'Snackbar',
            ],
            Display: [
              'Amount',
              'Total',
              'Chip',
              'TagIcon',
              'Link',
              'PercentBar',
              'RadialProgress',
              'CircularProgress',
              'ListRow',
              'ActionList',
              'Collapse',
            ],
          },
          'App',
          'Foundations',
        ],
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'Application color scheme',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', right: '☀️' },
          { value: 'dark', title: 'Dark', right: '🌙' },
        ],
      },
    },
    locale: {
      description: 'Application locale',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'en', title: 'English', right: 'EN' },
          { value: 'ru', title: 'Русский', right: 'RU' },
        ],
      },
    },
  },
  initialGlobals: {
    theme: 'light',
    locale: 'en',
  },
}

export default preview
