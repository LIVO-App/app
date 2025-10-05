<template>
  <ion-page>
    <outer-header :title="title" />

    <ion-content :fullscreen="true">
      <inner-header :title="title" />

      <suspense>
        <template #default>
          <learning-sessions-manager />
        </template>
        <template #fallback>
            <loading-component />
        </template>
      </suspense>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { User } from "@/types";
import { getPageTitle } from "@/utils";
import { IonContent, IonPage } from "@ionic/vue";

const user = User.getLoggedUser() as User;

const title = getPageTitle(user);
</script>

<style scoped></style>
