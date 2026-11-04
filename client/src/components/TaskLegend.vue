<template>
  <div>
    <div v-for="task in tasks" :key="task.id" class="d-flex align-center ga-3 my-3 text-body-2">
      <v-avatar :color="task.color" size="12" />
      <span class="text-truncate">{{ task.name }}</span>
      <span class="ml-auto text-no-wrap text-medium-emphasis">
        {{ weekly ? formatHours(task.weeklySeconds) + ' h' : formatDuration(task.periodSeconds) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TaskSummary } from '../types/tracker';
import { formatDuration, formatHours } from '../utilities/time';

withDefaults(defineProps<{
  tasks: TaskSummary[];
  weekly?: boolean;
}>(), { weekly: false });
</script>
