const bankModules = import.meta.glob<string>('./banks/ic_bank_*_54px.svg', {
  eager: true,
  import: 'default',
  query: '?inline',
})

/** Map account.company to original-color bank artwork, separate from monochrome category icons. */
export const bankIconById = Object.fromEntries(
  Object.entries(bankModules).map(([path, url]) => {
    const match = /ic_bank_(\d+)_54px\.svg$/.exec(path)
    if (!match) throw new Error(`Unexpected Zenmoney bank asset: ${path}`)
    return [match[1], url]
  })
) as Partial<Record<string, string>>
