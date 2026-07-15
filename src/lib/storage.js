export const defaultUser = { nickname: "별이", gender: "female", mbti: "INFP", expression: "직접 표현형", tendency: "감정을 천천히 확인하고 진심을 전하는 편", relationshipLength: "" }
export const readLegacy = (key, fallback) => { try { const value = JSON.parse(localStorage.getItem(key) ?? "null"); return value ?? fallback } catch { return fallback } }
export const loadUser = () => ({ ...defaultUser, ...readLegacy("loveDefense.userProfile", {}) })
export const loadPartner = () => ({ nickname: "연인", gender: loadUser().gender === "male" ? "female" : "male", mbti: "INFJ", tendency: "마음을 오래 참다가 조심스럽게 털어놓는 편", ...readLegacy("loveDefense.partnerProfile", {}) })
export const loadHistory = () => readLegacy("loveDefense.gameHistory", [])
export const loadSavedExpressions = () => readLegacy("loveDefense.savedExpressions", [])
export const saveUser = (user) => localStorage.setItem("loveDefense.userProfile", JSON.stringify(user))
export const savePartner = (partner) => localStorage.setItem("loveDefense.partnerProfile", JSON.stringify(partner))
export const saveHistory = (result) => { const next = [{ ...result, id: result.id ?? crypto.randomUUID() }, ...loadHistory()].slice(0, 30); localStorage.setItem("loveDefense.gameHistory", JSON.stringify(next)); return next }
export const saveExpression = (expression) => { const next = [expression, ...loadSavedExpressions().filter((x) => x !== expression)]; localStorage.setItem("loveDefense.savedExpressions", JSON.stringify(next)); return next }
export const removeSavedExpression = (expression) => { const next = loadSavedExpressions().filter((x) => x !== expression); localStorage.setItem("loveDefense.savedExpressions", JSON.stringify(next)); return next }
