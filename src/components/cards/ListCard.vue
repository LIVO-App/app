<template>
  <!-- Main card wrapper with optional title/subtitle header -->
  <ion-card
    :color="getIonicColor(colors?.background)"
    :class="{
      ...getBreakpointClasses(classes?.card, breakpoint),
      '--ion-no-border': colors?.external_borders == undefined,
      background:
        colors?.background != undefined &&
        getIonicColor(colors?.background) == undefined,
    }"
  >
    <!-- Card header: optional title and subtitle -->
    <ion-card-header
      v-if="title != undefined"
      :class="getBreakpointClasses(classes?.header, breakpoint)"
    >
      <ion-card-title v-if="title != undefined"
        ><ionic-element v-model:element="title_ref"
      /></ion-card-title>
      <ion-card-subtitle v-if="subtitle != undefined"
        ><ionic-element v-model:element="subtitle_ref"
      /></ion-card-subtitle>
    </ion-card-header>
    <!-- Card content: displays empty state, list, or grid based on data -->
    <ion-card-content
      style="overflow-y: auto"
      :class="getBreakpointClasses(classes?.content, breakpoint)"
    >
      <!-- Empty state: display message when no cards available -->
      <template v-if="hasNoData(cards_list_ref)">
        <ion-item
          :color="getIonicColor(colors?.background)"
          :class="{
            background:
              colors?.background != undefined &&
              getIonicColor(colors?.background) == undefined,
          }"
          class="ion-no-padding"
        >
          <ionic-element v-model:element="emptiness_message_ref" />
        </ion-item>
      </template>
      <!-- List layout: render cards in linear lists (when all columns = 1) -->
      <ion-list
        v-else-if="onlyLists()"
        class="ion-no-padding"
        :class="getBreakpointClasses(classes?.list, breakpoint)"
      >
        <!-- Ungrouped cards: render directly without dividers -->
        <template v-if="cards_list_ref.cards[''] != undefined">
          <card-item
            v-for="(card, i) in cards_list_ref.cards['']"
            :key="card.id"
            v-model:card="cards_list_ref.cards[''][i]"
            :colors="colors"
            :classes="classes"
            @execute_link="$emit('execute_link')"
            @signal_event="$emit('signal_event')"
          />
        </template>
        <!-- Grouped cards: render with dividers between groups -->
        <template v-else>
          <ion-item-group
            v-for="(ordered_cards, i) in cards_list_ref.order"
            :key="'group-' + ordered_cards.key"
          >
            <group-list
              v-model:emptiness_message="emptiness_message_ref"
              v-model:divider="cards_list_ref.order[i].title"
              v-model:cards_list="cards_list_ref.cards[ordered_cards.key]"
              :colors="colors"
              :classes="classes"
              @execute_link="$emit('execute_link')"
              @signal_event="$emit('signal_event')"
            />
          </ion-item-group>
        </template>
      </ion-list>
      <!-- Grid/mixed layout: render cards in grids (when columns > 1) -->
      <template v-else>
        <!-- Ungrouped grid: render directly without dividers -->
        <cards-grid
          v-if="cards_list_ref.cards[''] != undefined"
          v-model:cards_list="cards_list_ref.cards['']"
          :columns="typeof columns == 'number' ? columns : columns['']"
          :colors="colors"
          :classes="classes"
          @execute_link="$emit('execute_link')"
          @signal_event="$emit('signal_event')"
        />
        <!-- Grouped grid/list: iterate over card groups -->
        <template v-else>
          <template
            v-for="(ordered_cards, i) in cards_list_ref.order"
            :key="'group-' + ordered_cards.key"
          >
            <!-- Single column group: render as list -->
            <ion-list
              v-if="
                (typeof columns == 'number'
                  ? columns
                  : columns[ordered_cards.key]) == 1
              "
            >
              <ion-item-group>
                <group-list
                  v-model:emptiness_message="emptiness_message_ref"
                  v-model:divider="cards_list_ref.order[i].title"
                  v-model:cards_list="cards_list_ref.cards[ordered_cards.key]"
                  :colors="colors"
                  :classes="classes"
                  @execute_link="$emit('execute_link')"
                  @signal_event="$emit('signal_event')"
                />
              </ion-item-group>
            </ion-list>
            <!-- Multi-column group: render as grid with divider -->
            <template v-else>
              <ion-item-divider
                :color="getIonicColor(colors?.dividers) ?? 'light'"
                :class="{
                  ...classes?.divider,
                  dividers_background:
                    colors?.dividers != undefined &&
                    getIonicColor(colors?.dividers) == undefined,
                }"
              >
                <ionic-element
                  v-model:element="cards_list_ref.order[i].title"
                />
              </ion-item-divider>
              <ion-item
                v-if="cards_list_ref.cards[ordered_cards.key].length === 0"
                :color="getIonicColor(colors?.background)"
                :class="{
                  background:
                    colors?.background != undefined &&
                    getIonicColor(colors?.background) == undefined,
                }"
                class="ion-no-padding"
              >
                <ionic-element v-model:element="emptiness_message_ref" />
              </ion-item>
              <template v-else>
                <cards-grid
                  v-model:cards_list="cards_list_ref.cards[ordered_cards.key]"
                  :columns="
                    typeof columns == 'number'
                      ? columns
                      : columns[ordered_cards.key]
                  "
                  :colors="colors"
                  :classes="classes"
                  @execute_link="$emit('execute_link')"
                  @signal_event="$emit('signal_event')"
                />
              </template>
            </template>
          </template>
        </template>
      </template>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
/**
 * @displayName ListCard
 * @description
 * “Main-structure” component that renders an `OrderedCardsList`.
 * Supports list/grid and grouped sections with dividers, propagating events to parents.
 */

import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonItemGroup,
  IonItemDivider,
  IonItem,
} from "@ionic/vue";
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  PropType,
  ref,
  watch,
} from "vue";
import {
  ColorObject,
  EnrollmentCardElements,
  CustomElement,
  OrderedCardsList,
  Classes,
  CardsListElements,
  Colors,
  GeneralCardSubElements,
  TmpList,
  CardsGridElements,
  CustomSubElements,
} from "../../types";
import {
  getIonicColor,
  isGeneral,
  isCourse,
  canVModel,
  canCardListVModel,
  adjustColor,
  hasNoData,
  getBreakpoint,
  getBreakpointClasses,
} from "../../utils";
import { getCssColor } from "../../utils";
import { WatchStopHandle } from "vue";

/**
 * Merge specific card colors with general card colors.
 * @param specific_colors - Card-specific color overrides
 * @returns Merged color object
 */
const setSpecificColors = (
  specific_colors: Colors<CustomSubElements> | undefined
) => Object.assign(general_card_colors ?? {}, specific_colors);

/**
 * Check if all card groups should render as lists (columns = 1 for all).
 * @returns true if all groups have single-column layout
 */
const onlyLists = () => {
  const groups = Object.keys(props.columns);

  let is_list;
  let count = 0;

  if (
    !(is_list =
      props.columns === 1 ||
      (cards_list_ref.value.cards[""] != undefined &&
        typeof props.columns != "number" &&
        props.columns[""] == 1))
  ) {
    while (
      (is_list = (props.columns as TmpList<number>)[groups[count]] == 1) &&
      ++count < groups.length
    );
  }

  return is_list;
};

/**
 * Check if cards_list needs v-model watchers (if any element is editable).
 * @returns true if titles or cards can use v-model
 */
const checkVModel = () =>
  props.cards_list.order.find((order_element) =>
    canVModel(order_element.title)
  ) != undefined || canCardListVModel(props.cards_list.cards);

/**
 * Set up watchers to sync cards_list_ref with props.cards_list (for v-model).
 */
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

/**
 * Update the current breakpoint on window resize.
 */
const updateBreakpoint = () => {
  breakpoint.value = getBreakpoint(window.innerWidth);
};

// --- Component props and emit setup ---
const props = defineProps({
  title: Object as PropType<CustomElement>,
  subtitle: Object as PropType<CustomElement>,
  emptiness_message: {
    type: Object as PropType<CustomElement>,
    required: true,
  },
  cards_list: {
    type: Object as PropType<OrderedCardsList>,
    required: true,
  },
  columns: {
    type: [Number, Object] as PropType<number | TmpList<number>>,
    default() {
      return 1;
    },
  },
  colors: Object as PropType<Colors<GeneralCardSubElements>>,
  classes: Object as PropType<Classes<CardsListElements | CardsGridElements>>,
});
const emit = defineEmits([
  "execute_link",
  "signal_event",
  "update:title",
  "update:subtitle",
  "update:emptiness_message",
  "update:cards_list",
]);

const title_ref = ref(props.title);
const subtitle_ref = ref(props.subtitle);
const emptiness_message_ref = ref(props.emptiness_message);
const cards_list_ref = ref(props.cards_list);
const breakpoint = ref(getBreakpoint(window.innerWidth));

const css_background_color =
  props.colors?.background != undefined
    ? getCssColor(props.colors.background)
    : undefined;
const css_dividers_color =
  props.colors?.dividers != undefined
    ? getCssColor(props.colors.dividers)
    : undefined;
const groups = Object.keys(cards_list_ref.value.cards);
const general_card_colors:
  | {
      [key in keyof string as CustomSubElements]?: ColorObject;
    }
  | undefined =
  props.colors?.background != undefined ||
  props.colors?.cards_borders != undefined
    ? {
        background: props.colors?.background,
        borders: props.colors?.cards_borders,
      }
    : undefined;

let tmp_card;
let tmp_color: ColorObject | undefined = undefined;
let stopWatch: WatchStopHandle;

// --- Color adjustments: apply parent colors to child elements ---
// Adjust title color
if (props.title != undefined && title_ref.value != undefined) {
  if (title_ref.value.colors == undefined) {
    title_ref.value.colors = {};
  }
  title_ref.value.colors.text = adjustColor(
    props.title?.colors?.text,
    props.colors?.text
  );
}
// Adjust subtitle color
if (props.subtitle != undefined && subtitle_ref.value != undefined) {
  if (subtitle_ref.value.colors == undefined) {
    subtitle_ref.value.colors = {};
  }
  subtitle_ref.value.colors.text = adjustColor(
    props.subtitle?.colors?.text,
    props.colors?.text
  );
}
// Adjust emptiness message color and classes
if (emptiness_message_ref.value.colors == undefined) {
  emptiness_message_ref.value.colors = {};
}
emptiness_message_ref.value.colors.text = adjustColor(
  props.emptiness_message?.colors?.text,
  props.colors?.text
);
if (emptiness_message_ref.value.classes == undefined) {
  emptiness_message_ref.value.classes = {};
}
emptiness_message_ref.value.classes.label = {
  "ion-text-wrap": true,
  "ion-text-center": true,
};
// Adjust divider title classes
for (const card_group of cards_list_ref.value.order) {
  if (card_group.title.classes == undefined) {
    card_group.title.classes = {};
  }
  card_group.title.classes.label = {
    "ion-padding-end": true,
    "item-text-wrap": true,
  };
}

// Adjust colors for all cards in all groups
for (const group in groups) {
  for (const card in cards_list_ref.value.cards[groups[group]]) {
    tmp_card = cards_list_ref.value.cards[groups[group]][card];
    if (isGeneral(tmp_card)) {
      if (tmp_card.title != undefined) {
        tmp_color = adjustColor(
          tmp_card.title.colors?.text,
          props.colors?.text
        );
        if (tmp_color != undefined) {
          if (tmp_card.title.colors == undefined) {
            tmp_card.title.colors = {};
          }
          tmp_card.title.colors.text = tmp_color;
        }
      }
      if (tmp_card.subtitle != undefined) {
        tmp_color = adjustColor(
          tmp_card.subtitle.colors?.text,
          props.colors?.text
        );
        if (tmp_color != undefined) {
          if (tmp_card.subtitle.colors == undefined) {
            tmp_card.subtitle.colors = {};
          }
          tmp_card.subtitle.colors.text = tmp_color;
        }
      }
      if (tmp_card.content != undefined) {
        for (const element of tmp_card.content) {
          tmp_color = adjustColor(element.colors?.text, props.colors?.text);
          if (tmp_color != undefined) {
            if (element.colors == undefined) {
              element.colors = {};
            }
            element.colors.text = tmp_color;
          }
        }
      }
      tmp_card.colors = setSpecificColors(tmp_card.colors);
    } else if (isCourse(tmp_card)) {
      tmp_card.enrollment = (
        props.cards_list.cards[groups[group]][card] as EnrollmentCardElements
      ).enrollment;

      tmp_color = adjustColor(
        tmp_card.content[0].colors?.text,
        props.colors?.background
      );
      if (tmp_color != undefined) {
        if (tmp_card.content[0].colors == undefined) {
          tmp_card.content[0].colors = {};
        }
        tmp_card.content[0].colors.text = tmp_color;
      }

      tmp_color = adjustColor(
        tmp_card.content[1].colors?.text,
        props.colors?.text
      );
      if (tmp_color != undefined) {
        if (tmp_card.content[1].colors == undefined) {
          tmp_card.content[1].colors = {};
        }
        tmp_card.content[1].colors.text = tmp_color;
      }
    }
  }
}
// Adjust divider title colors for ordered groups
for (const ordered_cards of cards_list_ref.value.order) {
  tmp_color = adjustColor(
    ordered_cards.title.colors?.text,
    props.colors?.dividers_text,
    props.colors?.background
  );
  if (tmp_color != undefined) {
    if (ordered_cards.title.colors == undefined) {
      ordered_cards.title.colors = {};
    }
    ordered_cards.title.colors.text = tmp_color;
  }
}

if (canVModel(props.emptiness_message)) {
  watch(
    () => props.emptiness_message,
    (value) => {
      emptiness_message_ref.value = value;
    }
  );
  watch(
    () => emptiness_message_ref.value,
    (value) => {
      emit("update:title", value);
    }
  );
}
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
if (hasNoData(props.cards_list)) {
  stopWatch = watch(
    () => props.cards_list,
    (value) => {
      cards_list_ref.value = value;
      if (!hasNoData(value) && checkVModel()) {
        addListeners();
        stopWatch();
      }
    }
  );
} else if (checkVModel()) {
  addListeners();
}

if (
  props.classes?.card != undefined ||
  props.classes?.header != undefined ||
  props.classes?.content != undefined ||
  props.classes?.list != undefined ||
  props.classes?.divider != undefined
) {
  onMounted(() =>
    nextTick(() => {
      window.addEventListener("resize", updateBreakpoint);
    })
  );

  onBeforeUnmount(() => {
    window.removeEventListener("resize", updateBreakpoint);
  });

  watch(
    () => window.innerWidth,
    (newWidth) => {
      breakpoint.value = getBreakpoint(newWidth);
    }
  );
}
</script>

<style scoped>
ion-card {
  max-height: 100%;
  display: flex;
  flex-direction: column;
}
ion-card-content {
  max-height: 100%;
  position: relative;
  overflow: hidden;
  overflow-y: auto;
}
.background {
  background-color: v-bind("css_background_color");
}
.dividers_background {
  background-color: v-bind("css_dividers_color");
}
</style>
