// 规则层：改版闸门校验
// 冷却不足、危险区相交或节点越出段落，则拒绝应用、保留上一版。
import type {
  Catalog,
  FireworkModel,
  IgnitionNode,
  LaunchPoint,
  Segment,
  ShowState,
  TrackVersion,
} from "../data/types";

export type IssueKind = "bounds" | "cooldown" | "danger";

export interface Issue {
  kind: IssueKind;
  /** 涉及的节点 id（锚点顺序问题可能只有一个） */
  nodeIds: string[];
  message: string;
}

const EPSILON = 0.0005; // 亚毫秒容差

export interface ValidationResult {
  ok: boolean;
  issues: Issue[];
}

/** 点到点平面距离（米） */
function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** 两个燃烧窗口是否相交（端点相接视为不相交） */
function windowsOverlap(
  aStart: number,
  aDuration: number,
  bStart: number,
  bDuration: number
): boolean {
  return aStart < bStart + bDuration - EPSILON &&
    bStart < aStart + aDuration - EPSILON;
}

/**
 * 对候选节目做全量校验。任何一条不通过，改版都应被整体拒绝。
 */
export function validateShow(
  show: ShowState,
  target: TrackVersion,
  catalog: Catalog
): ValidationResult {
  const issues: Issue[] = [];

  const segmentsById = new Map<string, Segment>();
  for (const segment of show.segments) {
    segmentsById.set(segment.id, segment);
    if (segment.end <= segment.start + EPSILON) {
      issues.push({
        kind: "bounds",
        nodeIds: [],
        message: `段落「${segment.name}」首尾锚点倒置或重合（${segment.start}s→${segment.end}s）`,
      });
    }
    if (segment.start < -EPSILON || segment.end > target.duration + EPSILON) {
      issues.push({
        kind: "bounds",
        nodeIds: [],
        message: `段落「${segment.name}」越出曲目范围（0–${target.duration}s）`,
      });
    }
  }

  // 规则一：节点必须落在所属段落锚点之内，且不越出曲目
  interface Enriched {
    node: IgnitionNode;
    segment: Segment;
    point: LaunchPoint;
    model: FireworkModel;
  }
  const enriched: Enriched[] = show.nodes
    .map((node) => ({
      node,
      segment: segmentsById.get(node.segmentId),
      point: catalog.points.find((p) => p.id === node.pointId),
      model: catalog.models.find((m) => m.id === node.modelId),
    }))
    .filter(
      (item): item is Enriched =>
        Boolean(item.segment && item.point && item.model)
    );

  for (const { node, segment, model } of enriched) {
    if (
      node.time < segment.start - EPSILON ||
      node.time > segment.end - EPSILON
    ) {
      issues.push({
        kind: "bounds",
        nodeIds: [node.id],
        message: `${node.id} 点火 ${node.time.toFixed(2)}s 越出段落「${segment.name}」(${segment.start.toFixed(
          2
        )}–${segment.end.toFixed(2)}s)`,
      });
    }
    if (node.time < -EPSILON || node.time > target.duration + EPSILON) {
      issues.push({
        kind: "bounds",
        nodeIds: [node.id],
        message: `${node.id} 点火 ${node.time.toFixed(2)}s 越出曲目范围（0–${target.duration}s）`,
      });
    }
    if (node.time + model.duration > segment.end + EPSILON) {
      issues.push({
        kind: "bounds",
        nodeIds: [node.id],
        message: `${node.id} 燃烧至 ${(node.time + model.duration).toFixed(
          2
        )}s，超出段落「${segment.name}」尾锚点 ${segment.end.toFixed(2)}s`,
      });
    }
  }

  // 规则二：同一点位两次点火间隔不足前一枚的冷却时间
  const byPoint = new Map<string, typeof enriched>();
  for (const item of enriched) {
    const list = byPoint.get(item.node.pointId) ?? [];
    list.push(item);
    byPoint.set(item.node.pointId, list);
  }
  for (const list of byPoint.values()) {
    const sorted = [...list].sort((a, b) => a.node.time - b.node.time);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const gap = curr.node.time - prev.node.time;
      if (gap < prev.model.cooldown - EPSILON) {
        issues.push({
          kind: "cooldown",
          nodeIds: [prev.node.id, curr.node.id],
          message: `${prev.node.id}→${curr.node.id} 在「${prev.point.name}」间隔 ${gap.toFixed(
            2
          )}s，短于 ${prev.model.short} 冷却 ${prev.model.cooldown}s`,
        });
      }
    }
  }

  // 规则三：燃烧窗口相交且危险区（点距 < 安全半径之和）的两枚烟花
  for (let i = 0; i < enriched.length; i++) {
    for (let j = i + 1; j < enriched.length; j++) {
      const a = enriched[i];
      const b = enriched[j];
      if (a.node.id === b.node.id) continue;
      const pointGap = distance(a.point, b.point);
      const radiusSum = a.model.safetyRadius + b.model.safetyRadius;
      if (pointGap >= radiusSum - EPSILON) continue;
      if (
        windowsOverlap(
          a.node.time,
          a.model.duration,
          b.node.time,
          b.model.duration
        )
      ) {
        issues.push({
          kind: "danger",
          nodeIds: [a.node.id, b.node.id],
          message: `${a.node.id}（${a.model.short}）与 ${b.node.id}（${
            b.model.short
          }）燃烧相交，点距 ${pointGap.toFixed(1)}m < 安全半径之和 ${radiusSum}m`,
        });
      }
    }
  }

  return { ok: issues.length === 0, issues };
}

/** 用于编辑期实时提示：只返回问题集合，不阻断操作 */
export function liveIssues(
  show: ShowState,
  catalog: Catalog
): ValidationResult {
  const version =
    catalog.versions.find((v) => v.id === show.versionId) ??
    catalog.versions[0];
  return validateShow(show, version, catalog);
}
