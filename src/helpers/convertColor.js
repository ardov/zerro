export const intToRGB = int => {
  let r = (int >> 16) & 0xff
  let g = (int >> 8) & 0xff
  let b = int & 0xff
  return `rgb(${r},${g},${b})`
}

export const RGBToInt = (r, g, b) => (r << 16) + (g << 8) + b
