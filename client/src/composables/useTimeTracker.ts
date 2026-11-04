import { computed, onUnmounted, ref, watch } from 'vue';
import type { ChartDay, Period, Session, Task, TaskSummary } from '../types/tracker';
import { localDate } from '../utilities/time';

const STORAGE_KEY = 'timetrack-v1';
const TASK_COLORS = ['#8066ff', '#44c780', '#65b5ff', '#ffa337', '#f369a6'];

function createDefaultTasks(): Task[] {
  const names = [
    'PyTorch Learning',
    'IA04 - Multi-Agent Project',
    'IA03 - Knowledge Graph',
    'English Vocabulary',
    'Course Revision',
  ];
  const weeklyGoals = [840, 480, 360, 420, 420];

  return names.map((name, index) => ({
    id: index + 1,
    name,
    weeklyGoalMinutes: weeklyGoals[index],
    todaysGoalMinutes: 60,
  }));
}

export function useTimeTracker() {
  const tasks = ref<Task[]>([]);
  const sessions = ref<Session[]>([]);
  const activeSession = ref<{ taskId: number; startTime: string } | null>(null);
  const pausedTaskId = ref<number | null>(null);
  const selectedTaskId = ref<number | null>(null);
  const error = ref('');
  const period = ref<Period>('Day');
  const selectedDate = ref(localDate(new Date()));
  const now = ref(Date.now());

  try {
    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');

    if (savedData) {
      tasks.value = savedData.tasks;
      sessions.value = savedData.sessions;
      activeSession.value = savedData.active || null;
    } else {
      tasks.value = createDefaultTasks();
    }
  } catch {
    error.value = 'Could not read saved data.';
  }

  watch(
    [tasks, sessions, activeSession],
    () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          tasks: tasks.value,
          sessions: sessions.value,
          active: activeSession.value,
        }));
      } catch {
        error.value = 'Could not save. Export a backup before closing.';
      }
    },
    { deep: true },
  );

  watch(
    () => tasks.value.map(task => task.id),
    taskIds => {
      if (selectedTaskId.value !== null && !taskIds.includes(selectedTaskId.value)) {
        selectedTaskId.value = null;
      }
    },
    { flush: 'sync' },
  );

  const timer = setInterval(() => {
    now.value = Date.now();
  }, 1000);

  onUnmounted(() => clearInterval(timer));

  const weekStart = computed(() => {
    const date = new Date(selectedDate.value + 'T00:00:00');
    const daysSinceMonday = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - daysSinceMonday);
    return date;
  });

  const weekDays = computed(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart.value);
    date.setDate(date.getDate() + index);
    return date;
  }));

  const weekLabel = computed(() => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const firstDay = weekStart.value.toLocaleDateString(undefined, options);
    const lastDay = weekDays.value[6].toLocaleDateString(undefined, options);
    return firstDay + ' – ' + lastDay;
  });

  function getPeriodBounds(selectedPeriod: Period, day?: Date) {
    const start = new Date(day || (
      selectedPeriod === 'Week' ? weekStart.value : selectedDate.value + 'T00:00:00'
    ));

    if (selectedPeriod === 'Month') {
      start.setDate(1);
    }

    const end = new Date(start);

    if (selectedPeriod === 'Month') {
      end.setMonth(end.getMonth() + 1);
    } else {
      end.setDate(end.getDate() + (selectedPeriod === 'Week' ? 7 : 1));
    }

    return { start: start.getTime(), end: end.getTime() };
  }

  function getTrackedSeconds(taskId: number, selectedPeriod: Period = 'Day', day?: Date) {
    const { start, end } = getPeriodBounds(selectedPeriod, day);

    return sessions.value
      .filter(session => session.taskId === taskId)
      .reduce((total, session) => {
        const overlapStart = Math.max(Date.parse(session.startTime), start);
        const overlapEnd = Math.min(Date.parse(session.endTime), end);
        return total + Math.max(0, overlapEnd - overlapStart) / 1000;
      }, 0);
  }

  function taskColor(taskId: number): string {
    const index = Math.max(0, tasks.value.findIndex(task => task.id === taskId));
    return TASK_COLORS[index % TASK_COLORS.length];
  }

  function taskName(taskId: number): string {
    return tasks.value.find(task => task.id === taskId)?.name || 'Deleted task';
  }

  const taskSummaries = computed<TaskSummary[]>(() => tasks.value.map(task => {
    const weeklySeconds = getTrackedSeconds(task.id, 'Week');
    const dailySeconds = getTrackedSeconds(task.id, 'Day');
    const weeklyGoalSeconds = task.weeklyGoalMinutes * 60;
    const dailyGoalSeconds = task.todaysGoalMinutes * 60;

    return {
      ...task,
      color: taskColor(task.id),
      dailySeconds,
      weeklySeconds,
      periodSeconds: getTrackedSeconds(task.id, period.value),
      weeklyProgress: weeklyGoalSeconds ? weeklySeconds / weeklyGoalSeconds * 100 : 0,
      dailyProgress: dailyGoalSeconds ? dailySeconds / dailyGoalSeconds * 100 : 0,
    };
  }));

  const totalSeconds = computed(() =>
    taskSummaries.value.reduce((total, task) => total + task.periodSeconds, 0),
  );
  const weeklySeconds = computed(() =>
    taskSummaries.value.reduce((total, task) => total + task.weeklySeconds, 0),
  );
  const weeklyGoalSeconds = computed(() =>
    tasks.value.reduce((total, task) => total + task.weeklyGoalMinutes * 60, 0),
  );
  const weeklyProgress = computed(() =>
    weeklyGoalSeconds.value ? weeklySeconds.value / weeklyGoalSeconds.value * 100 : 0,
  );

  const chartDays = computed<ChartDay[]>(() => weekDays.value.map(date => ({
    date: localDate(date),
    label: date.toLocaleDateString('en', { weekday: 'short' }),
    shortDate: date.getDate() + '/' + (date.getMonth() + 1),
    segments: tasks.value.map(task => ({
      taskId: task.id,
      name: task.name,
      color: taskColor(task.id),
      seconds: getTrackedSeconds(task.id, 'Day', date),
    })),
  })));

  const recentSessions = computed(() => {
    const { start, end } = getPeriodBounds(period.value);

    return sessions.value
      .filter(session => {
        const sessionStart = Date.parse(session.startTime);
        return sessionStart >= start && sessionStart < end;
      })
      .slice()
      .sort((first, second) => second.startTime.localeCompare(first.startTime));
  });

  const elapsedSeconds = computed(() => activeSession.value
    ? Math.max(0, Math.floor((now.value - Date.parse(activeSession.value.startTime)) / 1000))
    : 0,
  );
  const clock = computed(() => [
    Math.floor(elapsedSeconds.value / 3600),
    Math.floor((elapsedSeconds.value % 3600) / 60),
    elapsedSeconds.value % 60,
  ].map(value => String(value).padStart(2, '0')).join(':'));

  const timerStatus = computed(() => {
    if (activeSession.value) return 'Current Task';
    if (pausedTaskId.value !== null) return 'Timer paused';
    return 'Ready to focus';
  });
  const focusTask = computed(() => {
    const taskId = activeSession.value?.taskId ?? pausedTaskId.value ?? selectedTaskId.value;
    return taskSummaries.value.find(task => task.id === taskId) ?? null;
  });
  const currentTaskName = computed(() =>
    focusTask.value?.name ?? 'Make time for what matters',
  );

  function stopTimer() {
    if (activeSession.value) {
      sessions.value.push({
        id: Date.now(),
        ...activeSession.value,
        endTime: new Date().toISOString(),
      });
    }

    activeSession.value = null;
    pausedTaskId.value = null;
  }

  function startTimer(taskId: number) {
    if (!tasks.value.some(task => task.id === taskId)) return;

    stopTimer();
    selectedTaskId.value = taskId;
    now.value = Date.now();
    activeSession.value = { taskId, startTime: new Date().toISOString() };
  }

  function startFocus() {
    if (selectedTaskId.value === null) return;

    startTimer(selectedTaskId.value);
  }

  function togglePause() {
    if (activeSession.value) {
      const taskId = activeSession.value.taskId;
      stopTimer();
      pausedTaskId.value = taskId;
    } else if (pausedTaskId.value !== null) {
      startTimer(pausedTaskId.value);
    }
  }

  function moveDate(direction: number) {
    const date = new Date(selectedDate.value + 'T12:00:00');

    if (period.value === 'Month') {
      date.setMonth(date.getMonth() + direction);
    } else {
      date.setDate(date.getDate() + direction * (period.value === 'Week' ? 7 : 1));
    }

    selectedDate.value = localDate(date);
  }

  function saveTask(task: Task) {
    const index = tasks.value.findIndex(existingTask => existingTask.id === task.id);

    if (index < 0) {
      tasks.value.push(task);
    } else {
      tasks.value[index] = task;
    }
  }

  function deleteTask(taskId: number) {
    if (activeSession.value?.taskId === taskId || pausedTaskId.value === taskId) {
      stopTimer();
    }

    tasks.value = tasks.value.filter(task => task.id !== taskId);
    sessions.value = sessions.value.filter(session => session.taskId !== taskId);
  }

  function exportBackup() {
    const data = JSON.stringify({ tasks: tasks.value, sessions: sessions.value }, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'timetrack-backup.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importBackup(files: File[]) {
    try {
      const file = files[0];
      if (!file) return;

      const data = JSON.parse(await file.text());
      const hasValidTasks = Array.isArray(data.tasks) && data.tasks.every((task: Task) =>
        task && Number.isFinite(task.id) && typeof task.name === 'string' &&
        Number.isFinite(task.weeklyGoalMinutes) && task.weeklyGoalMinutes >= 0 &&
        Number.isFinite(task.todaysGoalMinutes) && task.todaysGoalMinutes >= 0,
      );
      const hasValidSessions = hasValidTasks && Array.isArray(data.sessions) &&
        data.sessions.every((session: Session) =>
          session && Number.isFinite(session.id) &&
          data.tasks.some((task: Task) => task.id === session.taskId) &&
          Number.isFinite(Date.parse(session.startTime)) &&
          Date.parse(session.endTime) >= Date.parse(session.startTime),
        );

      if (!hasValidTasks || !hasValidSessions) throw new Error('Invalid backup');

      stopTimer();
      tasks.value = data.tasks;
      sessions.value = data.sessions;
    } catch {
      error.value = 'Invalid backup file.';
    }
  }

  return {
    tasks,
    taskSummaries,
    activeSession,
    pausedTaskId,
    selectedTaskId,
    focusTask,
    error,
    period,
    selectedDate,
    weekLabel,
    totalSeconds,
    weeklySeconds,
    weeklyGoalSeconds,
    weeklyProgress,
    chartDays,
    recentSessions,
    clock,
    timerStatus,
    currentTaskName,
    taskColor,
    taskName,
    startTimer,
    startFocus,
    stopTimer,
    togglePause,
    moveDate,
    saveTask,
    deleteTask,
    exportBackup,
    importBackup,
  };
}

