const YMID = 56072254

export default function sendEvent(event) {
  if (window.ym) {
    window.ym(YMID, 'reachGoal', event)
    console.log('send ', event)
  }
}
