import * as colors from '@material-ui/core/colors'

const colorArray = []
const shades = ['A100', 100, 200, 300, 400, 500, 600, 700, 800, 900]
for (const color in colors) {
  shades.forEach(shade => {
    if (colors[color][shade]) colorArray.push(colors[color][shade])
  })
}

function hashCode(str) {
  return str
    .toString()
    .split('')
    .reduce(
      (prevHash, currVal) =>
        ((prevHash << 5) - prevHash + currVal.charCodeAt(0)) | 0,
      0
    )
}

const getIntFromSeed = seed => (seed * 9301 + 49297) % 233280

export const getColorForString = str => {
  const seed = hashCode(str)
  let int = getIntFromSeed(seed)
  if (int < 0) int = -int
  const idx = int % colorArray.length
  return colorArray[idx]
}

export const intToRGB = int => {
  let r = (int >> 16) & 0xff
  let g = (int >> 8) & 0xff
  let b = int & 0xff
  return `rgb(${r},${g},${b})`
}

export const intToHEX = int => {
  let r = ((int >> 16) & 0xff).toString(16).padStart(2, '0')
  let g = ((int >> 8) & 0xff).toString(16).padStart(2, '0')
  let b = (int & 0xff).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}

export const HEXToInt = hex => {
  if (hex?.length !== 7) return null
  let r = parseInt(hex.slice(1, 3), 16)
  let g = parseInt(hex.slice(3, 5), 16)
  let b = parseInt(hex.slice(5, 7), 16)
  return RGBToInt(r, g, b)
}

export const RGBToInt = (r, g, b) => (r << 16) + (g << 8) + b

export const getOpacity = opacity => Math.floor(opacity * 256).toString(16)
