export type Period = 'Day' | 'Week' | 'Month';

export interface Task {
  id: number;
  name: string;
  weeklyGoalMinutes: number;
  todaysGoalMinutes: number;
}

export interface Session {
  id: number;
  taskId: number;
  startTime: string;
  endTime: string;
}

export interface TaskSummary extends Task {
  color: string;
  dailySeconds: number;
  weeklySeconds: number;
  periodSeconds: number;
  weeklyProgress: number;
  dailyProgress: number;
}

export interface ChartDay {
  date: string;
  label: string;
  shortDate: string;
  segments: { taskId: number; name: string; color: string; seconds: number }[];
}
