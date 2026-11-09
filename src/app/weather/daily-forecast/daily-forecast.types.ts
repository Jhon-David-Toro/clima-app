import { DailyPoint } from '../domain/forecast';

/** Computed view data for a single row in the daily forecast list. */
export interface DayRow {
  readonly day: DailyPoint;
  readonly label: string;
  /** Start and width of the min–max bar, as percentages of the 10-day range. */
  readonly offset: number;
  readonly span: number;
  readonly gradient: string;
}
