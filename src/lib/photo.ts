export const MAX_PHOTO_SIDE = 800

const PHOTO_QUALITY = 0.85

/**
 * Returns the size a photo should be drawn at so its longest side is at most
 * `maxSide`. The aspect ratio is kept and small photos are never enlarged.
 */
export function fitWithin(width: number, height: number, maxSide = MAX_PHOTO_SIDE) {
  const longest = Math.max(width, height)
  if (longest <= maxSide) {
    return { width, height }
  }

  const scale = maxSide / longest
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

/**
 * Shrinks a picked photo for storage. The photo is redrawn on a canvas and
 * re-encoded as JPEG, which keeps the orientation the camera recorded (the
 * bitmap is decoded with its EXIF rotation applied) and drops every metadata
 * block, including GPS location. Transparent areas become white.
 *
 * Rejects when the file is not a readable image.
 */
export async function shrinkPhoto(file: Blob, maxSide = MAX_PHOTO_SIDE): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })

  try {
    const size = fitWithin(bitmap.width, bitmap.height, maxSide)
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Canvas is not available')
    }

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, size.width, size.height)
    context.drawImage(bitmap, 0, 0, size.width, size.height)

    return canvas.toDataURL('image/jpeg', PHOTO_QUALITY)
  } finally {
    bitmap.close()
  }
}
