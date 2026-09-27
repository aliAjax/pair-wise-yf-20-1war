// 规则层：时间码工具（mm:ss.mmm ↔ 秒），供校验、重排与界面共用

/** "03:40.000" → 220；非法输入返回 NaN */
export function parseTimecode(input: string): number {
  const text = input.trim();
  const match = /^(\d+):(\d{1,2})(?:[.:](\d{1,3}))?$/.exec(text);
  if (!match) return NaN;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const fracText = match[3] ?? "";
  const fraction = fracText ? Number(fracText) / 1000 : 0;
  if (seconds >= 60) return NaN;
  return minutes * 60 + seconds + fraction;
}

/** 220 → "03:40.000" */
export function formatTimecode(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = Math.floor(safe % 60);
  const millis = Math.round((safe - Math.floor(safe)) * 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}.${String(millis).padStart(3, "0")}`;
}

/** 紧凑显示：220 → "03:40"（刻度用） */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = Math.round(safe % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
