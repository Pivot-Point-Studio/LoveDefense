import test from "node:test"
import assert from "node:assert/strict"
import { distanceFromLatest, isAwayFromLatest, scrollToLatest } from "./chatScroll.js"

test("끝 화면에서는 최신 메시지 버튼을 표시하지 않는다", () => {
  const container = { scrollHeight: 1000, scrollTop: 398, clientHeight: 600 }
  assert.equal(distanceFromLatest(container), 2)
  assert.equal(isAwayFromLatest(container), false)
})

test("사용자가 끝 화면에서 멀어지면 최신 메시지 버튼을 표시한다", () => {
  const container = { scrollHeight: 1000, scrollTop: 300, clientHeight: 600 }
  assert.equal(distanceFromLatest(container), 100)
  assert.equal(isAwayFromLatest(container), true)
})

test("새 메시지 또는 버튼 클릭은 즉시 최신 위치로 이동한다", () => {
  const container = { scrollHeight: 1400, scrollTop: 200, clientHeight: 600 }
  scrollToLatest(container)
  assert.equal(container.scrollTop, 1400)
})
