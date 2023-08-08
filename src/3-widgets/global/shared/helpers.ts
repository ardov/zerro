import { MenuProps } from '@mui/material'

export function getMenuPosition(anchorPosition?: {
  left: number
  top: number
}): Partial<MenuProps> {
  return anchorPosition
    ? {
        anchorReference: 'anchorPosition',
        anchorPosition,
      }
    : {
        anchorReference: 'anchorPosition',
        anchorPosition: {
          // Center of the screen
          left: window.innerWidth / 2,
          top: window.innerHeight / 2,
        },
        transformOrigin: { horizontal: 'center', vertical: 'center' },
      }
}

export function getEventPosition(event: React.MouseEvent | React.TouchEvent) {
  if ('touches' in event) {
    const touch = event.touches[0]
    return { left: touch.clientX, top: touch.clientY }
  }
  return { left: event.clientX, top: event.clientY }
}
