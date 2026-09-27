import "./styles.css";
import { useShow } from "./state/useShow";
import { VersionBar } from "./components/VersionBar";
import { Timeline } from "./components/Timeline";
import { PointMap } from "./components/PointMap";
import { SegmentsPanel } from "./components/SegmentsPanel";
import { NodeEditor } from "./components/NodeEditor";
import { IssuesPanel } from "./components/IssuesPanel";
import { Inventory } from "./components/Inventory";
import { ISSUE_COLOR, OK_COLOR } from "./components/theme";

function App() {
  const {
    catalog,
    show,
    version,
    stock,
    issues,
    lastSwitch,
    selectedNodeId,
    setSelectedNodeId,
    switchVersion,
    toggleLock,
    updateSegment,
    updateNode,
    updateStock,
    restorePresets,
  } = useShow();

  const selectedNode =
    show.nodes.find((n) => n.id === selectedNodeId) ?? null;
  const lockedCount = show.segments.filter((s) => s.locked).length;

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <p className="kicker">hxyfront-62008 · 配乐改版台</p>
          <h1>烟花燃放脚本 · 配乐改版台</h1>
          <span className="subtitle">
            联排后配乐 03:40 → 04:20。未锁定段落按首尾锚点比例重排，锁定段落留在原时刻；
            冷却不足、危险区相交或节点越出段落即停止应用并保留上一版。
          </span>
        </div>
        <button className="ghost-btn" onClick={restorePresets}>
          恢复预置（3 段 / 4 点 / 8 枚）
        </button>
      </header>

      <section className="metrics">
        <article>
          <small>节目段落</small>
          <strong>{show.segments.length}</strong>
          <em>锁定 {lockedCount} 段</em>
        </article>
        <article>
          <small>燃放点位</small>
          <strong>{catalog.points.length}</strong>
          <em>平面坐标 1m 制</em>
        </article>
        <article>
          <small>点火节点</small>
          <strong>{show.nodes.length}</strong>
          <em>枚烟花已编排</em>
        </article>
        <article>
          <small>当前问题</small>
          <strong style={{ color: issues.length ? ISSUE_COLOR : OK_COLOR }}>
            {issues.length}
          </strong>
          <em>冷却 / 危险区 / 越界</em>
        </article>
      </section>

      <VersionBar
        versions={catalog.versions}
        show={show}
        onSwitch={switchVersion}
        lastSwitch={lastSwitch}
      />

      <section className="panel">
        <div className="panel-heading">
          <h2>时间轴编排</h2>
          <p>彩条为燃烧窗口，竖线为点火时刻；点击条目可在右侧编辑，红色描边为问题节点。</p>
        </div>
        <Timeline
          show={show}
          catalog={catalog}
          duration={version.duration}
          issues={issues}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
        />
      </section>

      <div className="console-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>燃放点位平面图</h2>
            <p>四个点位，虚线圆表示与选中烟花危险区相交的点位。</p>
          </div>
          <PointMap
            show={show}
            catalog={catalog}
            issues={issues}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>段落锁定与锚点</h2>
            <p>锁定段在改版时不重排；锚点支持 mm:ss.mmm 或秒数编辑。</p>
          </div>
          <SegmentsPanel
            segments={show.segments}
            onToggleLock={toggleLock}
            onUpdate={updateSegment}
          />
          <div className="panel-subhead">
            <h3>选中烟花</h3>
          </div>
          <NodeEditor
            node={selectedNode}
            catalog={catalog}
            onUpdate={updateNode}
          />
        </section>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <h2>冲突时间提示</h2>
          <p>编辑期实时校验，切换版本时作为应用闸门。</p>
        </div>
        <IssuesPanel issues={issues} onSelectNode={setSelectedNodeId} />
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>型号清单与用量</h2>
          <p>用量随当前版本节点实时统计，库存保存在本机，重开仍可编辑。</p>
        </div>
        <Inventory
          show={show}
          catalog={catalog}
          stock={stock}
          onStockChange={updateStock}
        />
      </section>

      <footer className="app-footer">
        数据（src/data）· 规则（src/rules）· 页面交互（src/components、src/state）分开维护，纯前端 +
        localStorage，无后端。
      </footer>
    </main>
  );
}

export default App;
