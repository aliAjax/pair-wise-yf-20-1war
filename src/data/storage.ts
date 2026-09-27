// 数据层：浏览器本地持久化（无后端，重开仍可编辑）
import type { ShowState } from "./types";
import { catalog, initialShow, initialStock } from "./presets";

const SHOW_KEY = "fireworks-show-v1";
const STOCK_KEY = "fireworks-stock-v1";

function isShowState(value: unknown): value is ShowState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.versionId === "string" &&
    Array.isArray(v.segments) &&
    Array.isArray(v.nodes)
  );
}

export function loadShow(): ShowState {
  try {
    const raw = localStorage.getItem(SHOW_KEY);
    if (!raw) return structuredClone(initialShow);
    const parsed = JSON.parse(raw) as unknown;
    if (!isShowState(parsed)) return structuredClone(initialShow);
    // 版本/点位/型号 id 必须仍在目录中，否则回退预置
    if (!catalog.versions.some((v) => v.id === parsed.versionId)) {
      return structuredClone(initialShow);
    }
    return parsed;
  } catch {
    return structuredClone(initialShow);
  }
}

export function saveShow(show: ShowState): void {
  try {
    localStorage.setItem(SHOW_KEY, JSON.stringify(show));
  } catch {
    // 隐私模式等场景静默失败，不影响编排
  }
}

export function loadStock(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STOCK_KEY);
    if (!raw) return { ...initialStock };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const result: Record<string, number> = {};
    for (const model of catalog.models) {
      const value = Number(parsed[model.id]);
      result[model.id] = Number.isFinite(value) && value >= 0
        ? value
        : initialStock[model.id] ?? 0;
    }
    return result;
  } catch {
    return { ...initialStock };
  }
}

export function saveStock(stock: Record<string, number>): void {
  try {
    localStorage.setItem(STOCK_KEY, JSON.stringify(stock));
  } catch {
    // 同上
  }
}

export function resetAll(): { show: ShowState; stock: Record<string, number> } {
  try {
    localStorage.removeItem(SHOW_KEY);
    localStorage.removeItem(STOCK_KEY);
  } catch {
    // 忽略
  }
  return {
    show: structuredClone(initialShow),
    stock: { ...initialStock },
  };
}
