// 改版台：选择目标曲目版本、设置段落锁定、应用改版并展示结果
import { useMemo, useState } from "react";
import {
  MUSIC_VERSIONS,
  MusicVersion,
  SEGMENT_COLORS,
  Shot,
  segmentOf,
  versionDuration,
} from "../data/showData";
import {
  SwitchPlanResult,
  VIOLATION_LABEL,
  formatTime,
} from "../rules/replan";

interface VersionConsoleProps {
  currentVersion: MusicVersion;
  shots: Shot[];
  lockedSegmentIds: string[];
  onToggleLock: (segmentId: string) => void;
  onApply: (targetVersionId: string) => SwitchPlanResult;
  onReset: () => void;
}

export function VersionConsole({
  currentVersion,
  shots,
  lockedSegmentIds,
  onToggleLock,
  onApply,
  onReset,
}: VersionConsoleProps) {
  const [targetId, setTargetId] = useState(
    MUSIC_VERSIONS.find((v) => v.id !== currentVersion.id)?.id ??
      MUSIC_VERSIONS[0].id
  );
  const [result, setResult] = useState<SwitchPlanResult | null>(null);

  const target = MUSIC_VERSIONS.find((v) => v.id === targetId) ?? MUSIC_VERSIONS[0];
  const sameVersion = target.id === currentVersion.id;

  // 改版预览：每个段落的时间范围变化与受影响节点数
  const preview = useMemo(
    () =>
      currentVersion.segments.map((seg, index) => {
        const next = segmentOf(target, seg.id);
        const locked = lockedSegmentIds.includes(seg.id);
        const count = shots.filter((s) => s.segmentId === seg.id).length;
        const fromSpan = seg.endSec - seg.startSec;
        const toSpan = next.endSec - next.startSec;
        return {
          seg,
          next,
          locked,
          count,
          scale: fromSpan > 0 ? toSpan / fromSpan : 0,
          color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
        };
      }),
    [currentVersion, target, lockedSegmentIds, shots]
  );

  const handleApply = () => {
    setResult(onApply(target.id));
  };

  return (
    <section className="panel console">
      <div className="heading">
        <div>
          <p>配乐改版台</p>
          <h2>曲目版本切换</h2>
        </div>
        <button onClick={onReset} title="清除本地草稿，恢复预置编排">
          恢复预置
        </button>
      </div>

      <div className="console-grid">
        <div className="version-card current">
          <small>当前版本</small>
          <strong>{currentVersion.name}</strong>
          <span>
            全长 {formatTime(versionDuration(currentVersion))} ·{" "}
            {currentVersion.note}
          </span>
        </div>

        <div className="console-controls">
          <label>
            <span>目标版本</span>
            <select
              value={targetId}
              onChange={(e) => {
                setTargetId(e.target.value);
                setResult(null);
              }}
            >
              {MUSIC_VERSIONS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}（{formatTime(versionDuration(v))}）
                </option>
              ))}
            </select>
          </label>
          <button
            className="primary"
            disabled={sameVersion}
            onClick={handleApply}
            title={sameVersion ? "目标版本与当前版本一致" : "按比例重排并校验后切换"}
          >
            应用改版
          </button>
        </div>

        <div className="version-card target">
          <small>目标版本</small>
          <strong>{target.name}</strong>
          <span>{target.note}</span>
        </div>
      </div>

      <div className="segment-preview">
        <div className="segment-preview-head">
          <span>段落</span>
          <span>当前范围</span>
          <span>目标范围</span>
          <span>缩放</span>
          <span>节点</span>
          <span>锁定</span>
        </div>
        {preview.map(({ seg, next, locked, count, scale, color }) => (
          <div className="segment-preview-row" key={seg.id}>
            <span>
              <i className="dot" style={{ background: color }} />
              {seg.name}
            </span>
            <span>
              {formatTime(seg.startSec)}–{formatTime(seg.endSec)}
            </span>
            <span>
              {formatTime(next.startSec)}–{formatTime(next.endSec)}
            </span>
            <span>{locked ? "—" : `×${scale.toFixed(2)}`}</span>
            <span>{count} 枚</span>
            <span>
              <label className="lock-toggle">
                <input
                  type="checkbox"
                  checked={locked}
                  onChange={() => onToggleLock(seg.id)}
                />
                <em>{locked ? "锁定·留原时刻" : "跟随重排"}</em>
              </label>
            </span>
          </div>
        ))}
      </div>

      {result && (
        <div className={`apply-result ${result.ok ? "ok" : "fail"}`}>
          {result.ok ? (
            <p>
              ✓ 已切换到「{target.name}」：{result.movedCount} 枚节点按比例重排
              {result.keptCount > 0
                ? `，${result.keptCount} 枚锁定节点保留原时刻`
                : ""}
              。时间轴、点位图与型号用量已同步。
            </p>
          ) : (
            <>
              <p>
                ✕ 已停止应用，保留上一版「{currentVersion.name}」。命中{" "}
                {result.violations.length} 条安全规则：
              </p>
              <ul>
                {result.violations.map((v, i) => (
                  <li key={i}>
                    <b>{VIOLATION_LABEL[v.kind]}</b>
                    {v.message}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}
