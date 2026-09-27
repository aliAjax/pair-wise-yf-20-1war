// 交互层：段落锁定与首尾锚点编辑
import type { Segment } from "../data/types";
import { formatTimecode } from "../rules/time";
import { LOCKED_COLOR } from "./theme";

interface Props {
  segments: Segment[];
  onToggleLock: (segmentId: string) => void;
  onUpdate: (
    segmentId: string,
    patch: { name?: string; start?: number; end?: number }
  ) => void;
}

function parseLoose(input: string): number | null {
  const value = input.trim();
  if (value === "") return null;
  if (/^\d+(\.\d+)?$/.test(value)) return Number(value);
  const match = /^(\d+):(\d{1,2})(?:[.:](\d{1,3}))?$/.exec(value);
  if (!match) return null;
  const seconds = Number(match[2]);
  if (seconds >= 60) return null;
  const frac = match[3] ? Number(match[3]) / 1000 : 0;
  return Number(match[1]) * 60 + seconds + frac;
}

export function SegmentsPanel({ segments, onToggleLock, onUpdate }: Props) {
  return (
    <div className="segment-list">
      {segments.map((segment, index) => (
        <article
          key={segment.id}
          className="segment-row"
          style={{
            borderLeftColor: segment.locked ? LOCKED_COLOR : "#9fb4cf",
          }}
        >
          <div className="segment-head">
            <span className="segment-index">{index + 1}</span>
            <input
              className="segment-name-input"
              value={segment.name}
              onChange={(e) => onUpdate(segment.id, { name: e.target.value })}
            />
            <button
              className={segment.locked ? "lock-btn locked" : "lock-btn"}
              onClick={() => onToggleLock(segment.id)}
              title={segment.locked ? "点击解锁" : "点击锁定：改版时留在原时刻"}
            >
              {segment.locked ? "🔒 已锁定" : "🔓 未锁定"}
            </button>
          </div>
          <div className="segment-anchors">
            <label>
              首锚点
              <input
                defaultValue={formatTimecode(segment.start)}
                key={segment.id + "-start-" + segment.start.toFixed(3)}
                onBlur={(e) => {
                  const t = parseLoose(e.target.value);
                  if (t !== null) onUpdate(segment.id, { start: t });
                  else e.target.value = formatTimecode(segment.start);
                }}
              />
            </label>
            <label>
              尾锚点
              <input
                defaultValue={formatTimecode(segment.end)}
                key={segment.id + "-end-" + segment.end.toFixed(3)}
                onBlur={(e) => {
                  const t = parseLoose(e.target.value);
                  if (t !== null) onUpdate(segment.id, { end: t });
                  else e.target.value = formatTimecode(segment.end);
                }}
              />
            </label>
            <span className="segment-length">
              长 {(segment.end - segment.start).toFixed(1)}s
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
