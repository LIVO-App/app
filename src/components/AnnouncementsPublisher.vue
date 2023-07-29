<template>
  <ion-header>
    <ion-toolbar>
      <ion-grid>
        <ion-row class="ion-text-center ion-align-items-center">
          <ion-col>
            <ionic-element :element="elements.title"></ionic-element>
          </ion-col>
          <ion-col size="auto">
            <ionic-element
              :element="elements.close"
              @signal_event="$emit('close')"
            ></ionic-element>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-toolbar>
  </ion-header>
  <div class="ion-padding">
    <div class="ion-padding-bottom">
      <ion-input
        type="text"
        v-model="italian_title"
        :label="getCurrentElement(store, 'title')"
        :aria-label="getCurrentElement(store, 'title')"
        color="primary"
        style="color: var(--ion-color-primary)"
        fill="outline"
        class="ion-margin-vertical"
      ></ion-input
      ><!--Da sistemare: mettere italiano e inglese-->
      <ion-input
        type="text"
        v-model="italian_message"
        :label="getCurrentElement(store, 'message')"
        :aria-label="getCurrentElement(store, 'message')"
        color="primary"
        style="color: var(--ion-color-primary)"
        fill="outline"
        class="ion-margin-vertical"
      ></ion-input
      ><!--Da sistemare: mettere italiano e inglese-->
      <ion-label color="primary"
        >{{ getCurrentElement(store, "sections") }}:</ion-label
      >
      <ion-list class="ion-margin-top">
        <ion-item
          v-for="(selection, index) in sections_selections"
          :key="index + '_section'"
        >
          <ion-checkbox
            v-model="selection.value"
            :aria-label="sections[index].id"
            class="ion-padding-start"
            label-placement="start"
            >{{ sections[index].id }}</ion-checkbox
          >
        </ion-item>
      </ion-list>
    </div>
    <div class="ion-text-center">
      <ion-button
        @click="
          () => {
            const outcome = check_announcement();
            $emit('signal_event');
            if (outcome) {
              $emit('close');
            }
          }
        "
      >
        {{ getCurrentElement(store, "publish") }}
      </ion-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CustomElement } from "@/types";
import { getCurrentElement, getIcon } from "@/utils";
import {
  IonHeader,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonCheckbox,
  IonButton,
} from "@ionic/vue";
import { Ref, ref } from "vue";
import { useStore } from "vuex";

const check_announcement = () => {
  const sections_to_publish: string[] = [];

  let outcome = false;

  if (italian_title.value == "" || italian_message.value == "") {
    store.state.event = {
      name: "empty_titles_or_messages",
      data: {},
    };
  } else if (sections_selections.value.filter((a) => a.value).length == 0) {
    store.state.event = {
      name: "no_selected_sections",
      data: {},
    };
  } else {
    for (let i = 0; i < sections_selections.value.length; i++) {
      if (sections_selections.value[i]) {
        sections_to_publish.push(props.sections[i].id);
      }
    }
    store.state.event = {
      name: "publish",
      data: {
        title: italian_title,
        message: italian_message,
        sections: sections_to_publish,
      },
    };
    outcome = true;
  }

  return outcome;
};

const store = useStore();

const props = defineProps({
  sections: {
    type: Array<{ id: string }>,
    required: true,
  },
  current_section_index: {
    type: Number,
    required: true,
  },
});
defineEmits(["signal_event", "close"]);

const italian_title: Ref<string> = ref("");
const italian_message: Ref<string> = ref("");
const sections_selections: Ref<{ value: boolean }[]> = ref(
  new Array(props.sections.length).fill({ value: false })
);
sections_selections.value[props.current_section_index].value = true;

const elements: {
  [key: string]: CustomElement;
} = {
  close: {
    id: "close",
    type: "icon",
    linkType: "event",
    content: {
      event: "close",
      icon: getIcon(store, "close"),
    },
  },
  title: {
    id: "title",
    type: "title",
    content: getCurrentElement(store, "announcement_publishment"),
  },
};
</script>

<style>
</style>