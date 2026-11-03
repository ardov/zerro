// Keep ordinary broken slugs useful while masking email addresses, long IDs and opaque tokens.
export function reportablePath(pathname: string) {
  return pathname
    .split('/')
    .map(segment => {
      if (!segment) return ''
      try {
        const text = decodeURIComponent(segment)
        if (
          /^[\p{L}\d._~-]{1,64}$/u.test(text) &&
          !/\d{5}|[a-z\d]{24}|^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(
            text
          )
        )
          return segment
      } catch {
        // Malformed percent escapes are common in broken links.
      }
      return '[redacted]'
    })
    .join('/')
}

export function reportableReferrer(referrer: string) {
  if (!referrer) return ''
  try {
    const source = new URL(referrer)
    if (source.protocol !== 'http:' && source.protocol !== 'https:') return ''
    return source.origin === location.origin
      ? source.origin + reportablePath(source.pathname)
      : source.origin
  } catch {
    return ''
  }
}
