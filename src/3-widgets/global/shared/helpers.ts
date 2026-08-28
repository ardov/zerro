export function getEventPosition(event: React.MouseEvent | React.TouchEvent) {
  if ('touches' in event) {
    const touch = event.touches[0]
    return { left: touch.clientX, top: touch.clientY }
  }
  return { left: event.clientX, top: event.clientY }
}
