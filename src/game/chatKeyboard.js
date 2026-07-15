export function hasDesktopChatKeyboard(targetWindow = globalThis.window) {
  const navigator = targetWindow?.navigator ?? {}
  const userAgent = String(navigator.userAgent ?? "")
  const platform = String(navigator.userAgentData?.platform ?? navigator.platform ?? "")
  const mobileUserAgent = /android|iphone|ipad|ipod|mobile/i.test(userAgent)
  const touchOnlyIPad = platform === "MacIntel" && Number(navigator.maxTouchPoints) > 1
  if (mobileUserAgent || touchOnlyIPad) return false
  if (/win|mac|linux|cros/i.test(`${platform} ${userAgent}`)) return true
  return Boolean(targetWindow?.matchMedia?.("(any-hover: hover) and (any-pointer: fine)")?.matches)
}

export function shouldSubmitChatOnEnter(event, { compositionActive = false, desktopKeyboard = true } = {}) {
  if (!desktopKeyboard || event.key !== "Enter" || event.shiftKey) return false
  const nativeEvent = event.nativeEvent ?? event
  return !compositionActive && !nativeEvent.isComposing && nativeEvent.keyCode !== 229
}
