// 交互层：时间轴（段落泳道 + 燃烧窗口 + 点火时刻，问题节点红色描边）
import { useMemo } from "react";
import type { Catalog, ShowState } from "../data/types";
import { formatClock } from "../rules/time";
import type { Issue } from "../rules/validate";
import { categoryColors, ISSUE_COLOR } from "./theme";

interface Props {
  show: ShowState;
  catalog: Catalog;
  duration: number;
  issues: Issue[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
}

const LANE_HEIGHT = 58;
const LANE_GAP = 14;
const PAD_LEFT = 88;
const PAD_RIGHT = 16;
const PAD_TOP = 26;
const VIEW_WIDTH = 960;

export function Timeline({
  show,
  catalog,
  duration,
  issues,
  selectedNodeId,
  onSelectNode,
}: Props) {
  const modelsById = new Map(catalog.models.map((m) => [m.id, m]));
  const pointsById = new Map(catalog.points.map((p) => [p.id, p]));

  const badNodeIds = useMemo(() => {
    const set = new Set<string>();
    for (const issue of issues) issue.nodeIds.forEach((id) => set.add(id));
    return set;
  }, [issues]);

  const trackWidth = VIEW_WIDTH - PAD_LEFT - PAD_RIGHT;
  const xFor = (t: number) => PAD_LEFT + (t / duration) * trackWidth;
  const laneY = (index: number) => PAD_TOP + index * (LANE_HEIGHT + LANE_GAP);
  const viewHeight =
    PAD_TOP + show.segments.length * (LANE_HEIGHT + LANE_GAP) + 10;

  const ticks: number[] = [];
  for (let t = 0; t <= duration + 0.001; t += 20) ticks.push(t);

  return (
    <svg
      className="timeline"
      viewBox={`0 0 ${VIEW_WIDTH} ${viewHeight}`}
      role="img"
      aria-label="节目时间轴"
    >
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={xFor(t)}
            x2={xFor(t)}
            y1={10}
            y2={viewHeight - 6}
            stroke={t % 60 === 0 ? "#cdd7e4" : "#e7edf5"}
            strokeWidth={1}
          />
          <text x={xFor(t)} y={20} textAnchor="middle" className="tick-text">
            {formatClock(t)}
          </text>
        </g>
      ))}

      {show.segments.map((segment, index) => {
        const y = laneY(index);
        const locked = segment.locked;
        return (
          <g key={segment.id}>
            <rect
              x={xFor(segment.start)}
              y={y}
              width={Math.max(2, xFor(segment.end) - xFor(segment.start))}
              height={LANE_HEIGHT}
              rx={8}
              className={locked ? "lane lane-locked" : "lane"}
            />
            <text x={xFor(segment.start) + 8} y={y + 17} className="lane-name">
              {locked ? "🔒 " : ""}
              {segment.name}
            </text>
          </g>
        );
      })}

      {show.nodes.map((node) => {
        const segmentIndex = show.segments.findIndex(
          (s) => s.id === node.segmentId
        );
        if (segmentIndex < 0) return null;
        const model = modelsById.get(node.modelId);
        if (!model) return null;
        const point = pointsById.get(node.pointId);
        const y = laneY(segmentIndex) + 24;
        const x = xFor(node.time);
        const width = (model.duration / duration) * trackWidth;
        const color = categoryColors[model.category];
        const bad = badNodeIds.has(node.id);
        const selected = node.id === selectedNodeId;
        return (
          <g
            key={node.id}
            className="fire-bar"
            onClick={() => onSelectNode(node.id)}
          >
            <rect
              x={x}
              y={y}
              width={Math.max(3, width)}
              height={24}
              rx={5}
              fill={color}
              fillOpacity={selected ? 0.95 : 0.62}
              stroke={bad ? ISSUE_COLOR : selected ? "#10223f" : "#ffffff"}
              strokeWidth={bad ? 2.4 : selected ? 2 : 1.2}
            />
            <line
              x1={x}
              x2={x}
              y1={y - 5}
              y2={y + 29}
              stroke={bad ? ISSUE_COLOR : color}
              strokeWidth={1.6}
            />
            <text x={x + 5} y={y + 16} className="fire-text">
              {node.id} {model.short}·{point?.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
