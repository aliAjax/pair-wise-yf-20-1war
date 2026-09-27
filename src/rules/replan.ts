// ============================================================
// 规则层：配乐改版的比例重排与安全校验
// 全部为纯函数，不依赖 React / DOM，可独立测试。
// 数据见 src/data/showData.ts。
// ============================================================

import {
  FireworkModel,
  LaunchPoint,
  MusicVersion,
  SegmentDef,
  Shot,
  modelById,
  pointById,
  segmentOf,
} from "../data/showData";

const EPS = 1e-6;

/** 秒 → "mm:ss.d" */
export function formatTime(sec: number): string {
  const total = Math.round(sec * 10) / 10;
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  return `${String(m).padStart(2, "0")}:${s.toFixed(1).padStart(4, "0")}`;
}

/** 秒 → "m:ss"（时间轴刻度用） */
export function formatTick(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec - m * 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ------------------------------------------------------------
// 比例重排
// ------------------------------------------------------------

/**
 * 首尾锚点比例重排：
 * 节点在旧段落中的相对位置，等比映射到新段落的首尾锚点之间。
 * 结果保留到 0.1 秒。
 */
export function rescaleShotTime(
  fireAtSec: number,
  fromSeg: SegmentDef,
  toSeg: SegmentDef
): number {
  const fromSpan = fromSeg.endSec - fromSeg.startSec;
  const toSpan = toSeg.endSec - toSeg.startSec;
  if (fromSpan <= 0) return Math.round(toSeg.startSec * 10) / 10;
  const ratio = (fireAtSec - fromSeg.startSec) / fromSpan;
  const mapped = toSeg.startSec + ratio * toSpan;
  return Math.round(mapped * 10) / 10;
}

/**
 * 生成改版方案：
 * - 未锁定段落：按首尾锚点比例重排到新版本；
 * - 锁定段落：节点留在原时刻，不做任何移动。
 * 返回的是候选新方案，不修改入参。
 */
export function buildSwitchPlan(
  shots: Shot[],
  fromVersion: MusicVersion,
  toVersion: MusicVersion,
  lockedSegmentIds: string[]
): Shot[] {
  return shots.map((shot) => {
    if (lockedSegmentIds.includes(shot.segmentId)) return { ...shot };
    const fromSeg = segmentOf(fromVersion, shot.segmentId);
    const toSeg = segmentOf(toVersion, shot.segmentId);
    return { ...shot, fireAtSec: rescaleShotTime(shot.fireAtSec, fromSeg, toSeg) };
  });
}

// ------------------------------------------------------------
// 安全校验
// ------------------------------------------------------------

export type ViolationKind = "cooldown" | "danger" | "out-of-segment";

export const VIOLATION_LABEL: Record<ViolationKind, string> = {
  cooldown: "冷却不足",
  danger: "危险区相交",
  "out-of-segment": "节点越出段落",
};

export interface Violation {
  kind: ViolationKind;
  /** 涉及的节点 id */
  shotIds: string[];
  /** 涉及的点位 id（危险区相交时为两个点位） */
  pointIds: string[];
  message: string;
}

/** 校验同点位点火冷却：相邻两发间隔不得小于两者型号冷却的较大值 */
function checkCooldown(shots: Shot[]): Violation[] {
  const violations: Violation[] = [];
  const byPoint = new Map<string, Shot[]>();
  for (const shot of shots) {
    const list = byPoint.get(shot.pointId) ?? [];
    list.push(shot);
    byPoint.set(shot.pointId, list);
  }
  for (const [pointId, list] of byPoint) {
    const sorted = [...list].sort((a, b) => a.fireAtSec - b.fireAtSec);
    for (let i = 0; i + 1 < sorted.length; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      const need = Math.max(
        modelById(a.modelId).cooldownSec,
        modelById(b.modelId).cooldownSec
      );
      const gap = b.fireAtSec - a.fireAtSec;
      if (gap < need - EPS) {
        const point = pointById(pointId);
        violations.push({
          kind: "cooldown",
          shotIds: [a.id, b.id],
          pointIds: [pointId],
          message:
            `点位 ${point.name}：「${a.label}」${formatTime(a.fireAtSec)} 与 ` +
            `「${b.label}」${formatTime(b.fireAtSec)} 间隔 ${gap.toFixed(1)}s，` +
            `低于冷却要求 ${need}s`,
        });
      }
    }
  }
  return violations;
}

/** 校验危险区相交：不同点位的安全区在空间上重叠，且效果时间窗也交叠 */
function checkDangerZones(
  shots: Shot[],
  models: FireworkModel[],
  points: LaunchPoint[]
): Violation[] {
  const violations: Violation[] = [];
  for (let i = 0; i < shots.length; i++) {
    for (let j = i + 1; j < shots.length; j++) {
      const a = shots[i];
      const b = shots[j];
      if (a.pointId === b.pointId) continue; // 同点位由冷却规则约束
      const pa = points.find((p) => p.id === a.pointId)!;
      const pb = points.find((p) => p.id === b.pointId)!;
      const ma = models.find((m) => m.id === a.modelId)!;
      const mb = models.find((m) => m.id === b.modelId)!;
      const dist = Math.hypot(pa.x - pb.x, pa.y - pb.y);
      const spatialOverlap = dist < ma.safetyRadiusM + mb.safetyRadiusM - EPS;
      if (!spatialOverlap) continue;
      const aEnd = a.fireAtSec + ma.durationSec;
      const bEnd = b.fireAtSec + mb.durationSec;
      const timeOverlap =
        a.fireAtSec < bEnd - EPS && b.fireAtSec < aEnd - EPS;
      if (!timeOverlap) continue;
      violations.push({
        kind: "danger",
        shotIds: [a.id, b.id],
        pointIds: [a.pointId, b.pointId],
        message:
          `「${a.label}」@${pa.name} 与「${b.label}」@${pb.name} ` +
          `安全区相距 ${dist.toFixed(1)}m（半径合计 ${ma.safetyRadiusM + mb.safetyRadiusM}m），` +
          `且效果时间 ${formatTime(a.fireAtSec)}–${formatTime(aEnd)} 与 ` +
          `${formatTime(b.fireAtSec)}–${formatTime(bEnd)} 交叠`,
      });
    }
  }
  return violations;
}

/** 校验节点越出段落：整段效果窗口必须落在所属段落的时间范围内 */
function checkSegmentBounds(
  shots: Shot[],
  version: MusicVersion
): Violation[] {
  const violations: Violation[] = [];
  for (const shot of shots) {
    const seg = segmentOf(version, shot.segmentId);
    const model = modelById(shot.modelId);
    const effectEnd = shot.fireAtSec + model.durationSec;
    if (
      shot.fireAtSec < seg.startSec - EPS ||
      effectEnd > seg.endSec + EPS
    ) {
      violations.push({
        kind: "out-of-segment",
        shotIds: [shot.id],
        pointIds: [shot.pointId],
        message:
          `「${shot.label}」效果窗口 ${formatTime(shot.fireAtSec)}–${formatTime(effectEnd)} ` +
          `越出段落「${seg.name}」${formatTime(seg.startSec)}–${formatTime(seg.endSec)}`,
      });
    }
  }
  return violations;
}

/**
 * 整场校验：冷却不足、危险区相交、节点越出段落。
 * 任一类别出现违例，调用方都应停止应用并保留上一版。
 */
export function validateShow(
  shots: Shot[],
  version: MusicVersion,
  models: FireworkModel[],
  points: LaunchPoint[]
): Violation[] {
  return [
    ...checkSegmentBounds(shots, version),
    ...checkCooldown(shots),
    ...checkDangerZones(shots, models, points),
  ];
}

// ------------------------------------------------------------
// 改版结果
// ------------------------------------------------------------

export interface SwitchPlanResult {
  ok: boolean;
  plan: Shot[];
  violations: Violation[];
  /** 被比例重排的节点数 */
  movedCount: number;
  /** 锁定保留原时刻的节点数 */
  keptCount: number;
}

/**
 * 计算一次曲目切换：先按比例重排生成候选方案，再做整场校验。
 * ok=false 时调用方必须丢弃 plan，保留上一版。
 */
export function planVersionSwitch(
  shots: Shot[],
  fromVersion: MusicVersion,
  toVersion: MusicVersion,
  lockedSegmentIds: string[],
  models: FireworkModel[],
  points: LaunchPoint[]
): SwitchPlanResult {
  const plan = buildSwitchPlan(shots, fromVersion, toVersion, lockedSegmentIds);
  const violations = validateShow(plan, toVersion, models, points);
  const keptCount = shots.filter((s) =>
    lockedSegmentIds.includes(s.segmentId)
  ).length;
  return {
    ok: violations.length === 0,
    plan,
    violations,
    movedCount: shots.length - keptCount,
    keptCount,
  };
}
