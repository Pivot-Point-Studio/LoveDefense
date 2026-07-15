export const dialogueEndingModes = ["direct_question", "indirect_question", "plain_statement", "emotional_disclosure", "short_reply", "silence", "ellipsis", "boundary_setting", "action_promise", "concrete_request", "apology", "responsibility_acknowledgment", "topic_shift", "sarcasm", "irritated_close", "avoidant_withdrawal", "unresolved_close", "delayed_response_style", "relationship_confirmation", "behavioral_observation"]

const groups = [
  { id: "attention_gap", intent: "관심과 연락의 불균형", variants: [
    ["내가 먼저 말을 걸어야만 오늘이 시작되는 느낌이 들었어.", "plain_statement"], ["요 며칠 네 답이 늦어서, 나도 모르게 이유를 찾고 있었어.", "emotional_disclosure"], ["연락이 줄어든 건 사실이지?", "direct_question"], ["바쁜 건 알겠는데, 그 사이에 내가 빠진 것 같더라.", "behavioral_observation"], ["괜찮다고 넘기기엔 계속 마음에 남았어…", "ellipsis"], ["지금은 답을 바로 듣고 싶은 기분은 아니야.", "boundary_setting"], ["오늘은 내가 먼저 짧게라도 연락할게.", "action_promise"], ["응. 알겠어.", "short_reply"]
  ]},
  { id: "money_fairness", intent: "데이트 비용과 부담의 균형", variants: [
    ["계산할 때마다 내가 먼저 지갑을 꺼내는 장면이 반복됐어.", "behavioral_observation"], ["돈보다도 당연하게 여겨진 기분이 서운했어.", "emotional_disclosure"], ["이번에는 각자 낼까, 아니면 미리 기준을 정할까.", "concrete_request"], ["빌린 돈 이야기를 꺼내는 내가 쪼잔해 보일까 싶었어.", "unresolved_close"], ["다음 약속부터는 금액을 숨기지 말자.", "action_promise"], ["그건 내가 미처 생각하지 못했어. 미안해.", "apology"], ["다른 데 쓸 돈은 있으면서 여기서는 모른 척하네.", "sarcasm"], ["오늘 계산은 내가 할게. 대신 다음엔 네가 맡아줘.", "plain_statement"]
  ]},
  { id: "third_person_boundary", intent: "친구와 연인의 경계", variants: [
    ["친구에게 그렇게 가까이 대하는 걸 보니 내가 어디에 서 있는지 헷갈렸어.", "emotional_disclosure"], ["그 행동이 장난이었다고 해도 나는 편하지 않았어.", "plain_statement"], ["다음에는 그 선을 넘기 전에 내 눈치를 한 번 봐줬으면 해.", "concrete_request"], ["내가 예민한 게 아니라, 네 행동이 계속 눈에 들어왔어.", "behavioral_observation"], ["그 친구와는 원래 그렇게까지 가까운 사이야?", "indirect_question"], ["이 얘기는 사람들 앞에서 더 하고 싶지 않아.", "boundary_setting"], ["내가 불편하게 만든 부분은 인정할게.", "responsibility_acknowledgment"], ["지금은 더 말하면 서로 상처만 될 것 같아.", "avoidant_withdrawal"]
  ]},
  { id: "safety_and_care", intent: "귀가와 안전을 관심으로 해석하는 갈등", variants: [
    ["오늘 못 데려다주는 것보다, 내가 혼자 돌아가도 괜찮다는 듯한 태도가 더 서운했어.", "emotional_disclosure"], ["막차 시간은 확인해뒀어. 대신 도착하면 연락할게.", "action_promise"], ["피곤한 건 이해하지만, 귀가 방법을 같이 정해줬으면 했어.", "concrete_request"], ["이 길은 밤에 혼자 걷기엔 좀 불안해.", "plain_statement"], ["내 안전을 챙기는 일이 부담스러운 부탁처럼 느껴졌어?", "indirect_question"], ["지금은 걷는 것보다 택시를 잡는 게 먼저야.", "short_reply"], ["오늘은 각자 돌아가자. 이 얘기는 내일 하자.", "boundary_setting"], ["알겠어. 나도 내 쪽에서 방법을 찾을게.", "unresolved_close"]
  ]},
  { id: "repair_and_accountability", intent: "사과와 책임 인정", variants: [
    ["내가 네 입장에서 생각하지 못한 건 분명해. 미안해.", "apology"], ["좋게 말하려고 했는데 결과적으로 네 시간을 가볍게 만들었어.", "responsibility_acknowledgment"], ["다음엔 약속 전에 가능한 범위를 먼저 말할게.", "action_promise"], ["당장 괜찮아졌다고 하긴 어렵지만, 네 말을 듣고 있어.", "emotional_disclosure"], ["응. 그 부분은 내가 잘못했어.", "short_reply"], ["변명으로 들릴 만한 말은 여기서 멈출게.", "plain_statement"], ["내가 먼저 정리해서 다시 이야기하자.", "avoidant_withdrawal"], ["그래도 이 관계를 포기하고 싶지는 않아.", "relationship_confirmation"]
  ]},
  { id: "distance_and_unresolved", intent: "거리를 두거나 해결되지 않은 감정", variants: [
    ["지금은 네 말이 틀렸다고 하기보다, 내가 받아들일 여유가 없어.", "boundary_setting"], ["오늘은 여기까지 할게.", "short_reply"], ["나도 내가 왜 이렇게까지 예민해졌는지 모르겠어…", "ellipsis"], ["이걸 그냥 없던 일처럼 넘기고 싶지는 않아.", "unresolved_close"], ["우리 얘기 말고 다른 것부터 하자.", "topic_shift"], ["그렇게까지 의미를 붙여야 했어?", "irritated_close"], ["읽고도 바로 답할 자신이 없었어.", "delayed_response_style"], ["시간이 좀 필요해. 정해지면 내가 먼저 말할게.", "avoidant_withdrawal"]
  ]}
]

export const relationshipDialoguePatterns = groups.map((group) => ({
  id: group.id,
  intent: group.intent,
  variants: group.variants.map(([textTemplate, endingMode]) => ({ textTemplate, endingMode, directness: endingMode.includes("question") ? .8 : .55, emotionalIntensity: ["sarcasm", "irritated_close", "emotional_disclosure"].includes(endingMode) ? .8 : .45, suitableAttachmentTypes: ["avoidant", "anxious", "secure"], suitableBehaviorTypes: [], suitableStages: [1, 2, 3, 4, 5], prohibitedRecentPatterns: [] }))
}))

export function getDialogueVariants({ intent, attachmentStyle, stageNumber = 1, discouragedEndingModes = [] } = {}) {
  const preferred = relationshipDialoguePatterns.find((group) => group.id === intent) ?? relationshipDialoguePatterns[0]
  return preferred.variants.filter((variant) => variant.suitableStages.includes(stageNumber) && !discouragedEndingModes.includes(variant.endingMode) && (!attachmentStyle || variant.suitableAttachmentTypes.includes(attachmentStyle)))
}
