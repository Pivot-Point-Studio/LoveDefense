export async function retryAIRequest(invoke, validate, onFailure = () => {}) {
  let lastError
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await invoke(attempt)
      return { ...response, result: validate(response.result), attempts: attempt }
    } catch (error) {
      lastError = error
      onFailure(error, attempt)
    }
  }
  throw Object.assign(new Error(lastError?.message ?? "OpenAI 요청에 실패했습니다."), { attempts: 2, cause: lastError })
}
