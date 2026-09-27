// 交互层：曲目版本切换台（03:40 联排版 ↔ 04:20 正式演出版）
import type { ShowState, TrackVersion } from "../data/types";
import { formatTimecode } from "../rules/time";
import { OK_COLOR, ISSUE_COLOR } from "./theme";
import type { SwitchResult } from "../state/useShow";

interface Props {
  versions: TrackVersion[];
  show: ShowState;
  onSwitch: (targetId: string) => void;
  lastSwitch: SwitchResult | null;
}

export function VersionBar({ versions, show, onSwitch, lastSwitch }: Props) {
  const current = versions.find((v) => v.id === show.versionId);
  const lockedNames = show.segments.filter((s) => s.locked).map((s) => s.name);

  return (
    <section className="panel version-bar">
      <div className="version-current">
        <small>当前配乐版本</small>
        <strong>{current?.name}</strong>
        <span>
          全长 {formatTimecode(current?.duration ?? 0)} · {current?.note}
        </span>
      </div>

      <div className="version-switch">
        {versions.map((v) => {
          const active = v.id === show.versionId;
          return (
            <button
              key={v.id}
              className={active ? "active" : ""}
              onClick={() => onSwitch(v.id)}
              title={active ? "当前版本" : `切换到 ${v.name}`}
            >
              <b>{v.name}</b>
              <span>{v.note}</span>
            </button>
          );
        })}
        <p className="version-hint">
          未锁定段落按首尾锚点比例重排，锁定段落留在原时刻；
          {lockedNames.length > 0
            ? `已锁定：${lockedNames.join("、")}`
            : "当前无锁定段落（试试锁定「Chorus 主歌」再切到 04:20，可看到冷却闸门拦截）"}
        </p>
      </div>

      {lastSwitch && (
        <div
          className="switch-feedback"
          style={{
            borderColor: lastSwitch.ok ? OK_COLOR : ISSUE_COLOR,
            background: lastSwitch.ok
              ? "color-mix(in srgb, #15803d 8%, #fff)"
              : "color-mix(in srgb, #dc2626 8%, #fff)",
          }}
        >
          {lastSwitch.ok ? (
            <p>
              ✓ 已应用「{lastSwitch.targetName}」，未锁定段落按首尾锚点比例重排完成。
            </p>
          ) : (
            <div>
              <p>
                ✕ 切换「{lastSwitch.targetName}」被闸门拦截，已保留上一版，共{" "}
                {lastSwitch.issues.length} 项问题：
              </p>
              <ul>
                {lastSwitch.issues.map((issue, i) => (
                  <li key={i}>{issue.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
