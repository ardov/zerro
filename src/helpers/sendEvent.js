import ReactGA from 'react-ga'

const YMID = 56072254

export default function sendEvent(event) {
  const { ym } = window

  if (!event) return
  console.log('send', event)

  if (ym) ym(YMID, 'reachGoal', event)

  const eventArr = event.split(': ')
  ReactGA.event({
    category: eventArr[0],
    action: eventArr[1] || '-',
    label: eventArr[2] || '',
  })
}
