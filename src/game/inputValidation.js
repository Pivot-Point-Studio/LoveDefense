export function validateUserInput(value) {
  const text = String(value ?? "")
  if (!text.trim()) return { valid: false, message: "빈 답변은 보낼 수 없어요." }
  if ([...text].length < 2) return { valid: false, message: "두 글자 이상 입력해 주세요." }
  if ([...text].length > 200) return { valid: false, message: "답변은 200자 이내로 입력해 주세요." }
  const normalized = text.replace(/\r\n/g, "\n").trim()
  const endings = normalized.split(/\n|[.!?！？]+/u).map((x) => x.trim()).filter(Boolean)
  if (endings.length > 2) return { valid: false, message: "답변은 최대 두 문장까지 입력해 주세요." }
  return { valid: true, value: text }
}
