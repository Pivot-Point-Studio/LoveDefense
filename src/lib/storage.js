export const defaultUser = { nickname: "별이", mbti: "INFP", expression: "직접 표현형", relationshipLength: "" }
export const readLegacy = (key, fallback) => { try { const value = JSON.parse(localStorage.getItem(key) ?? "null"); return value ?? fallback } catch { return fallback } }
export const loadUser = () => ({ ...defaultUser, ...readLegacy("loveDefense.userProfile", {}) })
export const loadHistory = () => readLegacy("loveDefense.gameHistory", [])
export const loadSavedExpressions = () => readLegacy("loveDefense.savedExpressions", [])
export const saveUser = (user) => localStorage.setItem("loveDefense.userProfile", JSON.stringify(user))
export const saveHistory = (result) => { const next = [{ ...result, id: result.id ?? crypto.randomUUID() }, ...loadHistory()].slice(0, 30); localStorage.setItem("loveDefense.gameHistory", JSON.stringify(next)); return next }
export const saveExpression = (expression) => { const next = [expression, ...loadSavedExpressions().filter((x) => x !== expression)]; localStorage.setItem("loveDefense.savedExpressions", JSON.stringify(next)); return next }
