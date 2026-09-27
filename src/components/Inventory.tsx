// 交互层：型号用量（按当前版本节点实时统计，库存可编辑并持久化）
import type { Catalog, ShowState } from "../data/types";
import { categoryColors } from "./theme";

interface Props {
  show: ShowState;
  catalog: Catalog;
  stock: Record<string, number>;
  onStockChange: (modelId: string, value: number) => void;
}

export function Inventory({ show, catalog, stock, onStockChange }: Props) {
  const used = new Map<string, number>();
  for (const node of show.nodes) {
    used.set(node.modelId, (used.get(node.modelId) ?? 0) + 1);
  }

  return (
    <table className="inventory">
      <thead>
        <tr>
          <th>型号</th>
          <th>口径/角度</th>
          <th>燃烧/冷却</th>
          <th>安全距离</th>
          <th>用量</th>
          <th>库存</th>
        </tr>
      </thead>
      <tbody>
        {catalog.models.map((model) => {
          const count = used.get(model.id) ?? 0;
          const remaining = (stock[model.id] ?? 0) - count;
          return (
            <tr key={model.id}>
              <td>
                <span
                  className="color-dot"
                  style={{ background: categoryColors[model.category] }}
                />
                {model.name}
              </td>
              <td>
                {model.caliber} · {model.angle}°
              </td>
              <td>
                {model.duration}s / {model.cooldown}s
              </td>
              <td>{model.safetyRadius}m</td>
              <td>
                <b>{count}</b> 枚
              </td>
              <td>
                <input
                  type="number"
                  min={0}
                  value={stock[model.id] ?? 0}
                  onChange={(e) =>
                    onStockChange(model.id, Number(e.target.value))
                  }
                />
                <span
                  className="stock-tag"
                  style={{ color: remaining < 0 ? "#dc2626" : "#15803d" }}
                >
                  {remaining < 0 ? `缺 ${-remaining}` : `余 ${remaining}`}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={4}>合计</td>
          <td>
            <b>{show.nodes.length}</b> 枚
          </td>
          <td className="muted">本地保存</td>
        </tr>
      </tfoot>
    </table>
  );
}
