const FALLBACK_COLOR = '#c9ced2'

export const getValidColor = (colorInput) => {
  if (!colorInput) return FALLBACK_COLOR

  let colorString = colorInput
  if (typeof colorInput === 'object') {
    colorString = colorInput.hex || colorInput.code || colorInput.color || FALLBACK_COLOR
  }

  if (typeof colorString !== 'string') return FALLBACK_COLOR

  const hexMatch = colorString.match(/#[0-9a-fA-F]{3,6}/)
  if (hexMatch) return hexMatch[0]
  return colorString
}

export const getColorName = (colorInput) => {
  if (!colorInput) return 'Unknown Color'
  if (typeof colorInput === 'string') return colorInput
  if (typeof colorInput === 'object') {
    return colorInput.name || colorInput.label || 'Unknown Color'
  }
  return 'Unknown Color'
}
