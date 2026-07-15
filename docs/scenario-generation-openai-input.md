# 상황 생성 시 OpenAI에 전달되는 입력

이 문서는 `supabase/functions/generate-stage`가 상황 생성을 요청할 때 사용하는 기본 입력 예시다.

## 1. 옵션 설계도

`optionBlueprints`가 없거나 형식이 올바르지 않으면 아래 기본 설계도가 사용된다. OpenAI에는 네 개의 슬롯이 전달되며, 각 슬롯에 맞는 자연스러운 선택지를 하나씩 작성하도록 지시한다.

| slot | label | c | e | u | p |
|---|---|---:|---:|---:|---:|
| `best` | `emotion-first validation` | 1 | 1 | 1 | 1 |
| `emotionMismatch` | `solution before empathy` | 1 | 0 | 1 | 0 |
| `contextMismatch` | `misses the immediate context` | 0 | 1 | 0 | 0 |
| `communicationMismatch` | `unclear or indirect communication` | 0 | 0 | 1 | 0 |

프롬프트의 `Blueprints` 영역에는 `slot`과 `label`이 전달되고, `Request` JSON에는 위 설계도의 전체 필드가 포함된다. `c/e/u/p` 값은 프로그램이 소유하며 OpenAI가 새로 만들거나 수정하지 않는다.

## 2. 사용자·파트너 정보 예시

현재 저장소의 기본 프로필 기준 예시는 다음과 같다.

```json
{
  "userProfile": {
    "nickname": "별이",
    "gender": "female",
    "mbti": "INFP",
    "expression": "직접 표현형",
    "tendency": "감정을 천천히 확인하고 진심을 전하는 편",
    "relationshipLength": ""
  },
  "partnerProfile": {
    "nickname": "연인",
    "gender": "male",
    "mbti": "INFJ",
    "tendency": "마음을 오래 참다가 조심스럽게 털어놓는 편"
  },
  "characterProfile": {
    "characterId": "partner",
    "name": "연인",
    "relationshipRole": "대화 상대",
    "personalitySummary": "상황을 가볍게 넘기려다 뒤늦게 감정을 알아차리는 사람",
    "speechStyle": "자연스러운 반말"
  }
}
```

## 3. OpenAI 요청에 들어가는 전체 형태 예시

실제 호출에서는 위 정보와 함께 최근 대화, 이전 조언, 중복 회피용 최근 상황 등이 `Request` JSON으로 전달된다.

```json
{
  "userProfile": {
    "nickname": "별이",
    "gender": "female",
    "mbti": "INFP",
    "expression": "직접 표현형",
    "tendency": "감정을 천천히 확인하고 진심을 전하는 편",
    "relationshipLength": ""
  },
  "partnerProfile": {
    "nickname": "연인",
    "gender": "male",
    "mbti": "INFJ",
    "tendency": "마음을 오래 참다가 조심스럽게 털어놓는 편"
  },
  "partnerGender": "male",
  "characterProfile": {
    "characterId": "partner",
    "name": "연인",
    "relationshipRole": "대화 상대",
    "personalitySummary": "상황을 가볍게 넘기려다 뒤늦게 감정을 알아차리는 사람",
    "speechStyle": "자연스러운 반말"
  },
  "recentMessages": [],
  "previousAdvice": [],
  "recentScenariosToAvoid": [],
  "optionBlueprints": [
    { "slot": "best", "label": "emotion-first validation", "c": 1, "e": 1, "u": 1, "p": 1 },
    { "slot": "emotionMismatch", "label": "solution before empathy", "c": 1, "e": 0, "u": 1, "p": 0 },
    { "slot": "contextMismatch", "label": "misses the immediate context", "c": 0, "e": 1, "u": 0, "p": 0 },
    { "slot": "communicationMismatch", "label": "unclear or indirect communication", "c": 0, "e": 0, "u": 1, "p": 0 }
  ]
}
```

> 참고: `generate-stage` 함수는 호출자가 넘긴 요청을 그대로 기반으로 프롬프트를 만든다. 따라서 실제 호출자가 특정 프로필 필드를 생략하면 해당 필드는 OpenAI에 전달되지 않는다.
