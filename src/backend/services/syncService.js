import { friendlyError } from "../client/supabaseClient"
const QUEUE_KEY = "loveDefense.pendingSyncQueue"
const read = () => { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") } catch { return [] } }
export function enqueueSync(operationType, payload, error) { const queue = read(); const operationId = payload.operationId ?? crypto.randomUUID(); if (!queue.some((x) => x.operationId === operationId)) queue.push({ operationId, operationType, payload: { ...payload, operationId }, createdAt: new Date().toISOString(), retryCount: 0, lastError: friendlyError(error) }); localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); return operationId }
export function getPendingSyncQueue() { return read() }
export function removePendingSync(operationId) { localStorage.setItem(QUEUE_KEY, JSON.stringify(read().filter((x) => x.operationId !== operationId))) }
export async function syncPendingQueue(handler) { for (const item of read()) { if (item.retryCount >= 5) continue; try { await handler(item); removePendingSync(item.operationId) } catch { item.retryCount += 1; item.lastError = "재시도 중입니다."; localStorage.setItem(QUEUE_KEY, JSON.stringify(read().map((x) => x.operationId === item.operationId ? item : x))) } } }
