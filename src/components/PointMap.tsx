// 点位图：燃放点位平面布置 + 各节点安全半径（危险区）示意
import {
  FIELD,
  POINTS,
  Shot,
  modelById,
} from "../data/showData";
import { Violation, formatTime } from "../rules/replan";

interface PointMapProps {
  shots: Shot[];
  violations: Violation[];
  selectedShotId: string | null;
  onSelectShot: (shotId: string) => void;
}

const W = 1000;
const H = 660;
const PAD = 46;
const BOTTOM_STRIP = 44; // 观众席条带

export function PointMap({
  shots,
  violations,
  selectedShotId,
  onSelectShot,
}: PointMapProps) {
  const sx = (m: number) => PAD + (m / FIELD.widthM) * (W - PAD * 2);
  const sy = (m: number) => PAD + (m / FIELD.heightM) * (H - PAD * 2 - BOTTOM_STRIP);
  const sr = (m: number) => (m / FIELD.widthM) * (W - PAD * 2);

  // 危险区相交命中的点位对，用于连线告警
  const dangerPairs = violations
    .filter((v) => v.kind === "danger")
    .map((v) => v.pointIds as [string, string]);
  const dangerPoints = new Set(dangerPairs.flat());

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>点位图</p>
          <h2>燃放点位平面 · {FIELD.widthM}m × {FIELD.heightM}m</h2>
        </div>
        <span className="hint">虚线圆为各发烟花的安全距离</span>
      </div>
      <svg className="pointmap" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="点位平面图">
        {/* 场地 */}
        <rect
          x={PAD}
          y={PAD}
          width={W - PAD * 2}
          height={H - PAD * 2 - BOTTOM_STRIP}
          fill="#f8fafc"
          stroke="#cbd5e1"
        />
        <text x={PAD + 10} y={PAD + 20} className="map-note">
          后场 ↑
        </text>
        {/* 观众席 */}
        <rect
          x={PAD}
          y={H - PAD - BOTTOM_STRIP}
          width={W - PAD * 2}
          height={BOTTOM_STRIP}
          fill="#e2e8f0"
        />
        <text
          x={W / 2}
          y={H - PAD - BOTTOM_STRIP / 2 + 5}
          textAnchor="middle"
          className="map-note"
        >
          观众席 · 安全线外
        </text>

        {/* 危险区相交连线 */}
        {dangerPairs.map(([a, b], i) => {
          const pa = POINTS.find((p) => p.id === a)!;
          const pb = POINTS.find((p) => p.id === b)!;
          return (
            <line
              key={i}
              x1={sx(pa.x)}
              y1={sy(pa.y)}
              x2={sx(pb.x)}
              y2={sy(pb.y)}
              stroke="#dc2626"
              strokeWidth={3}
              strokeDasharray="8 6"
            />
          );
        })}

        {/* 每发烟花的安全半径圆（同点位同心） */}
        {shots.map((shot) => {
          const point = POINTS.find((p) => p.id === shot.pointId)!;
          const model = modelById(shot.modelId);
          const selected = selectedShotId === shot.id;
          return (
            <circle
              key={shot.id}
              cx={sx(point.x)}
              cy={sy(point.y)}
              r={sr(model.safetyRadiusM)}
              fill={model.color}
              fillOpacity={selected ? 0.16 : 0.05}
              stroke={model.color}
              strokeOpacity={selected ? 0.9 : 0.45}
              strokeDasharray="6 5"
              strokeWidth={selected ? 3 : 1.5}
            />
          );
        })}

        {/* 点位标记 */}
        {POINTS.map((point) => {
          const here = shots.filter((s) => s.pointId === point.id);
          const inDanger = dangerPoints.has(point.id);
          const maxRadius = here.length
            ? Math.max(...here.map((s) => modelById(s.modelId).safetyRadiusM))
            : 0;
          return (
            <g key={point.id}>
              <rect
                x={sx(point.x) - 9}
                y={sy(point.y) - 9}
                width={18}
                height={18}
                rx={4}
                fill={inDanger ? "#dc2626" : "#0f172a"}
                transform={`rotate(45 ${sx(point.x)} ${sy(point.y)})`}
              />
              <text
                x={sx(point.x)}
                y={sy(point.y) - 16}
                textAnchor="middle"
                className="point-label"
              >
                {point.name}
              </text>
              <text
                x={sx(point.x)}
                y={sy(point.y) + 28}
                textAnchor="middle"
                className="point-sub"
              >
                {here.length} 枚 · 最大半径 {maxRadius}m
              </text>
            </g>
          );
        })}
      </svg>

      <div className="point-list">
        {POINTS.map((point) => {
          const here = shots.filter((s) => s.pointId === point.id);
          return (
            <div key={point.id} className="point-card">
              <b>{point.name}</b>
              {here.map((shot) => {
                const model = modelById(shot.modelId);
                return (
                  <button
                    key={shot.id}
                    className={selectedShotId === shot.id ? "chip active" : "chip"}
                    onClick={() => onSelectShot(shot.id)}
                  >
                    <i className="dot" style={{ background: model.color }} />
                    {shot.label} · {formatTime(shot.fireAtSec)}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}
