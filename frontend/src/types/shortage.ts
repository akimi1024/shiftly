export type ShortageResponse = {
  date: string;
  time: string;
  required_count: number;
  available_count: number;
  shortage: number; // 正=不足(required>available) / 負=過剰
};
