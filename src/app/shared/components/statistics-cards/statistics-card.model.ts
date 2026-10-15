export type TrendDirection = 'up' | 'down' | 'neutral';

/** One KPI card. Colors stay on the card so each feature picks its own icon treatment. */
export interface StatisticsCard {
  id: string;
  title: string;
  /** A ready-made label such as `1,284`, or a number the component formats. */
  value: string | number;
  icon?: string;
  iconColor?: string;
  iconBackground?: string;
  /** Signed percentage. `12.5` renders as `+12.5%`. */
  trend?: number;
  trendDirection?: TrendDirection;
  /** Replaces the formatted percentage when the feature already has a label. */
  trendLabel?: string;
  caption?: string;
  /** When true the card emits `cardSelect` and is exposed as a button. */
  interactive?: boolean;
}
