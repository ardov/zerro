const YMID = 56072254

export default function sendEvent(event) {
  if (!event) return
  console.log('send', event)

  if (window.ym) {
    window.ym(YMID, 'reachGoal', event)
  }

  if (window.ga) {
    const eventArr = event.split(': ')
    window.ga(
      'send',
      'event',
      eventArr[0],
      eventArr[1] || '-',
      eventArr[2] || ''
    )
  }
}
