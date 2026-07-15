export const attachmentStyles = ["avoidant", "anxious", "secure"]

export const attachmentDialogueProfiles = {
  anxious: {
    id: "anxious",
    coreFears: ["버려질 가능성", "관심이 줄어드는 것", "애매한 관계"],
    coreNeeds: ["확인", "일관된 관심", "안심할 수 있는 설명"],
    commonTriggers: ["답장 지연", "약속 변경", "제3자에게 보이는 친밀함"],
    speechHabits: ["참아둔 일을 한꺼번에 꺼냄", "상대 행동의 의미를 확인하려 함", "감정 단어가 구체적임"],
    confirmationBehaviors: ["연락 빈도와 태도 변화를 비교함", "관계의 위치를 확인함"],
    avoidanceBehaviors: ["상처받을까 봐 먼저 괜찮다고 함", "답을 재촉한 뒤 후회함"],
    conflictEscalationPatterns: ["작은 신호를 관계 전체의 문제로 확대할 수 있음", "애매한 답을 부정적으로 해석할 수 있음"],
    calmingPatterns: ["구체적인 사실과 행동 약속", "감정을 먼저 인정하는 반응"],
    commonEndingModes: ["direct_question", "emotional_disclosure", "behavioral_observation", "unresolved_close"],
    uncommonEndingModes: ["topic_shift", "short_reply"],
    prohibitedStereotypes: ["집착하는 사람으로 단정", "항상 울거나 화내는 캐릭터"]
  },
  avoidant: {
    id: "avoidant",
    coreFears: ["감정 대화가 통제할 수 없이 커지는 것", "자율성을 잃는 것", "잘못된 말을 하는 것"],
    coreNeeds: ["생각할 시간", "구체적인 사실", "압박 없는 선택권"],
    commonTriggers: ["연속된 확인 요구", "사람들 앞에서의 추궁", "감정 표현을 강요받는 상황"],
    speechHabits: ["짧게 대답함", "감정보다 상황을 설명함", "말을 고르며 늦게 답함"],
    confirmationBehaviors: ["행동으로 관심을 보임", "필요한 일을 조용히 처리함"],
    avoidanceBehaviors: ["화제를 실무적인 쪽으로 돌림", "잠시 혼자 있을 시간을 요청함", "침묵으로 긴장을 낮춤"],
    conflictEscalationPatterns: ["문제를 별일 아닌 것으로 축소할 수 있음", "대화가 길어지면 먼저 자리를 피할 수 있음"],
    calmingPatterns: ["짧고 명확한 요청", "시간을 준 뒤 다시 약속하는 방식"],
    commonEndingModes: ["plain_statement", "short_reply", "boundary_setting", "topic_shift", "delayed_response_style"],
    uncommonEndingModes: ["direct_question", "relationship_confirmation"],
    prohibitedStereotypes: ["무정한 사람으로 단정", "사랑이 없다고 단정"]
  },
  secure: {
    id: "secure",
    coreFears: ["반복되는 불공정", "신뢰가 무너지는 것", "서로의 경계가 무시되는 것"],
    coreNeeds: ["솔직한 정보", "상호 조율", "지킬 수 있는 행동"],
    commonTriggers: ["같은 약속의 반복 위반", "거짓말", "일방적인 결정"],
    speechHabits: ["감정과 사실을 나누어 말함", "상대 관점도 확인함", "필요하면 단호하게 선을 긋음"],
    confirmationBehaviors: ["구체적인 합의를 제안함", "잘못을 인정하고 수정을 요청함"],
    avoidanceBehaviors: ["불필요한 추측을 줄임", "해결 불가능한 순간에는 대화를 중단함"],
    conflictEscalationPatterns: ["부당한 행동에는 분명히 화를 냄", "반복되면 관계 지속 여부를 검토함"],
    calmingPatterns: ["책임 인정과 실행 가능한 변화", "서로의 경계를 확인하는 합의"],
    commonEndingModes: ["responsibility_acknowledgment", "concrete_request", "boundary_setting", "action_promise", "plain_statement"],
    uncommonEndingModes: ["sarcasm", "direct_question"] ,
    prohibitedStereotypes: ["항상 차분하고 친절함", "어떤 잘못도 용서함"]
  }
}

export const attachmentDialoguePatterns = attachmentDialogueProfiles
