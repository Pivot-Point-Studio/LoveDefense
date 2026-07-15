export const categories = ["연락", "감정 공감", "데이트와 시간", "사과/화해", "갈등과 거리", "경계 존중"]
const baseScenarios = [
  { id: "contact-001", title: "짧아진 연락", tags: ["연락", "감정 공감"], summary: "최근 대화가 줄어든 상황", messages: [{ speaker: "partner", text: "연락이 줄어든 뒤 내가 먼저 말을 꺼내야 하는 날이 많았어." }, { speaker: "me", text: "미안, 요즘 정신이 없었어." }], options: [{ text: "그렇게 느꼈구나. 요즘 내가 먼저 연락하지 못해서 서운했을 것 같아. 미안해.", correct: true }, { text: "나도 바쁜데 어쩔 수 없었어.", feedback: "상대의 감정보다 사정을 먼저 설명했어요." }, { text: "혹시 나를 못 믿는 거야?", feedback: "확인보다 방어적인 결론으로 건너뛰었어요." }, { text: "앞으로 매일 연락할게.", feedback: "감정 확인보다 해결책을 먼저 약속했어요." }] },
  { id: "date-002", title: "기대와 다른 데이트", tags: ["데이트와 시간", "감정 공감"], summary: "함께 보내기로 한 시간이 줄어든 상황", messages: [{ speaker: "partner", text: "오늘은 여기까지만 하고 들어갈까? 내일 일찍 일어나야 해서." }, { speaker: "me", text: "응, 알겠어." }], options: [{ text: "아쉽지만 내일 일정이 있구나. 오늘 함께해서 좋았어.", correct: true }, { text: "그럼 다음에는 더 빨리 만나자.", feedback: "다음 계획보다 지금 상대의 마음을 먼저 읽어보세요." }, { text: "나랑 있는 게 재미없어진 거야?", feedback: "상대의 일정에서 관계의 결론으로 건너뛰었어요." }, { text: "앞으로 약속은 오래 잡지 말자.", feedback: "서운함을 정리하기 전에 결론을 내렸어요." }] },
  { id: "apology-003", title: "남은 상처", tags: ["사과/화해", "갈등과 거리"], summary: "지난 말이 아직 마음에 남은 상황", messages: [{ speaker: "partner", text: "아까 말은 아직 마음에 남아 있어." }, { speaker: "me", text: "그 정도로 심각한 말은 아니었는데?" }], options: [{ text: "그렇게 상처로 남았구나. 내가 가볍게 생각했어. 더 듣고 싶어.", correct: true }, { text: "너도 예전에 나한테 그랬잖아.", feedback: "상대의 상처를 다른 잘못으로 상쇄하려 했어요." }, { text: "일단 우리 둘 다 진정하자.", feedback: "잠시 쉬는 것도 좋지만 먼저 감정을 확인해보세요." }, { text: "뭘 어떻게 해야 하는데?", feedback: "해결 방법을 요구하기 전에 마음을 들어주세요." }] },
]

// Provider 시나리오가 역할 메타데이터를 생략해도 채팅 화면이 안전하게 동작하도록 기본값을 채운다.
export const scenarios = baseScenarios.map((scenario) => ({
  ...scenario,
  playerRole: { name: "나", gender: "unspecified", relationshipRole: "사용자", ...(scenario.playerRole ?? {}) },
  partnerRole: { name: "연인", gender: "unspecified", relationshipRole: "대화 상대", ...(scenario.partnerRole ?? {}) },
  playerPerspective: scenario.playerPerspective ?? "연인의 입장에서 대화하기",
  playerObjective: scenario.playerObjective ?? "상대방의 감정을 이해하고 대화를 이어가세요.",
}))
