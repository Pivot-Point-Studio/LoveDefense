export const categories = [
  "연락",
  "감정 공감",
  "데이트 태도",
  "사과/화해",
  "갈등 후 대화",
  "경계 존중",
]

export const scenarios = [
  {
    id: "contact-001",
    title: "짧아진 답장",
    tags: ["연락", "감정 공감"],
    summary: "최근 바빠서 연락이 줄어든 상황",
    emotion: "서운함과 불안함",
    need: "관계에 대한 확신",
    messages: [
      { speaker: "partner", text: "요즘은 내가 먼저 연락하지 않으면 연락도 안 하네." },
      { speaker: "me", text: "미안, 요즘 정신이 없었어." },
    ],
    options: [
      { text: "그렇게 느꼈구나. 내가 요즘 소홀했던 것 같아. 미안해.", correct: true },
      { text: "나도 바빴는데 어쩔 수 없었잖아.", feedback: "상대의 감정보다 내 사정을 먼저 설명했어요." },
      { text: "혹시 나한테 마음이 식은 거야?", feedback: "확인되지 않은 결론으로 대화를 크게 만들 수 있어요." },
      { text: "앞으로 매일 아침저녁으로 연락할게.", feedback: "감정 확인보다 해결책을 먼저 약속했어요." },
    ],
  },
  {
    id: "date-002",
    title: "기대와 다른 저녁",
    tags: ["데이트 태도", "감정 공감"],
    summary: "기대했던 데이트가 빠르게 끝날 것 같은 상황",
    emotion: "아쉬움과 서운함",
    need: "함께 보내는 시간의 의미",
    messages: [
      { speaker: "partner", text: "오늘은 여기까지만 하고 들어갈까? 내일 일찍 일어나야 해서." },
      { speaker: "me", text: "응… 알겠어." },
    ],
    options: [
      { text: "아쉬웠구나. 오늘 같이 있고 싶었던 마음이 있었던 것 같아. 미안해.", correct: true },
      { text: "그럼 다음에 더 길게 만나면 되지.", feedback: "다음 계획보다 지금 느끼는 아쉬움을 먼저 살펴볼 수 있어요." },
      { text: "나랑 있는 게 재미없어진 거야?", feedback: "상대의 일정에서 관계의 결론으로 너무 빨리 건너뛰었어요." },
      { text: "알았어. 다음부터는 네 일정에 맞춰서만 보자.", feedback: "서운함이 전부 포기하는 말로 바뀌었어요." },
    ],
  },
  {
    id: "apology-003",
    title: "늦어진 사과",
    tags: ["사과/화해", "갈등 후 대화"],
    summary: "감정이 올라간 뒤 대화를 다시 시작하는 상황",
    emotion: "경계와 서운함",
    need: "안전하게 존중받는 대화",
    messages: [
      { speaker: "partner", text: "아까 말은 아직 마음에 남아 있어." },
      { speaker: "me", text: "그 정도로 심각한 말은 아니었는데…" },
    ],
    options: [
      { text: "내 의도와 달리 상처가 됐구나. 그 부분은 미안해. 네가 괜찮아질 때까지 들을게.", correct: true },
      { text: "그럼 네가 예민하게 받아들인 거 아닐까?", feedback: "상대가 느낀 상처를 판단하는 말이 될 수 있어요." },
      { text: "일단 우리 둘 다 진정하고 나중에 얘기하자.", feedback: "잠시 쉬는 것도 좋지만, 지금 감정 확인이 먼저 필요해요." },
      { text: "내가 뭘 어떻게 더 해야 하는데?", feedback: "상대에게 해결 방법을 바로 요구하는 말이 됐어요." },
    ],
  },
]
