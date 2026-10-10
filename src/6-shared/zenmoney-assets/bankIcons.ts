const bankModules = import.meta.glob<string>('./banks/ic_bank_*_54px.svg', {
  eager: true,
  import: 'default',
  // Keep the catalog as URLs instead of inlining every bank's SVG in app JS.
  query: '?url&no-inline',
})

const unknownBankModules = import.meta.glob<string>(
  './banks/ic_unknown_bank_*px.svg',
  {
    eager: true,
    import: 'default',
    query: '?url',
  }
)

/**
 * ZenMoney bank icon ID to its original-color asset.
 *
 * AccountIcon resolves account.company directly against this catalog.
 * Keep bank artwork separate from monochrome category assets.
 */
export const bankIconById = Object.fromEntries(
  Object.entries(bankModules).map(([path, url]) => {
    const match = /ic_bank_(\d+)_54px\.svg$/.exec(path)
    if (!match) throw new Error(`Unexpected ZenMoney bank asset: ${path}`)
    return [match[1], url]
  })
) as Partial<Record<string, string>>

/** Fallback bank icon by its native size in pixels. */
export const unknownBankIconBySize = Object.fromEntries(
  Object.entries(unknownBankModules).map(([path, url]) => {
    const match = /ic_unknown_bank_(\d+)px\.svg$/.exec(path)
    if (!match) throw new Error(`Unexpected ZenMoney bank fallback: ${path}`)
    return [match[1], url]
  })
) as Record<string, string>
