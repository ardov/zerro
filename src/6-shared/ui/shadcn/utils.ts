import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      // Parse 'ui-14' as a text size
      text: [(value: string) => /^ui-\d+$/.test(value)],
      radius: ['ui-card', 'ui-control', 'ui-control-inner', 'ui-popover'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
