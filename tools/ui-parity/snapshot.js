// Browser-side capture for the UI parity harness.
//
// Paste the `capture` body into a page's console (or an automation tool's
// evaluate call) to record everything the page paints as text or as a filled
// box, keyed by where it lands on the page rather than by DOM structure. The
// DOM changes shape during the MUI to Tailwind migration; the painted result
// is what has to stay the same.
//
// Set `window.__uiParityName` first and the capture posts itself to the sink,
// which writes it to disk; otherwise it stores the snapshot on
// `window.__uiParity` and `chunk(i)` reads it back in pieces small enough to
// survive an evaluate call's output limit. See README.md for the procedure.

/** Computed properties recorded for the element that owns each text node. */
export const TEXT_PROPERTIES = [
  'fontSize',
  'lineHeight',
  'fontWeight',
  'fontFamily',
  'fontStyle',
  'letterSpacing',
  'textTransform',
  'textDecorationLine',
  'color',
  'textAlign',
  'whiteSpace',
]

export const CHUNK_SIZE = 30000

export const SINK_PORT = 3002

/** Source of the capture step, ready to paste into an evaluate call. */
export const captureSource = `(() => {
  window.__uiParityCapture = name => {
  const S = ${JSON.stringify(TEXT_PROPERTIES)}
  const box = r => [
    Math.round(r.x + scrollX),
    Math.round(r.y + scrollY),
    Math.round(r.width),
    Math.round(r.height),
  ]

  // Most runs on a page share a handful of style tuples, so they are interned
  // and referenced by index. Without this a snapshot is large enough that
  // moving it out of the page becomes the slow part of the comparison.
  const styles = []
  const styleIndex = new Map()
  const intern = values => {
    const key = values.join('\\u0000')
    let index = styleIndex.get(key)
    if (index === undefined) {
      index = styles.length
      styles.push(values)
      styleIndex.set(key, index)
    }
    return index
  }

  const runs = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue.replace(/\\s+/g, ' ').trim()
    if (!text) continue
    const parent = node.parentElement
    if (!parent || parent.closest('script, style')) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    const rect = range.getBoundingClientRect()
    if (!rect.width && !rect.height) continue
    const style = getComputedStyle(parent)
    runs.push([text, box(rect), intern(S.map(name => style[name]))])
  }

  const paints = []
  const paintIndex = new Map()
  const internPaint = values => {
    const key = values.join('\\u0000')
    let index = paintIndex.get(key)
    if (index === undefined) {
      index = paints.length
      paints.push(values)
      paintIndex.set(key, index)
    }
    return index
  }

  const boxes = []
  for (const el of document.body.querySelectorAll('*')) {
    const style = getComputedStyle(el)
    const painted =
      (style.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
        style.backgroundColor !== 'transparent') ||
      style.boxShadow !== 'none' ||
      parseFloat(style.borderTopWidth) > 0 ||
      parseFloat(style.borderRightWidth) > 0 ||
      parseFloat(style.borderBottomWidth) > 0 ||
      parseFloat(style.borderLeftWidth) > 0
    if (!painted) continue
    const rect = el.getBoundingClientRect()
    if (!rect.width || !rect.height) continue
    boxes.push([
      box(rect),
      internPaint([
        style.backgroundColor,
        style.borderRadius,
        style.boxShadow,
        // A zero-width border paints nothing, so its declared style and colour
        // are noise: 'none' and 'solid' look the same at 0px.
        ['Top', 'Right', 'Bottom', 'Left']
          .map(side =>
            parseFloat(style['border' + side + 'Width']) > 0
              ? [
                  style['border' + side + 'Width'],
                  style['border' + side + 'Style'],
                  style['border' + side + 'Color'],
                ].join(' ')
              : '-'
          )
          .join(' | '),
      ]),
    ])
  }

  window.__uiParity = JSON.stringify({
    route: location.pathname,
    viewport: [innerWidth, innerHeight],
    styles,
    paints,
    runs,
    boxes,
  })
  if (!name) {
    return JSON.stringify({
      runs: runs.length,
      boxes: boxes.length,
      length: window.__uiParity.length,
      chunks: Math.ceil(window.__uiParity.length / ${CHUNK_SIZE}),
    })
  }
  return fetch('http://localhost:${SINK_PORT}/' + name, {
    method: 'POST',
    body: window.__uiParity,
  }).then(
    response => \`\${name}: \${runs.length} runs, \${boxes.length} boxes, sink \${response.status}\`,
    error => \`sink unreachable: \${error.message}\`
  )
  }
  return 'installed'
})()`

/** Source of one read-back step, ready to paste into an evaluate call. */
export function chunkSource(index) {
  return `window.__uiParity.slice(${index * CHUNK_SIZE}, ${(index + 1) * CHUNK_SIZE})`
}

// Printing the sources keeps the copy that runs in the page identical to the
// copy this repository reviews.
if (process.argv[1] && process.argv[1].endsWith('snapshot.js')) {
  const [step, index] = process.argv.slice(2)
  if (step === 'chunk') console.log(chunkSource(Number(index) || 0))
  else console.log(captureSource)
}
