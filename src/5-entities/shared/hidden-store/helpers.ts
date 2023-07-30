export function parseComment(comment: string | null) {
  if (!comment) return null
  try {
    return JSON.parse(comment)
  } catch {
    return null
  }
}
