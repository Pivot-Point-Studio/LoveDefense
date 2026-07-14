const USER_KEY = "loveDefense.userProfile"
const HISTORY_KEY = "loveDefense.gameHistory"
const SAVED_KEY = "loveDefense.savedExpressions"

export const defaultUser = {
  nickname: "별빛",
  mbti: "INFP",
  expression: "직접 표현형",
  relationshipLength: "",
}

function read(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "null")
    return value && typeof value === "object" ? { ...fallback, ...value } : fallback
  } catch {
    return fallback
  }
}

function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]")
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function loadUser() {
  return read(USER_KEY, defaultUser)
}

export function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify({ ...defaultUser, ...user }))
}

export function loadHistory() {
  return readList(HISTORY_KEY)
}

export function saveHistory(result) {
  const next = [{ ...result, id: Date.now() }, ...loadHistory()].slice(0, 30)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  return next
}

export function loadSavedExpressions() {
  return readList(SAVED_KEY)
}

export function saveExpression(expression) {
  const current = loadSavedExpressions()
  if (!current.some((item) => item === expression)) {
    localStorage.setItem(SAVED_KEY, JSON.stringify([expression, ...current]))
  }
}
