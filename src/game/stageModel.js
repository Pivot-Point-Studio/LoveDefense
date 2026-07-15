export const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : 0))

const neutralTurns = [
  "수업 끝나고 네 친구한테만 유난히 다정했던 장면이 계속 생각나.",
  "나는 그걸 보고도 괜찮은 척했는데, 집에 오니까 마음이 불편했어.",
  "그 행동이 장난이었다면 왜 나한테는 미리 말하지 않았는지 모르겠어.",
  "사람들 앞에서 이 얘기를 길게 하고 싶지는 않아.",
  "내가 본 장면과 네가 생각한 의미가 달랐을 수도 있겠지.",
  "그래도 비슷한 일이 반복되면 그냥 넘기기는 어려울 것 같아.",
  "나는 우리 사이의 선이 다른 사람에게도 보였으면 해.",
  "지금 당장 결론을 내리기보다 서로 기준을 정하는 게 맞을 것 같아.",
  "오늘 이야기한 건 기억해둘게.",
  "말보다 다음에 네가 어떻게 하는지가 더 중요할 것 같아."
].map((partnerMessage, index) => ({ turnNumber: index + 1, partnerMessage, situationContext: "관계의 경계와 서운함을 확인하는 상황", evaluationFocus: { importantEmotions: ["서운함", "불안"], importantNeeds: ["존중", "확신"], preferredResponses: ["감정 인정", "구체적인 행동 제안"], harmfulResponses: ["예민하다고 단정", "모호한 약속"] }, reactionGuidelines: { positive: "감정과 사실을 함께 확인한다.", partial: "일부를 인정하지만 남은 감정이 있다.", negative: "거리를 두거나 대화를 닫는다." }, reactionRequirements: { preserveCharacterPersonality: true, preserveSpeechStyle: true, reflectUserWording: true, reflectUserTone: true, maxSentences: 2 } }))

export const defaultStages = [{
  id: "boundary-repair-001", stageNumber: 1, title: "경계가 흐려진 순간", contextSummary: "친구와 연인의 경계가 애매해져 서운함이 쌓인 상황",
  characterProfile: { characterId: "partner", name: "연인", relationshipRole: "대화 상대", personalitySummary: "상황을 가볍게 넘기려다 뒤늦게 감정을 알아차리는 사람", speechStyle: "자연스러운 반말" },
  attachmentType: { type: "secure", intensity: 52, triggers: ["공개적인 무시", "반복되는 경계 침해"], calmingFactors: ["구체적인 사과", "행동 기준 합의"] },
  communicationAxes: { expressionStyle: "사실과 감정을 나누어 말함", desiredResponse: "존중과 구체적인 조율", conflictResponse: "반복되면 단호하게 선을 긋는다", relationshipNeed: "상호성" },
  evaluationWeights: { emotionRecognition: .24, needSatisfaction: .2, communicationFit: .16, attachmentSafety: .15, conflictAppropriateness: .12, relationshipRepair: .13 },
  initialState: { relationshipHp: 78, conflictLevel: 44, stability: 48, trust: 50 },
  hiddenEmotion: { primary: "서운함", secondary: ["불안", "당황"], acceptedSimilarMeanings: ["섭섭", "불편", "찜찜"] },
  hiddenNeed: { primary: "존중과 경계", secondary: ["확신", "솔직한 설명"], acceptedSimilarMeanings: ["배려", "선", "기준"] },
  turns: neutralTurns, branching: { positiveNextStageId: null, partialNextStageId: null, negativeNextStageId: null }
}]

export const stageDefinitions = Array.from({ length: 5 }, (_, index) => {
  const stageNumber = index + 1; const source = defaultStages[0]
  return { ...source, id: `${source.id}-${stageNumber}`, stageNumber, title: stageNumber === 1 ? source.title : `${source.title} · ${stageNumber}단계`, contextSummary: stageNumber === 1 ? source.contextSummary : "앞선 사건의 영향이 커져 관계의 기준을 다시 확인하는 상황", branching: { positiveNextStageId: stageNumber < 5 ? `${source.id}-${stageNumber + 1}` : null, partialNextStageId: stageNumber < 5 ? `${source.id}-${stageNumber + 1}` : null, negativeNextStageId: stageNumber < 5 ? `${source.id}-${stageNumber + 1}` : null } }
})

export function normalizeStage(stage, index = 0) {
  if (stage?.turns?.length >= 6 && stage.evaluationWeights) return { ...stage, stageNumber: stage.stageNumber ?? index + 1 }
  const source = defaultStages[index % defaultStages.length]
  return { ...source, ...stage, turns: source.turns, evaluationWeights: source.evaluationWeights, initialState: source.initialState, branching: source.branching, hiddenEmotion: source.hiddenEmotion, hiddenNeed: source.hiddenNeed, characterProfile: source.characterProfile, attachmentType: source.attachmentType, communicationAxes: source.communicationAxes }
}

export function validateStage(stage) {
  if (!stage || typeof stage !== "object") throw new Error("Stage가 없습니다.")
  if (!Array.isArray(stage.turns) || stage.turns.length < 6) throw new Error("Stage에는 최소 6개의 턴 데이터가 필요합니다.")
  const total = Object.values(stage.evaluationWeights ?? {}).reduce((sum, value) => sum + Number(value), 0)
  if (Math.abs(total - 1) > .01 && Math.abs(total - 100) > 1) throw new Error("평가 가중치 합계가 올바르지 않습니다.")
  return true
}

export function createInitialGameState(stage = defaultStages[0]) { const s = normalizeStage(stage); return { currentStageId: s.id, currentTurn: 1, relationshipHp: clamp(s.initialState.relationshipHp), conflictLevel: clamp(s.initialState.conflictLevel), stability: clamp(s.initialState.stability), trust: clamp(s.initialState.trust), adviceItems: [], turnHistory: [], isGameOver: false } }
export function conflictStatus(value) { const v = clamp(value); if (v < 15) return ["갈등 봉합", "🌿"]; if (v < 30) return ["누그러짐", "🙂"]; if (v < 50) return ["보통", "😐"]; if (v < 65) return ["갈등 상승", "😟"]; if (v < 85) return ["화남", "😠"]; return ["관계 파토", "💥"] }
