import type { CheckIn, TaskItem } from '../../store/appStore';

export type SleepEntry = {
  date: string; // YYYY-MM-DD
  hours: number; // 0..24
};

export type CycleEntry = {
  date: string; // YYYY-MM-DD (period start)
};

export interface DataContext {
  checkIns: CheckIn[];
  tasks: TaskItem[];
  sleep?: SleepEntry[]; // optional (future module)
  cycles?: CycleEntry[]; // optional (future module)
}

export interface ModelParams {
  id: string; // e.g., 'moodRiskV1'
  weights: number[]; // feature vector length
  bias: number;
  lastTrainedAt?: number;
}
