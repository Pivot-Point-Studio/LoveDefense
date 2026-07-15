import test from "node:test"
import assert from "node:assert/strict"
import { hasDesktopChatKeyboard, shouldSubmitChatOnEnter } from "./chatKeyboard.js"

test("데스크톱 Enter는 제출하고 Shift+Enter는 줄바꿈으로 남긴다", () => {
  assert.equal(shouldSubmitChatOnEnter({ key: "Enter", shiftKey: false, nativeEvent: {} }), true)
  assert.equal(shouldSubmitChatOnEnter({ key: "Enter", shiftKey: true, nativeEvent: {} }), false)
  assert.equal(shouldSubmitChatOnEnter({ key: "a", shiftKey: false, nativeEvent: {} }), false)
})

test("한글·일본어 IME 조합 확정 Enter는 제출하지 않는다", () => {
  assert.equal(shouldSubmitChatOnEnter({ key: "Enter", shiftKey: false, nativeEvent: { isComposing: true } }), false)
  assert.equal(shouldSubmitChatOnEnter({ key: "Enter", shiftKey: false, nativeEvent: { keyCode: 229 } }), false)
  assert.equal(shouldSubmitChatOnEnter({ key: "Enter", shiftKey: false, nativeEvent: {} }, { compositionActive: true }), false)
})

test("터치 중심 모바일 환경에서는 Enter를 강제 제출하지 않는다", () => {
  assert.equal(shouldSubmitChatOnEnter({ key: "Enter", shiftKey: false, nativeEvent: {} }, { desktopKeyboard: false }), false)
  assert.equal(hasDesktopChatKeyboard({ navigator: { userAgent: "Mozilla/5.0 (Windows NT 10.0)", platform: "Win32" }, matchMedia: () => ({ matches: false }) }), true)
  assert.equal(hasDesktopChatKeyboard({ navigator: { userAgent: "Mozilla/5.0 (Macintosh)", platform: "MacIntel", maxTouchPoints: 0 }, matchMedia: () => ({ matches: false }) }), true)
  assert.equal(hasDesktopChatKeyboard({ navigator: { userAgent: "Mozilla/5.0 (iPhone; Mobile)", platform: "iPhone" }, matchMedia: () => ({ matches: true }) }), false)
  assert.equal(hasDesktopChatKeyboard({ navigator: { userAgent: "Mozilla/5.0 (Macintosh)", platform: "MacIntel", maxTouchPoints: 5 }, matchMedia: () => ({ matches: true }) }), false)
})
