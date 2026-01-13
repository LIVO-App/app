<template>
  <!-- Main card wrapper with dynamic background and clickable behavior -->
  <ion-card
    :color="
      selected
        ? 'light'
        : !local_hovered
        ? getIonicColor(colors?.background)
        : undefined
    "
    :class="{
      ...getBreakpointClasses(classes?.card, breakpoint),
      no_card_border: colors?.borders == undefined,
      background:
        !local_hovered &&
        colors?.background != undefined &&
        getIonicColor(colors?.background) == undefined,
      hovered: local_hovered,
    }"
    class="ion-no-padding ion-no-margin"
    style="width: 100%"
    :button="link != undefined"
    :href="link != undefined && isRequest(link) && isGet ? link.url : undefined"
    @click="
      () => {
        if (link != undefined) {
          if (isEvent(link)) {
            store.state.event =
              selected != undefined
                ? {
                    event: 'change_selection',
                    data: {
                      id: id,
                    },
                  }
                : {
                    event: link.event,
                    data: link.data,
                  };
            $emit('signal_event');
          } else if (!isGet) {
            store.state.request = {
              url: link.url,
              method: link.method,
            };
            $emit('execute_link');
          }
        }
      }
    "
  >
    <!-- Card header section: title, subtitle, and optional side element -->
    <ion-card-header
      v-if="title_ref != undefined || subtitle_ref != undefined"
      class="ion-no-padding"
      :class="getBreakpointClasses(classes?.header, breakpoint)"
    >
      <ion-grid class="ion-no-margin">
        <ion-row class="ion-align-items-center">
          <!-- Title column -->
          <ion-col size="auto">
            <ion-card-title v-if="title_ref != undefined"
              ><b
                ><ionic-element
                  v-model:element="title_ref"
                  @execute_link="$emit('execute_link')"
                  @signal_event="$emit('signal_event')" /></b
            ></ion-card-title>
          </ion-col>
          <!-- Subtitle column -->
          <ion-col size="auto">
            <ion-card-subtitle v-if="subtitle_ref != undefined"
              ><ionic-element
                v-model:element="subtitle_ref"
                @execute_link="$emit('execute_link')"
                @signal_event="$emit('signal_event')"
            /></ion-card-subtitle>
          </ion-col>
          <ion-col size="1"></ion-col>
          <!-- Side element column (when no content) -->
          <ion-col size-sm="auto" size="12">
            <ionic-element
              v-if="content_ref == undefined && side_element_ref != undefined"
              v-model:element="side_element_ref"
              @execute_link="$emit('execute_link')"
              @signal_event="$emit('signal_event')"
            />
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-card-header>
    <!-- Card content section: main content elements with optional layout -->
    <ion-card-content
      v-if="content_ref != undefined"
      :class="getBreakpointClasses(classes?.content, breakpoint)"
    >
      <!-- Content with side element: two-column layout -->
      <ion-grid v-if="side_element_ref != undefined">
        <ion-row>
          <ion-col>
            <!-- Linear layout: render elements sequentially -->
            <template
              v-if="actual_layout == undefined || !isMatrix(actual_layout)"
            >
              <ionic-element
                v-for="element in actual_layout == undefined
                  ? content_ref.map((e) => e.id)
                  : actual_layout"
                :key="
                  content_ref[content_ref.findIndex((e) => e.id == element)].id
                "
                v-model:element="
                  content_ref[content_ref.findIndex((e) => e.id == element)]
                "
                @execute_link="$emit('execute_link')"
                @signal_event="$emit('signal_event')"
              />
            </template>
            <!-- Matrix layout: render elements in a responsive grid -->
            <ion-grid v-else>
              <ion-row
                v-for="(row, r) in actual_layout"
                :key="r"
                class="ion-align-items-center"
              >
                <ion-col
                  v-for="element in castLayoutRow(row)"
                  :key="element.id"
                  :size-xl="getSize(element.size, 'xl')"
                  :size-lg="getSize(element.size, 'lg')"
                  :size-md="getSize(element.size, 'md')"
                  :size-sm="getSize(element.size, 'xs')"
                  :size="getSize(element.size, 'xs')"
                >
                  <ionic-element
                    v-model:element="
                      content_ref[
                        content_ref.findIndex((e) => e.id == element.id)
                      ]
                    "
                    @execute_link="$emit('execute_link')"
                    @signal_event="$emit('signal_event')"
                  />
                </ion-col>
              </ion-row>
            </ion-grid>
          </ion-col>
          <!-- Side element column with left border -->
          <ion-col
            size="auto"
            style="border-left: 1px solid var(--ion-color-dark)"
          >
            <ionic-element
              v-model:element="side_element_ref"
              @execute_link="$emit('execute_link')"
              @signal_event="$emit('signal_event')"
            />
          </ion-col>
        </ion-row>
      </ion-grid>
      <!-- Content without side element -->
      <template v-else>
        <!-- Linear layout: render elements sequentially -->
        <template v-if="actual_layout == undefined || !isMatrix(actual_layout)">
          <ionic-element
            v-for="element in actual_layout == undefined
              ? content_ref.map((e) => e.id)
              : actual_layout"
            :key="content_ref[content_ref.findIndex((e) => e.id == element)].id"
            v-model:element="
              content_ref[content_ref.findIndex((e) => e.id == element)]
            "
            @execute_link="$emit('execute_link')"
            @signal_event="$emit('signal_event')"
          />
        </template>
        <!-- Matrix layout: render elements in a responsive grid -->
        <ion-grid v-else>
          <ion-row
            v-for="(row, r) in actual_layout"
            :key="r"
            class="ion-align-items-center"
          >
            <ion-col
              v-for="element in castLayoutRow(row)"
              :key="element.id"
              :size-xl="getSize(element.size, 'xl')"
              :size-lg="getSize(element.size, 'lg')"
              :size-md="getSize(element.size, 'md')"
              :size-sm="getSize(element.size, 'xs')"
              :size="getSize(element.size, 'xs')"
            >
              <ionic-element
                v-model:element="
                  content_ref[content_ref.findIndex((e) => e.id == element.id)]
                "
                @execute_link="$emit('execute_link')"
                @signal_event="$emit('signal_event')"
              />
            </ion-col>
          </ion-row>
        </ion-grid>
      </template>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
/**
 * @displayName GeneralCard
 * @description
 * Generic card renderer used across the app to display data-driven content.
 * Renders a title/subtitle plus a list (or matrix) of `CustomElement` items, optionally with a side element.
 *
 * Link handling:
 * - If `link` is an event link, it writes `store.state.event` and emits `signal_event`.
 * - If `link` is a non-GET request link, it writes `store.state.request` and emits `execute_link`.
 *
 * @prop {(string|number)} id - Identifier used by selection and event payloads.
 * @prop {CustomElement} [title] - Card title element.
 * @prop {CustomElement} [subtitle] - Card subtitle element.
 * @prop {CustomElement[]} [content] - Main content elements.
 * @prop {Layout} [layout] - Optional responsive layout definition for content.
 * @prop {CustomElement} [side_element] - Optional element rendered in a side column.
 * @prop {boolean} [selected] - Enables selection behavior and related event payload.
 * @prop {boolean} [hovered] - External hover state.
 * @prop {LinkParameters} [link] - Optional link action to execute on click.
 * @prop {Colors<GeneralCardSubElements>} [colors] - Optional color overrides.
 * @prop {Classes<CardSubElements>} [classes] - Optional breakpoint-aware class overrides.
 *
 * @event update:title - Emitted when `title` is edited via v-model.
 * @event update:subtitle - Emitted when `subtitle` is edited via v-model.
 * @event update:content - Emitted when `content` is edited via v-model.
 * @event update:side_element - Emitted when `side_element` is edited via v-model.
 * @event execute_link - Emitted when a request-link should be executed by the parent.
 * @event signal_event - Emitted when an event-link should be handled by the parent.
 */

import {
  CardSubElements,
  Classes,
  CustomElement,
  Layout,
  LinkParameters,
  Colors,
  GeneralCardSubElements,
} from "@/types";
import {
  canVModel,
  castLayoutRow,
  getBreakpoint,
  getBreakpointClasses,
  getCssColor,
  getIonicColor,
  getLayout,
  getSize,
  isMatrix,
} from "@/utils";
import { isRequest, isEvent } from "@/utils";
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonLabel,
} from "@ionic/vue";
import { nextTick, onBeforeUnmount, onMounted } from "vue";
import { PropType, ref, toRef, watch } from "vue";
import { useStore } from "vuex";
IonLabel;

/** Update the current breakpoint */
const updateBreakpoint = () => {
  breakpoint.value = getBreakpoint(window.innerWidth);
  actual_layout.value = getLayout(props.layout, breakpoint.value);
};

const store = useStore();
const props = defineProps({
  id: {
    type: [String, Number],
    required: true,
  },
  title: Object as PropType<CustomElement>,
  subtitle: Object as PropType<CustomElement>,
  content: Array<CustomElement>,
  layout: Object as PropType<Layout>,
  side_element: Object as PropType<CustomElement>,
  selected: Boolean,
  hovered: Boolean,
  link: Object as PropType<LinkParameters>,
  colors: Object as PropType<Colors<GeneralCardSubElements>>,
  classes: Object as PropType<Classes<CardSubElements>>,
});
// <!-- TODO (4): forse manca propagazione del content tra gli stessi elementi (es. id:name e id:name_sm) e elementi collegati (id:number + id:group e id:number_group), visto che al momento, se si scrive una cosa su un elemento in un certo layout, quando si cambierà layout l'elemento collegato non avrà lo stesso valore
const emit = defineEmits([
  "execute_link",
  "signal_event",
  "update:title",
  "update:subtitle",
  "update:content",
  "update:side_element",
]);

const isGet =
  props.link != undefined &&
  isRequest(props.link) &&
  props.link.method == "get";
const css_background_color =
  props.colors?.background != undefined
    ? getCssColor(props.colors.background)
    : undefined;
const css_hover_color =
  props.colors?.hover != undefined
    ? getCssColor(props.colors.hover)
    : undefined;

const local_hovered = toRef(props, "hovered");

const title_ref = ref(props.title);
const subtitle_ref = ref(props.subtitle);
const content_ref = ref(props.content);
const side_element_ref = ref(props.side_element);
const breakpoint = ref(getBreakpoint(window.innerWidth));
const actual_layout = ref(getLayout(props.layout, breakpoint.value));

if (props.title != undefined && canVModel(props.title)) {
  watch(
    () => props.title,
    (value) => {
      title_ref.value = value;
    }
  );
  watch(
    () => title_ref.value,
    (value) => {
      emit("update:title", value);
    }
  );
}
if (props.subtitle != undefined && canVModel(props.subtitle)) {
  watch(
    () => props.subtitle,
    (value) => {
      subtitle_ref.value = value;
    }
  );
  watch(
    () => subtitle_ref.value,
    (value) => {
      emit("update:subtitle", value);
    }
  );
}
if (
  props.content != undefined &&
  props.content.find((e) => canVModel(e)) != undefined
) {
  watch(
    () => props.content,
    (value) => {
      content_ref.value = value;
    }
  );
  watch(
    () => content_ref.value,
    (value) => {
      emit("update:content", value);
    }
  );
}
if (props.side_element != undefined && canVModel(props.side_element)) {
  watch(
    () => props.side_element,
    (value) => {
      side_element_ref.value = value;
    }
  );
  watch(
    () => side_element_ref.value,
    (value) => {
      emit("update:side_element", value);
    }
  );
}

if (Object.keys(props.classes ?? {}).length > 0) {
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
.background {
  background-color: v-bind("css_background_color");
}
.hovered {
  cursor: "pointer";
  --background: rgba(v-bind("css_hover_color"), 0.14);
}
</style>
