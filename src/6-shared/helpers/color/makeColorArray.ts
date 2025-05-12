import * as materialColors from '@mui/material/colors'
import { mainColors } from '../../ui/theme/createTheme'

type Shade = keyof (typeof materialColors)['red']
type ColorGroups = Exclude<keyof typeof materialColors, 'common'>
const allColors: ColorGroups[] = [
  'red',
  'pink',
  'purple',
  'deepPurple',
  'indigo',
  'blue',
  'lightBlue',
  'cyan',
  'teal',
  'green',
  'lightGreen',
  'lime',
  'yellow',
  'amber',
  'orange',
  'deepOrange',
  'brown',
  'grey',
  'blueGrey',
]

const allShades: Shade[] = [
  50,
  100,
  200,
  300,
  400,
  500,
  600,
  700,
  800,
  900,
  'A100',
  'A200',
  'A400',
  'A700',
]

type MakeColorArrayProps = {
  shades?: Shade[]
  colors?: ColorGroups[]
  byShades?: boolean
}
export function makeColorArray(props: MakeColorArrayProps = {}) {
  const doNotUse = new Set<string>(Object.values(mainColors))
  const { shades = allShades, colors = allColors, byShades } = props
  const colorArray: string[] = []
  if (byShades)
    shades.forEach(shade =>
      colors.forEach(color => {
        const hex = materialColors[color][shade]
        if (hex) colorArray.push(hex)
      })
    )
  else
    colors.forEach(color =>
      shades.forEach(shade => {
        const hex = materialColors[color][shade]
        if (hex) colorArray.push(hex)
      })
    )
  return colorArray.filter(x => !doNotUse.has(x))
}
