export const zmColors = [
  '#CC3077',
  '#FB8D01',
  '#43A047',
  '#29B6F6',
  '#1564C0',
  '#9C26B0',
]

/**
 * The picker's swatches are written out as stable color values.
 *
 * One row per accent shade across six hues, and the two halves run their
 * shades in opposite directions — the warm hues darkest first, the cool ones
 * lightest first — which is the order the grid was built in.
 *
 * The last row is a hue short: grey A100 is `#f5f5f5`, the light theme's page
 * background, and a swatch of it is invisible.
 */
const swatchRows = [
  // lightGreen, yellow, orange, red, pink, brown — A700, A400, A100
  ['#64dd17', '#ffd600', '#ff6d00', '#d50000', '#c51162', '#5d4037'],
  ['#76ff03', '#ffea00', '#ff9100', '#ff1744', '#f50057', '#8d6e63'],
  ['#ccff90', '#ffff8d', '#ffd180', '#ff8a80', '#ff80ab', '#d7ccc8'],

  // teal, lightBlue, indigo, purple, blueGrey, grey — A100, A400, A700
  ['#a7ffeb', '#80d8ff', '#8c9eff', '#ea80fc', '#cfd8dc'],
  ['#1de9b6', '#00b0ff', '#3d5afe', '#d500f9', '#78909c', '#bdbdbd'],
  ['#00bfa5', '#0091ea', '#304ffe', '#aa00ff', '#455a64', '#616161'],
]

export const colors = swatchRows.flat()
