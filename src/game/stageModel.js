export const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : 0))

const baseTurns = [
  { turnNumber: 1, partnerMessage: "요즘은 내가 먼저 연락하지 않으면 연락도 안 하네.", situationContext: "연락이 줄어 서운함이 쌓인 상황", evaluationFocus: { importantEmotions: ["서운함", "외로움"], importantNeeds: ["관심", "연결감"], preferredResponses: ["감정 인정", "구체적인 질문"], harmfulResponses: ["바쁘다는 변명", "과도한 약속"] }, reactionGuidelines: { positive: "서운했던 마음을 조금 풀고 더 이야기한다.", partial: "아직 조심스럽지만 대화를 이어간다.", negative: "방어적으로 반응하고 거리를 둔다." }, reactionRequirements: { preserveCharacterPersonality: true, preserveSpeechStyle: true, reflectUserWording: true, reflectUserTone: true, maxSentences: 2 } },
  { turnNumber: 2, partnerMessage: "사실 나만 관계를 챙기는 것 같아서 조금 불안했어.", situationContext: "상대가 관계에 대한 불안을 털어놓는 상황", evaluationFocus: { importantEmotions: ["불안", "외로움"], importantNeeds: ["확신", "안정감"], preferredResponses: ["불안을 알아차리기", "곁에 있겠다고 표현하기"], harmfulResponses: ["예민하다고 하기", "즉시 해결책 강요"] }, reactionGuidelines: { positive: "마음을 더 솔직하게 털어놓는다.", partial: "고마워하지만 완전히 안심하지는 못한다.", negative: "마음을 닫고 대화를 피하려 한다." }, reactionRequirements: { preserveCharacterPersonality: true, preserveSpeechStyle: true, reflectUserWording: true, reflectUserTone: true, maxSentences: 2 } },
  { turnNumber: 3, partnerMessage: "내가 이런 얘기를 하면 부담스러울까 봐 계속 참았어.", situationContext: "상대가 감정을 참아온 이유를 말하는 상황", evaluationFocus: { importantEmotions: ["두려움", "답답함"], importantNeeds: ["안전한 대화", "수용"], preferredResponses: ["말해줘서 고맙다고 하기", "판단하지 않고 듣기"], harmfulResponses: ["왜 이제 말하냐고 따지기", "대화를 피하기"] }, reactionGuidelines: { positive: "안도하며 자신의 마음을 더 구체적으로 설명한다.", partial: "조금 더 생각할 시간이 필요하다고 말한다.", negative: "다음부터는 아무 말도 하지 않겠다고 한다." }, reactionRequirements: { preserveCharacterPersonality: true, preserveSpeechStyle: true, reflectUserWording: true, reflectUserTone: true, maxSentences: 2 } },
  { turnNumber: 4, partnerMessage: "그럼 앞으로 우리는 어떻게 해야 덜 서운할까?", situationContext: "상대가 관계를 회복할 방법을 함께 찾으려는 상황", evaluationFocus: { importantEmotions: ["기대", "조심스러움"], importantNeeds: ["협력", "일관성"], preferredResponses: ["함께 정하기", "현실적인 제안"], harmfulResponses: ["일방적인 약속", "상대 탓"] }, reactionGuidelines: { positive: "작은 약속을 함께 정하며 희망을 보인다.", partial: "제안을 들어보지만 신중한 태도를 보인다.", negative: "또 지켜지지 않을 약속일 것이라며 냉소한다." }, reactionRequirements: { preserveCharacterPersonality: true, preserveSpeechStyle: true, reflectUserWording: true, reflectUserTone: true, maxSentences: 2 } },
  { turnNumber: 5, partnerMessage: "오늘 이야기해줘서 고마워. 그래도 아직 마음 한쪽은 무거워.", situationContext: "대화 끝에 남은 감정을 확인하는 상황", evaluationFocus: { importantEmotions: ["고마움", "무거움", "불안"], importantNeeds: ["지속적인 관심", "진심"], preferredResponses: ["감사와 남은 감정 모두 인정", "서두르지 않기"], harmfulResponses: ["이제 끝내자고 하기", "괜찮다고 단정하기"] }, reactionGuidelines: { positive: "남은 감정도 함께 다룰 수 있다는 믿음을 보인다.", partial: "고맙다고 말하지만 아직 시간이 필요하다.", negative: "대화를 끝내고 싶다고 말한다." }, reactionRequirements: { preserveCharacterPersonality: true, preserveSpeechStyle: true, reflectUserWording: true, reflectUserTone: true, maxSentences: 2 } },
]

export const defaultStages = [{
  id: "contact-repair-001", stageNumber: 1, title: "짧아진 연락", contextSummary: "연락이 줄어든 뒤 서운함과 불안이 커진 상황",
  characterProfile: { characterId: "partner", name: "연인", relationshipRole: "대화 상대", personalitySummary: "마음을 오래 참다가 조심스럽게 털어놓는 사람", speechStyle: "부드러운 반말" },
  attachmentType: { type: "불안-안정 추구형", intensity: 62, triggers: ["무관심", "답이 없는 시간"], calmingFactors: ["감정 인정", "일관된 관심"] },
  communicationAxes: { expressionStyle: "감정을 돌려 말하지만 알아주기를 바람", desiredResponse: "공감과 안심", conflictResponse: "처음에는 다가오지만 반복되면 움츠러듦", relationshipNeed: "확인과 안정감" },
  evaluationWeights: { emotionRecognition: .24, needSatisfaction: .2, communicationFit: .16, attachmentSafety: .15, conflictAppropriateness: .12, relationshipRepair: .13 },
  initialState: { relationshipHp: 78, conflictLevel: 48, stability: 42, trust: 46 },
  hiddenEmotion: { primary: "서운함과 불안", secondary: ["외로움", "두려움"], acceptedSimilarMeanings: ["섭섭", "허전", "걱정", "조급"] },
  hiddenNeed: { primary: "관심과 관계에 대한 확신", secondary: ["연결감", "안전한 대화"], acceptedSimilarMeanings: ["확인", "안심", "곁", "관심"] },
  turns: baseTurns, branching: { positiveNextStageId: null, partialNextStageId: null, negativeNextStageId: null },
}]

export const stageDefinitions = Array.from({ length: 5 }, (_, index) => {
  const stageNumber = index + 1
  const source = defaultStages[0]
  return { ...source, id: `${source.id}-${stageNumber}`, stageNumber, title: stageNumber === 1 ? source.title : `${source.title} · 다음 대화`, contextSummary: stageNumber === 1 ? source.contextSummary : "앞선 대화 이후에도 관계를 이어가며 서로의 마음을 확인하는 상황", branching: { positiveNextStageId: stageNumber < 5 ? `${source.id}-${stageNumber + 1}` : null, partialNextStageId: stageNumber < 5 ? `${source.id}-${stageNumber + 1}` : null, negativeNextStageId: stageNumber < 5 ? `${source.id}-${stageNumber + 1}` : null } }
})

export function normalizeStage(stage, index = 0) {
  if (stage?.turns?.length === 5 && stage.evaluationWeights) return { ...stage, stageNumber: stage.stageNumber ?? index + 1 }
  const source = defaultStages[index % defaultStages.length]
  return { ...source, ...stage, turns: source.turns, evaluationWeights: source.evaluationWeights, initialState: source.initialState, branching: source.branching, hiddenEmotion: source.hiddenEmotion, hiddenNeed: source.hiddenNeed, characterProfile: source.characterProfile, attachmentType: source.attachmentType, communicationAxes: source.communicationAxes }
}

export function validateStage(stage) {
  if (!stage || typeof stage !== "object") throw new Error("Stage가 없습니다.")
  if (!Array.isArray(stage.turns) || stage.turns.length !== 5) throw new Error("Stage는 정확히 5턴이어야 합니다.")
  const total = Object.values(stage.evaluationWeights ?? {}).reduce((sum, value) => sum + Number(value), 0)
  if (Math.abs(total - 1) > .01 && Math.abs(total - 100) > 1) throw new Error("평가 가중치 합계가 올바르지 않습니다.")
  return true
}

export function createInitialGameState(stage = defaultStages[0]) {
  const s = normalizeStage(stage)
  return { currentStageId: s.id, currentTurn: 1, relationshipHp: clamp(s.initialState.relationshipHp), conflictLevel: clamp(s.initialState.conflictLevel), stability: clamp(s.initialState.stability), trust: clamp(s.initialState.trust), adviceItems: [], turnHistory: [], isGameOver: false }
}

export function conflictStatus(value) {
  const v = clamp(value)
  if (v < 15) return ["갈등 봉합", "🌿"]
  if (v < 30) return ["누그러짐", "🙂"]
  if (v < 50) return ["보통", "😐"]
  if (v < 65) return ["갈등 상승", "😟"]
  if (v < 85) return ["화남", "😠"]
  return ["관계 파토", "💥"]
}
