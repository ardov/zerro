import { useId, type ComponentType } from 'react'
import type { TIconProps } from '@/6-shared/ui/lucide/createIcon'
import { ButtonBase, type ButtonBaseProps } from '@/6-shared/ui/kit/ButtonBase'
import { Tooltip, type TooltipProps } from '@/6-shared/ui/kit/Tooltip'
import { cn } from '@/6-shared/ui/shadcn/utils'
import '@/6-shared/ui/kit/Press.css'
import '@/6-shared/ui/kit/Button.css'
import './NavigationAction.css'

export type NavigationActionProps = Omit<ButtonBaseProps, 'children'> & {
  label: string
  icon: ComponentType<TIconProps>
  tooltipSide?: TooltipProps['side']
  /** Something that needs attention behind this action: shown as a dot on
   * the tile, in the tooltip and to screen readers. */
  notice?: string
}

/** The hit area stretches with the navigation; only the inner tile moves. */
export function NavigationAction({
  label,
  icon: Icon,
  tooltipSide,
  notice,
  className,
  ...props
}: NavigationActionProps) {
  const selected = props['aria-current'] === 'page'
  const noticeId = useId()
  return (
    <Tooltip
      content={
        notice ? (
          <>
            {label}
            <br />
            {notice}
          </>
        ) : (
          label
        )
      }
      side={tooltipSide}
      disabled={!tooltipSide}
    >
      <ButtonBase
        {...props}
        aria-label={label}
        aria-describedby={notice ? noticeId : undefined}
        className={cn(
          'navigation-action kit-press-trigger pb-[var(--navigation-action-bottom-inset,0px)] outline-none',
          className
        )}
      >
        <span className="navigation-action-tile kit-press kit-button-icon kit-button-ghost rounded-ui-control">
          <Icon size={24} strokeWidth={selected ? 2 : 1.5} />
          {notice && <span aria-hidden className="navigation-action-notice" />}
        </span>
        {notice && (
          <span id={noticeId} hidden>
            {notice}
          </span>
        )}
      </ButtonBase>
    </Tooltip>
  )
}
