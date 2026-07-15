import test from "node:test"
import assert from "node:assert/strict"
import { countUserInputCharacters, validateUserInput } from "./inputValidation.js"

test("특수문자와 문장부호를 포함한 답변을 허용한다", () => {
  const inputs = [
    "우리 #다시_얘기해 볼까?",
    "응, 네 마음을 이해해",
    "서운했구나. 더 듣고 싶어.",
    ",",
    ".",
  ]

  for (const input of inputs) {
    assert.deepEqual(validateUserInput(input), { valid: true, value: input })
  }
})

test("문장부호와 여러 줄바꿈이 있어도 답변을 허용한다", () => {
  const input = "네 마음을 이해해.\n조금 더 이야기해 줄래?\n내가 들을게."

  assert.deepEqual(validateUserInput(input), { valid: true, value: input })
})

test("이모지와 UTF-16 서로게이트 페어를 글자 단위로 처리한다", () => {
  const inputs = [
    "좋아🙂",
    "우리 다시 얘기해 보자. 🫶",
    "🙂🙂",
    "🙂",
  ]

  for (const input of inputs) {
    assert.deepEqual(validateUserInput(input), { valid: true, value: input })
  }
})

test("이모지 조합은 사용자에게 보이는 글자 단위로 센다", () => {
  assert.equal(countUserInputCharacters("👨‍👩‍👧‍👦"), 1)
  assert.equal(countUserInputCharacters("좋아🫶"), 3)
})

test("CRLF를 정규화하고 200자 초과만 거부한다", () => {
  assert.deepEqual(validateUserInput("  안녕\r\n반가워  "), { valid: true, value: "안녕\n반가워" })
  assert.equal(validateUserInput("가".repeat(200)).valid, true)
  assert.deepEqual(validateUserInput("가".repeat(201)), { valid: false, message: "답변은 200자 이내로 입력해 주세요." })
})

test("공백 문자만 있는 답변은 거부한다", () => {
  assert.deepEqual(validateUserInput(" \t\r\n "), {
    valid: false,
    message: "빈 답변은 보낼 수 없어요.",
  })
})
