// 数据层：领域类型定义（页面与规则共用，不依赖任何 React/后端结构）

export type Category = "礼花弹" | "罗马烛光" | "扇形架" | "冷焰火";

/** 曲目版本（联排版 / 正式演出版） */
export interface TrackVersion {
  id: string;
  name: string;
  /** 曲目总长（秒） */
  duration: number;
  note: string;
}

/** 燃放点位（坐标单位：米，用于平面图与危险区计算） */
export interface LaunchPoint {
  id: string;
  name: string;
  x: number;
  y: number;
}

/** 烟花型号目录 */
export interface FireworkModel {
  id: string;
  short: string;
  name: string;
  category: Category;
  /** 口径 */
  caliber: string;
  /** 发射角度（度） */
  angle: number;
  /** 燃烧持续（秒） */
  duration: number;
  /** 同点位两次点火的最小间隔（秒） */
  cooldown: number;
  /** 安全距离 / 危险区半径（米） */
  safetyRadius: number;
}

/** 节目段落，start/end 为相对当前曲目的首尾锚点（秒） */
export interface Segment {
  id: string;
  name: string;
  start: number;
  end: number;
  /** 锁定后切换版本不重排，留在原时刻 */
  locked: boolean;
}

/** 点火节点：一枚烟花在某点位、某段落内的一次燃放 */
export interface IgnitionNode {
  id: string;
  segmentId: string;
  pointId: string;
  modelId: string;
  /** 点火时刻（秒，相对当前曲目） */
  time: number;
}

/** 一场节目的可变状态（可持久化） */
export interface ShowState {
  versionId: string;
  segments: Segment[];
  nodes: IgnitionNode[];
}

export interface Catalog {
  versions: TrackVersion[];
  points: LaunchPoint[];
  models: FireworkModel[];
}
