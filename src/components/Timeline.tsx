// 时间轴：段落色带 + 按点位分泳道的点火节点标记
import {
  MusicVersion,
  POINTS,
  SEGMENT_COLORS,
  Shot,
  modelById,
  versionDuration,
} from "../data/showData";
import { formatTick, formatTime } from "../rules/replan";

interface TimelineProps {
  version: MusicVersion;
  shots: Shot[];
  lockedSegmentIds: string[];
  /** 实时校验命中的节点 id 集合 */
  conflictShotIds: Set<string>;
  selectedShotId: string | null;
  onSelectShot: (shotId: string) => void;
}

const W = 1000;
const PAD_L = 86;
const PAD_R = 24;
const TOP = 40;
const LANE_H = 46;
const BOTTOM = 30;

export function Timeline({
  version,
  shots,
  lockedSegmentIds,
  conflictShotIds,
  selectedShotId,
  onSelectShot,
}: TimelineProps) {
  const duration = versionDuration(version);
  const lanes = POINTS;
  const H = TOP + lanes.length * LANE_H + BOTTOM;
  const x = (sec: number) => PAD_L + (sec / duration) * (W - PAD_L - PAD_R);

  const ticks: number[] = [];
  for (let t = 0; t <= duration; t += 20) ticks.push(t);
  if (ticks[ticks.length - 1] !== duration) ticks.push(duration);

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>时间轴</p>
          <h2>点火时刻编排 · {version.name}</h2>
        </div>
        <span className="hint">点击节点可在下方表格中定位编辑</span>
      </div>
      <svg
        className="timeline"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="燃放时间轴"
      >
        {/* 段落色带 */}
        {version.segments.map((seg, i) => {
          const locked = lockedSegmentIds.includes(seg.id);
          const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
          return (
            <g key={seg.id}>
              <rect
                x={x(seg.startSec)}
                y={TOP - 22}
                width={x(seg.endSec) - x(seg.startSec)}
                height={H - TOP - BOTTOM + 22}
                fill={color}
                opacity={0.08}
              />
              <line
                x1={x(seg.startSec)}
                y1={TOP - 22}
                x2={x(seg.startSec)}
                y2={H - BOTTOM}
                stroke={color}
                strokeOpacity={0.5}
                strokeDasharray="4 3"
              />
              <text
                x={(x(seg.startSec) + x(seg.endSec)) / 2}
                y={TOP - 8}
                textAnchor="middle"
                className="seg-label"
                fill={color}
              >
                {seg.name}
                {locked ? " 🔒" : ""} {formatTick(seg.startSec)}–
                {formatTick(seg.endSec)}
              </text>
            </g>
          );
        })}
        {/* 末段结束线 */}
        <line
          x1={x(duration)}
          y1={TOP - 22}
          x2={x(duration)}
          y2={H - BOTTOM}
          stroke="#94a3b8"
          strokeDasharray="4 3"
        />

        {/* 时间刻度 */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={x(t)}
              y1={H - BOTTOM}
              x2={x(t)}
              y2={H - BOTTOM + 6}
              stroke="#94a3b8"
            />
            <text
              x={x(t)}
              y={H - BOTTOM + 20}
              textAnchor="middle"
              className="tick-label"
            >
              {formatTick(t)}
            </text>
          </g>
        ))}

        {/* 点位泳道 */}
        {lanes.map((point, laneIdx) => {
          const yMid = TOP + laneIdx * LANE_H + LANE_H / 2;
          return (
            <g key={point.id}>
              <text x={PAD_L - 10} y={yMid + 4} textAnchor="end" className="lane-label">
                {point.name}
              </text>
              <line
                x1={PAD_L}
                y1={yMid}
                x2={W - PAD_R}
                y2={yMid}
                stroke="#e2e8f0"
              />
            </g>
          );
        })}

        {/* 点火节点 */}
        {shots.map((shot) => {
          const model = modelById(shot.modelId);
          const laneIdx = lanes.findIndex((p) => p.id === shot.pointId);
          const yMid = TOP + laneIdx * LANE_H + LANE_H / 2;
          const sx = x(shot.fireAtSec);
          const ex = x(shot.fireAtSec + model.durationSec);
          const conflict = conflictShotIds.has(shot.id);
          const selected = selectedShotId === shot.id;
          return (
            <g
              key={shot.id}
              className="shot-marker"
              onClick={() => onSelectShot(shot.id)}
            >
              <title>{`${shot.label} · ${model.name} · 点火 ${formatTime(shot.fireAtSec)} · 效果 ${model.durationSec}s`}</title>
              <rect
                x={sx}
                y={yMid - 4}
                width={Math.max(ex - sx, 2)}
                height={8}
                rx={4}
                fill={model.color}
                opacity={0.3}
              />
              <circle
                cx={sx}
                cy={yMid}
                r={selected ? 9 : 7}
                fill={model.color}
                stroke={conflict ? "#dc2626" : selected ? "#0f172a" : "#ffffff"}
                strokeWidth={conflict || selected ? 3 : 2}
              />
              {conflict && (
                <text x={sx} y={yMid - 13} textAnchor="middle" className="conflict-flag">
                  ⚠
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="legend">
        {Array.from(new Set(shots.map((s) => s.modelId))).map((modelId) => {
          const model = modelById(modelId);
          return (
            <span key={modelId}>
              <i className="dot" style={{ background: model.color }} />
              {model.name}
            </span>
          );
        })}
      </div>
    </section>
  );
}
