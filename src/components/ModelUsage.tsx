// 型号用量：随点火节点草稿同步汇总
import { MODELS, Shot } from "../data/showData";

interface ModelUsageProps {
  shots: Shot[];
}

export function ModelUsage({ shots }: ModelUsageProps) {
  const rows = MODELS.map((model) => {
    const used = shots.filter((s) => s.modelId === model.id);
    return {
      model,
      count: used.length,
      totalEffectSec: used.length * model.durationSec,
    };
  });
  const totalShots = shots.length;

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>型号用量</p>
          <h2>装药清单汇总</h2>
        </div>
        <span className="hint">共 {totalShots} 枚</span>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>型号</th>
            <th>口径</th>
            <th>单发时长</th>
            <th>冷却</th>
            <th>安全距离</th>
            <th>用量</th>
            <th>效果合计</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ model, count, totalEffectSec }) => (
            <tr key={model.id} className={count === 0 ? "muted-row" : ""}>
              <td>
                <i className="dot" style={{ background: model.color }} />
                {model.name}
              </td>
              <td>{model.caliberMm === null ? "—" : `${model.caliberMm}mm`}</td>
              <td>{model.durationSec}s</td>
              <td>{model.cooldownSec}s</td>
              <td>{model.safetyRadiusM}m</td>
              <td>
                <b>{count}</b> 枚
              </td>
              <td>{totalEffectSec}s</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
