<template>
  <v-dialog :model-value="modelValue" max-width="460" @update:model-value="emit('update:modelValue', $event)">
    <v-card class="pa-3" :title="task ? 'Edit task' : 'Add a task'">
      <v-form @submit.prevent="save">
        <v-card-text>
          <v-text-field v-model="name" label="Task name" maxlength="100" autofocus />
          <v-btn-toggle v-model="unit" mandatory color="primary" class="mb-4" density="compact">
            <v-btn value="minutes">Minutes</v-btn>
            <v-btn value="hours">Hours</v-btn>
          </v-btn-toggle>
          <v-text-field v-model="displayDailyGoal" type="number" min="0" step="any" :label="`Daily goal (${unit})`" />
          <v-text-field v-model="displayWeeklyGoal" type="number" min="0" step="any" :label="`Weekly goal (${unit})`" />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="close">Cancel</v-btn>
          <v-btn type="submit" variant="flat" color="primary" :disabled="!canSave">
            Save task
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Task } from '../types/tracker';

const props = defineProps<{ modelValue: boolean; task: Task | null }>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  save: [task: Task];
}>();

const name = ref('');
const dailyGoal = ref<number | string>(60);
const weeklyGoal = ref<number | string>(420);
const unit = ref<'minutes' | 'hours'>('minutes');
const unitMinutes = computed(() => unit.value === 'hours' ? 60 : 1);
const displayDailyGoal = computed({
  get: () => Number(dailyGoal.value) / unitMinutes.value,
  set: (value: number | string) => { dailyGoal.value = Number(value) * unitMinutes.value; },
});
const displayWeeklyGoal = computed({
  get: () => Number(weeklyGoal.value) / unitMinutes.value,
  set: (value: number | string) => { weeklyGoal.value = Number(value) * unitMinutes.value; },
});
const canSave = computed(() => name.value.trim().length > 0 &&
  Number.isFinite(Number(dailyGoal.value)) && Number(dailyGoal.value) >= 0 &&
  Number.isFinite(Number(weeklyGoal.value)) && Number(weeklyGoal.value) >= 0,
);

watch(() => props.modelValue, open => {
  if (!open) return;

  name.value = props.task?.name ?? '';
  dailyGoal.value = props.task?.todaysGoalMinutes ?? 60;
  weeklyGoal.value = props.task?.weeklyGoalMinutes ?? 420;
});

function close() {
  emit('update:modelValue', false);
}

function save() {
  if (!canSave.value) return;

  emit('save', {
    id: props.task?.id ?? Date.now(),
    name: name.value.trim(),
    todaysGoalMinutes: Number(dailyGoal.value),
    weeklyGoalMinutes: Number(weeklyGoal.value),
  });
  close();
}
</script>
