<template>
  <ion-header collapse="condense">
    <ion-toolbar color="primary">
      <ion-title
        size="large"
        class="ion-justify-content-center"
        color="white"
        >{{ props.title }}</ion-title
      >
      <ion-title
        v-if="props.subtitle"
        size="small"
        class="ion-justify-content-center"
        color="white"
        >{{ props.subtitle }}</ion-title
      >
    </ion-toolbar>
  </ion-header>
</template>

<script setup lang="ts">
/**
 * @displayName InnerHeader
 * @description
 * “Compact” (Ionic) header used on inner pages as a secondary bar.
 */

import { IonHeader, IonToolbar, IonTitle } from "@ionic/vue";

const props = defineProps(["title", "subtitle"]);
</script>

<style scoped>
ion-toolbar {
  --background: var(--ion-color-primary);
}
</style>
