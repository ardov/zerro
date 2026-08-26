import type { Decorator, Preview } from '@storybook/react-vite'
import { INITIAL_VIEWPORTS } from 'storybook/viewport'
import { StoryProviders } from './StoryProviders'
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

const withAppProviders: Decorator = (Story, context) => (
  <StoryProviders context={context}>
    <Story />
  </StoryProviders>
)

const preview: Preview = {
  decorators: [withAppProviders],
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
  tags: ['autodocs'],
}

export default preview
