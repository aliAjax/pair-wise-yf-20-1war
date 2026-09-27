// 交互层：节目编排状态机（持久化、改版闸门、编辑操作）
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ShowState } from "../data/types";
import { catalog } from "../data/presets";
import { loadShow, loadStock, resetAll, saveShow, saveStock } from "../data/storage";
import { remapShow } from "../rules/remap";
import { liveIssues, validateShow, type Issue } from "../rules/validate";

export interface SwitchResult {
  ok: boolean;
  issues: Issue[];
  targetName: string;
}

export function useShow() {
  const [show, setShow] = useState<ShowState>(loadShow);
  const [stock, setStock] = useState<Record<string, number>>(loadStock);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    () => loadShow().nodes[0]?.id ?? null
  );
  const [lastSwitch, setLastSwitch] = useState<SwitchResult | null>(null);

  useEffect(() => saveShow(show), [show]);
  useEffect(() => saveStock(stock), [stock]);

  const version =
    catalog.versions.find((v) => v.id === show.versionId) ??
    catalog.versions[0];

  const issues = useMemo(() => liveIssues(show, catalog).issues, [show]);

  /** 切换曲目：先出候选，再走改版闸门；失败则保留上一版 */
  const switchVersion = useCallback(
    (targetId: string): SwitchResult => {
      const target = catalog.versions.find((v) => v.id === targetId);
      if (!target || targetId === show.versionId) {
        return {
          ok: targetId === show.versionId,
          issues: [],
          targetName: target?.name ?? "",
        };
      }
      const { candidate } = remapShow(show, target);
      const result = validateShow(candidate, target, catalog);
      const outcome: SwitchResult = {
        ok: result.ok,
        issues: result.issues,
        targetName: target.name,
      };
      setLastSwitch(outcome);
      if (result.ok) {
        setShow(candidate);
      }
      return outcome;
    },
    [show]
  );

  const toggleLock = useCallback((segmentId: string) => {
    setLastSwitch(null);
    setShow((prev) => ({
      ...prev,
      segments: prev.segments.map((s) =>
        s.id === segmentId ? { ...s, locked: !s.locked } : s
      ),
    }));
  }, []);

  const updateSegment = useCallback(
    (
      segmentId: string,
      patch: { name?: string; start?: number; end?: number }
    ) => {
      setLastSwitch(null);
      setShow((prev) => ({
        ...prev,
        segments: prev.segments.map((s) =>
          s.id === segmentId ? { ...s, ...patch } : s
        ),
      }));
    },
    []
  );

  const updateNode = useCallback(
    (nodeId: string, patch: Partial<{ time: number; pointId: string; modelId: string }>) => {
      setLastSwitch(null);
      setShow((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === nodeId ? { ...n, ...patch } : n
        ),
      }));
    },
    []
  );

  const updateStock = useCallback((modelId: string, value: number) => {
    setStock((prev) => ({ ...prev, [modelId]: Math.max(0, Math.round(value)) }));
  }, []);

  const restorePresets = useCallback(() => {
    const reset = resetAll();
    setShow(reset.show);
    setStock(reset.stock);
    setSelectedNodeId(reset.show.nodes[0]?.id ?? null);
    setLastSwitch(null);
  }, []);

  return {
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
  };
}
