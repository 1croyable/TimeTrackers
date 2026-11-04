<template>
  <v-card class="h-100 pa-5 pa-md-6">
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-5">
      <h2 class="text-h6 font-weight-bold d-flex align-center ga-3">
        <v-icon :icon="icon" color="primary" />
        {{ title }}
      </h2>

      <slot name="action" />
    </div>

    <slot />
  </v-card>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
});
</script>
