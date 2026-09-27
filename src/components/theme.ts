// 交互层：展示常量（型号分类配色，供时间轴与点位图共用）
import type { Category } from "../data/types";

export const categoryColors: Record<Category, string> = {
  礼花弹: "#dc2626",
  罗马烛光: "#f59e0b",
  扇形架: "#1d4ed8",
  冷焰火: "#0ea5e9",
};

export const ISSUE_COLOR = "#dc2626";
export const LOCKED_COLOR = "#b45309";
export const OK_COLOR = "#15803d";
