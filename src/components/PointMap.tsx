// 交互层：燃放点位平面图（1m 坐标系，危险区随选中节点显示，冲突点位红框）
import { useMemo } from "react";
import type { Catalog, ShowState } from "../data/types";
import type { Issue } from "../rules/validate";
import { ISSUE_COLOR } from "./theme";

interface Props {
  show: ShowState;
  catalog: Catalog;
  issues: Issue[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
}

const FIELD_W = 120;
const FIELD_H = 120;
const PAD = 14;
const VIEW = 460;

export function PointMap({
  show,
  catalog,
  issues,
  selectedNodeId,
  onSelectNode,
}: Props) {
  const modelsById = new Map(catalog.models.map((m) => [m.id, m]));

  const badPointIds = useMemo(() => {
    const set = new Set<string>();
    for (const issue of issues) {
      for (const id of issue.nodeIds) {
        const node = show.nodes.find((n) => n.id === id);
        if (node) set.add(node.pointId);
      }
    }
    return set;
  }, [issues, show.nodes]);

  const selectedNode = show.nodes.find((n) => n.id === selectedNodeId) ?? null;
  const selectedPoint = selectedNode
    ? catalog.points.find((p) => p.id === selectedNode.pointId) ?? null
    : null;
  const selectedModel = selectedNode
    ? modelsById.get(selectedNode.modelId) ?? null
    : null;

  const scale = (VIEW - PAD * 2) / FIELD_W;
  const cx = (x: number) => PAD + x * scale;
  const cy = (y: number) => PAD + y * scale;

  return (
    <svg
      className="point-map"
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      role="img"
      aria-label="燃放点位平面图"
    >
      <rect
        x={PAD}
        y={PAD}
        width={FIELD_W * scale}
        height={FIELD_H * scale}
        rx={10}
        className="field"
      />
      {Array.from({ length: 5 }, (_, i) => (i + 1) * 20).map((m) => (
        <g key={m} opacity={0.5}>
          <line
            x1={cx(m)}
            x2={cx(m)}
            y1={PAD}
            y2={PAD + FIELD_H * scale}
            className="grid-line"
          />
          <line
            x1={PAD}
            x2={PAD + FIELD_W * scale}
            y1={cy(m)}
            y2={cy(m)}
            className="grid-line"
          />
        </g>
      ))}

      {selectedPoint && selectedModel && (
        <circle
          cx={cx(selectedPoint.x)}
          cy={cy(selectedPoint.y)}
          r={selectedModel.safetyRadius * scale}
          className="danger-zone"
        />
      )}

      {catalog.points.map((point) => {
        const bad = badPointIds.has(point.id);
        const activeNodes = show.nodes.filter((n) => n.pointId === point.id);
        const target =
          activeNodes.find((n) => n.id === selectedNodeId) ?? activeNodes[0];
        return (
          <g key={point.id}>
            <circle
              cx={cx(point.x)}
              cy={cy(point.y)}
              r={bad ? 9 : 7}
              className={bad ? "point point-bad point-clickable" : "point point-clickable"}
              onClick={target ? () => onSelectNode(target.id) : undefined}
            />
            <text x={cx(point.x)} y={cy(point.y) - 14} className="point-id">
              {point.id}
              {bad ? " ⚠" : ""}
            </text>
            <text x={cx(point.x)} y={cy(point.y) + 24} className="point-name">
              {point.name}
            </text>
            {activeNodes.length > 0 && (
              <text x={cx(point.x)} y={cy(point.y) + 38} className="point-count">
                {activeNodes.length} 枚
              </text>
            )}
          </g>
        );
      })}

      {selectedNode &&
        show.nodes
          .filter(
            (n) =>
              n.id !== selectedNode.id &&
              n.pointId !== selectedNode.pointId &&
              modelsById.get(n.modelId) &&
              (() => {
                const other = catalog.points.find((p) => p.id === n.pointId);
                return (
                  other &&
                  selectedPoint &&
                  selectedModel &&
                  Math.hypot(other.x - selectedPoint.x, other.y - selectedPoint.y) <
                    selectedModel.safetyRadius +
                      (modelsById.get(n.modelId)?.safetyRadius ?? 0)
                );
              })()
          )
          .map((n) => {
            const p = catalog.points.find((pt) => pt.id === n.pointId)!;
            return (
              <circle
                key={n.id}
                cx={cx(p.x)}
                cy={cy(p.y)}
                r={12}
                fill="none"
                stroke={ISSUE_COLOR}
                strokeWidth={1.6}
                strokeDasharray="4 3"
                className="danger-ring"
              />
            );
          })}

      <text x={PAD + 4} y={VIEW - 4} className="map-foot">
        网格 20m · 选中烟花后阴影圆为其安全距离（危险区）
      </text>
    </svg>
  );
}
