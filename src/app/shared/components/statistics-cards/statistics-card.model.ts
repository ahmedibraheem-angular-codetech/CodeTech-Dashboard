export type TrendDirection = 'up' | 'down' | 'neutral';

export interface StatisticsCard {
  id: string;
  title: string;

  value: string | number;
  icon?: string;
  iconColor?: string;
  iconBackground?: string;

  trend?: number;
  trendDirection?: TrendDirection;

  trendLabel?: string;
  caption?: string;

  interactive?: boolean;
}
