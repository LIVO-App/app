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
  </ion-header>
  <ion-content>
    <ion-grid class="ion-no-margin">
      <ion-row>
        <ion-col key="parameters" size="12">
          <div class="ion-padding-bottom">
            <slot name="parameters"></slot>
          </div>
          <div v-if="props.show_confirm" class="ion-text-center">
            <ionic-element :element="buttons[0]" @signal_event="$emit('add')" />
          </div>
          <hr
            class="ion-margin-top"
            style="border-bottom: 1px solid var(--ion-color-medium)"
          />
        </ion-col>
        <ion-col key="list" size="12">
          <ionic-table
            v-if="props.sizes != undefined && props.first_row !== undefined"
            :emptiness_message="props.emptiness_message"
            :data="props.data"
            :first_row="props.first_row"
            :sizes="props.sizes"
            @signal_event="$emit('remove')"
          />
          <list-card
            v-else
            :emptiness_message="props.emptiness_message"
            :cards_list="props.data"
            @signal_event="$emit('remove')"
          />
          <div class="ion-text-center">
            <ionic-element
              :element="buttons[1]"
              @signal_event="$emit('confirm')"
            />
          </div>
        </ion-col>
      </ion-row>
    </ion-grid>
  </ion-content>
</template>

<script setup lang="ts">
import {
  CustomElement,
  OrderedCardsList,
  GeneralCardElements,
  TableElement,
  TmpList,
} from "@/types";
import { getCurrentElement, getIcon } from "@/utils";
import {
  IonHeader,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonContent,
} from "@ionic/vue";
import { PropType } from "vue";
import { useStore } from "vuex";

const store = useStore();

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  emptiness_message: {
    type: Object as PropType<CustomElement>,
    required: true,
  },
  first_row: {
    type: Array<TableElement>,
  },
  show_confirm: {
    type: Boolean,
    default: true,
  },
  sizes: {
    type: [Array, Object] as PropType<
      string[] | TmpList<TmpList<(string | undefined)[]>>
    >,
  },
  data: {
    type: Object as PropType<OrderedCardsList<GeneralCardElements>>,
    required: true,
  },
});
defineEmits(["signal_event", "close", "add", "remove", "confirm"]);

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
const buttons = [
  {
    id: "add",
    type: "string_icon",
    linkType: "event",
    content: {
      text: getCurrentElement("add"),
      icon: getIcon("add"),
      event: "add",
      whole_link: true,
    },
    ...store.state.button_css,
  },
  {
    id: "confirm",
    type: "string_icon",
    linkType: "event",
    content: {
      text: getCurrentElement("confirm"),
      icon: getIcon("checkmark"),
      event: "add",
      whole_link: true,
    },
    ...store.state.button_css,
  },
];
</script>

<style></style>
