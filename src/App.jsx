import { useMemo, useState } from "react"
import { categories, scenarios } from "./data/scenarios"
import {
  defaultUser,
  loadHistory,
  loadSavedExpressions,
  loadUser,
  saveExpression,
  saveHistory,
  saveUser,
} from "./lib/storage"

const tabs = [
  ["home", "홈", "⌂"],
  ["practice", "연습", "◇"],
  ["league", "리그", "♛"],
  ["profile", "사용자", "◉"],
]

function App() {
  const [page, setPage] = useState("landing")
  const [user, setUser] = useState(loadUser)
  const [history, setHistory] = useState(loadHistory)
  const [savedExpressions, setSavedExpressions] = useState(loadSavedExpressions)
  const [selectedCategories, setSelectedCategories] = useState([])
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const [stage, setStage] = useState(0)
  const [score, setScore] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [lastResult, setLastResult] = useState(null)

  const scenario = scenarios[scenarioIndex]
  const bestScore = history.length ? Math.max(...history.map((item) => item.score)) : 0
  const rank = history.length ? Math.max(1, 12 - history.length) : "--"
  const matchingScenarios = useMemo(
    () => scenarios.filter((item) => selectedCategories.some((tag) => item.tags.includes(tag))),
    [selectedCategories],
  )

  function go(nextPage) {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function startGame() {
    const nextScenario = matchingScenarios[0] ?? scenarios[0]
    setScenarioIndex(scenarios.indexOf(nextScenario))
    setStage(0)
    setScore(0)
    setWrongCount(0)
    setFeedback("")
    go("chat")
  }

  function finishGame(finalScore, success) {
    const result = { score: finalScore, stage: stage + 1, success, scenario: scenario.title, createdAt: new Date().toISOString() }
    setLastResult(result)
    setHistory(saveHistory(result))
    go("result")
  }

  function chooseOption(option) {
    if (!option.correct) {
      const nextWrongCount = wrongCount + 1
      setWrongCount(nextWrongCount)
      setFeedback(option.feedback)
      if (nextWrongCount >= 2) finishGame(score, false)
      return
    }

    const nextScore = score + 100
    setFeedback("상대의 감정을 먼저 확인하고 마음에 가까운 반응을 골랐어요.")
    if (stage >= scenarios.length - 1) finishGame(nextScore, true)
    else {
      setScore(nextScore)
      setStage(stage + 1)
      setScenarioIndex((scenarioIndex + 1) % scenarios.length)
      setWrongCount(0)
    }
  }

  function updateProfile(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const nextUser = { ...user, nickname: form.get("nickname") || defaultUser.nickname, mbti: form.get("mbti") || "미설정", relationshipLength: form.get("relationshipLength") || "" }
    setUser(nextUser)
    saveUser(nextUser)
    go("profile")
  }

  function toggleCategory(category) {
    setSelectedCategories((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category])
  }

  function saveRecommendedExpression() {
    const expression = scenario.options.find((option) => option.correct)?.text
    saveExpression(expression)
    setSavedExpressions(loadSavedExpressions())
  }

  if (page === "landing") return <Landing onStart={() => go("home")} onProfile={() => go("profile")} />
  if (page === "chat") return <Chat scenario={scenario} stage={stage} score={score} wrongCount={wrongCount} feedback={feedback} onChoose={chooseOption} onExit={() => go("home")} />
  if (page === "result") return <Result result={lastResult} saved={savedExpressions.includes(scenario.options.find((option) => option.correct)?.text)} onSave={saveRecommendedExpression} onHome={() => go("home")} onReplay={startGame} />

  return (
    <Shell page={page} onNavigate={go}>
      {page === "home" && <Home user={user} history={history} onStart={startGame} />}
      {page === "practice" && <Practice selected={selectedCategories} onToggle={toggleCategory} onStart={startGame} />}
      {page === "league" && <League history={history} bestScore={bestScore} rank={rank} />}
      {page === "profile" && <Profile user={user} savedExpressions={savedExpressions} onSubmit={updateProfile} />}
    </Shell>
  )
}

function Landing({ onStart, onProfile }) {
  return <main className="phone-shell landing-shell"><section className="landing"><div className="landing-logo">♡</div><p className="eyebrow">RELATIONSHIP COMMUNICATION GAME</p><h1>연애<br /><span>디펜스</span></h1><p className="landing-lead">상대방의 속마음을 읽고<br />우리의 대화를 지켜내는 게임</p><div className="landing-preview"><span>“내가 먼저 연락하지 않으면 연락도 안 하네.”</span><b>어떤 말이 마음에 닿을까요?</b></div><button className="button button-primary button-large button-wide" onClick={onStart}>게임 시작하기 <span>→</span></button><button className="text-button" onClick={onProfile}>내 성향 먼저 설정하기 <span>↗</span></button></section></main>
}

function Shell({ page, onNavigate, children }) {
  return <main className="phone-shell"><div className="app-scroll">{children}</div><nav className="bottom-tabs">{tabs.map(([id, label, icon]) => <button className={`bottom-tab ${page === id ? "is-active" : ""}`} key={id} onClick={() => onNavigate(id)}><span>{icon}</span><small>{label}</small></button>)}</nav></main>
}

function PageHeader({ eyebrow, title, copy, mark }) {
  return <header className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{copy}</p></div><span className="header-mark">{mark}</span></header>
}

function Home({ user, history, onStart }) {
  const latest = history[0]
  return <><PageHeader eyebrow="LOVE DEFENSE" title={`안녕, ${user.nickname}`} copy="오늘도 대화의 마음을 천천히 살펴봐요." mark="✦" /><section className="hero-card"><div><p className="eyebrow">TODAY'S MISSION</p><h2>오늘의 일일 데이트</h2><p>상대의 감정을 먼저 읽고<br />마음에 닿는 말을 골라보세요.</p><button className="button button-light" onClick={onStart}>플레이하기 <span>→</span></button></div><div className="hero-orb">♡</div></section><section className="stats-row"><div className="mini-stat"><span>오늘의 방어력</span><strong>{latest?.score ?? 100}</strong><small>관계 HP</small></div><div className="mini-stat"><span>최근 점수</span><strong>{latest?.score ?? "--"}</strong><small>점수 / 100</small></div></section><section className="section-heading"><div><p className="eyebrow">CHECK POINT</p><h2>오늘의 대화 레이더</h2></div><span className="status-dot">●</span></section><article className="info-card accent-blue"><span className="card-icon">!</span><div><h3>오늘의 위험 포인트</h3><p>공감보다 해결책을 먼저 말하는 습관을 잠깐 멈춰보세요.</p></div></article><article className="summary-card"><div className="summary-top"><div><p className="eyebrow">RECENT RESULT</p><h3>최근 플레이 리포트</h3></div><span className="text-button">최근 기록</span></div><div className="summary-metrics"><div><strong>{latest?.score ?? "--"}</strong><span>점수</span></div><div><strong>{latest?.stage ?? "--"}</strong><span>Stage</span></div><div><strong>{history.length || "--"}</strong><span>플레이</span></div></div></article></>
}

function Practice({ selected, onToggle, onStart }) {
  return <><PageHeader eyebrow="TRAINING ROOM" title="연습" copy="지금 필요한 대화 장면을 골라보세요." mark="✦" /><section className="practice-hero"><div><span className="pill pill-dark">{categories.length}가지 주제</span><h2>다양한 상황 연습</h2><p>한 장면씩 천천히<br />대화 감각을 키워보세요.</p></div><div className="practice-spark">✧</div></section><section className="section-block"><div className="section-heading"><div><p className="eyebrow">CHOOSE A TOPIC</p><h2>상황 카테고리</h2></div><span className="selection-count">{selected.length} / {categories.length}</span></div><div className="tag-list">{categories.map((category) => <button className={`tag ${selected.includes(category) ? "is-selected" : ""}`} key={category} onClick={() => onToggle(category)}>{category}</button>)}</div><button className="button button-primary button-wide" onClick={onStart}>선택한 상황 연습하기 <span>→</span></button></section><section className="section-block"><div className="section-heading"><div><p className="eyebrow">TRAINING TIP</p><h2>마음에 먼저 닿기</h2></div></div><p className="section-note">좋은 대화는 정답을 빨리 찾는 것보다, 상대가 어떤 감정인지 잠시 머무는 데서 시작해요.</p></section></>
}

function Chat({ scenario, stage, score, wrongCount, feedback, onChoose, onExit }) {
  return <main className="chat-page"><div className="chat-app"><header className="chat-header"><button className="chat-back" onClick={onExit}>‹</button><div className="chat-title"><span className="online-dot" /><div><strong>AI 데이트 코치</strong><small>STAGE {stage + 1} · {score} POINTS</small></div></div><button className="chat-exit" onClick={onExit}>종료</button></header><div className="stage-track"><span style={{ width: `${((stage + 1) / scenarios.length) * 100}%` }} /></div><section className="chat-context"><span className="context-kicker">CURRENT SCENE</span><strong>{scenario.title}</strong><small>{scenario.summary}</small></section><section className="message-list">{scenario.messages.map((message, index) => <div className={`message ${message.speaker}`} key={`${message.text}-${index}`}>{message.text}</div>)}</section>{feedback && <section className="feedback-panel">{feedback}</section>}<section className="option-panel"><div className="choice-heading"><span>HOW WILL YOU RESPOND?</span><small>가장 마음에 가까운 말을 골라보세요 · 오답 {wrongCount}/2</small></div><div className="option-list">{scenario.options.map((option) => <button className="option-button" key={option.text} onClick={() => onChoose(option)}>{option.text}<span>→</span></button>)}</div></section></div></main>
}

function Result({ result, saved, onSave, onHome, onReplay }) {
  return <main className="phone-shell result-shell"><section className="result-hero"><p className="eyebrow">{result?.success ? "DEFENSE COMPLETE" : "A LITTLE PAUSE"}</p><div className="result-orbit"><span>{result?.score ?? 0}</span><small>POINTS</small></div><h1>{result?.success ? "대화 방어 성공!" : "다음에는 마음을 먼저"}</h1><p>{result?.success ? "상대의 감정을 확인하고 마음에 가까운 반응을 골랐어요." : "괜찮아요. 한 번 더 천천히 살펴볼 수 있어요."}</p></section><section className="result-summary"><div><span>클리어 Stage</span><strong>{result?.stage ?? 0}</strong></div><div><span>상황</span><strong>{result?.scenario ?? "-"}</strong></div></section><section className="recommend-card"><p className="eyebrow">RECOMMENDED PHRASE</p><blockquote>“그렇게 느꼈구나. 네 마음을 먼저 듣고 싶어.”</blockquote><button className="button button-secondary button-wide" onClick={onSave}>{saved ? "저장했어요 ✓" : "추천 표현 저장"}</button></section><div className="result-actions"><button className="button button-primary button-wide" onClick={onHome}>홈으로</button><button className="button button-secondary button-wide" onClick={onReplay}>다시 플레이</button></div></main>
}

function League({ history, bestScore, rank }) {
  return <><PageHeader eyebrow="WEEKLY LEAGUE" title="리그" copy="이번 주 대화 방어력을 확인해보세요." mark="♛" /><section className="league-card"><div className="league-badge">◆</div><div><span className="pill pill-light">CURRENT TIER</span><h2>{bestScore >= 300 ? "골드 리그" : "실버 리그"}</h2><p><strong>{bestScore}</strong> DEFENSE POINTS</p></div></section><section className="rank-summary"><div><span>최고 점수</span><strong>{bestScore}</strong></div><div><span>내 순위</span><strong>{rank}</strong></div><div><span>총 플레이</span><strong>{history.length}</strong></div></section><section className="section-block"><div className="section-heading"><div><p className="eyebrow">MY RECORD</p><h2>최근 플레이</h2></div></div>{history.length ? history.slice(0, 5).map((item) => <div className="history-row" key={item.id}><span>{item.scenario}</span><strong>{item.score}점</strong></div>) : <p className="section-note">첫 플레이를 시작하면 여기에 기록이 쌓여요.</p>}</section></>
}

function Profile({ user, savedExpressions, onSubmit }) {
  return <><PageHeader eyebrow="MY SPACE" title="사용자" copy="나에게 맞는 대화 연습을 설계해요." mark="◉" /><section className="profile-card"><div className="avatar">☆</div><div><h2>{user.nickname}</h2><p>{user.mbti} · {user.expression}</p></div></section><section className="section-block"><div className="section-heading"><div><p className="eyebrow">PERSONAL SETTINGS</p><h2>내 성향</h2></div></div><form className="profile-form" onSubmit={onSubmit}><label>닉네임<input name="nickname" defaultValue={user.nickname} maxLength="12" required /></label><label>MBTI<input name="mbti" defaultValue={user.mbti} maxLength="4" /></label><label>연애 기간<input name="relationshipLength" defaultValue={user.relationshipLength} placeholder="예: 6개월" /></label><button className="button button-primary button-wide" type="submit">내 성향 저장하기</button></form></section><section className="section-block"><div className="section-heading"><div><p className="eyebrow">SAVED PHRASES</p><h2>저장한 추천 표현</h2></div></div>{savedExpressions.length ? savedExpressions.map((expression) => <blockquote className="saved-phrase" key={expression}>{expression}</blockquote>) : <p className="section-note">플레이 후 마음에 드는 표현을 저장해보세요.</p>}</section></>
}

export default App
