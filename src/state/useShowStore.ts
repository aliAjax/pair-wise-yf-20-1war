// ============================================================
// 状态层：编排草稿的 React 状态、动作与本地持久化
// 数据见 src/data/showData.ts，规则见 src/rules/replan.ts。
// 不新增后端：草稿保存在 localStorage，重开页面仍可继续编辑。
// ============================================================

import { useEffect, useMemo, useState } from "react";
import {
  MODELS,
  MUSIC_VERSIONS,
  POINTS,
  PRESET_SHOTS,
  Shot,
  versionById,
} from "../data/showData";
import {
  SwitchPlanResult,
  planVersionSwitch,
  validateShow,
  Violation,
} from "../rules/replan";

const STORAGE_KEY = "hxyfront-62008:show-draft:v1";

interface PersistedDraft {
  versionId: string;
  /** shotId → 点火时刻（秒） */
  fireAt: Record<string, number>;
  lockedSegmentIds: string[];
}

/** 从 localStorage 还原草稿；数据缺失或损坏时回退到预置 */
function loadDraft(): { versionId: string; shots: Shot[]; lockedSegmentIds: string[] } {
  const fallback = {
    versionId: MUSIC_VERSIONS[0].id,
    shots: PRESET_SHOTS.map((s) => ({ ...s })),
    lockedSegmentIds: [] as string[],
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PersistedDraft>;
    const version = MUSIC_VERSIONS.find((v) => v.id === parsed.versionId);
    if (!version || typeof parsed.fireAt !== "object" || parsed.fireAt === null) {
      return fallback;
    }
    const segmentIds = new Set(version.segments.map((s) => s.id));
    const shots = PRESET_SHOTS.map((preset) => {
      const t = parsed.fireAt?.[preset.id];
      return typeof t === "number" && Number.isFinite(t)
        ? { ...preset, fireAtSec: t }
        : { ...preset };
    });
    const lockedSegmentIds = Array.isArray(parsed.lockedSegmentIds)
      ? parsed.lockedSegmentIds.filter(
          (id): id is string => typeof id === "string" && segmentIds.has(id)
        )
      : [];
    return { versionId: version.id, shots, lockedSegmentIds };
  } catch {
    return fallback;
  }
}

export interface ShowStore {
  versionId: string;
  shots: Shot[];
  lockedSegmentIds: string[];
  /** 当前草稿的实时校验结果（编辑时即时提示） */
  liveViolations: Violation[];
  /** 应用曲目改版：校验通过才切换，否则保留上一版 */
  applyVersion: (targetVersionId: string) => SwitchPlanResult;
  /** 逐条修改点火时刻（编排师手动微调） */
  updateShotTime: (shotId: string, fireAtSec: number) => void;
  toggleSegmentLock: (segmentId: string) => void;
  resetToPreset: () => void;
}

export function useShowStore(): ShowStore {
  const [initial] = useState(loadDraft);
  const [versionId, setVersionId] = useState(initial.versionId);
  const [shots, setShots] = useState<Shot[]>(initial.shots);
  const [lockedSegmentIds, setLockedSegmentIds] = useState<string[]>(
    initial.lockedSegmentIds
  );

  // 任何状态变化都写入 localStorage，刷新/重开后可继续编辑
  useEffect(() => {
    const fireAt: Record<string, number> = {};
    for (const shot of shots) fireAt[shot.id] = shot.fireAtSec;
    const draft: PersistedDraft = { versionId, fireAt, lockedSegmentIds };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // 存储不可用时静默降级为纯内存编辑
    }
  }, [versionId, shots, lockedSegmentIds]);

  const liveViolations = useMemo(
    () => validateShow(shots, versionById(versionId), MODELS, POINTS),
    [shots, versionId]
  );

  const applyVersion = (targetVersionId: string): SwitchPlanResult => {
    const from = versionById(versionId);
    const to = versionById(targetVersionId);
    const result = planVersionSwitch(
      shots,
      from,
      to,
      lockedSegmentIds,
      MODELS,
      POINTS
    );
    if (result.ok) {
      setShots(result.plan);
      setVersionId(to.id);
    }
    // 校验未通过：不改动任何状态，保留上一版
    return result;
  };

  const updateShotTime = (shotId: string, fireAtSec: number) => {
    if (!Number.isFinite(fireAtSec)) return;
    const clamped = Math.max(0, Math.min(3599, Math.round(fireAtSec * 10) / 10));
    setShots((prev) =>
      prev.map((s) => (s.id === shotId ? { ...s, fireAtSec: clamped } : s))
    );
  };

  const toggleSegmentLock = (segmentId: string) => {
    setLockedSegmentIds((prev) =>
      prev.includes(segmentId)
        ? prev.filter((id) => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  const resetToPreset = () => {
    setVersionId(MUSIC_VERSIONS[0].id);
    setShots(PRESET_SHOTS.map((s) => ({ ...s })));
    setLockedSegmentIds([]);
  };

  return {
    versionId,
    shots,
    lockedSegmentIds,
    liveViolations,
    applyVersion,
    updateShotTime,
    toggleSegmentLock,
    resetToPreset,
  };
}
