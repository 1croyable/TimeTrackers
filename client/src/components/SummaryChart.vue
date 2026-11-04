<template>
  <div class="d-flex align-center flex-wrap ga-6">
    <TaskLegend :tasks="visibleTasks" class="flex-grow-1" />

    <div class="summary-ring d-flex align-center justify-center rounded-circle flex-shrink-0"
      :style="{ background: chartBackground }" role="img" :aria-label="'Tracked time: ' + formatDuration(totalSeconds)">
      <div class="summary-center d-flex align-center justify-center rounded-circle bg-surface text-center pa-3">
        <p class="font-weight-bold">{{ formatDuration(totalSeconds) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import TaskLegend from './TaskLegend.vue';
import type { TaskSummary } from '../types/tracker';
import { formatDuration } from '../utilities/time';

const props = defineProps<{ tasks: TaskSummary[]; totalSeconds: number }>();
const visibleTasks = computed(() => props.tasks.filter(task => task.periodSeconds > 0));
const chartBackground = computed(() => {
  if (!props.totalSeconds) return 'rgb(var(--v-theme-surface-variant))';

  let position = 0;
  const stops = visibleTasks.value.map(task => {
    const start = position;
    position += task.periodSeconds / props.totalSeconds * 100;
    return task.color + ' ' + start + '% ' + position + '%';
  });

  return 'conic-gradient(' + stops.join(', ') + ')';
});
</script>

<style scoped>
.summary-ring {
  width: 140px;
  height: 140px;
}

.summary-center {
  width: 92px;
  height: 92px;
}
</style>
