<template>
  <ion-grid :class="getBreakpointClasses(classes?.grid, breakpoint)">
    <ion-row
      :class="getBreakpointClasses(classes?.row, breakpoint)"
      class="ion-align-items-center"
    >
      <ion-col
        v-for="(card, i) in cards_list_ref"
        :key="card.id"
        :size="'' + Math.trunc(12 / columns)"
        :class="getBreakpointClasses(classes?.col, breakpoint)"
      >
        <card-item
          :card="cards_list_ref[i]"
          :detail="false"
          :colors="colors"
          :classes="classes"
          @execute_link="$emit('execute_link')"
          @signal_event="$emit('signal_event')"
        />
      </ion-col>
    </ion-row>
  </ion-grid>
</template>

<script setup lang="ts">
import {
  CardElements,
  CardsGridElements,
  Classes,
  Colors,
  GeneralCardSubElements,
} from "@/types";
import {
  canCardArrayVModel,
  getBreakpoint,
  getBreakpointClasses,
} from "@/utils";
import { IonGrid, IonRow, IonCol } from "@ionic/vue";
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
  cards_list: {
    type: Array<CardElements>,
    required: true,
  },
  columns: {
    type: Number,
    required: true,
  },
  colors: Object as PropType<Colors<GeneralCardSubElements>>,
  classes: Object as PropType<Classes<CardsGridElements>>,
});
const emit = defineEmits(["execute_link", "signal_event", "update:cards_list"]);

const breakpoint = ref(getBreakpoint(window.innerWidth));

const cards_list_ref = ref(props.cards_list);

let stopWatch: WatchStopHandle;

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

if (
  props.classes?.grid != undefined ||
  props.classes?.row != undefined ||
  props.classes?.col != undefined
) {
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
