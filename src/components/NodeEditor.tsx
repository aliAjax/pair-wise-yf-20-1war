// 交互层：选中烟花的点火时刻 / 点位 / 型号编辑
import type { Catalog, IgnitionNode } from "../data/types";
import { formatTimecode } from "../rules/time";
import { categoryColors } from "./theme";

interface Props {
  node: IgnitionNode | null;
  catalog: Catalog;
  onUpdate: (
    nodeId: string,
    patch: Partial<{ time: number; pointId: string; modelId: string }>
  ) => void;
}

export function NodeEditor({ node, catalog, onUpdate }: Props) {
  if (!node) {
    return <p className="empty-hint">点击时间轴上的烟花条目进行编辑。</p>;
  }

  const model = catalog.models.find((m) => m.id === node.modelId);
  const point = catalog.points.find((p) => p.id === node.pointId);

  return (
    <div className="node-editor">
      <div
        className="node-editor-badge"
        style={{
          background: model ? categoryColors[model.category] : "#64748b",
        }}
      >
        {node.id}
      </div>
      <dl className="node-meta">
        <div>
          <dt>型号</dt>
          <dd>
            <select
              value={node.modelId}
              onChange={(e) => onUpdate(node.id, { modelId: e.target.value })}
            >
              {catalog.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}（{m.category} · 燃{m.duration}s · 冷却{m.cooldown}s）
                </option>
              ))}
            </select>
          </dd>
        </div>
        <div>
          <dt>点位</dt>
          <dd>
            <select
              value={node.pointId}
              onChange={(e) => onUpdate(node.id, { pointId: e.target.value })}
            >
              {catalog.points.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} {p.name} ({p.x},{p.y})
                </option>
              ))}
            </select>
          </dd>
        </div>
        <div>
          <dt>点火时刻</dt>
          <dd>
            <input
              defaultValue={formatTimecode(node.time)}
              key={node.id + "-time-" + node.time.toFixed(3)}
              onBlur={(e) => {
                const value = e.target.value.trim();
                const plain = /^\d+(\.\d+)?$/.test(value) ? Number(value) : NaN;
                const match = /^(\d+):(\d{1,2})(?:[.:](\d{1,3}))?$/.exec(value);
                let t = plain;
                if (Number.isNaN(t) && match) {
                  const seconds = Number(match[2]);
                  if (seconds < 60) {
                    const frac = match[3] ? Number(match[3]) / 1000 : 0;
                    t = Number(match[1]) * 60 + seconds + frac;
                  }
                }
                if (Number.isFinite(t)) onUpdate(node.id, { time: t });
                else e.target.value = formatTimecode(node.time);
              }}
            />
          </dd>
        </div>
      </dl>
      {model && point && (
        <p className="node-foot">
          口径 {model.caliber} · 角度 {model.angle}° · 燃烧 {model.duration}s
          （至 {formatTimecode(node.time + model.duration)}） · 安全距离
          {model.safetyRadius}m
        </p>
      )}
    </div>
  );
}
