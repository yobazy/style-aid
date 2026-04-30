const colorMap: Record<string, string> = {
  black: '#111111',
  white: '#f3f1ea',
  brown: '#5d4037',
  camel: '#b9935a',
  champagne: '#d8c4a8',
  indigo: '#3f51b5',
  gold: '#caa24c',
  navy: '#1f2a44',
  gray: '#7b7b7b',
  grey: '#7b7b7b',
  red: '#9f2d2d',
  burgundy: '#5b1f29',
  green: '#365c46',
  olive: '#5b6031',
  tan: '#b1906a',
  cream: '#e9e1d2',
  silver: '#b9bec8',
}

export function getColorSwatch(color: string) {
  const normalized = color.trim().toLowerCase()
  if (colorMap[normalized]) {
    return colorMap[normalized]
  }

  const firstWord = normalized.split(/\s+/)[0]
  return colorMap[firstWord] ?? '#6b7280'
}
