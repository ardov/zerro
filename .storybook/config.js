import { configure } from '@storybook/react'
import '../src/index.scss'

// automatically import all files ending in *.stories.js
configure(require.context('../src', true, /\.stories\.js$/), module)

// import { configure } from '@storybook/react'

// const req = require.context('../src', true, /\.stories.js$/)

// function loadStories() {
//   req.keys().forEach(filename => req(filename))
// }

// configure(loadStories, module)
