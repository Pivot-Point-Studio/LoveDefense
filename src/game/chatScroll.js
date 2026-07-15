export const LATEST_MESSAGE_THRESHOLD = 24

export function distanceFromLatest(scrollContainer) {
  if (!scrollContainer) return 0
  return Math.max(0, scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight)
}

export function isAwayFromLatest(scrollContainer, threshold = LATEST_MESSAGE_THRESHOLD) {
  return distanceFromLatest(scrollContainer) > threshold
}

export function scrollToLatest(scrollContainer) {
  if (!scrollContainer) return
  scrollContainer.scrollTop = scrollContainer.scrollHeight
}
