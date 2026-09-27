// ============================================================
// 数据层：预置数据与类型定义
// 只存放数据，不包含任何规则或页面交互逻辑。
// 规则见 src/rules/replan.ts，交互见 src/state/useShowStore.ts。
// ============================================================

/** 烟花型号 */
export interface FireworkModel {
  id: string;
  name: string;
  /** 口径（mm），冷焰火等非口径类为 null */
  caliberMm: number | null;
  /** 单发效果持续时间（秒） */
  durationSec: number;
  /** 安全距离 / 危险区半径（米） */
  safetyRadiusM: number;
  /** 同点位再次点火所需冷却（秒） */
  cooldownSec: number;
  /** 图示颜色 */
  color: string;
}

/** 燃放点位（平面图坐标，单位：米） */
export interface LaunchPoint {
  id: string;
  name: string;
  x: number;
  y: number;
}

/** 节目段落在某个曲目版本中的时间范围 */
export interface SegmentDef {
  id: string;
  name: string;
  startSec: number;
  endSec: number;
}

/** 配乐版本：同一台节目在不同剪辑版本下的段落边界 */
export interface MusicVersion {
  id: string;
  name: string;
  note: string;
  segments: SegmentDef[];
}

/** 点火节点（一枚烟花的燃放指令） */
export interface Shot {
  id: string;
  label: string;
  modelId: string;
  pointId: string;
  segmentId: string;
  /** 点火时刻（秒，相对曲目起点） */
  fireAtSec: number;
  /** 发射角度（度） */
  angleDeg: number;
}

/** 项目元信息 */
export const SHOW_META = {
  sourceNo: 10,
  id: "hxyfront-62008",
  port: 62008,
  title: "烟花燃放配乐改版台",
  domain: "烟花燃放编排",
} as const;

/** 点位平面图场地尺寸（米） */
export const FIELD = { widthM: 100, heightM: 60 } as const;

/** 预置烟花型号 */
export const MODELS: FireworkModel[] = [
  { id: "fan30",    name: "30mm扇形架",   caliberMm: 30,   durationSec: 6,  safetyRadiusM: 15, cooldownSec: 4, color: "#f59e0b" },
  { id: "shell75",  name: "75mm礼花弹",   caliberMm: 75,   durationSec: 3,  safetyRadiusM: 25, cooldownSec: 8, color: "#dc2626" },
  { id: "candle20", name: "20mm罗马烛光", caliberMm: 20,   durationSec: 8,  safetyRadiusM: 12, cooldownSec: 3, color: "#1d4ed8" },
  { id: "cold",     name: "冷焰火",       caliberMm: null, durationSec: 10, safetyRadiusM: 8,  cooldownSec: 2, color: "#0ea5e9" },
];

/** 预置四个燃放点位 */
export const POINTS: LaunchPoint[] = [
  { id: "A", name: "A · 台左前", x: 20, y: 40 },
  { id: "B", name: "B · 台右前", x: 80, y: 40 },
  { id: "C", name: "C · 台后中", x: 50, y: 15 },
  { id: "D", name: "D · 近景台", x: 50, y: 48 },
];

/** 预置两个配乐版本：联排 3′40″ → 改版 4′20″，三段节目共用 id */
export const MUSIC_VERSIONS: MusicVersion[] = [
  {
    id: "v340",
    name: "联排版 3′40″",
    note: "联排使用的原始配乐，全长 220 秒。",
    segments: [
      { id: "intro",  name: "开场", startSec: 0,   endSec: 60  },
      { id: "verse",  name: "主歌", startSec: 60,  endSec: 150 },
      { id: "finale", name: "终章", startSec: 150, endSec: 220 },
    ],
  },
  {
    id: "v420",
    name: "改版 4′20″",
    note: "联排后更换的新配乐，全长 260 秒，开场与主歌拉长。",
    segments: [
      { id: "intro",  name: "开场", startSec: 0,   endSec: 70  },
      { id: "verse",  name: "主歌", startSec: 70,  endSec: 180 },
      { id: "finale", name: "终章", startSec: 180, endSec: 260 },
    ],
  },
];

/** 预置八枚点火节点（时刻对应联排版 3′40″） */
export const PRESET_SHOTS: Shot[] = [
  { id: "n1", label: "开场扇形",   modelId: "fan30",    pointId: "A", segmentId: "intro",  fireAtSec: 12.5, angleDeg: 45 },
  { id: "n2", label: "开场烛光",   modelId: "candle20", pointId: "C", segmentId: "intro",  fireAtSec: 30,   angleDeg: 90 },
  { id: "n3", label: "主歌礼花·右", modelId: "shell75",  pointId: "B", segmentId: "verse",  fireAtSec: 68.2, angleDeg: 75 },
  { id: "n4", label: "主歌礼花·左", modelId: "shell75",  pointId: "A", segmentId: "verse",  fireAtSec: 90,   angleDeg: 75 },
  { id: "n5", label: "主歌烛光",   modelId: "candle20", pointId: "D", segmentId: "verse",  fireAtSec: 120,  angleDeg: 90 },
  { id: "n6", label: "终章冷焰",   modelId: "cold",     pointId: "D", segmentId: "finale", fireAtSec: 155,  angleDeg: 90 },
  { id: "n7", label: "终章礼花",   modelId: "shell75",  pointId: "C", segmentId: "finale", fireAtSec: 180,  angleDeg: 80 },
  { id: "n8", label: "终章扇形",   modelId: "fan30",    pointId: "B", segmentId: "finale", fireAtSec: 205,  angleDeg: 45 },
];

/** 段落展示色（按段落顺序循环使用） */
export const SEGMENT_COLORS = ["#1d4ed8", "#dc2626", "#f59e0b"];

export function modelById(id: string): FireworkModel {
  const m = MODELS.find((m) => m.id === id);
  if (!m) throw new Error(`未知型号: ${id}`);
  return m;
}

export function pointById(id: string): LaunchPoint {
  const p = POINTS.find((p) => p.id === id);
  if (!p) throw new Error(`未知点位: ${id}`);
  return p;
}

export function versionById(id: string): MusicVersion {
  const v = MUSIC_VERSIONS.find((v) => v.id === id);
  if (!v) throw new Error(`未知曲目版本: ${id}`);
  return v;
}

export function segmentOf(version: MusicVersion, segmentId: string): SegmentDef {
  const s = version.segments.find((s) => s.id === segmentId);
  if (!s) throw new Error(`版本 ${version.id} 中不存在段落: ${segmentId}`);
  return s;
}

/** 曲目总时长 = 最后一段的结束时刻 */
export function versionDuration(version: MusicVersion): number {
  return Math.max(...version.segments.map((s) => s.endSec));
}
