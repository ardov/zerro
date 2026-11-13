import { cn } from '@/6-shared/ui/shadcn/utils'
import { ButtonBase, type ButtonBaseProps } from './ButtonBase'
import { TextSwap } from './TextSwap'

export type InlineButtonProps = Omit<
  ButtonBaseProps,
  'children' | 'aria-label'
> & {
  /** The words shown, which are also the button's name. They swap in place
   * when the value changes. */
  value: string
}

/** Words inside a sentence that change what the sentence says: pressing them
 * moves on to the next value. */
export function InlineButton(props: InlineButtonProps) {
  const { value, className, ...restProps } = props
  return (
    <ButtonBase
      {...restProps}
      aria-label={value}
      className={cn(
        // Sits on the text line and takes its type
        'inline align-baseline text-[length:inherit] leading-[inherit] [text-align:inherit]',
        // Room for hover and focus that does not push the words apart
        '-mx-2 rounded-lg px-2 text-info',
        className
      )}
    >
      {/* Bottom-aligned: a clipped inline box has no text baseline of its own. */}
      <TextSwap value={value} className="inline-block align-bottom" />
    </ButtonBase>
  )
}
