import * as materialColors from '@material-ui/core/colors'

export const colors = makeColors()
export const zmColors = [
  '#CC3077',
  '#FB8D01',
  '#43A047',
  '#29B6F6',
  '#1564C0',
  '#9C26B0',
]

type Shade = keyof typeof materialColors['red']
function makeColors() {
  const colorArray: string[] = []
  const shades: Shade[] = [
    // '50',
    // '100',
    // '200',
    // '300',
    // '400',
    // '500',
    // '600',
    // '700',
    // '800',
    // '900',
    'A100',
    // 'A200',
    'A400',
    'A700',
  ]
  const colors = [
    materialColors.red,
    // materialColors.pink,
    materialColors.purple,
    // materialColors.deepPurple,
    materialColors.indigo,
    // materialColors.blue,
    materialColors.lightBlue,
    // materialColors.cyan,
    materialColors.teal,
    // materialColors.green,
    materialColors.lightGreen,
    // materialColors.lime,
    materialColors.yellow,
    // materialColors.amber,
    materialColors.orange,
    // materialColors.deepOrange,
    materialColors.brown,
    materialColors.grey,
    materialColors.blueGrey,
  ]
  colors.forEach(color =>
    shades.forEach(shade => {
      if (color[shade]) {
        colorArray.push(color[shade])
      }
    })
  )
  return colorArray
}
