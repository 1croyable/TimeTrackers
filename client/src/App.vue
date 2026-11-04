<template>
  <v-app>
    <v-navigation-drawer :width="drawerOpenWidth" color="sidebar">
      <div class="d-flex align-center ga-3 pa-5 mb-3">
        <v-icon v-show="mobileNavigationOpen" icon="mdi-timer-outline" color="primary" size="44" />
        <div v-show="mobileNavigationOpen" class="text-h5 font-weight-bold">TimeTrackers</div>
        <v-btn icon="mdi-menu" variant="text" aria-label="Open navigation"
          @click="mobileNavigationOpen = !mobileNavigationOpen" />
      </div>

      <v-list nav class="px-3" color="primary">
        <v-list-item v-for="item in navigation" :key="item.title" :title="item.title" :prepend-icon="item.icon"
          :active="page === item.title" rounded="lg" class="mb-1" @click="page = item.title" />
      </v-list>

      <template #append>
        <v-card width="270" class="ma-4 pa-4" v-show="mobileNavigationOpen">
          <div class="text-body-2">This Week</div>
          <v-progress-linear :model-value="weeklyProgress" color="primary" class="my-3" />
          <div class="text-caption text-medium-emphasis">
            {{ formatHours(weeklySeconds) }} h / {{ formatHours(weeklyGoalSeconds) }} h
          </div>
        </v-card>
      </template>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid class="pa-4">
        <header class="d-flex align-center flex-wrap ga-4 mb-6">
          <h1 class="text-h4 font-weight-bold mr-auto">{{ page }}</h1>

          <div class="d-flex align-center ga-2">
            <v-btn icon="mdi-chevron-left" variant="outlined" size="small" aria-label="Previous period"
              @click="moveDate(-1)" />
            <v-text-field v-model="selectedDate" type="date" aria-label="Selected date" hide-details density="compact"
              width="172" />
            <v-btn icon="mdi-chevron-right" variant="outlined" size="small" aria-label="Next period"
              @click="moveDate(1)" />
          </div>

          <v-btn-toggle v-model="period" mandatory color="primary" variant="outlined" divided rounded="lg">
            <v-btn v-for="option in periods" :key="option" :value="option">
              {{ option }}
            </v-btn>
          </v-btn-toggle>
        </header>

        <v-alert v-if="error" type="warning" closable class="mb-4" @click:close="error = ''">
          {{ error }}
        </v-alert>

        <v-row>
          <v-col v-if="page === 'Dashboard'" cols="10" offset="1">
            <v-card class="pa-6" :color="focusCardColor">
              <div class="d-flex align-center ga-3 text-body-2 text-medium-emphasis">
                <v-avatar :color="focusTask?.color ?? 'secondary'" size="12" />
                {{ timerStatus }}
              </div>

              <div class="d-flex align-center ga-4 my-5">
                <v-avatar color="surface" size="56" rounded="lg">
                  <v-icon icon="mdi-layers-triple" :color="focusTask?.color ?? 'primary'" size="34" />
                </v-avatar>
                <v-select
                  v-if="!activeSession && pausedTaskId === null"
                  v-model="selectedTaskId"
                  :items="taskSummaries"
                  clearable
                  item-title="name"
                  item-value="id"
                  label="Choose a task"
                  :placeholder="tasks.length ? 'Select a task to focus on' : 'Add a task first'"
                  :disabled="!tasks.length"
                  :color="focusTask?.color ?? 'primary'"
                  variant="outlined"
                  hide-details
                  class="flex-grow-1"
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template #prepend>
                        <v-avatar :color="item.raw.color" size="12" class="mr-3" />
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
                <h2 v-else class="text-h5 font-weight-bold">{{ currentTaskName }}</h2>
              </div>

              <div class="d-flex align-center justify-space-between flex-wrap ga-3">
                <p class="text-h2 font-weight-bold">{{ clock }}</p>
                <div class="d-flex flex-wrap ga-2">
                  <template v-if="activeSession || pausedTaskId !== null">
                    <v-btn :color="focusTask?.color ?? 'primary'" :prepend-icon="activeSession ? 'mdi-pause' : 'mdi-play'"
                      @click="togglePause">
                      {{ activeSession ? 'Pause' : 'Resume' }}
                    </v-btn>
                    <v-btn prepend-icon="mdi-stop" @click="stopTimer">Stop</v-btn>
                  </template>

                  <v-btn
                    v-else
                    :color="focusTask?.color ?? 'primary'"
                    prepend-icon="mdi-play"
                    :disabled="!focusTask"
                    @click="startFocus"
                  >
                    Start focus
                  </v-btn>
                </div>
              </div>
            </v-card>
          </v-col>

          <v-col v-if="showStatistics" cols="10" offset="1">
            <DashboardPanel :title="summaryTitle" icon="mdi-calendar-month-outline">
              <template #action>
                <span class="text-body-2 text-medium-emphasis">
                  Total: <p class="font-weight-bold">{{ formatDuration(totalSeconds) }}</p>
                </span>
              </template>
              <SummaryChart :tasks="taskSummaries" :total-seconds="totalSeconds" />
            </DashboardPanel>
          </v-col>

          <v-col v-if="showTasks" cols="12">
            <DashboardPanel title="Tasks" icon="mdi-format-list-bulleted">
              <template #action>
                <v-btn color="primary" variant="outlined" size="small" prepend-icon="mdi-plus"
                  @click="openTaskDialog()">
                  Add Task
                </v-btn>
              </template>

              <v-table density="comfortable" class="text-body-2">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Today / Daily Goal</th>
                    <th>This Week / Weekly Goal</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="task in taskSummaries" :key="task.id">
                    <td>
                      <div class="d-flex align-center ga-3 text-no-wrap">
                        <v-avatar :color="task.color" size="12" rounded="sm" />
                        {{ task.name }}
                      </div>
                    </td>
                    <td>
                      <div class="py-2">
                        <v-progress-linear :model-value="task.dailyProgress" :color="task.color" />
                        <div class="text-caption text-right text-no-wrap mt-1">
                          {{ formatHours(task.dailySeconds) }} h /
                          {{ formatHours(task.todaysGoalMinutes * 60) }} h
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="py-2">
                        <v-progress-linear :model-value="task.weeklyProgress" :color="task.color" />
                        <div class="text-caption text-right text-no-wrap mt-1">
                          {{ formatHours(task.weeklySeconds) }} h /
                          {{ formatHours(task.weeklyGoalMinutes * 60) }} h
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="d-flex ga-2">
                        <v-btn :icon="activeSession?.taskId === task.id ? 'mdi-stop' : 'mdi-play'" color="primary"
                          variant="outlined" size="x-small"
                          :aria-label="(activeSession?.taskId === task.id ? 'Stop ' : 'Start ') + task.name"
                          @click="activeSession?.taskId === task.id ? stopTimer() : startTimer(task.id)" />
                        <v-menu>
                          <template #activator="{ props }">
                            <v-btn v-bind="props" icon="mdi-dots-horizontal" variant="outlined" size="x-small"
                              :aria-label="'Options for ' + task.name" />
                          </template>
                          <v-list density="compact">
                            <v-list-item title="Edit" prepend-icon="mdi-pencil-outline" @click="openTaskDialog(task)" />
                            <v-list-item title="Delete" prepend-icon="mdi-delete-outline"
                              @click="deletingTask = task" />
                          </v-list>
                        </v-menu>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <p v-if="!tasks.length" class="text-body-2 text-medium-emphasis py-6">Add your first task to get started.</p>
            </DashboardPanel>
          </v-col>

          <v-col v-if="showStatistics" :cols="page === 'Dashboard' ? 6 : 12">
            <DashboardPanel title="Weekly Goal" icon="mdi-bullseye-arrow">
              <template #action>
                <span class="text-caption text-medium-emphasis">{{ weekLabel }}</span>
              </template>

              <v-row v-for="task in taskSummaries" :key="task.id" align="center" class="py-2">
                <v-col cols="12" sm="5" class="d-flex align-center ga-3 text-body-2">
                  <v-avatar :color="task.color" size="12" rounded="sm" />
                  <span class="text-truncate">{{ task.name }}</span>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-progress-linear :model-value="task.weeklyProgress" :color="task.color" />
                </v-col>
                <v-col cols="6" sm="4" class="text-caption text-right text-medium-emphasis">
                  {{ formatHours(task.weeklySeconds) }} /
                  {{ formatHours(task.weeklyGoalMinutes * 60) }} h
                  <strong class="ml-2">{{ Math.round(task.weeklyProgress) }}%</strong>
                </v-col>
              </v-row>
            </DashboardPanel>
          </v-col>

          <v-col v-if="showSessions" :cols="page === 'Dashboard' ? 6 : 12">
            <DashboardPanel :title="page === 'Sessions' ? 'Sessions' : 'Recent Sessions'" icon="mdi-clock-outline">
              <template v-if="page === 'Dashboard'" #action>
                <v-btn color="primary" variant="text" @click="page = 'Sessions'">View All</v-btn>
              </template>

              <v-list v-if="visibleSessions.length" bg-color="transparent" lines="two">
                <v-list-item v-for="session in visibleSessions" :key="session.id" :title="taskName(session.taskId)"
                  :subtitle="formatTime(session.startTime) + ' – ' + formatTime(session.endTime)" class="px-0">
                  <template #prepend>
                    <v-avatar :color="taskColor(session.taskId)" size="12" rounded="sm" class="mr-3" />
                  </template>
                  <template #append>
                    <strong class="text-body-2 text-no-wrap">
                      {{ formatDuration((Date.parse(session.endTime) - Date.parse(session.startTime)) / 1000, true) }}
                    </strong>
                  </template>
                </v-list-item>
              </v-list>
              <p v-else class="text-body-2 text-medium-emphasis py-6">
                No sessions in this period.<br />
                Your completed focus sessions will appear here.
              </p>
            </DashboardPanel>
          </v-col>

          <v-col v-if="showStatistics" cols="12">
            <DashboardPanel title="Weekly Distribution" icon="mdi-chart-bar">
              <template #action>
                <span class="text-caption text-medium-emphasis">
                  Total: {{ formatHours(weeklySeconds) }} h
                </span>
              </template>
              <WeeklyDistribution :days="chartDays" :tasks="taskSummaries" :selected-date="selectedDate"
                @select="selectedDate = $event" />
            </DashboardPanel>
          </v-col>

          <v-col v-if="page === 'Settings'" cols="12">
            <DashboardPanel title="Data & backups" icon="mdi-database-outline">
              <p class="text-body-2 text-medium-emphasis mb-5">
                Tasks and sessions are saved in this browser.
                Export a backup to keep a copy or move devices.
              </p>
              <v-btn color="primary" prepend-icon="mdi-download" @click="exportBackup">
                Export JSON
              </v-btn>
              <v-alert type="info" variant="tonal" class="my-5">
                Import replaces all current tasks and sessions. Export a backup first.
              </v-alert>
              <v-file-input label="Import JSON backup" accept=".json,application/json"
                @update:model-value="importBackup" />
            </DashboardPanel>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <TaskDialog v-model="taskDialogOpen" :task="editingTask" @save="saveTask" />

    <v-dialog :model-value="!!deletingTask" max-width="420" @update:model-value="deletingTask = null">
      <v-card title="Delete task?" text="This also deletes the task's saved sessions." class="pa-3">
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deletingTask = null">Cancel</v-btn>
          <v-btn color="error" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import DashboardPanel from './components/DashboardPanel.vue';
import SummaryChart from './components/SummaryChart.vue';
import TaskDialog from './components/TaskDialog.vue';
import WeeklyDistribution from './components/WeeklyDistribution.vue';
import { useTimeTracker } from './composables/useTimeTracker';
import type { Task } from './types/tracker';
import { formatDuration, formatHours, formatTime } from './utilities/time';

const navigation = [
  { title: 'Dashboard', icon: 'mdi-home-outline' },
  { title: 'Tasks', icon: 'mdi-format-list-bulleted' },
  { title: 'Sessions', icon: 'mdi-clock-outline' },
  { title: 'Statistics', icon: 'mdi-chart-bar' },
  { title: 'Settings', icon: 'mdi-cog-outline' },
];
const periods = ['Day', 'Week', 'Month'];
const page = ref('Dashboard');
const mobileNavigationOpen = ref(true);
const drawerOpenWidth = computed(() => {
  return mobileNavigationOpen.value ? 305 : 80;
});

const {
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
} = useTimeTracker();

// Mix the task color with white to keep the focus card light and readable.
const focusCardColor = computed(() => {
  if (!focusTask.value) return 'surface';

  const color = focusTask.value.color;
  const tintedChannels = [1, 3, 5].map(offset => {
    const channel = parseInt(color.slice(offset, offset + 2), 16);
    const tintedChannel = Math.round(channel * 0.15 + 255 * 0.85);
    return tintedChannel.toString(16).padStart(2, '0');
  });

  return '#' + tintedChannels.join('');
});

const showStatistics = computed(() => ['Dashboard', 'Statistics'].includes(page.value));
const showTasks = computed(() => ['Dashboard', 'Tasks'].includes(page.value));
const showSessions = computed(() => ['Dashboard', 'Sessions'].includes(page.value));
const summaryTitle = computed(() => {
  if (period.value === 'Day') return "Today's Summary";
  return period.value === 'Week' ? 'Weekly Summary' : 'Monthly Summary';
});
const visibleSessions = computed(() =>
  page.value === 'Dashboard' ? recentSessions.value.slice(0, 4) : recentSessions.value,
);

const taskDialogOpen = ref(false);
const editingTask = ref<Task | null>(null);
const deletingTask = ref<Task | null>(null);

function openTaskDialog(task: Task | null = null) {
  editingTask.value = task;
  taskDialogOpen.value = true;
}

function confirmDelete() {
  if (!deletingTask.value) return;

  deleteTask(deletingTask.value.id);
  deletingTask.value = null;
}
</script>
