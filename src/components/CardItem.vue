<template>
  <ion-item
    :lines="colors?.list_borders != undefined ? 'inset' : 'none'"
    :detail="detail && isGeneral(card) && card.link != undefined"
    :color="!local_hovered ? getIonicColor(colors?.background) : undefined"
    :class="{
      ...getBreakpointClasses(classes?.item, breakpoint),
      background:
        !local_hovered &&
        colors?.background != undefined &&
        getIonicColor(colors?.background) == undefined,
      hovered: local_hovered,
    }"
    class="ion-no-padding"
    @mouseenter="
      if (props.colors?.hover != undefined) {
        local_hovered = true;
        hoverItem(card, true);
      }
    "
    @mouseleave="
      if (props.colors?.hover != undefined) {
        local_hovered = false;
        hoverItem(card, false);
      }
    "
  >
    <template v-if="isCourse(card_ref)">
      <general-card
        v-if="'layout' in card_ref"
        @execute_link="$emit('execute_link')"
        @signal_event="$emit('signal_event')"
        :id="card_ref.id"
        v-model:content="card_ref.content"
        :layout="card_ref.layout"
        :hovered="local_hovered"
        :colors="card_ref.colors"
        :classes="card_ref.classes"
      />
      <course-card
        v-else
        @execute_link="$emit('execute_link')"
        @signal_event="$emit('signal_event')"
        :content="card_ref.content"
        :credits="card_ref.credits"
        :enrollment="card_ref.enrollment"
        :colors="card.colors"
      />
    </template>
    <general-card
      v-else-if="isGeneral(card_ref)"
      @execute_link="$emit('execute_link')"
      @signal_event="$emit('signal_event')"
      :id="card_ref.id"
      v-model:title="card_ref.title"
      v-model:subtitle="card_ref.subtitle"
      v-model:content="card_ref.content"
      v-model:side_element="card_ref.side_element"
      :layout="card_ref.layout"
      :selected="card_ref.selected"
      :hovered="local_hovered"
      :link="card_ref.link"
      :colors="card_ref.colors"
      :classes="card_ref.classes"
    />
  </ion-item>
</template>

<script setup lang="ts">
import {
  CardElements,
  CardsCommonElements,
  Classes,
  Colors,
  GeneralCardSubElements,
} from "@/types";
import {
  canCardVModel,
  getBreakpointClasses,
  getBreakpoint,
  hoverItem,
} from "@/utils";
import { getCssColor, getIonicColor, isCourse, isGeneral } from "@/utils";
import { IonItem } from "@ionic/vue";
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  PropType,
  ref,
  watch,
} from "vue";

const updateBreakpoint = () => {
  breakpoint.value = getBreakpoint(window.innerWidth);
};

const props = defineProps({
  card: {
    type: Object as PropType<CardElements>,
    required: true,
  },
  detail: {
    type: Boolean,
    default: true,
  },
  colors: Object as PropType<Colors<GeneralCardSubElements>>,
  classes: Object as PropType<Classes<CardsCommonElements>>,
});
const emit = defineEmits(["execute_link", "signal_event", "update:card"]);

const local_hovered = ref(false); // Dummy variable to keep track of reactivity, since it seems not possible to catch props.class.hovered changes
const css_hover_color =
  props.colors?.hover != undefined
    ? getCssColor(props.colors.hover)
    : undefined;
const css_background_color =
  props.colors?.background != undefined
    ? getCssColor(props.colors.background)
    : undefined;

const breakpoint = ref(getBreakpoint(window.innerWidth));
const card_ref = ref(props.card);

if (isGeneral(props.card) && canCardVModel(props.card)) {
  watch(
    () => props.card,
    (value) => {
      card_ref.value = value;
    }
  );
  watch(
    () => card_ref.value,
    (value) => {
      emit("update:card", value);
    }
  );
}

if (props.classes?.item != undefined) {
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

<style scoped>
ion-item {
  --padding-end: 0px;
  --inner-padding-end: 0px;
}
.hovered {
  cursor: "pointer";
  --background: v-bind("css_hover_color");
}
.background {
  background-color: v-bind("css_background_color");
}
</style>
