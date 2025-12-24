<template>
  <ion-item-divider
    :color="
      (colors?.dividers?.type == 'var' ? colors?.dividers.name : undefined) ??
      'light'
    "
    :class="{
      ...getBreakpointClasses(classes?.divider, breakpoint),
      background:
        colors?.dividers != undefined && colors.dividers.type != 'var',
    }"
  >
    <ionic-element v-model:element="divider_ref" />
  </ion-item-divider>
  <ion-item
    v-if="cards_list.length === 0"
    :color="
      colors?.background?.type == 'var' ? colors?.background.name : undefined
    "
    :class="{
      background:
        colors?.background != undefined && colors?.background?.type != 'var',
    }"
    class="ion-no-padding"
  >
    <ionic-element v-model:element="emptiness_message_ref" />
  </ion-item>
  <template v-else>
    <card-item
      v-for="(card, i) in cards_list_ref"
      :key="card.id"
      :card="cards_list_ref[i]"
      :colors="colors"
      :classes="classes"
      @execute_link="$emit('execute_link')"
      @signal_event="$emit('signal_event')"
    />
  </template>
</template>

<script setup lang="ts">
import {
  CardElements,
  CardsCommonElements,
  Classes,
  Colors,
  CustomElement,
  GeneralCardSubElements,
} from "@/types";
import {
  canCardArrayVModel,
  canVModel,
  getBreakpoint,
  getBreakpointClasses,
} from "@/utils";
import { IonItemDivider, IonItem } from "@ionic/vue";
import {
  PropType,
  WatchStopHandle,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";

const addListeners = () => {
  watch(
    () => props.cards_list,
    (value) => {
      cards_list_ref.value = value;
    }
  );
  watch(
    () => cards_list_ref.value,
    (value) => {
      emit("update:cards_list", value);
    }
  );
};
const updateBreakpoint = () => {
  breakpoint.value = getBreakpoint(window.innerWidth);
};

const props = defineProps({
  emptiness_message: {
    type: Object as PropType<CustomElement>,
    required: true,
  },
  divider: {
    type: Object as PropType<CustomElement>,
    required: true,
  },
  cards_list: {
    type: Array<CardElements>,
    required: true,
  },
  colors: Object as PropType<Colors<GeneralCardSubElements>>,
  classes: Object as PropType<Classes<CardsCommonElements>>,
});
const emit = defineEmits([
  "execute_link",
  "signal_event",
  "update:emptiness_message",
  "update:divider",
  "update:cards_list",
]);

const emptiness_message_ref = ref(props.emptiness_message);
const divider_ref = ref(props.divider);
const cards_list_ref = ref(props.cards_list);
const breakpoint = ref(getBreakpoint(window.innerWidth));

let stopWatch: WatchStopHandle;

if (
  props.emptiness_message != undefined &&
  canVModel(props.emptiness_message)
) {
  watch(
    () => props.emptiness_message,
    (value) => {
      emptiness_message_ref.value = value;
    }
  );
  watch(
    () => emptiness_message_ref.value,
    (value) => {
      emit("update:emptiness_message", value);
    }
  );
}
if (props.divider != undefined && canVModel(props.divider)) {
  watch(
    () => props.divider,
    (value) => {
      divider_ref.value = value;
    }
  );
  watch(
    () => divider_ref.value,
    (value) => {
      emit("update:divider", value);
    }
  );
}
if (props.cards_list.length == 0) {
  stopWatch = watch(
    () => props.cards_list,
    (value) => {
      cards_list_ref.value = value;
      if (value.length > 0 && canCardArrayVModel(props.cards_list)) {
        addListeners();
        stopWatch();
      }
    }
  );
} else if (canCardArrayVModel(props.cards_list)) {
  addListeners();
}

if (props.classes?.divider != undefined) {
  onMounted(() =>
    nextTick(() => {
      window.addEventListener("resize", updateBreakpoint);
    })
  );

  onBeforeUnmount(() => {
    window.removeEventListener("resize", updateBreakpoint);
  });
}
</script>

<style></style>
