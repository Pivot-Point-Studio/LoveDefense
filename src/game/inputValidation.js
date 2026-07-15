const graphemeSegmenter = typeof Intl?.Segmenter === "function" ? new Intl.Segmenter("ko", { granularity: "grapheme" }) : null

export function countUserInputCharacters(value) {
  const text = String(value ?? "")
  return graphemeSegmenter ? [...graphemeSegmenter.segment(text)].length : [...text].length
}

export function validateUserInput(value) {
  const text = String(value ?? "").replace(/\r\n?/g, "\n").trim()
  if (!text.trim()) return { valid: false, message: "빈 답변은 보낼 수 없어요." }
  if (countUserInputCharacters(text) > 200) return { valid: false, message: "답변은 200자 이내로 입력해 주세요." }
  return { valid: true, value: text }
}
