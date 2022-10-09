import React from 'react'
// import { DemoProviders } from '../src/stories/shared/DemoProviders'

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}

// export const decorators = [
//   Story => (
//     <DemoProviders>
//       <Story />
//     </DemoProviders>
//   ),
// ]
