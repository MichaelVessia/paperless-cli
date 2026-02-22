/** Truncate long text while preserving context about original length. */
export const truncateContent = (
  text: string,
  maxLength = 10000,
): { readonly text: string; readonly truncated: boolean; readonly original_length: number } => {
  if (text.length <= maxLength) {
    return { text, truncated: false, original_length: text.length }
  }
  return {
    text: text.slice(0, maxLength),
    truncated: true,
    original_length: text.length,
  }
}

/** Truncate a list while preserving total count. */
export const truncateList = <T>(
  items: readonly T[],
  maxLength = 25,
): { readonly items: readonly T[]; readonly truncated: boolean; readonly total: number } => {
  if (items.length <= maxLength) {
    return { items, truncated: false, total: items.length }
  }
  return {
    items: items.slice(0, maxLength),
    truncated: true,
    total: items.length,
  }
}
