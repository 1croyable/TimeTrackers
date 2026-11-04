<template>
  <v-row>
    <v-col cols="8">
      <div class="distribution-chart d-flex ga-2" role="group" aria-label="Weekly tracked time by day">
        <div class="chart-axis d-flex flex-column justify-space-between text-caption text-medium-emphasis">
          <span v-for="tick in axisTicks" :key="tick">
            {{ formatHours(maximumSeconds * tick / 4) }} h
          </span>
        </div>

        <div class="d-flex justify-space-around ga-1 flex-grow-1">
          <div v-for="day in days" :key="day.date" class="chart-column flex-grow-1">
            <div class="chart-stack d-flex flex-column-reverse overflow-hidden rounded-t">
              <div v-for="segment in day.segments" :key="segment.taskId" class="flex-shrink-0"
                :title="segment.name + ': ' + formatDuration(segment.seconds)" :style="{
                  height: segment.seconds / maximumSeconds * 100 + '%',
                  backgroundColor: segment.color,
                }" />
            </div>

            <v-btn class="mt-1 px-0 text-caption" :variant="day.date === selectedDate ? 'tonal' : 'text'"
              :color="day.date === selectedDate ? 'primary' : undefined" :aria-label="'Show ' + day.date"
              :aria-pressed="day.date === selectedDate" min-width="0" width="100%" height="44"
              @click="emit('select', day.date)">
              <span>{{ day.label }}<br />{{ day.shortDate }}</span>
            </v-btn>
          </div>
        </div>
      </div>
    </v-col>

    <v-col cols="4">
      <TaskLegend :tasks="tasks" weekly />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import TaskLegend from './TaskLegend.vue';
import type { ChartDay, TaskSummary } from '../types/tracker';
import { formatDuration, formatHours } from '../utilities/time';

const props = defineProps<{
  days: ChartDay[];
  tasks: TaskSummary[];
  selectedDate: string;
}>();
const emit = defineEmits<{ select: [date: string] }>();

const maximumSeconds = computed(() => Math.max(
  3600,
  ...props.days.map(day => day.segments.reduce((total, segment) => total + segment.seconds, 0)),
));
const axisTicks = [4, 3, 2, 1, 0];
</script>

<style scoped>
.distribution-chart {
  height: 230px;
}

.chart-axis {
  height: 180px;
  min-width: 36px;
}

.chart-column {
  min-width: 0;
  max-width: 42px;
}

.chart-stack {
  height: 180px;
  background: repeating-linear-gradient(to top, rgb(var(--v-theme-on-surface), 0.06) 0 1px, transparent 1px 25%);
}
</style>
