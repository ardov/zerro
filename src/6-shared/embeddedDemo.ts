/** Fixed for this document's lifetime, including internal navigation. */
export const isEmbeddedDemo =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('demo') === 'embedded'
