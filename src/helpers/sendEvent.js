const YMID = 56072254
const GAID = 'UA-72832368-2'

export default function sendEvent(event) {
  const { ga, ym } = window

  if (!event) return
  console.log('send', event)

  if (ym) ym(YMID, 'reachGoal', event)

  if (ga) {
    ga(tracker => {
      if (!tracker) window.ga('create', GAID, 'auto')
    })

    const eventArr = event.split(': ')
    ga('send', 'event', eventArr[0], eventArr[1] || '-', eventArr[2] || '')
  }
}
