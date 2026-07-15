import test from "node:test"
import assert from "node:assert/strict"
import { canStartSlide, isSlideComplete, slideProgress } from "./profileOnboarding.js"

test("드래그 진행률을 트랙 안의 0~1 범위로 계산한다", () => {
  const rect = { left: 100, width: 300 }
  assert.equal(slideProgress(50, rect), 0)
  assert.equal(slideProgress(250, rect), 0.5)
  assert.equal(slideProgress(500, rect), 1)
})

test("왼쪽에서 시작해 오른쪽 끝까지 밀어야 저장된다", () => {
  assert.equal(canStartSlide(0.1), true)
  assert.equal(canStartSlide(0.5), false)
  assert.equal(isSlideComplete(0.9), false)
  assert.equal(isSlideComplete(0.96), true)
})
