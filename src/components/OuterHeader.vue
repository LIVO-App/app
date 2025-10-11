<template>
  <ion-header class="adaptive-header" id="outer_header" :translucent="true">
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-menu-button class="adaptive-menu-button"></ion-menu-button>
      </ion-buttons>
      <ion-title
        size="large"
        color="white"
        class="ion-justify-content-center ion-text-center"
        >{{ props.title }}</ion-title
      >
      <ion-title
        v-if="props.subtitle"
        size="small"
        class="ion-justify-content-center ion-text-center"
        color="white"
        >{{ props.subtitle }}</ion-title
      >
    </ion-toolbar>
  </ion-header>
</template>

<script setup lang="ts">
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
} from "@ionic/vue";

const props = defineProps(["title", "subtitle"]);
</script>

<style scoped>
ion-toolbar {
  --background: var(--ion-color-primary);
}

.adaptive-menu-button {
  --color: var(--ion-color-white);
  color: var(--ion-color-white);
}
.adaptive-header {
  background-color: var(--ion-color-background);
}
.adaptive-header.header-collapse-condense-inactive .adaptive-menu-button {
  --color: var(--ion-color-primary) !important;
  color: var(--ion-color-primary) !important;
}

.adaptive-header:not(.header-collapse-condense-inactive) .adaptive-menu-button {
  --color: var(--ion-color-white) !important;
  color: var(--ion-color-white) !important;
}
</style>
