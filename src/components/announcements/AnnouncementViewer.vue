<template>
  <ion-header>
    <ion-toolbar>
      <ion-grid>
        <ion-row class="ion-text-center ion-align-items-center">
          <ion-col>
            <ionic-element :element="elements.title" />
          </ion-col>
          <ion-col size="auto">
            <ionic-element
              :element="elements.close"
              @signal_event="$emit('close')"
            />
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-toolbar>
    <div class="ion-padding" style="color: var(--ion-color-primary)">
      <ionic-element :element="content" />
    </div>
  </ion-header>
</template>

<script setup lang="ts">
import { CustomElement } from "@/types";
import { executeLink, getCurrentLanguage, getIcon } from "@/utils";
import { IonHeader, IonToolbar, IonGrid, IonRow, IonCol } from "@ionic/vue";

const language = getCurrentLanguage();

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  id: {
    type: Number,
    required: true,
  },
});
defineEmits(["signal_event", "close"]);

const elements: {
  [key: string]: CustomElement;
} = {
  close: {
    id: "close",
    type: "icon",
    linkType: "event",
    content: {
      event: "close",
      icon: getIcon("close"),
    },
  },
  title: {
    id: "title",
    type: "title",
    content: props.title,
  },
};

const content: CustomElement = await executeLink(
  "/v1/announcements/" + props.id,
  (response) => {
    return {
      id: "content",
      type: "html",
      content: response.data.data[`${language}_message`],
    };
  },
  () => {
    return {
      id: "content",
      type: "html",
      content: "",
    };
  }
);
</script>

<style></style>
