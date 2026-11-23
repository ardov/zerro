export function getEventAnchor(event: React.MouseEvent | React.TouchEvent) {
  const { clientX, clientY } = 'touches' in event ? event.touches[0] : event
  const rect = new DOMRect(clientX, clientY, 0, 0)
  return { getBoundingClientRect: () => rect }
}
