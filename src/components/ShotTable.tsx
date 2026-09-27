// 点火节点表：逐条编辑点火时刻，实时显示冲突与锁定状态
import {
  MusicVersion,
  Shot,
  modelById,
  pointById,
  segmentOf,
} from "../data/showData";
import { VIOLATION_LABEL, Violation, formatTime } from "../rules/replan";

interface ShotTableProps {
  version: MusicVersion;
  shots: Shot[];
  lockedSegmentIds: string[];
  violations: Violation[];
  selectedShotId: string | null;
  onSelectShot: (shotId: string) => void;
  onUpdateTime: (shotId: string, fireAtSec: number) => void;
}

export function ShotTable({
  version,
  shots,
  lockedSegmentIds,
  violations,
  selectedShotId,
  onSelectShot,
  onUpdateTime,
}: ShotTableProps) {
  const conflictByShot = new Map<string, Violation[]>();
  for (const v of violations) {
    for (const id of v.shotIds) {
      conflictByShot.set(id, [...(conflictByShot.get(id) ?? []), v]);
    }
  }

  const sorted = [...shots].sort((a, b) => a.fireAtSec - b.fireAtSec);

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>点火节点</p>
          <h2>逐条调整点火时刻</h2>
        </div>
        <span className="hint">
          {violations.length === 0
            ? "当前草稿无冲突"
            : `当前草稿有 ${violations.length} 条冲突`}
        </span>
      </div>

      {violations.length > 0 && (
        <div className="apply-result fail compact">
          <ul>
            {violations.map((v, i) => (
              <li key={i}>
                <b>{VIOLATION_LABEL[v.kind]}</b>
                {v.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <table className="data-table shot-table">
        <thead>
          <tr>
            <th>#</th>
            <th>节点</th>
            <th>型号</th>
            <th>点位</th>
            <th>段落</th>
            <th>角度</th>
            <th>点火时刻</th>
            <th>编辑（秒）</th>
            <th>效果窗口</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((shot, index) => {
            const model = modelById(shot.modelId);
            const point = pointById(shot.pointId);
            const seg = segmentOf(version, shot.segmentId);
            const locked = lockedSegmentIds.includes(shot.segmentId);
            const shotConflicts = conflictByShot.get(shot.id) ?? [];
            const selected = selectedShotId === shot.id;
            return (
              <tr
                key={shot.id}
                className={[
                  selected ? "selected-row" : "",
                  shotConflicts.length > 0 ? "conflict-row" : "",
                ].join(" ")}
                onClick={() => onSelectShot(shot.id)}
              >
                <td>{String(index + 1).padStart(2, "0")}</td>
                <td>{shot.label}</td>
                <td>
                  <i className="dot" style={{ background: model.color }} />
                  {model.name}
                </td>
                <td>{point.name}</td>
                <td>
                  {seg.name}
                  {locked && <em className="tag">🔒锁定</em>}
                </td>
                <td>{shot.angleDeg}°</td>
                <td className="mono">{formatTime(shot.fireAtSec)}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={shot.fireAtSec}
                    onChange={(e) => {
                      // 清空输入框时不重置为 0，保留上一有效时刻
                      if (e.target.value === "") return;
                      onUpdateTime(shot.id, Number(e.target.value));
                    }}
                    aria-label={`${shot.label} 点火时刻（秒）`}
                  />
                </td>
                <td className="mono">
                  {formatTime(shot.fireAtSec)}–
                  {formatTime(shot.fireAtSec + model.durationSec)}
                </td>
                <td>
                  {shotConflicts.length === 0 ? (
                    <em className="tag ok">正常</em>
                  ) : (
                    shotConflicts.map((v, i) => (
                      <em key={i} className="tag bad">
                        {VIOLATION_LABEL[v.kind]}
                      </em>
                    ))
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
