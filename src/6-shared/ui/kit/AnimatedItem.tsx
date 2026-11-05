import type { ComponentPropsWithRef } from 'react'
import { motion, useIsPresent, useReducedMotion } from 'motion/react'
import { cn } from '../shadcn/utils'

/** A stable list item: exit ghosts are immediately inert, while neighbours reflow. */
export function AnimatedItem({
  children,
  className,
  ref,
  ...props
}: Pick<ComponentPropsWithRef<'div'>, 'children' | 'className' | 'ref'>) {
  const present = useIsPresent()
  const reduce = useReducedMotion()
  return (
    <motion.div
      {...props}
      ref={ref}
      layout={reduce ? false : 'position'}
      inert={!present}
      aria-hidden={!present || undefined}
      initial={{ opacity: 0, scale: reduce ? 1 : 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{
        opacity: 0,
        scale: reduce ? 1 : 0.95,
        transition: { duration: 0.12 },
      }}
      transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
      className={cn(
        'relative flex min-w-0 max-w-full items-center gap-1.5',
        className
      )}
    >
      {children}
    </motion.div>
  )
}
