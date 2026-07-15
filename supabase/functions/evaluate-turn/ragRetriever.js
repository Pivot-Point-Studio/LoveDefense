import { COACHING_KNOWLEDGE_VERSION, coachingKnowledgeCards } from "./coachingKnowledge.js"

const clean = (value) => typeof value === "string" ? value.trim().toLowerCase() : ""
const listText = (value) => Array.isArray(value) ? value.map(clean).filter(Boolean).join(" ") : clean(value)

function profileText(profile = {}) {
  return [profile.mbti, profile.tendency, profile.expressionStyle, profile.desiredResponse, profile.conflictStyle, profile.relationshipNeed].map(clean).filter(Boolean).join(" ")
}

function recentMessageText(messages) {
  return Array.isArray(messages) ? messages.slice(-6).map((message) => clean(message?.text)).filter(Boolean).join(" ") : ""
}

export function buildCoachingRetrievalQuery(input = {}) {
  const stage = input.stage ?? {}
  const pattern = input.patternContext ?? stage.patternContext ?? {}
  const trigger = pattern.trigger ?? {}
  const hints = input.ruleBasedHints ?? {}
  return [
    profileText(input.userProfile),
    profileText(input.partnerProfile ?? input.character),
    clean(input.contextSummary ?? stage.contextSummary),
    clean(input.conflictCause),
    listText(input.hiddenEmotion ?? stage.hiddenEmotion?.acceptedSimilarMeanings ?? stage.hiddenEmotion),
    listText(input.hiddenNeed ?? stage.hiddenNeed?.acceptedSimilarMeanings ?? stage.hiddenNeed),
    clean(trigger.summary),
    clean(trigger.currentEscalation),
    listText(pattern.speechPatternHints),
    listText(pattern.behaviorPatternHints),
    clean(input.userInput),
    recentMessageText(input.recentMessages ?? input.conversationHistory),
    listText(hints.detectedEmotionTerms),
    listText(hints.detectedNeedTerms),
    listText(hints.possibleRisks),
  ].filter(Boolean).join(" ")
}

function tokens(text) {
  return new Set(clean(text).replace(/[^0-9a-zA-Z가-힣\s]/g, " ").split(/\s+/).filter((token) => token.length >= 2))
}

function stableFingerprint(text) {
  let hash = 2166136261
  for (const character of text) {
    hash ^= character.codePointAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return `rq-${(hash >>> 0).toString(16).padStart(8, "0")}`
}

function scoreCard(card, query, queryTokens) {
  const matchedKeywords = card.keywords.filter((keyword) => query.includes(clean(keyword)))
  const matchedTopics = card.topics.filter((topic) => query.includes(clean(topic)))
  const cardTokens = tokens(`${card.title} ${card.topics.join(" ")} ${card.guidance} ${card.avoid}`)
  const overlap = [...cardTokens].filter((token) => queryTokens.has(token)).length
  const rawScore = matchedKeywords.reduce((sum, keyword) => sum + Math.min(5, Math.max(2, [...keyword].length)), 0) + matchedTopics.length * 5 + Math.min(6, overlap) * 0.75
  return { card, rawScore, matchedKeywords: [...new Set([...matchedTopics, ...matchedKeywords])].slice(0, 6) }
}

function publicSource(item) {
  return {
    knowledgeId: item.card.id,
    title: item.card.title,
    sourceId: item.card.source.id,
    sourceLabel: item.card.source.label,
    sourceType: item.card.source.type,
    relevanceScore: Number(Math.min(0.99, item.rawScore / (item.rawScore + 12)).toFixed(3)),
    matchedSignals: item.matchedKeywords,
  }
}

export function retrieveCoachingKnowledge(input = {}, { topK = 3 } = {}) {
  const query = buildCoachingRetrievalQuery(input)
  const queryTokens = tokens(query)
  const scored = coachingKnowledgeCards.map((card) => scoreCard(card, query, queryTokens)).sort((left, right) => right.rawScore - left.rawScore || left.card.id.localeCompare(right.card.id))
  const relevant = scored.filter((item) => item.rawScore > 0)
  const selected = (relevant.length ? relevant : scored).slice(0, Math.max(1, Math.min(5, topK)))
  const sources = selected.map(publicSource)
  return {
    promptContext: selected.map((item) => ({
      knowledgeId: item.card.id,
      title: item.card.title,
      guidance: item.card.guidance,
      avoid: item.card.avoid,
      sourceId: item.card.source.id,
    })),
    metadata: {
      applied: selected.length > 0,
      strategy: "curated_metadata_keyword_rag_v1",
      knowledgeBaseVersion: COACHING_KNOWLEDGE_VERSION,
      queryFingerprint: stableFingerprint(query),
      topK: selected.length,
      sources,
    },
  }
}
