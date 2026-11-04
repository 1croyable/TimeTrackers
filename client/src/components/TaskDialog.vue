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

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="460"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card
      class="pa-3"
      :title="task ? 'Edit task' : 'Add a task'"
    >
      <v-form @submit.prevent="save">
        <v-card-text>
          <v-text-field
            v-model="name"
            label="Task name"
            maxlength="100"
            autofocus
          />
          <v-text-field
            v-model="dailyGoal"
            type="number"
            min="0"
            label="Daily goal (minutes)"
          />
          <v-text-field
            v-model="weeklyGoal"
            type="number"
            min="0"
            label="Weekly goal (minutes)"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="close">Cancel</v-btn>
          <v-btn
            type="submit"
            variant="flat"
            color="primary"
            :disabled="!canSave"
          >
            Save task
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
