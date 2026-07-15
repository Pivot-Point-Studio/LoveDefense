export const SLIDE_START_LIMIT = 0.2
export const SLIDE_COMPLETE_LIMIT = 0.94

export function slideProgress(clientX, rect) {
  if (!rect || rect.width <= 0) return 0
  return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
}

export function canStartSlide(progress) {
  return progress <= SLIDE_START_LIMIT
}

export function isSlideComplete(progress) {
  return progress >= SLIDE_COMPLETE_LIMIT
}
