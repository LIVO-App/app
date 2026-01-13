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
        :label="getCurrentElement('title')"
        :aria-label="getCurrentElement('title')"
        color="primary"
        style="color: var(--ion-color-primary)"
        fill="outline"
        class="ion-margin-vertical"
      />
      <ion-input
        type="text"
        v-model="italian_message"
        :label="getCurrentElement('message')"
        :aria-label="getCurrentElement('message')"
        color="primary"
        style="color: var(--ion-color-primary)"
        fill="outline"
        class="ion-margin-vertical"
      />
      <template v-if="sections_use">
        <ion-label color="primary"
          >{{ getCurrentElement("sections") }}:</ion-label
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
      </template>
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
        {{ getCurrentElement("publish") }}
      </ion-button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @displayName AnnouncementsPublisher
 * @description
 * Modal content used to compose and publish an announcement.
 * Collects title/message and (optionally) a list of sections to target.
 * Writes the publishing request into `store.state.event` and asks the parent to execute it.
 *
 * @prop {{id: string}[]} sections - Available section identifiers.
 * @prop {number} current_section_index - Initial selected section index.
 *
 * @event signal_event - Emitted when the component requests the parent to handle the event stored in `store.state.event`.
 * @event close - Emitted when the modal should be closed.
 */

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
      event: "empty_titles_or_messages",
      data: {},
    };
  } else if (sections_selections.value.filter((a) => a.value).length == 0) {
    store.state.event = {
      event: "no_selected_sections",
      data: {},
    };
  } else {
    for (let i = 0; i < sections_selections.value.length; i++) {
      if (sections_selections.value[i]) {
        sections_to_publish.push(props.sections[i].id);
      }
    }
    store.state.event = {
      event: "publish",
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
const sections_use: boolean = store.state.sections_use;

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
      icon: getIcon("close"),
    },
  },
  title: {
    id: "title",
    type: "title",
    content: getCurrentElement("announcement_publishment"),
  },
};
</script>

<style></style>
