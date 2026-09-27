// 数据层：预置三段节目、四个点位、八枚烟花与两版曲目
import type { Catalog, ShowState } from "./types";

/** 联排后配乐从 03:40（220s）切到 04:20（260s） */
export const REHEARSAL_DURATION = 220;
export const SHOW_DURATION = 260;

export const catalog: Catalog = {
  versions: [
    {
      id: "v-rehearsal",
      name: "联排版 03:40",
      duration: REHEARSAL_DURATION,
      note: "联排配乐，全长 03:40",
    },
    {
      id: "v-show",
      name: "正式演出版 04:20",
      duration: SHOW_DURATION,
      note: "改版配乐，全长 04:20",
    },
  ],

  points: [
    { id: "P1", name: "一号 前左岸", x: 20, y: 24 },
    { id: "P2", name: "二号 前右岸", x: 80, y: 18 },
    { id: "P3", name: "三号 后左岸", x: 30, y: 92 },
    { id: "P4", name: "四号 后右岸", x: 88, y: 100 },
  ],

  models: [
    {
      id: "M1",
      short: "扇形",
      name: "30mm 扇形架",
      category: "扇形架",
      caliber: "30mm",
      angle: 45,
      duration: 6,
      cooldown: 8,
      safetyRadius: 35,
    },
    {
      id: "M2",
      short: "75礼花",
      name: "75mm 礼花弹",
      category: "礼花弹",
      caliber: "75mm",
      angle: 90,
      duration: 5,
      cooldown: 12,
      safetyRadius: 60,
    },
    {
      id: "M3",
      short: "冷焰",
      name: "舞台冷焰火",
      category: "冷焰火",
      caliber: "—",
      angle: 60,
      duration: 10,
      cooldown: 6,
      safetyRadius: 15,
    },
    {
      id: "M4",
      short: "罗马",
      name: "罗马烛光束",
      category: "罗马烛光",
      caliber: "20mm",
      angle: 70,
      duration: 7,
      cooldown: 9,
      safetyRadius: 25,
    },
    {
      id: "M5",
      short: "100礼花",
      name: "100mm 礼花弹",
      category: "礼花弹",
      caliber: "100mm",
      angle: 90,
      duration: 6,
      cooldown: 15,
      safetyRadius: 75,
    },
  ],
};

/** 联排版下的初始节目：三段节目、八枚烟花 */
export const initialShow: ShowState = {
  versionId: "v-rehearsal",
  segments: [
    { id: "S1", name: "Intro 开场", start: 0, end: 40, locked: false },
    { id: "S2", name: "Chorus 主歌", start: 40, end: 150, locked: false },
    { id: "S3", name: "Finale 终章", start: 150, end: 220, locked: false },
  ],
  nodes: [
    { id: "F1", segmentId: "S1", pointId: "P1", modelId: "M1", time: 33 },
    { id: "F2", segmentId: "S1", pointId: "P2", modelId: "M3", time: 12 },
    { id: "F3", segmentId: "S2", pointId: "P1", modelId: "M2", time: 46 },
    { id: "F4", segmentId: "S2", pointId: "P3", modelId: "M4", time: 82 },
    { id: "F5", segmentId: "S2", pointId: "P4", modelId: "M2", time: 104 },
    { id: "F6", segmentId: "S2", pointId: "P2", modelId: "M4", time: 128 },
    { id: "F7", segmentId: "S3", pointId: "P3", modelId: "M5", time: 175 },
    { id: "F8", segmentId: "S3", pointId: "P1", modelId: "M1", time: 200 },
  ],
};

/** 初始库存（型号用量的备货基线） */
export const initialStock: Record<string, number> = {
  M1: 4,
  M2: 6,
  M3: 3,
  M4: 4,
  M5: 2,
};
