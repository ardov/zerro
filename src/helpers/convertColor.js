export function unsignedToRGB(color) {
  let r = (color >> 16) & 0xff
  let g = (color >> 8) & 0xff
  let b = color & 0xff
  return `rgb(${r},${g},${b})`
}
