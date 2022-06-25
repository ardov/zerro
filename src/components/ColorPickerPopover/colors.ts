import { makeColorArray } from 'shared/helpers/color/makeColorArray'

export const zmColors = [
  '#CC3077',
  '#FB8D01',
  '#43A047',
  '#29B6F6',
  '#1564C0',
  '#9C26B0',
]

export const colors = makeColorArray({
  shades: [
    // 900,
    'A700',
    'A400',
    'A100',
  ],
  colors: ['lightGreen', 'yellow', 'orange', 'red', 'pink', 'brown'],
  byShades: true,
}).concat(
  makeColorArray({
    shades: [
      'A100',
      'A400',
      'A700',
      // 900,
    ],
    colors: ['teal', 'lightBlue', 'indigo', 'purple', 'blueGrey', 'grey'],
    byShades: true,
  })
)
