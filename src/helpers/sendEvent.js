import reactGA from 'react-ga'

const YMID = 56072254

export default function sendEvent(event) {
  const { ym } = window

  if (event && process.env.NODE_ENV === 'production') {
    if (ym) ym(YMID, 'reachGoal', event)

    const eventArr = event.split(': ')
    reactGA.event({
      category: eventArr[0],
      action: eventArr[1] || '-',
      label: eventArr[2] || '',
    })
  } else {
    console.log('📫', event)
  }
}
