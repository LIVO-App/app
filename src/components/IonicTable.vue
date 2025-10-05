<template>
  <div
    v-if="hasNoData(data_ref)"
    :class="{
      background:
        colors?.background != undefined &&
        getIonicColor(colors?.background) == undefined,
    }"
  >
    <ionic-element
      v-model:element="emptiness_message_ref"
      @execute_link="$emit('execute_link')"
      @signal_event="$emit('signal_event')"
    />
  </div>
  <template v-else>
    <div
      v-if="!isSmaller(breakpoint, list_breakpoint)"
      class="ion-margin white_background"
    >
      <ion-grid class="ion-padding">
        <ion-row
          v-if="first_row_ref != undefined"
          class="header ion-text-center ion-align-items-center"
        >
          <ion-col
            v-for="(cell, i) in first_row_ref"
            :key="cell.id"
            :size-xl="
              getTableCellSize(cell.size, sizes, i, 'xl', has_fr_custom_sizes)
            "
            :size-lg="
              getTableCellSize(cell.size, sizes, i, 'lg', has_fr_custom_sizes)
            "
            :size-md="
              getTableCellSize(cell.size, sizes, i, 'md', has_fr_custom_sizes)
            "
            :size-sm="
              getTableCellSize(cell.size, sizes, i, 'sm', has_fr_custom_sizes)
            "
            :size="
              getTableCellSize(cell.size, sizes, i, 'xs', has_fr_custom_sizes)
            "
          >
            <ionic-element
              :key="cell.id"
              :element="first_row_ref[i]"
              @execute_link="$emit('execute_link')"
              @signal_event="$emit('signal_event')"
            />
          </ion-col>
        </ion-row>
        <template
          v-for="row_order in data_ref.cards[''] != undefined
            ? [
                {
                  key: '',
                  title: getCustomMessage('', ''),
                },
              ]
            : data_ref.order"
        >
          <ion-row
            :key="row_order.key + '_divider'"
            v-if="data_ref.cards[''] == undefined && show_table_dividers"
            class="row ion-align-items-center"
          >
            <ion-col>
              <ionic-element
                :key="row_order.key"
                :element="row_order.title"
                @execute_link="$emit('execute_link')"
                @signal_event="$emit('signal_event')"
              />
            </ion-col>
          </ion-row>
          <ion-row
            v-for="(row, i) in data_ref.cards[row_order.key]"
            :key="row_order.key + '_' + row.id"
            class="row ion-align-items-center"
          >
            <ion-col
              v-if="first_col_ref != undefined"
              :size-xl="
                getTableCellSize(
                  first_col_ref[row_order.key][i].size,
                  sizes,
                  0,
                  'xl',
                  has_fc_custom_sizes
                )
              "
              :size-lg="
                getTableCellSize(
                  first_col_ref[row_order.key][i].size,
                  sizes,
                  0,
                  'lg',
                  has_fc_custom_sizes
                )
              "
              :size-md="
                getTableCellSize(
                  first_col_ref[row_order.key][i].size,
                  sizes,
                  0,
                  'md',
                  has_fc_custom_sizes
                )
              "
              :size-sm="
                getTableCellSize(
                  first_col_ref[row_order.key][i].size,
                  sizes,
                  0,
                  'sm',
                  has_fc_custom_sizes
                )
              "
              :size="
                getTableCellSize(
                  first_col_ref[row_order.key][i].size,
                  sizes,
                  0,
                  'xs',
                  has_fc_custom_sizes
                )
              "
              class="header"
            >
              <ionic-element
                :key="first_col_ref[row_order.key][i].id"
                :element="first_col_ref[row_order.key][i]"
                @execute_link="$emit('execute_link')"
                @signal_event="$emit('signal_event')"
              />
            </ion-col>
            <ion-col
              v-for="(index, j) in getFlatLayoutIndexes(
                data_ref.cards[row_order.key][i],
                breakpoint
              )"
              :key="
                castTableElementArray(data_ref.cards[row_order.key][i].content)[
                  index
                ].id
              "
              :size="
                Array.isArray(sizes)
                  ? '' + sizes[j + (first_col_ref != undefined ? 1 : 0)]
                  : sizes[row_order.key] != undefined &&
                    sizes[row_order.key][row.id] != undefined &&
                    sizes[row_order.key][row.id][j] != undefined
                  ? '' + sizes[row_order.key][row.id][j]
                  : undefined
              "
              :class="{
                'ion-text-center': isCellCentered(
                  row_order.key,
                  i,
                  index,
                  breakpoint
                ),
              }"
            >
              <ionic-element
                v-model:element="
                  castTableElementArray(
                    data_ref.cards[row_order.key][i].content
                  )[index]
                "
                @execute_link="$emit('execute_link')"
                @signal_event="$emit('signal_event')"
              />
            </ion-col>
          </ion-row>
        </template>
      </ion-grid>
    </div>
    <list-card
      v-if="isSmaller(breakpoint, list_breakpoint)"
      :key="trigger"
      @execute_link="$emit('execute_link')"
      @signal_event="$emit('signal_event')"
      v-model:emptiness_message="emptiness_message_ref"
      v-model:cards_list="data_ref"
      :colors="colors"
      :classes="classes"
    />
  </template>
</template>

<script setup lang="ts">
import {
  Breakpoint,
  CardsGridElements,
  CardsListElements,
  Classes,
  Colors,
  CustomElement,
  GeneralCardSubElements,
  GeneralTableCardElements,
  OrderedCardsList,
  SubElements,
  TableElement,
  TmpList,
} from "@/types";
import {
  adjustColor,
  canArrayVModel,
  canCardListVModel,
  canListVModel,
  canVModel,
  castLayoutRow,
  getBreakpoint,
  getBreakpointClasses,
  getCssColor,
  getCustomMessage,
  getIonicColor,
  getLayout,
  getTableCellSize,
  hasNoData,
  isMatrix,
  isSmaller,
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

const castTableElementArray = (e: any) => e as TableElement[];
const hasFirstColSizes = () => {
  let keys: string[];
  let count = 0;
  let has_sizes = false;

  if (props.first_col != undefined) {
    keys = Object.keys(props.first_col);
    while (
      !(has_sizes =
        props.first_col[keys[count]].find((e) => e.size != undefined) !=
        undefined) &&
      ++count < keys.length
    );
  }

  return has_sizes;
};
const checkVModel = () =>
  props.data.order.find((order_element) => canVModel(order_element.title)) !=
    undefined || canCardListVModel(props.data.cards);
const addListeners = () => {
  watch(
    () => props.data,
    (value) => {
      data_ref.value = value;
    }
  );
  watch(
    () => data_ref.value,
    (value) => {
      emit("update:data", value);
    }
  );
};
const getFlatLayoutIndexes = (
  element: GeneralTableCardElements,
  breakpoint: Breakpoint
) => {
  const actual_layout = getLayout(element.layout, breakpoint);

  let to_ret: number[];

  if (actual_layout == undefined) {
    to_ret = element.content.map((_, i) => i);
  } else if (!isMatrix(actual_layout)) {
    to_ret = (actual_layout as (string | number)[]).map((id) =>
      element.content.findIndex((c) => c.id == id)
    );
  } else {
    to_ret = [];
    actual_layout.forEach((row) => {
      castLayoutRow(row).forEach((e) =>
        element.content.findIndex((c) => c.id == e.id)
      );
    });
  }

  return to_ret;
};
const updateBreakpoint = () => {
  breakpoint.value = getBreakpoint(window.innerWidth);
  trigger.value++; // TODO (5): da vedere se si trova metodo migliore (es. breackpoint aggiornato in store)
};
const isCellCentered = (
  key: string | number,
  i: number,
  index: number,
  actual_breakpoint: Breakpoint
): boolean => {
  const classes = data_ref.value.cards[key][i].content[index].classes;

  if (!classes) return true;

  const elements = Object.keys(classes) as SubElements[];

  return elements.every((element) => {
    const breakpointClasses = getBreakpointClasses(
      classes[element],
      actual_breakpoint
    );
    return !Object.entries(breakpointClasses).some(
      ([className, isActive]) =>
        (className === "ion-text-start" || className === "ion-text-end") &&
        isActive
    );
  });
};

const props = defineProps({
  emptiness_message: {
    type: Object as PropType<CustomElement>,
    required: true,
  },
  data: {
    type: Object as PropType<OrderedCardsList<GeneralTableCardElements>>,
    required: true,
  },
  show_table_dividers: {
    type: Boolean,
    default: false,
  },
  first_row: {
    type: Array<TableElement>,
  },
  first_col: {
    //No cell (0,0)
    type: Object as PropType<TmpList<TableElement[]>>,
  },
  sizes: {
    type: [Array, Object] as PropType<
      string[] | TmpList<TmpList<(string | undefined)[]>>
    >,
    required: true,
  },
  list_breakpoint: {
    type: String as PropType<Breakpoint>,
    default: "sm",
  },
  colors: Object as PropType<Colors<GeneralCardSubElements>>, // TODO (5): vedere dove applicare colors e classes alla tabella
  classes: Object as PropType<Classes<CardsListElements | CardsGridElements>>,
});
const emit = defineEmits([
  "execute_link",
  "signal_event",
  "update:emptiness_message",
  "update:data",
  "update:first_row",
  "update:first_col",
]);

const emptiness_message_ref = ref(props.emptiness_message);
const data_ref = ref(props.data);
const first_row_ref = ref(props.first_row);
const first_col_ref = ref(props.first_col);
const has_fr_custom_sizes =
  props.first_row != undefined &&
  props.first_row.find((e) => e.size != undefined) != undefined;
const has_fc_custom_sizes = hasFirstColSizes();
const breakpoint = ref(getBreakpoint(window.innerWidth));
const trigger = ref(0);
const background_color = getCssColor(
  props.colors?.background ?? {
    name: "white",
    type: "var",
  }
);
const lines_color = getCssColor(
  props.colors?.list_borders ?? {
    name: "black",
    type: "var",
    alpha: 0.25,
  }
);

let stopWatch: WatchStopHandle;

if (emptiness_message_ref.value.colors == undefined) {
  emptiness_message_ref.value.colors = {};
}
emptiness_message_ref.value.colors.text = adjustColor(
  props.emptiness_message?.colors?.text,
  props.colors?.text
);

if (first_row_ref.value != undefined) {
  first_row_ref.value.forEach((cell) => {
    if (cell.colors == undefined) {
      cell.colors = {};
    }
    cell.colors.text = adjustColor(cell.colors.text, props.colors?.background, {
      name: "background-color",
      type: "var",
    });
  });
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
      emit("update:emptiness_message", value);
    }
  );
}
if (hasNoData(props.data)) {
  stopWatch = watch(
    () => props.data,
    (value) => {
      data_ref.value = value;
      if (!hasNoData(value) && checkVModel()) {
        addListeners();
        stopWatch();
      }
    }
  );
} else if (checkVModel()) {
  addListeners();
}
if (props.first_row != undefined && canArrayVModel(props.first_row)) {
  watch(
    () => props.first_row,
    (value) => {
      first_row_ref.value = value;
    }
  );
  watch(
    () => first_row_ref.value,
    (value) => {
      emit("update:first_row", value);
    }
  );
}
if (props.first_col != undefined && canListVModel(props.first_col)) {
  watch(
    () => props.first_col,
    (value) => {
      first_col_ref.value = value;
    }
  );
  watch(
    () => first_col_ref.value,
    (value) => {
      emit("update:first_col", value);
    }
  );
}
onMounted(() =>
  nextTick(() => {
    window.addEventListener("resize", updateBreakpoint);
  })
);

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateBreakpoint);
});
</script>

<style scoped>
.header {
  background-color: v-bind(lines_color);
}

.row {
  border-bottom: solid 1px v-bind(lines_color);
}

.white_background {
  background-color: v-bind(background_color);
}
</style>
