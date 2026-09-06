import type { ComponentPropsWithRef, MouseEvent, ReactNode } from 'react'
import { useId } from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'
import { GrowingTextarea, inputPlaceholderClass } from './GrowingTextarea'
import { PressBacking } from './PressBacking'
import { cn } from './shadcn/utils'
import './FilledField.css'

/** A field drawn as a filled row rather than a notched outline.
 *
 * The two field families answer different questions. `OutlinedField` labels
 * itself, so a form of them reads as a list of named values. A filled field
 * says what it is with a 20px icon and a placeholder, which is what a compact
 * editing surface wants: the rows stack into one block, and nothing is
 * written twice — the icon is the label.
 *
 * Every part of the recipe is exported because the family has more shapes
 * than components: a row can hold an input, a button that opens a selector,
 * or two controls sharing one frame. What they have in common is the frame,
 * so that is what is shared. Its states live in `FilledField.css`.
 */

/** The frame: a 48px row with the icon gap already in it.
 *
 * The horizontal padding is 1.5px short of 12px because the border makes up
 * the difference — content sits 12px from the outer edge in every state, and
 * the 12px radius is what the rest of the geometry is concentric with. */
export const filledFieldClass =
  'filled-field relative flex min-h-12 w-full items-center gap-2 rounded-xl px-[10.5px] text-base text-foreground'

/** A frame that is itself the control. Preflight is off, so the native button
 * decoration is spelled away here. */
const filledFieldButtonClass =
  'group isolate cursor-pointer appearance-none text-left outline-none disabled:cursor-default disabled:text-disabled-foreground'

/** What goes inside the frame: the frame owns the padding, so the control
 * carries none of its own. */
export const filledControlClass = cn(
  'm-0 min-w-0 flex-auto border-0 bg-transparent p-0 font-[family-name:inherit] text-[length:inherit] leading-[inherit] text-current outline-none disabled:text-disabled-foreground',
  inputPlaceholderClass
)

/** An icon that does something, at the end of a field. 32px square, and a 4px
 * radius: it sits 8px inside a 12px corner, and 12 − 8 is what keeps the two
 * curves concentric. The negative margin is that 8px — the frame's own
 * padding is 12. */
export const filledFieldActionClass =
  'inline-flex size-8 shrink-0 cursor-pointer appearance-none items-center justify-center rounded-[4px] border-0 bg-transparent p-0 text-icon-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:text-disabled-control-foreground -mx-1'

/** State the frame reads, whatever is inside it. */
export type FilledFieldState = {
  /** Marked wrong. The form decides when — nothing is invalid until it has
   * been asked to be saved. */
  invalid?: boolean
  /** Shown, not editable. It still takes focus and its text still selects. */
  readOnly?: boolean
  /** Not editable and not reachable. */
  disabled?: boolean
  /** What is wrong, under the field. */
  error?: ReactNode
}

function stateProps(state: FilledFieldState) {
  return {
    'data-invalid': state.invalid || undefined,
    'data-disabled': state.disabled || undefined,
    'data-hatched': state.readOnly || state.disabled || undefined,
  }
}

/** Clicking the row puts the caret in it.
 *
 * The whole 48px is the target, not just the text: a field is a place to type
 * in, and the icon and the padding around it are part of the same place.
 * Anything that does something of its own — a button, a link, the control
 * itself — is left alone. */
export function focusFieldControl(event: MouseEvent<HTMLElement>) {
  const target = event.target as HTMLElement
  if (target.closest('button, a, input, textarea, select, [role="button"]')) {
    return
  }
  const control =
    event.currentTarget.querySelector<HTMLElement>('input, textarea')
  if (!control) return
  // Without this the mousedown lands on the frame and takes the focus off
  // the control the line above just gave it to.
  event.preventDefault()
  control.focus()
}

/** The zigzag beside a field that is wrong.
 *
 * A torn edge rather than a coloured bar: at a glance it is not another
 * border, and it survives beside the red border it shares the field with. It
 * hangs off the left edge and is drawn over everything, so marking a field
 * moves nothing inside it. */
function InvalidMark() {
  const id = useId()
  return (
    <svg
      aria-hidden
      // An SVG is a replaced element: `top` and `bottom` together would leave
      // it at its intrinsic 150px rather than stretching, so the height is
      // spelled out.
      className="pointer-events-none absolute top-2 left-0 h-[calc(100%-1rem)] w-[6px] translate-x-0.5 text-error"
      preserveAspectRatio="none"
    >
      <defs>
        {/* One tile of the zigzag: 3px out and 3px down, then back. */}
        <pattern
          id={id}
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
        >
          <path
            d="M4.5 -3 L1.5 0 L4.5 3 L1.5 6 L4.5 9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </pattern>
      </defs>
      <rect width="6" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

/** The message under a field, and the room it takes. */
function FieldError({ children }: { children: ReactNode }) {
  if (!children) return null
  return <p className="m-0 px-3 pt-1 type-caption text-error">{children}</p>
}

export type FilledFieldProps = ComponentPropsWithRef<'div'> &
  FilledFieldState & {
    icon?: ReactNode
    /** Sits at the far end of the row — a time, a currency, a button. */
    trailing?: ReactNode
  }

/** The frame with arbitrary content, for a row that holds more than one
 * control. */
export function FilledField({
  icon,
  trailing,
  invalid,
  readOnly,
  disabled,
  error,
  className,
  children,
  ...props
}: FilledFieldProps) {
  const state = { invalid, readOnly, disabled, error }
  return (
    <div>
      <div
        data-slot="filled-field"
        className={cn(filledFieldClass, className)}
        onMouseDown={disabled ? undefined : focusFieldControl}
        {...stateProps(state)}
        {...props}
      >
        {icon && <FilledFieldIcon>{icon}</FilledFieldIcon>}
        {children}
        {trailing}
        {invalid && <InvalidMark />}
      </div>
      <FieldError>{error}</FieldError>
    </div>
  )
}

export type FilledInputProps = Omit<
  ComponentPropsWithRef<'input'>,
  'size' | 'children'
> &
  FilledFieldState & {
    icon?: ReactNode
    trailing?: ReactNode
    /** Grow with the text instead of scrolling it sideways. */
    multiline?: boolean
    maxRows?: number
    /** Sizes the frame; the input inside always fills it. */
    className?: string
  }

/** The common case: one icon, one input, one placeholder. */
export function FilledInput({
  icon,
  trailing,
  multiline,
  maxRows,
  invalid,
  readOnly,
  disabled,
  error,
  className,
  ...props
}: FilledInputProps) {
  const state = { invalid, readOnly, disabled, error }
  return (
    <div>
      <div
        data-slot="filled-field"
        className={cn(filledFieldClass, multiline && 'items-start', className)}
        onMouseDown={disabled ? undefined : focusFieldControl}
        {...stateProps(state)}
      >
        {icon && <FilledFieldIcon top={multiline}>{icon}</FilledFieldIcon>}
        {multiline ? (
          <GrowingTextarea
            {...props}
            readOnly={readOnly}
            disabled={disabled}
            maxRows={maxRows}
            className={cn(filledControlClass, 'py-3')}
          />
        ) : (
          <InputPrimitive
            {...props}
            readOnly={readOnly}
            disabled={disabled}
            className={filledControlClass}
          />
        )}
        {trailing}
        {invalid && <InvalidMark />}
      </div>
      <FieldError>{error}</FieldError>
    </div>
  )
}

export type FilledButtonProps = Omit<ComponentPropsWithRef<'button'>, 'type'> &
  FilledFieldState & {
    icon?: ReactNode
    trailing?: ReactNode
  }

/** The frame as a button, for a row that opens a selector. */
export function FilledButton({
  icon,
  trailing,
  invalid,
  readOnly,
  disabled,
  error,
  className,
  children,
  ...props
}: FilledButtonProps) {
  const state = { invalid, readOnly, disabled, error }
  return (
    <div>
      <button
        type="button"
        data-slot="filled-field"
        disabled={disabled}
        className={cn(filledFieldClass, filledFieldButtonClass, className)}
        {...stateProps(state)}
        {...props}
      >
        <PressBacking />
        {icon && <FilledFieldIcon>{icon}</FilledFieldIcon>}
        <span className="min-w-0 flex-auto truncate">{children}</span>
        {trailing}
        {invalid && <InvalidMark />}
      </button>
      <FieldError>{error}</FieldError>
    </div>
  )
}

/** The icon slot. Muted, and not a tab stop. Exported for a row whose control
 * is a third-party primitive and so cannot go through `FilledInput`.
 *
 * `top` is the multiline row: the frame stops centring once the text can be
 * several lines, and the icon lines up with the first of them instead. */
export function FilledFieldIcon({
  top,
  children,
}: {
  top?: boolean
  children: ReactNode
}) {
  return (
    <span
      data-slot="filled-field-icon"
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center text-muted-foreground',
        top && 'py-3'
      )}
    >
      {children}
    </span>
  )
}
