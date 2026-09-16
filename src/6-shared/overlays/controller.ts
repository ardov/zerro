/** Rendering needs only visibility and a normal change callback. */
export type SurfaceController = {
  open: boolean
  setOpen: (open: boolean) => void
}

/** The stable owner exposes lifecycle separately from its change callback. */
export type OverlayController = SurfaceController & {
  subscribeClose: (listener: () => void) => () => void
}

export type PopupController = OverlayController & {
  /** Technical removal, without a user-close notification. */
  release: () => void
}
