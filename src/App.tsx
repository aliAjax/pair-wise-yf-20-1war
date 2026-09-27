import { useMemo, useState } from "react";
import "./styles.css";
import { SHOW_META, versionById, versionDuration } from "./data/showData";
import { formatTime } from "./rules/replan";
import { useShowStore } from "./state/useShowStore";
import { VersionConsole } from "./components/VersionConsole";
import { Timeline } from "./components/Timeline";
import { PointMap } from "./components/PointMap";
import { ModelUsage } from "./components/ModelUsage";
import { ShotTable } from "./components/ShotTable";

function App() {
  const store = useShowStore();
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);

  const currentVersion = versionById(store.versionId);
  const conflictShotIds = useMemo(
    () => new Set(store.liveViolations.flatMap((v) => v.shotIds)),
    [store.liveViolations]
  );

  const metrics = [
    { label: "节目段落", value: String(currentVersion.segments.length) },
    { label: "点火节点", value: String(store.shots.length) },
    {
      label: "冲突提示",
      value: String(store.liveViolations.length),
      alert: store.liveViolations.length > 0,
    },
    {
      label: "当前曲目",
      value: formatTime(versionDuration(currentVersion)),
    },
  ];

  return (
    <main className="app">
      <section className="hero">
        <p>
          {SHOW_META.id} · 源提示词{SHOW_META.sourceNo} · Port {SHOW_META.port}
        </p>
        <h1>{SHOW_META.title}</h1>
        <span>
          联排后配乐从 3′40″ 切到 4′20″：切换曲目版本时，未锁定段落按首尾锚点
          比例重排点火时刻，锁定段落留在原时刻；若出现冷却不足、危险区相交或
          节点越出段落，则停止应用并保留上一版。时间轴、点位图与型号用量随草稿
          同步更新，草稿保存在本地，重开页面仍可继续逐条编辑。
        </span>
      </section>

      <section className="metrics">
        {metrics.map((m) => (
          <article key={m.label} className={m.alert ? "alert" : ""}>
            <small>{m.label}</small>
            <strong>{m.value}</strong>
          </article>
        ))}
      </section>

      <VersionConsole
        currentVersion={currentVersion}
        shots={store.shots}
        lockedSegmentIds={store.lockedSegmentIds}
        onToggleLock={store.toggleSegmentLock}
        onApply={store.applyVersion}
        onReset={store.resetToPreset}
      />

      <Timeline
        version={currentVersion}
        shots={store.shots}
        lockedSegmentIds={store.lockedSegmentIds}
        conflictShotIds={conflictShotIds}
        selectedShotId={selectedShotId}
        onSelectShot={setSelectedShotId}
      />

      <div className="two-col">
        <PointMap
          shots={store.shots}
          violations={store.liveViolations}
          selectedShotId={selectedShotId}
          onSelectShot={setSelectedShotId}
        />
        <ModelUsage shots={store.shots} />
      </div>

      <ShotTable
        version={currentVersion}
        shots={store.shots}
        lockedSegmentIds={store.lockedSegmentIds}
        violations={store.liveViolations}
        selectedShotId={selectedShotId}
        onSelectShot={setSelectedShotId}
        onUpdateTime={store.updateShotTime}
      />
    </main>
  );
}

export default App;
