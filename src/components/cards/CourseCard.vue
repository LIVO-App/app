<template>
  <ion-card
    style="width: 100%"
    :class="{
      no_card_border: colors?.borders == undefined,
    }"
    class="ion-no-padding ion-no-margin"
  >
    <ion-card-content class="ion-no-padding ion-padding-vertical">
      <ion-grid>
        <ion-row class="ion-align-items-center">
          <ion-col size-sm="auto" size="6" class="ion-text-center">
            <ionic-element :element="actual_content[0]" />
          </ion-col>
          <ion-col :size="isSmaller(breakpoint, 'sm') ? '6' : undefined">
            <ionic-element
              :element="content[1]"
              @signal_event="$emit('signal_event')"
            />
          </ion-col>
          <ion-col size-sm="auto" size="6" class="ion-text-center">
            <ionic-element :element="actual_content[2]" />
          </ion-col>
          <ion-col v-if="button" size="auto">
            <ionic-element
              :element="content[3]"
              @execute_link="$emit('execute_link')"
            />
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { CustomElement, Colors, GeneralCardSubElements } from "@/types";
import { Enrollment } from "@/types";
import { getBreakpoint, isSmaller } from "@/utils";
import { IonCard, IonCardContent, IonGrid, IonRow, IonCol } from "@ionic/vue";
import {
  computed,
  ComputedRef,
  nextTick,
  onBeforeUnmount,
  onMounted,
  PropType,
  ref,
} from "vue";

const updateBreakpoint = () => {
  breakpoint.value = getBreakpoint(window.innerWidth);
};

const props = defineProps({
  credits: {
    type: Number,
    required: true,
  },
  content: {
    type: Array as PropType<CustomElement[]>,
    required: true,
  },
  enrollment: {
    type: Object as PropType<Enrollment>,
    required: true,
  },
  colors: Object as PropType<Colors<GeneralCardSubElements>>,
});
defineEmits(["execute_link", "signal_event"]);
const button = props.enrollment.editable && props.content.length > 3;
const actual_content: ComputedRef<CustomElement[]> = computed(() =>
  JSON.parse(JSON.stringify(props.content))
);
const breakpoint = ref(getBreakpoint(window.innerWidth));

if (actual_content.value[0].classes == undefined) {
  actual_content.value[0].classes = {};
}
actual_content.value[0].classes.label = {
  "ion-padding": true,
  radius: true,
};
if (actual_content.value[2].classes == undefined) {
  actual_content.value[2].classes = {};
}
actual_content.value[2].classes.label = {
  "ion-padding": true,
  half_radius: true,
};

onMounted(() =>
  nextTick(() => {
    window.addEventListener("resize", updateBreakpoint);
  })
);

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateBreakpoint);
});
</script>

<style></style>
