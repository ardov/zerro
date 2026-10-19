import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      // Custom font sizes must not be merged as text colors.
      text: [
        'body',
        'body-sm',
        'caption',
        'overline',
        'title',
        'title-lg',
        'display',
        (value: string) => /^ui-\d+$/.test(value),
      ],
      radius: ['ui-card', 'ui-control', 'ui-control-inner', 'ui-popover'],
      shadow: ['ui-card', 'ui-popover'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
