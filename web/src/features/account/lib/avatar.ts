const AVATAR_COLORS = [
  '#2563eb',
  '#7c3aed',
  '#c026d3',
  '#db2777',
  '#e11d48',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0d9488',
  '#0891b2',
] as const

export function getInitials(name: string): string {
  const firstWord = name.trim().split(/\s+/).find(Boolean)

  if (!firstWord) {
    return '?'
  }

  return (Array.from(firstWord)[0] ?? '?').toLocaleUpperCase()
}

export function getBackgroundColor(name: string): string {
  let hash = 0

  for (const character of name.trim().toLocaleLowerCase()) {
    hash = (hash * 31 + (character.codePointAt(0) ?? 0)) | 0
  }

  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]
}
