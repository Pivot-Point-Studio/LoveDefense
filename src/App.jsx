import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { categories } from "./data/scenarios";
import { bootstrapApp } from "./appBootstrap";
import {
  defaultUser,
  loadHistory,
  loadPartner,
  loadSavedExpressions,
  loadUser,
  removeSavedExpression,
  saveExpression,
  saveHistory,
  savePartner,
  saveUser,
} from "./lib/storage";
import {
  getDialogueDiversityState,
  getProfile,
  saveDialogueDiversityState,
  upsertProfile,
} from "./backend/repositories/profileRepository";
import {
  deleteExpression as deleteServerExpression,
  getSavedExpressions,
  saveExpression as saveServerExpression,
} from "./backend/repositories/expressionRepository";
import {
  createGameSession,
  finalizeGameSession,
  saveStageResult,
} from "./backend/repositories/gameRepository";
import { friendlyError, supabase } from "./backend/client/supabaseClient";
import { enqueueSync } from "./backend/services/syncService";
import { clamp, conflictStatus, stageDefinitions } from "./game/stageModel.js";
import { judgment } from "./game/turnEvaluator.js";
import {
  evaluateTurn,
  generatePartnerReaction,
} from "./game/turnEvaluationService.js";
import {
  calculateStageDeltas,
  getNextStageNumber,
  getStageClearResult,
  getStageDifficulty,
  getStageSensitivity,
  normalizeConversationDifficulty,
  resolveStageInitialState,
  STAGE_COUNT,
} from "./game/stageDifficulty.js";
import {
  countUserInputCharacters,
  validateUserInput,
} from "./game/inputValidation.js";
import {
  hasDesktopChatKeyboard,
  shouldSubmitChatOnEnter,
} from "./game/chatKeyboard.js";
import { isAwayFromLatest, scrollToLatest } from "./game/chatScroll.js";
import {
  completeConversation,
  loadActiveConversation,
  loadCompletedConversations,
  loadLeagueProgress,
  saveActiveConversation,
  updateLeagueProgress,
} from "./game/conversationStorage.js";
import { mbtiTypes } from "./data/mbti.js";
import logo from "./assets/brand/love-defense.svg";
import { buildStageScenario } from "./game/relationshipScenarioService.js";
import {
  getLocalProfileId,
  loadDiversityState,
  recordGameCombination,
  recordPartnerDialogue,
  recordSuggestedResponse,
  saveDiversityState,
} from "./game/dialogueDiversity.js";
import {
  canAcknowledgeStage,
  canSubmitTurn,
  createScenarioSnapshot,
  createStageTransition,
  openStageIntro,
  RESOLUTION_STATE,
  resolveConversationState,
  scenarioSummaryText,
  SCENARIO_ENDED_MESSAGE,
  SCENARIO_STARTED_MESSAGE,
  STAGE_STATUS,
} from "./game/stageFlow.js";
import {
  isAnonymousUser,
  onAuthStateChanged,
  signInWithGoogleAccount,
  signOutCurrentUser,
} from "./backend/auth/authService.js";
import {
  getPartnerProfile,
  upsertPartnerProfile,
} from "./backend/repositories/partnerProfileRepository.js";

const tabs = [
  ["home", "홈", "⌂"],
  ["practice", "연습", "✦"],
  ["league", "리그", "♛"],
  ["profile", "사용자", "◉"],
];
const tendencyOptions = [
  {
    value: "해결 중심형",
    description: "감정보다 원인과 해결 방법을 먼저 찾는 편",
  },
  {
    value: "공감 중심형",
    description: "해결책보다 감정을 이해받는 것을 중요하게 여기는 편",
  },
  {
    value: "직접 표현형",
    description: "서운함과 원하는 점을 바로 솔직하게 말하는 편",
  },
  {
    value: "감정 축적형",
    description: "갈등을 피하며 참다가 감정을 한꺼번에 표현하는 편",
  },
  {
    value: "관계 밀착형",
    description: "잦은 연락과 애정 표현에서 안정감을 느끼는 편",
  },
  {
    value: "독립 공간형",
    description: "혼자 생각할 시간과 개인 공간을 중요하게 여기는 편",
  },
];
function normalizeTendency(value = "") {
  if (tendencyOptions.some((option) => option.value === value)) return value;
  if (/해결|분석|논리/.test(value)) return "해결 중심형";
  if (/참|쌓|오래/.test(value)) return "감정 축적형";
  if (/연락|애정 표현/.test(value)) return "관계 밀착형";
  if (/혼자|공간|독립/.test(value)) return "독립 공간형";
  if (/바로|솔직|직접/.test(value)) return "직접 표현형";
  return "공감 중심형";
}
const tendencyAdvice = {
  "해결 중심형":
    "해결책을 말하기 전에 상대의 감정을 한 문장으로 확인해 보세요.",
  "공감 중심형":
    "공감받고 싶은 마음을 상대가 추측하게 두지 말고 원하는 반응을 구체적으로 알려주세요.",
  "직접 표현형":
    "솔직함은 강점이지만 상대가 생각할 시간을 가질 수 있도록 말의 속도를 조절해 보세요.",
  "감정 축적형":
    "서운함이 커지기 전에 작은 감정을 짧고 부드럽게 표현하는 연습이 필요해요.",
  "관계 밀착형":
    "연락의 양만으로 애정을 판단하기보다 서로 가능한 연락 방식을 함께 정해 보세요.",
  "독립 공간형":
    "혼자 정리할 시간이 필요할 때는 다시 대화할 시점도 함께 알려주세요.",
};
function buildRelationshipAdvice(user, partner) {
  const userType = normalizeTendency(user.tendency);
  const partnerType = normalizeTendency(partner.tendency);
  return [
    `${user.nickname}님은 ${userType}, ${partner.nickname}님은 ${partnerType}에 가까워요.`,
    tendencyAdvice[userType],
    tendencyAdvice[partnerType],
    "서로의 방식 중 하나가 정답이라고 보기보다, 필요한 반응을 짧고 구체적으로 확인해 보세요.",
  ];
}
const genderLabel = (gender) =>
  gender === "male" ? "남성" : gender === "female" ? "여성" : "성별 미설정";
const genderIcon = (gender) =>
  gender === "male" ? "♂" : gender === "female" ? "♀" : "•";
const now = () => new Date().toISOString();
const makeMessage = ({
  conversationId,
  stageId,
  stageNumber,
  turnNumber,
  sender,
  senderName,
  text,
  gender,
  metadata = {},
}) => ({
  id: crypto.randomUUID(),
  conversationId,
  stageId,
  stageNumber,
  turnNumber,
  sender,
  senderName,
  text,
  createdAt: now(),
  metadata: { ...(gender ? { gender } : {}), ...metadata },
});
const THEME_STORAGE_KEY = "love-defense-theme";
const getInitialTheme = () => {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  return saved === "light" || saved === "dark"
    ? saved
    : window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
};
const readPartnerNotes = (notes) => {
  try {
    const parsed = JSON.parse(notes ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};
const partnerFromServer = (row, fallback) => {
  const notes = readPartnerNotes(row?.notes);
  return {
    ...fallback,
    nickname: row?.display_name ?? notes.nickname ?? fallback.nickname,
    gender: notes.gender ?? fallback.gender,
    mbti: notes.mbti ?? fallback.mbti,
    tendency: notes.tendency ?? fallback.tendency,
  };
};
const partnerServerPayload = (profile) => ({
  display_name: profile.nickname,
  notes: JSON.stringify({
    nickname: profile.nickname,
    gender: profile.gender,
    mbti: profile.mbti,
    tendency: profile.tendency,
  }),
});

export default function App() {
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState("landing");
  const [theme, setTheme] = useState(getInitialTheme);
  const [authUser, setAuthUser] = useState(null);
  const [user, setUser] = useState(() => ({ ...defaultUser, ...loadUser() }));
  const [partner, setPartner] = useState(loadPartner);
  const [history, setHistory] = useState(loadHistory);
  const [savedExpressions, setSavedExpressions] = useState(() =>
    loadSavedExpressions().map((text) =>
      typeof text === "string" ? { text, createdAt: now() } : text,
    ),
  );
  const [activeConversation, setActiveConversation] = useState(() =>
    normalizeConversationDifficulty(loadActiveConversation()),
  );
  const [completedConversations, setCompletedConversations] = useState(
    loadCompletedConversations,
  );
  const [readOnlyConversation, setReadOnlyConversation] = useState(null);
  const [leagueProgress, setLeagueProgress] = useState(loadLeagueProgress);
  const [selected, setSelected] = useState([]);
  const [status, setStatus] = useState("");
  const [configNote, setConfigNote] = useState("");
  const [resultSnapshot, setResultSnapshot] = useState(null);
  const [diversityState, setDiversityState] = useState(() =>
    loadDiversityState(),
  );
  const [profileOnboardingOpen, setProfileOnboardingOpen] = useState(false);
  const [profileOnboardingSaving, setProfileOnboardingSaving] = useState(false);
  const [profileOnboardingError, setProfileOnboardingError] = useState("");
  const turnRequestInFlight = useRef(false);
  const scenarioRequestInFlight = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error_code");
    if (oauthError) {
      setStatus(
        oauthError === "identity_already_exists"
          ? "이 Google 계정은 이미 등록되어 있어요. '기존 Google 계정으로 로그인'을 이용해주세요."
          : (params.get("error_description") ??
              "Google 인증을 완료하지 못했어요."),
      );
      window.history.replaceState({}, "", window.location.pathname);
    } else if (window.location.hash === "#")
      window.history.replaceState({}, "", window.location.pathname);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#050509" : "#ffffff");
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);
  useEffect(() => {
    (async () => {
      const splashStartedAt = performance.now();
      const boot = await bootstrapApp("love-defense");
      setAuthUser(boot.user);
      if (boot.error) setConfigNote(friendlyError(boot.error));
      else if (supabase) {
        const p = await getProfile();
        if (p.data)
          setUser((value) => ({
            ...value,
            nickname: p.data.nickname ?? value.nickname,
            mbti: p.data.mbti ?? value.mbti,
            gender: p.data.gender ?? value.gender,
            tendency: p.data.tendency ?? value.tendency,
          }));
        const remotePartner = await getPartnerProfile();
        if (remotePartner.data)
          setPartner((value) => partnerFromServer(remotePartner.data, value));
        const remoteDiversity =
          p.data?.dialogue_diversity ??
          (await getDialogueDiversityState()).data;
        if (remoteDiversity && Object.keys(remoteDiversity).length)
          setDiversityState(
            saveDiversityState(remoteDiversity, getLocalProfileId()),
          );
        const expressions = await getSavedExpressions();
        if (!expressions.error)
          setSavedExpressions(
            expressions.data.map((item) => ({
              id: item.id,
              text: item.expression_text,
              createdAt: item.created_at,
              source: item.scenario_title,
            })),
          );
      }
      const remainingSplashTime = 1500 - (performance.now() - splashStartedAt);
      if (remainingSplashTime > 0)
        await new Promise((resolve) =>
          setTimeout(resolve, remainingSplashTime),
        );
      setReady(true);
    })();
  }, []);
  useEffect(() => {
    const subscription = onAuthStateChanged((nextUser) =>
      setAuthUser(nextUser),
    );
    return () => subscription?.data?.subscription?.unsubscribe?.();
  }, []);
  useEffect(() => {
    if (activeConversation) saveActiveConversation(activeConversation);
  }, [activeConversation]);
  useEffect(() => {
    if (
      activeConversation?.stageStatus !== STAGE_STATUS.TRANSITION ||
      !activeConversation.transitionOverlay?.readyAt
    )
      return undefined;
    const { id, pendingStageNumber, transitionOverlay } = activeConversation;
    const timer = setTimeout(
      () =>
        setActiveConversation((current) => {
          if (
            !current ||
            current.id !== id ||
            current.stageStatus !== STAGE_STATUS.TRANSITION ||
            current.pendingStageNumber !== pendingStageNumber
          )
            return current;
          return { ...openStageIntro(current), updatedAt: now() };
        }),
      Math.max(0, Number(transitionOverlay.readyAt) - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [activeConversation]);
  const go = (next) => {
    setPage(next);
    setReadOnlyConversation(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  async function startGame() {
    const id = crypto.randomUUID();
    const currentDiversity = loadDiversityState(getLocalProfileId());
    const config = getStageDifficulty(1);
    const state = resolveStageInitialState(null, 1);
    const conversation = {
      id,
      status: "active",
      createdAt: now(),
      updatedAt: now(),
      title: "새 대화",
      stages: [],
      scenarioContext: { stageScenarios: [] },
      diversityState: currentDiversity,
      userProfileSnapshot: {
        nickname: user.nickname,
        gender: user.gender,
        mbti: user.mbti,
        tendency: user.tendency,
      },
      partnerProfileSnapshot: {
        nickname: partner.nickname,
        gender: partner.gender,
        mbti: partner.mbti,
        tendency: partner.tendency,
      },
      currentStageId: null,
      currentScenario: null,
      currentStageNumber: 1,
      currentTurn: 1,
      currentStageTurnCount: config.turnCount,
      currentStageDifficulty: config,
      resolutionState: RESOLUTION_STATE.UNRESOLVED,
      relationshipHp: state.relationshipHp,
      conflictLevel: state.conflictLevel,
      stability: state.stability,
      trust: state.trust,
      adviceItems: [],
      messages: [],
      turnHistory: [],
      stageResults: [],
      score: 0,
      ...createStageTransition(1),
    };
    setDiversityState(currentDiversity);
    setActiveConversation(conversation);
    setStatus("");
    go("chat");
    if (supabase) {
      const created = await createGameSession({
        client_session_id: id,
        mode: "practice",
        difficulty: "normal",
        blame_side: "partner",
        selected_categories: selected,
        started_at: conversation.createdAt,
        total_stages_played: STAGE_COUNT,
      });
      if (created.error) enqueueSync("SAVE_GAME_RESULT", { operationId: id });
      else
        setActiveConversation((current) =>
          current?.id === id
            ? { ...current, serverSessionId: created.data.id }
            : current,
        );
    }
  }
  async function acknowledgeStageIntro() {
    const before = activeConversation;
    if (scenarioRequestInFlight.current || !canAcknowledgeStage(before))
      return { ignored: true };
    scenarioRequestInFlight.current = true;
    setActiveConversation((current) =>
      current?.id === before.id
        ? {
            ...current,
            isGeneratingScenario: true,
            scenarioGenerationError: "",
          }
        : current,
    );
    try {
      await Promise.resolve();
      const stageNumber =
        before.pendingStageNumber ?? before.currentStageNumber;
      const usedCombinations = (before.stages ?? [])
        .filter(Boolean)
        .map((stage) => ({ combination: stage.scenarioCombination }));
      const generated = buildStageScenario({
        partnerGender: partner.gender,
        stageNumber,
        recentGameCombinations:
          before.diversityState?.recentGameCombinations ?? [],
        usedCombinations,
      });
      const stage = generated.stage;
      const config = getStageDifficulty(stageNumber);
      const state = resolveStageInitialState(stage, stageNumber);
      const scenario = createScenarioSnapshot(stage);
      const stages = [...(before.stages ?? [])];
      stages[stageNumber - 1] = stage;
      const messages = [
        ...before.messages,
        makeMessage({
          conversationId: before.id,
          stageId: stage.id,
          stageNumber,
          turnNumber: 1,
          sender: "system",
          senderName: "시스템",
          text: SCENARIO_STARTED_MESSAGE,
          metadata: { systemType: "scenario_started" },
        }),
        makeMessage({
          conversationId: before.id,
          stageId: stage.id,
          stageNumber,
          turnNumber: 1,
          sender: "system",
          senderName: "시스템",
          text: scenarioSummaryText(scenario),
          metadata: { systemType: "scenario_summary" },
        }),
        makeMessage({
          conversationId: before.id,
          stageId: stage.id,
          stageNumber,
          turnNumber: 1,
          sender: "partner",
          senderName: partner.nickname,
          text: stage.turns[0].partnerMessage,
          gender: partner.gender,
        }),
      ];
      setActiveConversation((current) => {
        if (
          !current ||
          current.id !== before.id ||
          current.pendingStageNumber !== stageNumber ||
          current.stageStatus !== STAGE_STATUS.INTRO
        )
          return current;
        const stageScenarios = [
          ...(current.scenarioContext?.stageScenarios ?? []),
          {
            stageNumber,
            scenarioId: stage.id,
            combination: generated.combination,
            signatures: generated.signatures,
            fallbackUsed: generated.fallbackUsed,
          },
        ];
        return {
          ...current,
          updatedAt: now(),
          title: current.title === "새 대화" ? stage.title : current.title,
          stages,
          scenarioContext: { ...current.scenarioContext, stageScenarios },
          currentStageId: stage.id,
          currentScenario: scenario,
          currentStageNumber: stageNumber,
          currentTurn: 1,
          currentStageTurnCount: config.turnCount,
          currentStageDifficulty: config,
          stageStatus: STAGE_STATUS.PLAYING,
          pendingStageNumber: null,
          transitionOverlay: null,
          stageIntroAcknowledged: true,
          stageIntro: { stageNumber, isOpen: false, acknowledged: true },
          isGeneratingScenario: false,
          scenarioGenerationError: "",
          resolutionState: RESOLUTION_STATE.UNRESOLVED,
          relationshipHp: state.relationshipHp,
          conflictLevel: state.conflictLevel,
          stability: stageNumber === 1 ? state.stability : current.stability,
          trust: stageNumber === 1 ? state.trust : current.trust,
          messages,
        };
      });
      return { started: true };
    } catch (error) {
      setActiveConversation((current) =>
        current?.id === before.id
          ? {
              ...current,
              isGeneratingScenario: false,
              scenarioGenerationError:
                error.message ||
                "시나리오를 준비하지 못했습니다. 다시 시도해 주세요.",
            }
          : current,
      );
      return { error: true };
    } finally {
      scenarioRequestInFlight.current = false;
    }
  }
  async function finishConversation(
    conversation,
    statusValue,
    stageClearResult,
  ) {
    const finished = {
      ...conversation,
      stageStatus:
        statusValue === "completed"
          ? STAGE_STATUS.GAME_RESULT
          : STAGE_STATUS.GAME_OVER,
      status: statusValue,
      stageClearResult,
      updatedAt: now(),
      completedAt: now(),
      finalOutcome: statusValue === "completed" ? "positive" : "failure",
    };
    let nextDiversity = finished.diversityState ?? diversityState;
    const stageScenarios = finished.scenarioContext?.stageScenarios ?? [];
    if (stageScenarios.length)
      for (const item of stageScenarios)
        nextDiversity = recordGameCombination(
          nextDiversity,
          `${finished.id}:stage:${item.stageNumber}`,
          item.combination,
          item.signatures,
          finished.completedAt,
        );
    else if (finished.scenarioContext?.combination)
      nextDiversity = recordGameCombination(
        nextDiversity,
        finished.id,
        finished.scenarioContext.combination,
        finished.scenarioContext.signatures,
        finished.completedAt,
      );
    else nextDiversity = saveDiversityState(nextDiversity);
    setDiversityState(nextDiversity);
    const nextCompleted = completeConversation({
      ...finished,
      diversityState: nextDiversity,
    });
    setCompletedConversations(nextCompleted);
    setActiveConversation(null);
    const nextHistory = saveHistory({
      id: finished.id,
      score: finished.score,
      stage: finished.currentStageNumber,
      success: statusValue === "completed",
      scenario: finished.title,
      createdAt: finished.completedAt,
      relationshipHp: finished.relationshipHp,
      conflictLevel: finished.conflictLevel,
      stageClearResult,
    });
    setHistory(nextHistory);
    const nextLeague = updateLeagueProgress(leagueProgress, finished);
    setLeagueProgress(nextLeague);
    if (supabase && finished.serverSessionId)
      await finalizeGameSession(finished.serverSessionId, {
        ended_at: finished.completedAt,
        end_reason:
          statusValue === "completed"
            ? "completed"
            : stageClearResult === "failed_hp_zero"
              ? "hp_zero"
              : "interrupted",
        cleared_stages: finished.stageResults.filter(
          (item) => item.result === "cleared",
        ).length,
        total_score: finished.score,
        is_completed: statusValue === "completed",
      });
    setPage("result");
    setResultSnapshot(finished);
  }
  async function chooseAnswer(text) {
    if (turnRequestInFlight.current)
      return { ignored: true, message: "이미 답변을 처리하고 있어요." };
    const before = activeConversation;
    if (!canSubmitTurn(before))
      return {
        blocked: true,
        message: "현재 STAGE 안내가 끝난 뒤에 답변할 수 있어요.",
      };
    const valid = validateUserInput(text);
    if (!valid.valid) return { invalid: true, message: valid.message };
    const submittedText = valid.value;
    turnRequestInFlight.current = true;
    try {
      const stage =
        before.stages?.[before.currentStageNumber - 1] ??
        stageDefinitions[before.currentStageNumber - 1];
      const config = getStageDifficulty(stage.stageNumber);
      const turn = stage.turns[before.currentTurn - 1];
      const previousAdvice = before.turnHistory
        .map((item) => item.suggestedBetterResponse)
        .filter(Boolean);
      const sessionUserProfile = before.userProfileSnapshot ?? user;
      const sessionPartnerProfile = before.partnerProfileSnapshot ?? partner;
      const context = {
        conversationId: before.id,
        stage,
        turn,
        stageDifficulty: config,
        currentScenario: before.currentScenario,
        resolutionState: before.resolutionState,
        recentMessages: before.messages,
        previousAdvice,
        diversityState: before.diversityState ?? diversityState,
        userProfile: sessionUserProfile,
        partnerProfile: sessionPartnerProfile,
        character: {
          ...sessionPartnerProfile,
          characterProfile: stage.characterProfile,
        },
        gameState: {
          relationshipHp: before.relationshipHp,
          conflictLevel: before.conflictLevel,
          stability: before.stability,
          trust: before.trust,
        },
        previousStageSummary: before.stageResults.at(-1)?.summary,
      };
      const analysis = await evaluateTurn(submittedText, context);
      if (analysis.blocked)
        return {
          blocked: true,
          message:
            "안전과 관련된 표현은 평가할 수 없어요. 다른 말로 다시 입력해 주세요.",
        };
      const deltas = calculateStageDeltas(
        analysis.adjustedScore,
        stage.stageNumber,
      );
      const nextHp = clamp(before.relationshipHp + deltas.hpDelta);
      const nextConflict = clamp(before.conflictLevel + deltas.conflictDelta);
      const nextStability = clamp(
        before.stability + Math.round(analysis.stabilityDelta),
      );
      const nextTrust = clamp(before.trust + Math.round(analysis.trustDelta));
      const resolutionState = resolveConversationState({
        adjustedScore: analysis.adjustedScore,
        relationshipHp: nextHp,
        conflictLevel: nextConflict,
        requiredEndHp: config.requiredEndHp,
        maximumEndConflict: config.maximumEndConflict,
      });
      const userMessage = makeMessage({
        conversationId: before.id,
        stageId: stage.id,
        stageNumber: stage.stageNumber,
        turnNumber: before.currentTurn,
        sender: "user",
        senderName: user.nickname,
        text: submittedText,
        gender: user.gender,
      });
      let dialogue = {
        dialogue: "",
        metadata: {
          source: "rule_fallback",
          openaiAttemptCount: 0,
          fallbackReason: "HP zero immediate failure",
        },
      };
      if (nextHp > 0) {
        if (analysis.partnerDialogue)
          dialogue = {
            dialogue: analysis.partnerDialogue,
            endingMode: analysis.dialogueEndingMode,
            metadata: {
              source: analysis.metadata.source,
              openaiAttemptCount: analysis.metadata.openaiAttemptCount,
              model: analysis.metadata.model,
            },
          };
        else
          dialogue = await generatePartnerReaction(submittedText, analysis, {
            ...context,
            recentMessages: [...before.messages, userMessage],
            gameState: {
              relationshipHp: nextHp,
              conflictLevel: nextConflict,
              stability: nextStability,
              trust: nextTrust,
            },
          });
      }
      const result = {
        stageId: stage.id,
        scenarioId: before.currentScenario.id,
        stageNumber: stage.stageNumber,
        turnNumber: before.currentTurn,
        partnerMessage: turn.partnerMessage,
        userInput: submittedText,
        partnerReaction: dialogue.dialogue,
        resolutionState,
        rawScore: analysis.rawScore,
        adjustedScore: analysis.adjustedScore,
        score: analysis.adjustedScore,
        stageSensitivityPower: analysis.stageSensitivityPower,
        judgment: judgment(analysis.adjustedScore),
        relationshipHpBefore: before.relationshipHp,
        relationshipHpAfter: nextHp,
        relationshipHpDelta: nextHp - before.relationshipHp,
        conflictBefore: before.conflictLevel,
        conflictAfter: nextConflict,
        conflictDelta: nextConflict - before.conflictLevel,
        stabilityBefore: before.stability,
        stabilityAfter: nextStability,
        stabilityDelta: nextStability - before.stability,
        trustBefore: before.trust,
        trustAfter: nextTrust,
        trustDelta: nextTrust - before.trust,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        suggestedBetterResponse: analysis.suggestedBetterResponse,
        riskExpressions: analysis.riskExpressions,
        dimensionScores: analysis.dimensionScores,
        reactionDirection: analysis.reactionDirection,
        evaluationMetadata: analysis.metadata,
        dialogueMetadata: dialogue.metadata,
        analysisSource: analysis.metadata.source,
        createdAt: now(),
      };
      const messages = [...before.messages, userMessage];
      if (dialogue.dialogue)
        messages.push(
          makeMessage({
            conversationId: before.id,
            stageId: stage.id,
            stageNumber: stage.stageNumber,
            turnNumber: before.currentTurn,
            sender: "partner",
            senderName: partner.nickname,
            text: dialogue.dialogue,
            gender: partner.gender,
            metadata: { generationSource: dialogue.metadata.source },
          }),
        );
      let nextDiversity = before.diversityState ?? diversityState;
      if (dialogue.dialogue)
        nextDiversity = recordPartnerDialogue(
          nextDiversity,
          dialogue.dialogue,
          dialogue.endingMode,
        );
      if (analysis.suggestedBetterResponse)
        nextDiversity = recordSuggestedResponse(
          nextDiversity,
          analysis.suggestedBetterResponse,
          analysis.suggestionApproach ?? "general_empathy",
        );
      setDiversityState(nextDiversity);
      if (supabase) saveDialogueDiversityState(nextDiversity).catch(() => {});
      let next = {
        ...before,
        updatedAt: now(),
        diversityState: nextDiversity,
        relationshipHp: nextHp,
        conflictLevel: nextConflict,
        stability: nextStability,
        trust: nextTrust,
        resolutionState,
        score: before.score + analysis.adjustedScore,
        turnHistory: [...before.turnHistory, result],
        latestEvaluation: result,
        lastProcessedTurnKey: `${stage.id}:${before.currentTurn}`,
        messages,
      };
      if (nextHp <= 0) {
        const stageResult = {
          stageNumber: stage.stageNumber,
          result: "failed_hp_zero",
          finalHp: nextHp,
          finalConflict: nextConflict,
          completedAt: now(),
        };
        next = { ...next, stageResults: [...next.stageResults, stageResult] };
        if (supabase && before.serverSessionId)
          await saveStageResult({
            session_id: before.serverSessionId,
            stage_number: stage.stageNumber,
            scenario_id: stage.id,
            scenario_title: stage.title,
            mode: "practice",
            difficulty: "normal",
            category_tags: selected,
            attempt_count: 1,
            wrong_answer_count: 1,
            cleared: false,
            hp_remaining: 0,
            context_score: analysis.dimensionScores.communicationFit,
            emotion_score: analysis.dimensionScores.emotionRecognition,
            communication_score: analysis.dimensionScores.communicationFit,
            non_leap_score: analysis.dimensionScores.relationshipRepair,
            feedback: result,
            stage_payload: {
              turnHistory: next.turnHistory.filter(
                (item) => item.stageNumber === stage.stageNumber,
              ),
              stageResult,
              difficulty: config,
            },
          });
        await finishConversation(next, "failed", stageResult.result);
        return { terminal: true };
      }
      if (before.currentTurn >= config.turnCount) {
        messages.push(
          makeMessage({
            conversationId: before.id,
            stageId: stage.id,
            stageNumber: stage.stageNumber,
            turnNumber: before.currentTurn,
            sender: "system",
            senderName: "시스템",
            text: SCENARIO_ENDED_MESSAGE,
            metadata: { systemType: "scenario_ended" },
          }),
        );
        const clearResult = getStageClearResult(
          nextHp,
          nextConflict,
          stage.stageNumber,
        );
        const stageResult = {
          stageNumber: stage.stageNumber,
          result: clearResult,
          branchOutcome: analysis.reactionDirection,
          finalHp: nextHp,
          finalConflict: nextConflict,
          requiredEndHp: config.requiredEndHp,
          maximumEndConflict: config.maximumEndConflict,
          completedAt: now(),
          summary: `${stage.title}: HP ${nextHp}, 갈등 ${nextConflict}`,
        };
        next = {
          ...next,
          messages,
          stageStatus: STAGE_STATUS.RESULT,
          stageResults: [...next.stageResults, stageResult],
        };
        if (supabase && before.serverSessionId)
          await saveStageResult({
            session_id: before.serverSessionId,
            stage_number: stage.stageNumber,
            scenario_id: stage.id,
            scenario_title: stage.title,
            mode: "practice",
            difficulty: "normal",
            category_tags: selected,
            attempt_count: 1,
            wrong_answer_count: 0,
            cleared: clearResult === "cleared",
            hp_remaining: nextHp,
            context_score: analysis.dimensionScores.communicationFit,
            emotion_score: analysis.dimensionScores.emotionRecognition,
            communication_score: analysis.dimensionScores.communicationFit,
            non_leap_score: analysis.dimensionScores.relationshipRepair,
            feedback: result,
            stage_payload: {
              turnHistory: next.turnHistory.filter(
                (item) => item.stageNumber === stage.stageNumber,
              ),
              stageResult,
              difficulty: config,
            },
          });
        if (clearResult !== "cleared") {
          setActiveConversation(next);
          await new Promise((resolve) => setTimeout(resolve, 800));
          await finishConversation(next, "failed", clearResult);
          return { terminal: true };
        }
        if (stage.stageNumber >= STAGE_COUNT) {
          setActiveConversation(next);
          await new Promise((resolve) => setTimeout(resolve, 800));
          await finishConversation(next, "completed", "cleared");
          return { terminal: true };
        }
        const nextStageNumber = getNextStageNumber(stage.stageNumber);
        if (!nextStageNumber) {
          await finishConversation(next, "failed", "failed_both");
          return { terminal: true };
        }
        setActiveConversation(next);
        await new Promise((resolve) => setTimeout(resolve, 650));
        setActiveConversation((current) =>
          current?.id === before.id &&
          current.stageStatus === STAGE_STATUS.RESULT
            ? {
                ...current,
                ...createStageTransition(nextStageNumber),
                updatedAt: now(),
              }
            : current,
        );
        return { terminal: false, stageAdvanced: true };
      }
      const nextTurn = before.currentTurn + 1;
      setActiveConversation({ ...next, currentTurn: nextTurn, messages });
      return { terminal: false };
    } finally {
      turnRequestInFlight.current = false;
    }
  }
  function addFeedbackMessage() {
    const latest = activeConversation?.latestEvaluation;
    if (!latest || !activeConversation) return { missing: true };
    const exists = activeConversation.messages.some(
      (message) =>
        message.sender === "ai" &&
        message.metadata?.feedbackForTurn === latest.turnNumber &&
        message.stageId === latest.stageId,
    );
    if (exists) return { exists: true };
    const ragRetrieval = latest.evaluationMetadata?.retrieval ?? null;
    const aiMessage = makeMessage({
      conversationId: activeConversation.id,
      stageId: latest.stageId,
      stageNumber: activeConversation.currentStageNumber,
      turnNumber: latest.turnNumber,
      sender: "ai",
      senderName: "AI 데이트 코치",
      text: `${latest.score}점 · ${latest.judgment}\n\n잘한 부분: ${latest.strengths.join(" ") || "대화를 이어가려는 시도였어요."}\n아쉬운 부분: ${latest.weaknesses.join(" ") || "조금 더 구체적으로 마음을 확인해도 좋아요."}\n\n가능한 답변 예시 중 하나입니다.\n“${latest.suggestedBetterResponse}”`,
      metadata: {
        score: latest.score,
        judgment: latest.judgment,
        hpDelta: latest.relationshipHpDelta,
        conflictDelta: latest.conflictDelta,
        strengths: latest.strengths,
        weaknesses: latest.weaknesses,
        suggestedBetterResponse: latest.suggestedBetterResponse,
        feedbackForTurn: latest.turnNumber,
        ragRetrieval,
      },
    });
    setActiveConversation({
      ...activeConversation,
      messages: [...activeConversation.messages, aiMessage],
    });
    return { added: true };
  }
  async function saveSuggested(text, source) {
    if (!text) return;
    const alreadySaved = savedExpressions.some((item) => item.text === text);
    if (!alreadySaved) {
      const local = {
        id: crypto.randomUUID(),
        text,
        createdAt: now(),
        source: source ?? activeConversation?.title,
      };
      setSavedExpressions((items) => [local, ...items]);
      saveExpression(text);
      if (supabase) {
        const saved = await saveServerExpression({
          expression_text: text,
          scenario_title: source ?? activeConversation?.title,
          category_tags: selected,
          source_session_id: activeConversation?.serverSessionId,
        });
        if (saved.error)
          enqueueSync(
            "SAVE_EXPRESSION",
            { expression_text: text },
            saved.error,
          );
      }
    }
    if (activeConversation)
      setActiveConversation((current) => ({
        ...current,
        messages: current.messages.map((message) =>
          message.metadata?.suggestedBetterResponse === text
            ? { ...message, metadata: { ...message.metadata, saved: true } }
            : message,
        ),
      }));
  }
  async function persistProfiles(formElement, { requireServer = false } = {}) {
    const form = new FormData(formElement);
    const nextUser = {
      ...user,
      nickname: String(form.get("nickname") || defaultUser.nickname).trim(),
      gender: form.get("gender") || "female",
      mbti: form.get("mbti") || "INFP",
      tendency: String(form.get("tendency") || "").trim(),
      relationshipLength:
        form.get("relationshipLength") || user.relationshipLength || "",
    };
    const nextPartner = {
      ...partner,
      nickname: String(form.get("partnerNickname") || "연인").trim(),
      gender:
        form.get("partnerGender") ||
        (nextUser.gender === "male" ? "female" : "male"),
      mbti: form.get("partnerMbti") || "INFJ",
      tendency: String(form.get("partnerTendency") || "").trim(),
    };
    if (!supabase) {
      if (requireServer)
        return {
          ok: false,
          error:
            "Supabase 연결이 필요합니다. 연결 상태를 확인한 뒤 다시 밀어 주세요.",
        };
      setUser(nextUser);
      setPartner(nextPartner);
      saveUser(nextUser);
      savePartner(nextPartner);
      enqueueSync("SAVE_PROFILE", nextUser);
      setStatus("기기에 저장했어요. 서버 연결 후 동기화합니다.");
      return { ok: true };
    }
    const [savedUser, savedPartner] = await Promise.all([
      upsertProfile({
        nickname: nextUser.nickname,
        mbti: nextUser.mbti,
        gender: nextUser.gender,
        tendency: nextUser.tendency,
        expression_style:
          nextUser.expression === "간접 표현형" ? "indirect" : "direct",
        relationship_duration: nextUser.relationshipLength,
      }),
      upsertPartnerProfile(partnerServerPayload(nextPartner)),
    ]);
    const saveError = savedUser.error || savedPartner.error;
    if (saveError) {
      if (import.meta.env.DEV)
        console.warn("[Profile] Supabase 프로필 저장 실패, 로컬 저장으로 전환", {
          userError: savedUser.error,
          partnerError: savedPartner.error,
        });
      if (requireServer)
        return {
          ok: false,
          error:
            friendlyError(saveError) ||
            "Supabase에 저장하지 못했습니다. 다시 시도해 주세요.",
        };
      setUser(nextUser);
      setPartner(nextPartner);
      saveUser(nextUser);
      savePartner(nextPartner);
      enqueueSync("SAVE_PROFILE", nextUser, saveError);
      setStatus("기기에 저장했어요. 서버 연결 후 동기화합니다.");
      return { ok: true };
    }
    setUser(nextUser);
    setPartner(nextPartner);
    saveUser(nextUser);
    savePartner(nextPartner);
    setStatus("프로필을 저장했어요.");
    return { ok: true };
  }
  async function updateProfile(event) {
    event.preventDefault();
    await persistProfiles(event.currentTarget);
  }
  function openProfileOnboarding() {
    setPage("home");
    setProfileOnboardingError("");
    setProfileOnboardingOpen(true);
    window.scrollTo({ top: 0 });
  }
  async function saveProfileOnboarding(formElement) {
    setProfileOnboardingSaving(true);
    setProfileOnboardingError("");
    try {
      const result = await persistProfiles(formElement);
      if (!result.ok) {
        setProfileOnboardingError(result.error);
        return false;
      }
      setProfileOnboardingOpen(false);
      return true;
    } catch (error) {
      setProfileOnboardingError(
        friendlyError(error) ||
          "Supabase에 저장하지 못했습니다. 다시 시도해 주세요.",
      );
      return false;
    } finally {
      setProfileOnboardingSaving(false);
    }
  }
  async function connectGoogle() {
    setStatus("Google 로그인을 준비하고 있어요…");
    const signedIn = await signInWithGoogleAccount();
    if (signedIn.error) {
      console.error("[Auth] Google 로그인 실패", signedIn.error);
      setStatus(signedIn.error.message ?? "Google 로그인에 실패했습니다.");
    }
  }
  async function signOutGoogle() {
    const signedOut = await signOutCurrentUser();
    if (signedOut.error) {
      setStatus(signedOut.error.message ?? "로그아웃하지 못했습니다.");
      return;
    }
    window.location.reload();
  }
  if (!ready)
    return (
      <main className="splash-screen" aria-label="연애 디펜스 로딩 중">
        <div className="splash-logo-wrap">
          <img className="splash-logo" src={logo} alt="연애 디펜스" />
        </div>
        <div className="splash-caption">AI-POWERED</div>
      </main>
    );
  if (page === "landing") return <Landing onStart={openProfileOnboarding} />;
  if (page === "chat" && activeConversation)
    return (
      <Chat
        conversation={activeConversation}
        partner={partner}
        onChoose={chooseAnswer}
        onFeedback={addFeedbackMessage}
        onSaveSuggested={saveSuggested}
        onAcknowledgeStage={acknowledgeStageIntro}
        onBack={() => go("home")}
        onHome={() => go("home")}
        onSaved={() => go("profile")}
      />
    );
  if (page === "readonly" && readOnlyConversation)
    return (
      <ReadonlyConversation
        conversation={readOnlyConversation}
        onBack={() => go("home")}
      />
    );
  if (page === "result")
    return (
      <Result
        result={resultSnapshot}
        onHome={() => go("home")}
        onReplay={startGame}
      />
    );
  return (
    <>
      <Shell page={page} onNavigate={go} blocked={profileOnboardingOpen}>
        <>
          {configNote && (
            <p className="offline-note">
              오프라인 모드 · 진행과 저장은 이 기기에 보관됩니다.
            </p>
          )}
          {page === "home" && (
            <Home
              user={user}
              active={activeConversation}
              completed={completedConversations}
              onStart={startGame}
              onResume={() => go("chat")}
              onOpen={(session) => {
                setReadOnlyConversation(session);
                setPage("readonly");
              }}
            />
          )}
          {page === "practice" && (
            <Practice
              selected={selected}
              onToggle={(tag) =>
                setSelected((items) =>
                  items.includes(tag)
                    ? items.filter((item) => item !== tag)
                    : [...items, tag],
                )
              }
              onStart={startGame}
            />
          )}
          {page === "league" && (
            <League history={history} progress={leagueProgress} />
          )}
          {page === "profile" && (
            <Profile
              user={user}
              partner={partner}
              savedExpressions={savedExpressions}
              onSubmit={updateProfile}
              onDelete={async (text) => {
                const item = savedExpressions.find(
                  (entry) => entry.text === text,
                );
                setSavedExpressions((items) =>
                  items.filter((entry) => entry.text !== text),
                );
                removeSavedExpression(text);
                if (supabase && item?.id) await deleteServerExpression(item.id);
              }}
              onCopy={(text) => navigator.clipboard?.writeText(text)}
              status={status}
              theme={theme}
              onToggleTheme={() =>
                setTheme((value) => (value === "dark" ? "light" : "dark"))
              }
              authUser={authUser}
              onConnectGoogle={connectGoogle}
              onSignOut={signOutGoogle}
            />
          )}
        </>
      </Shell>
      {profileOnboardingOpen && (
        <ProfileOnboardingModal
          user={user}
          partner={partner}
          saving={profileOnboardingSaving}
          error={profileOnboardingError}
          onSave={saveProfileOnboarding}
        />
      )}
    </>
  );
}

function Landing({ onStart }) {
  return (
    <main className="phone-shell landing-shell">
      <section className="landing">
        <div className="landing-logo">♡</div>
        <p className="eyebrow">RELATIONSHIP COMMUNICATION GAME</p>
        <h1>
          연애
          <br />
          <span>디펜스</span>
        </h1>
        <p className="landing-lead">
          상대의 마음을 읽고
          <br />
          우리의 대화를 지켜내는 게임
        </p>
        <div className="landing-preview">
          <span>상대가 먼저 연락하지 않으면 서운해.</span>
          <b>어떤 말이 마음에 닿을까요?</b>
        </div>
        <button
          className="button button-primary button-large button-wide"
          onClick={onStart}
        >
          게임 시작하기 <span>→</span>
        </button>
      </section>
    </main>
  );
}
function Shell({ page, onNavigate, children, blocked = false }) {
  return (
    <main
      className="phone-shell"
      inert={blocked}
      aria-hidden={blocked || undefined}
    >
      <div className="app-scroll">{children}</div>
      <nav className="bottom-tabs" aria-label="주요 메뉴">
        {tabs.map(([id, label, icon]) => (
          <button
            className={`bottom-tab ${page === id ? "is-active" : ""}`}
            key={id}
            onClick={() => onNavigate(id)}
            aria-label={`${label} 탭`}
          >
            <span>{icon}</span>
            <small>{label}</small>
          </button>
        ))}
      </nav>
    </main>
  );
}
function PageHeader({ eyebrow, title, copy, mark }) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      <span className="header-mark">{mark}</span>
    </header>
  );
}
function Home({ user, active, completed, onStart, onResume, onOpen }) {
  const turnCount = active
    ? getStageDifficulty(active.currentStageNumber).turnCount
    : 0;
  return (
    <>
      <PageHeader
        eyebrow="연애 디펜스"
        title={`안녕, ${user.nickname}`}
        copy="오늘도 대화의 마음을 천천히 살펴봐요."
        mark="✦"
      />
      {active ? (
        <section className="resume-card">
          <div>
            <p className="eyebrow">진행 중인 게임</p>
            <h2>{active.partnerProfileSnapshot.nickname}과 대화</h2>
            <p>
              Stage {active.currentStageNumber} · Turn {active.currentTurn}/
              {turnCount} · 관계 HP {active.relationshipHp}
            </p>
            <small>
              {active.stageIntroAcknowledged
                ? active.messages.at(-1)?.text
                : `STAGE ${active.pendingStageNumber ?? active.currentStageNumber} 안내 확인 대기 중`}
            </small>
          </div>
          <button className="button button-light" onClick={onResume}>
            이어하기 →
          </button>
        </section>
      ) : (
        <section className="hero-card">
          <div>
            <p className="eyebrow">TODAY'S MISSION</p>
            <h2>오늘의 대화</h2>
            <p>
              상대의 감정을 먼저 읽고
              <br />
              마음에 닿는 말을 직접 입력해보세요.
            </p>
            <button className="button button-light" onClick={onStart}>
              플레이하기 <span>→</span>
            </button>
          </div>
          <div className="hero-orb">♡</div>
        </section>
      )}
      <section className="section-block recent-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">RECENT CONVERSATIONS</p>
            <h2>최근 완료한 대화</h2>
          </div>
          <span>{Math.min(completed.length, 7)} / 7</span>
        </div>
        {completed.length ? (
          completed.slice(0, 7).map((session) => (
            <button
              className="conversation-row"
              key={session.id}
              onClick={() => onOpen(session)}
            >
              <span className="conversation-avatar">
                {genderIcon(session.partnerProfileSnapshot?.gender)}
              </span>
              <span>
                <strong>
                  {session.partnerProfileSnapshot?.nickname ?? "상대방"}
                </strong>
                <small>
                  Stage {session.currentStageNumber} · HP{" "}
                  {session.relationshipHp} ·{" "}
                  {new Date(
                    session.completedAt ?? session.updatedAt,
                  ).toLocaleDateString("ko-KR")}
                </small>
              </span>
              <b>›</b>
            </button>
          ))
        ) : (
          <p className="section-note">완료한 대화가 여기에 쌓여요.</p>
        )}
      </section>
    </>
  );
}
function Practice({ selected, onToggle, onStart }) {
  return (
    <>
      <PageHeader
        eyebrow="TRAINING ROOM"
        title="연습"
        copy="지금 필요한 대화 상황을 골라보세요."
        mark="✦"
      />
      <section className="practice-hero">
        <div>
          <span className="pill pill-dark">{categories.length}가지 주제</span>
          <h2>다양한 상황 연습</h2>
          <p>천천히, 감정부터 살펴보세요.</p>
        </div>
        <div className="practice-spark">✦</div>
      </section>
      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CHOOSE A TOPIC</p>
            <h2>상황 카테고리</h2>
          </div>
          <span className="selection-count">
            {selected.length} / {categories.length}
          </span>
        </div>
        <div className="tag-list">
          {categories.map((tag) => (
            <button
              className={`tag ${selected.includes(tag) ? "is-selected" : ""}`}
              key={tag}
              onClick={() => onToggle(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        <button className="button button-primary button-wide" onClick={onStart}>
          선택한 상황 연습하기 <span>→</span>
        </button>
      </section>
    </>
  );
}
function Chat({
  conversation,
  partner,
  onChoose,
  onFeedback,
  onSaveSuggested,
  onAcknowledgeStage,
  onBack,
  onHome,
  onSaved,
}) {
  const [input, setInput] = useState("");
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [advice, setAdvice] = useState([]);
  const [latestButton, setLatestButton] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState("");
  const listRef = useRef(null);
  const menuRef = useRef(null);
  const compositionRef = useRef(false);
  const turn = conversation.currentTurn;
  const config = getStageDifficulty(conversation.currentStageNumber);
  const introOpen = !canSubmitTurn(conversation);
  const [conflictLabel, conflictIcon] = conflictStatus(
    conversation.conflictLevel,
  );
  const inputLength = countUserInputCharacters(input);
  const desktopKeyboard = hasDesktopChatKeyboard();
  useLayoutEffect(() => {
    scrollToLatest(listRef.current);
    const frame = requestAnimationFrame(() => setLatestButton(false));
    return () => cancelAnimationFrame(frame);
  }, [conversation.messages.length]);
  useEffect(() => {
    const close = (event) => {
      if (
        !introOpen &&
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      )
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [introOpen, menuOpen]);
  useEffect(() => {
    const key = (event) => {
      if (!introOpen && event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [introOpen]);
  async function submit(event) {
    event.preventDefault();
    if (locked || introOpen) return;
    setLocked(true);
    setError("");
    try {
      const result = await onChoose(input);
      if (result?.invalid || result?.blocked || result?.ignored) {
        setError(result.message ?? "현재 답변을 처리할 수 없어요.");
        return;
      }
      setInput("");
    } catch {
      setError("메시지를 보내지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLocked(false);
    }
  }
  function handleInputKeyDown(event) {
    if (
      !shouldSubmitChatOnEnter(event, {
        compositionActive: compositionRef.current,
        desktopKeyboard,
      })
    )
      return;
    event.preventDefault();
    if (input.trim()) event.currentTarget.form?.requestSubmit();
  }
  function showFeedback() {
    if (introOpen) return;
    const result = onFeedback();
    setMenuOpen(false);
    if (result?.exists)
      setFeedbackNotice("이미 이 Turn의 피드백을 표시했어요.");
    else if (result?.missing)
      setFeedbackNotice("아직 평가가 완료된 답변이 없어요.");
    else setFeedbackNotice("");
  }
  function useAdvice() {
    if (introOpen) return;
    if (!conversation.adviceItems?.length) {
      setAdvice((items) => [
        ...items,
        "보유한 조언 아이템이 없어요. 상대의 감정을 먼저 인정하고 이야기를 들어보세요.",
      ]);
      return;
    }
    setAdvice((items) => [
      ...items,
      "상대의 감정을 먼저 인정하고, 해결책보다 이야기를 들을 여지를 남겨보세요.",
    ]);
  }
  return (
    <main className="chat-page">
      <div
        className={`chat-app ${introOpen ? "is-stage-blocked" : ""}`}
        inert={introOpen ? true : undefined}
        aria-hidden={introOpen ? "true" : undefined}
      >
        <header className="compact-chat-header">
          <button className="chat-back" onClick={onBack} aria-label="이전 화면">
            ‹
          </button>
          <div className="chat-room-title">
            <strong>{partner.nickname}</strong>
            <small>참여자 3명 · 연애 디펜스</small>
          </div>
          <div className="chat-menu-wrap" ref={menuRef}>
            <button
              className="hamburger-button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label="채팅 메뉴"
              aria-expanded={menuOpen}
            >
              ☰
            </button>
            {menuOpen && (
              <aside className="chat-menu" role="dialog" aria-label="채팅 메뉴">
                <button onClick={showFeedback}>AI 피드백 보기</button>
                <div className="menu-info">
                  <strong>현재 대화 정보</strong>
                  <span>
                    Stage {conversation.currentStageNumber} · Turn {turn}/
                    {config.turnCount}
                  </span>
                  <span>
                    HP {conversation.relationshipHp} · 갈등{" "}
                    {conversation.conflictLevel}
                  </span>
                </div>
                <button onClick={useAdvice}>
                  보유 조언 아이템 ({conversation.adviceItems?.length ?? 0})
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onSaved();
                  }}
                >
                  저장한 추천 표현 보기
                </button>
                <button
                  className="menu-close"
                  onClick={() => setMenuOpen(false)}
                >
                  닫기
                </button>
              </aside>
            )}
          </div>
        </header>
        <section className="stage-status">
          <div className="stage-badge">
            <span>STAGE {conversation.currentStageNumber}</span>
            <strong>
              TURN {turn}/{config.turnCount}
            </strong>
          </div>
          <div className="stage-track">
            <span style={{ width: `${(turn / config.turnCount) * 100}%` }} />
          </div>
        </section>
        <section className="relationship-status">
          <div
            className="hp-meter"
            aria-label={`관계 HP ${conversation.relationshipHp}`}
          >
            <span
              className="hp-fill"
              style={{ height: `${conversation.relationshipHp}%` }}
            />
          </div>
          <div>
            <strong>관계 HP {conversation.relationshipHp}</strong>
            <small>
              안정감 {conversation.stability} · 신뢰도 {conversation.trust}
            </small>
          </div>
          <div className="conflict-meter">
            <span>{conflictIcon}</span>
            <strong>{conflictLabel}</strong>
            <small>갈등 {conversation.conflictLevel}</small>
          </div>
        </section>
        <section
          className="chat-record"
          ref={listRef}
          onScroll={(event) =>
            setLatestButton(isAwayFromLatest(event.currentTarget))
          }
        >
          {conversation.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onSave={onSaveSuggested}
            />
          ))}
          {feedbackNotice && (
            <div className="chat-notice">{feedbackNotice}</div>
          )}
          {advice.map((item, index) => (
            <div className="advice-card" key={`${item}-${index}`}>
              <strong>조언 아이템</strong>
              <p>{item}</p>
            </div>
          ))}
          {latestButton && (
            <button
              className="latest-button"
              onClick={() => {
                scrollToLatest(listRef.current);
                setLatestButton(false);
              }}
            >
              ↓ 최신 메시지로
            </button>
          )}
        </section>
        <form className="free-input-panel chat-input" onSubmit={submit}>
          <div className="input-tools">
            <span>
              {desktopKeyboard
                ? "Enter 전송 · Shift+Enter 줄바꿈"
                : "여러 줄 입력 가능"}
            </span>
            <span className={inputLength > 200 ? "is-over-limit" : ""}>
              {inputLength} / 200
            </span>
          </div>
          <textarea
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              if (error) setError("");
            }}
            onKeyDown={handleInputKeyDown}
            onCompositionStart={() => {
              compositionRef.current = true;
            }}
            onCompositionEnd={() => {
              compositionRef.current = false;
            }}
            rows={2}
            enterKeyHint={desktopKeyboard ? "send" : "enter"}
            placeholder="상대방에게 전할 메시지를 입력해 주세요."
            disabled={locked || introOpen}
            aria-invalid={Boolean(error)}
            aria-describedby="chat-input-status"
          />
          <div className="input-footer">
            <small
              id="chat-input-status"
              className={error ? "input-error" : "input-hint"}
              role={error ? "alert" : undefined}
              aria-live="polite"
            >
              {error ||
                (desktopKeyboard
                  ? "Shift+Enter로 줄바꿈"
                  : "보내기 버튼으로 전송")}
            </small>
            <button
              className="button button-primary"
              aria-busy={locked}
              disabled={locked || introOpen || !input.trim()}
              type="submit"
            >
              {locked ? "평가 중…" : "보내기 →"}
            </button>
          </div>
        </form>
        <nav className="chat-system-nav" aria-label="기기 내비게이션">
          <button onClick={onBack} aria-label="뒤로가기">
            ▲
          </button>
          <button onClick={onHome} aria-label="홈으로">
            ■
          </button>
        </nav>
      </div>
      {conversation.stageStatus === STAGE_STATUS.TRANSITION && (
        <StageTransitionOverlay
          stageNumber={
            conversation.pendingStageNumber ?? conversation.currentStageNumber
          }
        />
      )}
      {conversation.stageStatus === STAGE_STATUS.INTRO && (
        <StageIntroModal
          stageNumber={
            conversation.pendingStageNumber ?? conversation.currentStageNumber
          }
          onConfirm={onAcknowledgeStage}
          isGenerating={conversation.isGeneratingScenario}
          error={conversation.scenarioGenerationError}
        />
      )}
    </main>
  );
}

function StageTransitionOverlay({ stageNumber }) {
  return (
    <div
      className="stage-transition-overlay"
      role="status"
      aria-live="assertive"
    >
      <strong>STAGE {stageNumber}</strong>
    </div>
  );
}

function StageIntroModal({ stageNumber, onConfirm, isGenerating, error }) {
  const dialogRef = useRef(null);
  const confirmRef = useRef(null);
  const config = getStageDifficulty(stageNumber);
  const previous = stageNumber > 1 ? getStageDifficulty(stageNumber - 1) : null;
  const sensitivity = getStageSensitivity(stageNumber);
  useEffect(() => {
    confirmRef.current?.focus();
    const trap = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...dialogRef.current.querySelectorAll("button")];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, []);
  return (
    <div className="stage-intro-backdrop">
      <section
        className="stage-intro-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stage-intro-title"
        aria-describedby="stage-intro-description"
        ref={dialogRef}
      >
        <p className="eyebrow">STAGE DIFFICULTY</p>
        <h1 id="stage-intro-title">STAGE {stageNumber}</h1>
        <div id="stage-intro-description">
          <p>
            이번 Stage는 총 <strong>{config.turnCount}턴</strong>입니다.
          </p>
          <h2>클리어 조건</h2>
          <ul>
            <li>
              종료 시 관계 HP <strong>{config.requiredEndHp} 이상</strong>
            </li>
            <li>
              종료 시 갈등 수치{" "}
              <strong>{config.maximumEndConflict} 이하</strong>
            </li>
          </ul>
          {previous ? (
            <>
              <h2>이전 Stage보다</h2>
              <ul>
                <li>
                  요구 HP가 {config.requiredEndHp - previous.requiredEndHp}{" "}
                  높아졌습니다.
                </li>
                <li>
                  허용 갈등이{" "}
                  {previous.maximumEndConflict - config.maximumEndConflict}{" "}
                  낮아졌습니다.
                </li>
                <li>
                  대화가 {config.turnCount - previous.turnCount}턴 길어졌습니다.
                </li>
              </ul>
            </>
          ) : (
            <p className="stage-intro-baseline">첫 Stage 기본 기준</p>
          )}
          <p>
            상대방 민감도: <strong>{sensitivity.sensitivityLabel}</strong>
          </p>
          <p className="stage-intro-warning">
            관계 HP가 진행 중 0이 되면 즉시 실패합니다. {config.turnCount}턴
            종료 시 두 조건을 모두 만족해야 합니다.
          </p>
          {error && (
            <p className="stage-intro-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <button
          className="button button-primary button-wide"
          ref={confirmRef}
          onClick={onConfirm}
          disabled={isGenerating}
        >
          {isGenerating ? "시나리오 준비 중…" : error ? "다시 시도" : "확인"}
        </button>
      </section>
    </div>
  );
}
function MessageBubble({ message, onSave }) {
  const isAi = message.sender === "ai";
  const gender = message.metadata?.gender;
  const ragSources = isAi
    ? (message.metadata?.ragRetrieval?.sources ?? [])
    : [];
  if (message.sender === "system")
    return (
      <div
        className={`system-message system-message--${message.metadata?.systemType ?? "notice"}`}
        role="status"
      >
        {message.text.split("\n").map((line, index) => (
          <span key={`${message.id}-${index}`}>
            {line}
            {index < message.text.split("\n").length - 1 && <br />}
          </span>
        ))}
      </div>
    );
  return (
    <div
      className={`chat-message-row chat-message-row--${message.sender} chat-message-row--${gender ?? "unknown"}`}
    >
      <div
        className="message-avatar"
        aria-label={`${message.senderName} ${gender ? genderLabel(gender) : ""}`}
      >
        {isAi ? "AI" : genderIcon(gender)}
      </div>
      <div className="message-column">
        <span className="message-sender">
          {message.senderName}
          {gender && <em>{genderLabel(gender)}</em>}
          {isAi && <em>AI</em>}
        </span>
        <div className={`chat-bubble chat-bubble--${message.sender}`}>
          {message.text.split("\n").map((line, index) => (
            <span key={`${message.id}-${index}`}>
              {line}
              {index < message.text.split("\n").length - 1 && <br />}
            </span>
          ))}
          {ragSources.length > 0 && (
            <aside className="rag-evidence" aria-label="RAG 참고 근거">
              <strong>RAG 참고 근거</strong>
              <div>
                {ragSources.map((source) => (
                  <span className="rag-source-chip" key={source.knowledgeId}>
                    {source.title}
                    <small>
                      관련도 {Math.round(source.relevanceScore * 100)}%
                    </small>
                  </span>
                ))}
              </div>
            </aside>
          )}
          {isAi && message.metadata?.suggestedBetterResponse && (
            <button
              className={`save-inline-button ${message.metadata.saved ? "is-saved" : ""}`}
              aria-pressed={Boolean(message.metadata.saved)}
              onClick={() =>
                onSave(
                  message.metadata.suggestedBetterResponse,
                  message.stageId,
                )
              }
            >
              {message.metadata.saved ? "♥ 저장됨" : "♡ 추천 표현 저장"}
            </button>
          )}
        </div>
        <time>
          {new Date(message.createdAt).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>
    </div>
  );
}
function ReadonlyConversation({ conversation, onBack }) {
  return (
    <main className="phone-shell readonly-shell">
      <header className="readonly-header">
        <button onClick={onBack} aria-label="뒤로가기">
          ‹
        </button>
        <div>
          <strong>
            {conversation.partnerProfileSnapshot?.nickname ?? "대화 기록"}
          </strong>
          <small>읽기 전용 · Stage {conversation.currentStageNumber}</small>
        </div>
      </header>
      <div className="readonly-record">
        {conversation.messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onSave={() => {}}
            saved={false}
          />
        ))}
      </div>
      <div className="readonly-footer">완료된 대화 기록은 변경되지 않아요.</div>
    </main>
  );
}
function Result({ result, onHome, onReplay }) {
  const config = getStageDifficulty(result?.currentStageNumber ?? 1);
  const reason =
    result?.stageClearResult === "failed_hp_zero"
      ? "관계 HP가 0이 되어 관계를 이어가지 못했습니다."
      : result?.stageClearResult === "failed_required_hp"
        ? `요구 관계 HP ${config.requiredEndHp}에 미달했습니다. 최종 HP는 ${result.relationshipHp}입니다.`
        : result?.stageClearResult === "failed_conflict"
          ? `허용 갈등 ${config.maximumEndConflict}를 초과했습니다. 최종 갈등은 ${result.conflictLevel}입니다.`
          : result?.stageClearResult === "failed_both"
            ? `관계 HP와 갈등 수치가 모두 클리어 조건을 만족하지 못했습니다. (HP ${result.relationshipHp}/${config.requiredEndHp}, 갈등 ${result.conflictLevel}/${config.maximumEndConflict})`
            : "Stage 1~5의 모든 클리어 조건을 통과했습니다.";
  return (
    <main className="phone-shell result-shell">
      <section className="result-hero">
        <p className="eyebrow">
          {result?.status === "completed" ? "DEFENSE COMPLETE" : "STAGE FAILED"}
        </p>
        <div className="result-orbit">
          <span>{result?.relationshipHp ?? 0}</span>
          <small>HP</small>
        </div>
        <h1>
          {result?.status === "completed"
            ? "대화 방어 성공!"
            : "Stage를 통과하지 못했어요"}
        </h1>
        <p>{reason}</p>
        <p>최종 갈등 수치 {result?.conflictLevel ?? 0}</p>
      </section>
      <div className="result-actions">
        <button className="button button-primary button-wide" onClick={onHome}>
          홈으로
        </button>
        <button
          className="button button-secondary button-wide"
          onClick={onReplay}
        >
          다시 플레이
        </button>
      </div>
    </main>
  );
}
function League({ progress }) {
  const [help, setHelp] = useState(false);
  const tiers = [
    "배치 중",
    "브론즈",
    "실버",
    "골드",
    "플래티넘",
    "다이아",
    "마스터",
    "그랜드 마스터",
    "챌린저",
  ];
  return (
    <>
      <PageHeader
        eyebrow="WEEKLY LEAGUE"
        title="리그"
        copy="꾸준한 대화 방어 기록을 쌓아보세요."
        mark="♛"
      />
      <section className="league-card">
        <div className="league-badge">◆</div>
        <div>
          <div className="tier-label">
            <span className="pill pill-light">CURRENT TIER</span>
            <button
              className="help-button"
              onClick={() => setHelp((value) => !value)}
              aria-label="티어 조건 도움말"
              aria-expanded={help}
            >
              ?
            </button>
          </div>
          <h2>{progress.currentTier}</h2>
          <p>
            {progress.totalClearedGames}회 클리어 · 퍼펙트{" "}
            {progress.totalPerfectClears}회
          </p>
          {help && (
            <div className="tier-help" role="tooltip">
              배치 중: 아직 한 판을 클리어하지 않은 상태
              <br />
              브론즈: 1회 클리어 · 실버: 3판 연속 · 골드: 5판 연속
              <br />
              플래티넘: 7판 연속 · 다이아: HP 100 3판 연속
              <br />
              마스터: HP 100 5판 연속 · 그랜드 마스터: HP 100 누적 10판
              <br />
              챌린저: 그랜드 마스터 중 HP 100 클리어 상위 10명
            </div>
          )}
        </div>
      </section>
      <section className="rank-summary">
        <div>
          <span>현재 연속 클리어</span>
          <strong>{progress.currentClearStreak}</strong>
        </div>
        <div>
          <span>최고 티어</span>
          <strong>{progress.highestTier}</strong>
        </div>
        <div>
          <span>퍼펙트 연속</span>
          <strong>{progress.currentPerfectClearStreak}</strong>
        </div>
      </section>
      <section className="section-block">
        <h2>티어 진행</h2>
        <div className="tier-list">
          {tiers.map((tier) => (
            <span
              className={
                tiers.indexOf(tier) <= tiers.indexOf(progress.currentTier)
                  ? "is-reached"
                  : ""
              }
              key={tier}
            >
              {tier}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}
function TendencyDropdown({ name, defaultValue, onChange }) {
  const [value, setValue] = useState(() => normalizeTendency(defaultValue));
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = tendencyOptions.find((option) => option.value === value);
  useEffect(() => {
    const close = (event) => {
      if (open && rootRef.current && !rootRef.current.contains(event.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div className="tendency-field">
      <span className="tendency-field-label">대화 성향</span>
      <div className="tendency-dropdown" ref={rootRef}>
        <input type="hidden" name={name} value={value} />
        <button
          className="tendency-trigger"
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <span>
            <strong>{selected.value}</strong>
            <small>{selected.description}</small>
          </span>
          <b aria-hidden="true">⌄</b>
        </button>
        {open && (
          <div
            className="tendency-menu"
            role="listbox"
            aria-label="대화 성향 선택"
          >
            {tendencyOptions.map((option) => (
              <button
                className={option.value === value ? "is-selected" : ""}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  setValue(option.value);
                  onChange?.(option.value);
                  setOpen(false);
                }}
                key={option.value}
              >
                <strong>{option.value}</strong>
                <small>{option.description}</small>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileEditorFields({
  user,
  partner,
  onUserTendencyChange,
  onPartnerTendencyChange,
}) {
  return (
    <>
      <div className="profile-form-column">
        <h3>내 성향</h3>
        <label>
          닉네임
          <input
            name="nickname"
            defaultValue={user.nickname}
            minLength="2"
            maxLength="20"
            required
          />
        </label>
        <label>
          성별
          <select name="gender" defaultValue={user.gender}>
            <option value="male">♂ 남성</option>
            <option value="female">♀ 여성</option>
          </select>
        </label>
        <label>
          MBTI
          <select name="mbti" defaultValue={user.mbti}>
            {mbtiTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <TendencyDropdown
          name="tendency"
          defaultValue={user.tendency}
          onChange={onUserTendencyChange}
        />
      </div>
      <div className="profile-form-column">
        <h3>상대방 성향</h3>
        <label>
          닉네임
          <input
            name="partnerNickname"
            defaultValue={partner.nickname}
            minLength="2"
            maxLength="20"
            required
          />
        </label>
        <label>
          성별
          <select name="partnerGender" defaultValue={partner.gender}>
            <option value="male">♂ 남성</option>
            <option value="female">♀ 여성</option>
          </select>
        </label>
        <label>
          MBTI
          <select name="partnerMbti" defaultValue={partner.mbti}>
            {mbtiTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <TendencyDropdown
          name="partnerTendency"
          defaultValue={partner.tendency}
          onChange={onPartnerTendencyChange}
        />
      </div>
    </>
  );
}

function ProfilePersonalityCard({
  user,
  partner,
  alwaysExpanded = false,
  formRef,
  onSubmit,
  footer = null,
  className = "",
  formClassName = "",
}) {
  const [expanded, setExpanded] = useState(alwaysExpanded);
  const [draftUser, setDraftUser] = useState(user);
  const [draftPartner, setDraftPartner] = useState(partner);
  const [heartLoading, setHeartLoading] = useState(false);
  const [adviceOpen, setAdviceOpen] = useState(false);
  const heartTimerRef = useRef(null);
  const isExpanded = alwaysExpanded || expanded;
  const displayUser = isExpanded ? draftUser : user;
  const displayPartner = isExpanded ? draftPartner : partner;
  useEffect(() => () => clearTimeout(heartTimerRef.current), []);
  useEffect(() => {
    if (!adviceOpen) return undefined;
    const close = (event) => {
      if (event.key === "Escape") setAdviceOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [adviceOpen]);
  function toggleExpanded() {
    if (!expanded) {
      setDraftUser(user);
      setDraftPartner(partner);
    }
    setExpanded((value) => !value);
  }
  function previewProfileChange(event) {
    const { name, value } = event.target;
    const userFields = { nickname: "nickname", gender: "gender", mbti: "mbti" };
    const partnerFields = {
      partnerNickname: "nickname",
      partnerGender: "gender",
      partnerMbti: "mbti",
    };
    if (userFields[name])
      setDraftUser((current) => ({ ...current, [userFields[name]]: value }));
    if (partnerFields[name])
      setDraftPartner((current) => ({
        ...current,
        [partnerFields[name]]: value,
      }));
  }
  function openRelationshipAdvice() {
    if (heartLoading) return;
    setHeartLoading(true);
    clearTimeout(heartTimerRef.current);
    heartTimerRef.current = setTimeout(() => {
      setHeartLoading(false);
      setAdviceOpen(true);
    }, 1500);
  }
  const advice = buildRelationshipAdvice(displayUser, displayPartner);
  return (
    <>
      <section className={`profile-summary-card ${isExpanded ? "is-expanded" : ""} ${className}`.trim()}>
        <div className="heart-animation" aria-hidden="true">
          ♥
        </div>
        <div className="profile-person">
          <span className="profile-gender">
            {genderIcon(displayUser.gender)} {genderLabel(displayUser.gender)}
          </span>
          <h2>{displayUser.nickname}</h2>
          <p>
            {displayUser.mbti} · {normalizeTendency(displayUser.tendency)}
          </p>
        </div>
        <div className="profile-heart-action">
          <button
            className={`profile-heart-button ${heartLoading ? "is-loading" : ""}`}
            type="button"
            aria-label={
              heartLoading ? "AI 연애 조언을 준비하는 중" : "AI 연애 조언 보기"
            }
            aria-describedby="profile-heart-tooltip"
            disabled={heartLoading}
            onClick={openRelationshipAdvice}
          >
            <svg
              className="profile-heart-svg"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <defs>
                <clipPath id="profile-heart-clip">
                  <path d="M12 21.35 10.55 20.03C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6.01 6.01 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54Z" />
                </clipPath>
              </defs>
              <g clipPath="url(#profile-heart-clip)">
                <g className="profile-heart-water-level">
                  <path
                    className="profile-heart-water-wave"
                    d="M-24 2Q-18-1-12 2T0 2T12 2T24 2T36 2V28H-24Z"
                  />
                </g>
              </g>
              <path
                className="profile-heart-stroke"
                d="M12 21.35 10.55 20.03C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6.01 6.01 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54Z"
              />
            </svg>
          </button>
          <span
            className="profile-heart-tooltip"
            id="profile-heart-tooltip"
            role="tooltip"
          >
            하트를 클릭해 맞춤형 연애 조언을 확인해보세요!
          </span>
        </div>
        <div className="profile-person">
          <span className="profile-gender">
            {genderIcon(displayPartner.gender)}{" "}
            {genderLabel(displayPartner.gender)}
          </span>
          <h2>{displayPartner.nickname}</h2>
          <p>
            {displayPartner.mbti} · {normalizeTendency(displayPartner.tendency)}
          </p>
        </div>
        {!alwaysExpanded && (
          <button
            className="button button-secondary edit-profile-button"
            type="button"
            onClick={toggleExpanded}
          >
            {expanded ? "닫기" : "수정하기"}
          </button>
        )}
        {isExpanded && (
          <form
            className={`profile-form profile-form-expanded ${formClassName}`.trim()}
            ref={formRef}
            onSubmit={onSubmit}
            onChange={previewProfileChange}
          >
            <ProfileEditorFields
              user={user}
              partner={partner}
              onUserTendencyChange={(tendency) =>
                setDraftUser((current) => ({ ...current, tendency }))
              }
              onPartnerTendencyChange={(tendency) =>
                setDraftPartner((current) => ({ ...current, tendency }))
              }
            />
            {footer}
          </form>
        )}
      </section>
      {adviceOpen && (
        <div
          className="relationship-advice-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAdviceOpen(false);
          }}
        >
          <section
            className="relationship-advice-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="relationship-advice-title"
          >
            <button
              className="relationship-advice-close"
              type="button"
              aria-label="조언 창 닫기"
              onClick={() => setAdviceOpen(false)}
            >
              ×
            </button>
            <div className="relationship-advice-heart" aria-hidden="true">
              ♥
            </div>
            <p className="eyebrow">RELATIONSHIP COACH</p>
            <h2 id="relationship-advice-title">AI 연애 조언</h2>
            <div className="relationship-advice-copy">
              {advice.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <small>현재 프로필 성향을 바탕으로 만든 조언 미리보기예요.</small>
            <button
              className="button button-primary button-wide"
              type="button"
              onClick={() => setAdviceOpen(false)}
            >
              확인
            </button>
          </section>
        </div>
      )}
    </>
  );
}

function SlideToSave({ onComplete, saving }) {
  return (
    <button
      className={`slide-save ${saving ? "is-saving" : ""}`}
      type="button"
      aria-label="프로필 저장"
      onClick={onComplete}
      disabled={saving}
    >
      {saving ? "저장 중…" : "저장"}
    </button>
  );
}
function ProfileOnboardingModal({ user, partner, saving, error, onSave }) {
  const formRef = useRef(null);
  const dialogRef = useRef(null);
  useEffect(() => {
    formRef.current?.elements?.nickname?.focus();
    const keepOpen = (event) => {
      if (event.key === "Escape") event.preventDefault();
    };
    document.addEventListener("keydown", keepOpen);
    return () => document.removeEventListener("keydown", keepOpen);
  }, []);
  const complete = () => {
    if (!formRef.current?.reportValidity()) return false;
    return onSave(formRef.current);
  };
  return (
    <div className="profile-onboarding-backdrop">
      <section
        className="profile-onboarding-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-onboarding-title"
        ref={dialogRef}
      >
        <p className="eyebrow">FIRST PROFILE</p>
        <h1 id="profile-onboarding-title">두 사람의 성향을 알려주세요</h1>
        <p className="profile-onboarding-copy">
          대화를 시작하기 전에 나와 상대방의 성향을 저장해요.
        </p>
        <ProfilePersonalityCard
          user={user}
          partner={partner}
          alwaysExpanded
          formRef={formRef}
          onSubmit={(event) => event.preventDefault()}
          className="onboarding-profile-card"
          formClassName="onboarding-profile-form"
        />
        {error && (
          <p className="profile-onboarding-error" role="alert">
            {error}
          </p>
        )}
        <SlideToSave onComplete={complete} saving={saving} />
      </section>
    </div>
  );
}
function Profile({
  user,
  partner,
  savedExpressions,
  onSubmit,
  onDelete,
  onCopy,
  status,
  theme,
  onToggleTheme,
  authUser,
  onConnectGoogle,
  onSignOut,
}) {
  return (
    <>
      <PageHeader
        eyebrow="MY SPACE"
        title="사용자"
        copy="나와 상대방의 대화 성향을 설계해요."
        mark="◉"
      />
      <ProfilePersonalityCard
        user={user}
        partner={partner}
        onSubmit={onSubmit}
        footer={
          <>
            <button
              className="button button-primary profile-save-button"
              type="submit"
            >
              저장하기
            </button>
            {status && <p className="section-note">{status}</p>}
          </>
        }
      />
      <section className="section-block account-section">
        <div className="appearance-row">
          <div>
            <p className="eyebrow">ACCOUNT</p>
            <h2>계정 연결</h2>
            <p className="section-note">
              {authUser && !isAnonymousUser(authUser)
                ? "Google 계정이 연결되어 대화 기록을 안전하게 보관하고 있어요."
                : "Google 계정을 연결하면 다른 기기에서도 대화 기록을 이어갈 수 있어요."}
            </p>
          </div>
          {authUser && !isAnonymousUser(authUser) ? (
            <div className="account-actions">
              <span
                className="account-connected"
                aria-label="Google 계정 연결됨"
              >
                ✓ 연결됨
              </span>
              <button
                className="account-signout-button"
                type="button"
                onClick={onSignOut}
              >
                로그아웃
              </button>
            </div>
          ) : (
            <button
              className="button button-secondary google-connect-button"
              type="button"
              onClick={onConnectGoogle}
            >
              G Google로 연결
            </button>
          )}
        </div>
        <p className="section-note account-status" role="status">
          {status}
        </p>
      </section>
      <section className="section-block appearance-section">
        <div className="appearance-row">
          <div>
            <p className="eyebrow">APPEARANCE</p>
            <h2>화면 테마</h2>
            <p className="section-note">
              기기 설정을 기본값으로 사용하며 선택한 테마는 저장됩니다.
            </p>
          </div>
          <button
            className="theme-toggle"
            type="button"
            role="switch"
            aria-checked={theme === "dark"}
            onClick={onToggleTheme}
          >
            <span className="theme-toggle-icon" aria-hidden="true">
              {theme === "dark" ? "☾" : "☀"}
            </span>
            <span>{theme === "dark" ? "다크모드" : "라이트모드"}</span>
          </button>
        </div>
      </section>
      <section className="section-block saved-expression-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">SAVED PHRASES</p>
            <h2>저장한 추천 표현</h2>
          </div>
        </div>
        {savedExpressions.length ? (
          savedExpressions.map((item) => (
            <div className="saved-expression-row" key={item.id ?? item.text}>
              <blockquote>{item.text}</blockquote>
              <small>
                {item.source ?? "AI 피드백"} ·{" "}
                {new Date(item.createdAt).toLocaleDateString("ko-KR")}
              </small>
              <div>
                <button onClick={() => onCopy(item.text)}>복사</button>
                <button onClick={() => onDelete(item.text)}>삭제</button>
              </div>
            </div>
          ))
        ) : (
          <p className="section-note">
            AI 피드백에서 추천 표현을 저장해보세요.
          </p>
        )}
      </section>
    </>
  );
}
