// 规则层：曲目改版重排
// 切换新版曲目后，未锁定段落按首尾锚点比例重排，锁定段落留在原时刻；
// 段内点火节点跟随其所在段落的锚点比例重排。
import type { IgnitionNode, Segment, ShowState, TrackVersion } from "../data/types";

/** 全曲首尾锚点：第一个段落起点、最后一个段落终点 */
function outerAnchors(segments: Segment[]): { head: number; tail: number } {
  return {
    head: segments[0]?.start ?? 0,
    tail: segments[segments.length - 1]?.end ?? 0,
  };
}

/**
 * 计算切换到目标曲目后的候选版本（不改动入参）。
 * - 未锁定段落：start/end 按全曲首尾锚点比例缩放到新版首尾（0 → 新曲长）
 * - 锁定段落：锚点保持原时刻
 * - 节点：按其段落的首尾锚点比例映射，保持段内相对位置
 */
export function remapShow(
  show: ShowState,
  target: TrackVersion
): { candidate: ShowState; segmentScales: Record<string, number> } {
  const { head, tail } = outerAnchors(show.segments);
  const span = tail - head;
  const newHead = 0;
  const newTail = target.duration;

  const remappedSegments = show.segments.map((segment) => {
    if (segment.locked) {
      return { ...segment };
    }
    if (span <= 0) return { ...segment };
    const map = (t: number) =>
      newHead + ((t - head) / span) * (newTail - newHead);
    return { ...segment, start: map(segment.start), end: map(segment.end) };
  });

  const segmentScales: Record<string, number> = {};
  const oldById = new Map(show.segments.map((s) => [s.id, s]));
  for (const next of remappedSegments) {
    const prev = oldById.get(next.id)!;
    const oldSpan = prev.end - prev.start;
    segmentScales[next.id] =
      prev.locked || oldSpan <= 0 ? 1 : (next.end - next.start) / oldSpan;
  }

  const newSegmentsById = new Map(remappedSegments.map((s) => [s.id, s]));
  const remappedNodes: IgnitionNode[] = show.nodes.map((node) => {
    const prev = oldById.get(node.segmentId)!;
    const next = newSegmentsById.get(node.segmentId)!;
    const oldSpan = prev.end - prev.start;
    const ratio = oldSpan <= 0 ? 0 : (node.time - prev.start) / oldSpan;
    const newSpan = next.end - next.start;
    return { ...node, time: next.start + ratio * newSpan };
  });

  return {
    candidate: {
      versionId: target.id,
      segments: remappedSegments,
      nodes: remappedNodes,
    },
    segmentScales,
  };
}
