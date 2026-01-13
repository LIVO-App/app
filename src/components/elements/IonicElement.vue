<template>
  <!-- Modal for date input elements -->
  <ion-modal v-if="element.type == 'input_date'" :keep-contents-mounted="true">
    <!-- Date picker for input_date type -->
    <ion-datetime
      :id="'date_' + element.id"
      @ion-change="changeDate"
      :presentation="element.params?.presentation"
      :first-day-of-week="1"
      :max="actual_max_date"
      hour-cycle="h23"
      :locale="getLocale()"
      :show-clear-button="element.params?.show_clear_button ?? true"
      :clear-text="getCurrentElement('clear')"
      :value="date_ref"
    />
  </ion-modal>
  <!-- Render raw HTML content if type is 'html' -->
  <div
    v-if="element.type == 'html'"
    v-html="element.content"
    :class="actual_classes.html"
  ></div>
  <!-- Standard input (not password) -->
  <ion-input
    v-else-if="element.type == 'input' && element.params?.type != 'password'"
    :type="element.params?.type ?? 'text'"
    :value="castInputValue(element_ref.content)"
    :disabled="element.params?.disabled"
    :label="actual_label"
    :aria-label="actual_label"
    :placeholder="actual_input_placeholder"
    :color="getIonicColor(element.colors?.text)"
    :size="element.params?.size ?? 'default'"
    fill="outline"
    :class="actual_classes.input"
    @ion-input="
      ($event) => {
        const tmp_element = element;
        tmp_element.content =
          $event.target.value ?? (element.params?.type == 'number' ? 0 : '');
        $emit('update:element', tmp_element);
        store.state.event = {
          event: 'ion-input',
          data: {
            element_ref: element.params?.ref ?? element.id,
          },
        };
        $emit('signal_event');
      }
    "
    @keydown="
      store.state.event = {
        event: 'keydown',
        data: {
          element_ref: element.params?.ref ?? element.id,
          key_event: $event,
        },
      };
      $emit('signal_event');
    "
  />
  <!-- Password input with show/hide toggle -->
  <ion-item
    v-else-if="element.type == 'input' && element.params?.type == 'password'"
    :class="actual_classes.item"
    lines="none"
  >
    <ion-input
      :type="show_password ? 'text' : 'password'"
      :value="castInputValue(element_ref.content)"
      :disabled="element.params?.disabled"
      :label="actual_label"
      :aria-label="actual_label"
      :placeholder="actual_input_placeholder"
      :color="getIonicColor(element.colors?.text)"
      :size="element.params?.size ?? 'default'"
      fill="outline"
      :class="actual_classes.input"
      @ion-input="
        ($event) => {
          const tmp_element = element;
          tmp_element.content =
            $event.target.value ?? (element.params?.type == 'number' ? 0 : '');
          $emit('update:element', tmp_element);
          store.state.event = {
            event: 'ion-input',
            data: {
              element_ref: element.params?.ref ?? element.id,
            },
          };
          $emit('signal_event');
        }
      "
    />
    <!-- Button to toggle password visibility -->
    <ion-button
      slot="end"
      fill="clear"
      @click="togglePassword"
      :class="actual_classes.button"
    >
      <ion-icon
        :ios="eye_icons[show_password].ios"
        :md="eye_icons[show_password].md"
        :class="actual_classes.icon"
      />
    </ion-button>
  </ion-item>
  <!-- Checkbox input -->
  <ion-checkbox
    v-else-if="element.type == 'checkbox'"
    :disabled="element.params?.disabled"
    :checked="castCheckboxValue(element_ref.content)"
    :aria-label="actual_label"
    :class="actual_classes.checkbox"
    :style="{
      '--checkmark-color': css_checkmark_color,
      '--checkbox-background': css_background_color,
      '--border-color-checked': css_borders_checked_color,
      '--checkbox-background-checked': css_background_checked_color,
    }"
    @ion-change="
      ($event) => {
        const tmp_element = element;

        tmp_element.content = $event.target.checked ?? false;
        $emit('update:element', tmp_element);
      }
    "
  />
  <!-- Elements without linkType: render as label, icon, or string_icon -->
  <template v-else-if="element.linkType == undefined">
    <!-- Render string or title as label -->
    <ion-label
      v-if="element.type == 'string' || element.type == 'title'"
      :color="getIonicColor(element.colors?.text)"
      :class="actual_classes.label"
    >
      <template v-if="element.type == 'string'">
        {{ element.content }}
      </template>
      <!-- Title (bold) -->
      <template v-else>
        <!--<h2>-->
        <!-- TODO (5): ingrandire titolo (magari mettendo un parametro per i gradi, es. h1, h2, ...) -->
        <b>{{ element.content }}</b>
        <!--</h2>-->
      </template></ion-label
    >
    <!-- Render icon element -->
    <ion-icon
      v-else-if="element.type == 'icon'"
      :ios="castIconAlternatives(element.content).ios"
      :md="castIconAlternatives(element.content).md"
      :color="getIonicColor(element.colors?.text)"
      :class="actual_classes.icon"
    />
    <!-- Render string_icon element (label + icon) -->
    <ion-item
      v-else-if="element.type == 'string_icon'"
      :lines="element.colors?.borders != undefined ? 'inset' : 'none'"
      :color="getIonicColor(element.colors?.background)"
      :class="actual_classes.item"
    >
      <!-- Icon after text -->
      <template v-if="!castStringIcon(element.content).order">
        <ion-label
          :color="getIonicColor(element.colors?.text)"
          :class="actual_classes.label"
        >
          {{ castStringIcon(element.content).text }}
        </ion-label>
        <ion-icon
          :ios="castStringIcon(element.content).icon.ios"
          :md="castStringIcon(element.content).icon.md"
          :color="getIonicColor(element.colors?.text)"
          :class="actual_classes.icon"
        />
      </template>
      <!-- Icon before text -->
      <template v-else>
        <ion-icon
          :ios="castStringIcon(element.content).icon.ios"
          :md="castStringIcon(element.content).icon.md"
          :color="getIonicColor(element.colors?.text)"
          :class="{
            'ion-padding-end': true,
            ...actual_classes.icon,
          }"
        />
        <ion-label
          :color="getIonicColor(element.colors?.text)"
          :class="actual_classes.label"
        >
          {{ castStringIcon(element.content).text }}
        </ion-label>
      </template>
    </ion-item>
    <!-- Date input button (for input_date type) -->
    <ion-item
      v-if="element.type == 'input_date'"
      lines="none"
      style="width: fit-content"
      class="ion-no-padding"
    >
      <ion-label
        v-if="actual_label != ''"
        :aria-label="actual_label"
        color="primary"
        style="color: var(--ion-color-primary); width: fit-content"
        >{{ actual_label }}</ion-label
      >
      <ion-datetime-button
        :datetime="'date_' + element.id"
        style="width: fit-content"
        class="ion-padding-start"
      />
    </ion-item>
  </template>
  <!-- Elements with linkType: clickable labels, buttons, or string_icon with links/events -->
  <template v-else>
    <!-- Clickable label for string/title with link/event -->
    <ion-label
      v-if="element.type == 'string' || element.type == 'title'"
      :color="getIonicColor(element.colors?.text)"
      @click="
        () => {
          if (!disabled && element.linkType == 'request') {
            store.state.request = {
              url: castRequestString(element.content).url,
              method: castRequestString(element.content).method,
            };
            $emit('execute_link');
          } else if (!disabled && element.linkType == 'event') {
            store.state.event = {
              event: castEventString(props.element.content).event,
              data: castEventString(props.element.content).data,
            };
            $emit('signal_event');
          }
        }
      "
      class="clickable"
      :class="actual_classes.label"
    >
      <template v-if="element.type == 'string'">
        {{ castEventString(element.content).text }}
      </template>
      <!-- Title (bold) -->
      <template v-else>
        <b>{{ castEventString(element.content).text }}</b>
      </template>
    </ion-label>
    <!-- Clickable icon or string_icon as button (link/event) -->
    <ion-button
      v-else-if="
        element.type == 'icon' ||
        (element.type == 'string_icon' &&
          castEventStringIcon(element.content).whole_link)
      "
      :disabled="disabled"
      fill="clear"
      @click="
        () => {
          if (element.linkType == 'request') {
            store.state.request = {
              url: (element.type == 'icon'
                ? castRequestIcon(element.content)
                : castRequestStringIcon(element.content)
              ).url,
              method: (element.type == 'icon'
                ? castRequestIcon(element.content)
                : castRequestStringIcon(element.content)
              ).method,
            };
            $emit('execute_link');
          } else if (element.linkType == 'event') {
            store.state.event = {
              event: (element.type == 'icon'
                ? castEventIcon(element.content)
                : castEventStringIcon(element.content)
              ).event,
              data: (element.type == 'icon'
                ? castEventIcon(element.content)
                : castEventStringIcon(element.content)
              ).data,
            };
            $emit('signal_event');
          }
        }
      "
      :class="actual_classes.button"
    >
      <!-- Text before icon (string_icon) -->
      <ion-label
        v-if="
          element.type == 'string_icon' &&
          (castStringIcon(element.content).order == undefined ||
            !castStringIcon(element.content).order)
        "
        :color="getIonicColor(element.colors?.text)"
        :class="actual_classes.label"
        class="ion-padding-end"
      >
        {{ castStringIcon(element.content).text }}
      </ion-label>
      <ion-icon
        :ios="
          (element.type == 'icon'
            ? castEventIcon(element.content)
            : castEventStringIcon(element.content)
          ).icon.ios
        "
        :md="
          (element.type == 'icon'
            ? castEventIcon(element.content)
            : castEventStringIcon(element.content)
          ).icon.md
        "
        :color="getIonicColor(element.colors?.text)"
        :class="actual_classes.icon"
      />
      <!-- Text after icon (string_icon) -->
      <ion-label
        v-if="
          element.type == 'string_icon' && castStringIcon(element.content).order
        "
        :color="getIonicColor(element.colors?.text)"
        :class="actual_classes.label"
        class="ion-padding-start"
      >
        {{ castStringIcon(element.content).text }}
      </ion-label>
    </ion-button>
    <!-- string_icon as item with clickable icon (link/event) -->
    <ion-item
      v-else-if="element.type == 'string_icon'"
      :lines="element.colors?.borders != undefined ? 'inset' : 'none'"
      :color="getIonicColor(element.colors?.background)"
      :class="actual_classes.item"
    >
      <!-- Text before icon -->
      <ion-label
        v-if="
          castStringIcon(element.content).order == undefined ||
          !castStringIcon(element.content).order
        "
        :color="getIonicColor(element.colors?.text)"
        :class="{
          'ion-padding-end': true,
          ...actual_classes.label,
        }"
      >
        {{ castStringIcon(element.content).text }}
      </ion-label>
      <!-- Clickable icon button -->
      <ion-button
        :disabled="disabled"
        fill="clear"
        @click="
          () => {
            if (element.linkType == 'request') {
              store.state.request = {
                url: castRequestStringIcon(element.content).url,
                method: castRequestStringIcon(element.content).method,
              };
              $emit('execute_link');
            } else if (element.linkType == 'event') {
              store.state.event = {
                event: castEventStringIcon(props.element.content).event,
                data: castEventStringIcon(props.element.content).data,
              };
              $emit('signal_event');
            }
          }
        "
        :class="actual_classes.button"
      >
        <ion-icon
          :ios="castStringIcon(element.content).icon.ios"
          :md="castStringIcon(element.content).icon.md"
          :color="getIonicColor(element.colors?.text)"
          :class="actual_classes.icon"
        />
      </ion-button>
      <!-- Text after icon -->
      <ion-label
        v-if="castStringIcon(element.content).order"
        :color="getIonicColor(element.colors?.text)"
        :class="actual_classes.label"
      >
        {{ castStringIcon(element.content).text }}
      </ion-label>
    </ion-item>
  </template>
</template>

<script setup lang="ts">
/**
 * @displayName IonicElement
 * @description
 * Renderer for “data-driven” UI elements defined by `CustomElement`.
 * Converts a payload (type+content+colors+classes+link) into Ionic/HTML widgets.
 *
 * Link handling:
 * - `linkType === 'request'`: writes `store.state.request` and emits `execute_link`.
 * - `linkType === 'event'`: writes `store.state.event` and emits `signal_event`.
 */

import {
  RequestIcon,
  CustomElement,
  EventString,
  EventIcon,
  IconAlternatives,
  RequestString,
  RequestStringIcon,
  EventStringIcon,
  Classes,
  StringIcon,
  SubElements,
} from "@/types";
import {
  getBreakpoint,
  updateBreakpointClasses,
  getCssColor,
  getIonicColor,
  getLocale,
  getCurrentElement,
  dateStringToISODate,
  toDateString,
  getIcon,
} from "@/utils";
import {
  IonCheckbox,
  IonButton,
  IonLabel,
  IonIcon,
  IonItem,
  IonInput,
  DatetimeCustomEvent,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
} from "@ionic/vue";
import {
  computed,
  ComputedRef,
  nextTick,
  onBeforeUnmount,
  onMounted,
  PropType,
  reactive,
  ref,
  watch,
} from "vue";
import { useStore } from "vuex";

const castInputValue = (a: any) => a as string | number;
const castCheckboxValue = (a: any) => a as boolean;
const castIconAlternatives = (a: any) => a as IconAlternatives;
const castStringIcon = (a: any) => a as StringIcon;
const castRequestIcon = (a: any) => a as RequestIcon;
const castEventIcon = (a: any) => a as EventIcon;
const castRequestString = (a: any) => a as RequestString;
const castEventString = (a: any) => a as EventString;
const castRequestStringIcon = (a: any) => a as RequestStringIcon;
const castEventStringIcon = (a: any) => a as EventStringIcon;

/**
 * Update the classes for each sub-element based on the current breakpoint.
 */
const updateElementClasses = () => {
  for (const sub_element in actual_classes) {
    updateBreakpointClasses(
      props.element.classes?.[sub_element as SubElements],
      actual_classes[sub_element as SubElements] as {
        [key: string]: boolean;
      },
      breakpoint.value
    );
  }
};

/**
 * Update the current breakpoint and refresh element classes.
 */
const updateBreakpoint = () => {
  breakpoint.value = getBreakpoint(window.innerWidth);
  updateElementClasses();
};

/**
 * Handler for date change events from ion-datetime.
 * Updates the element's content and emits the appropriate events.
 */
const changeDate = (event: DatetimeCustomEvent) => {
  const tmp_str_date = event.target.value;
  let tmp_date: Date;
  if (typeof tmp_str_date == "string") {
    tmp_date = new Date(tmp_str_date);
    if (actual_max_date == undefined || tmp_date <= new Date(actual_max_date)) {
      element_ref.value.content = toDateString(tmp_date);
    } else {
      element_ref.value.content = "";
    }
  } else {
    element_ref.value.content = "";
  }
  emit("update:element", props.element);
  store.state.event = {
    event: "ion-input",
    data: {
      element_ref: props.element.params?.ref ?? props.element.id,
    },
  };
  emit("signal_event");
};

/**
 * Toggle the visibility of the password input field.
 */
const togglePassword = () => {
  if (element_ref.value.params == undefined) {
    element_ref.value.params = {};
  }
  show_password.value = +!show_password.value;
};

const store = useStore();
const props = defineProps({
  element: {
    type: Object as PropType<CustomElement>,
    required: true,
  },
  disabled: Boolean, //<!-- TODO (7): aggiornare posti dove viene usato
});
const emit = defineEmits(["execute_link", "signal_event", "update:element"]);

const css_text_color =
  props.element.colors?.text != undefined
    ? getCssColor(props.element.colors.text)
    : undefined; // label for input
const css_background_color =
  props.element.colors?.background != undefined
    ? getCssColor(props.element.colors.background)
    : undefined;
const css_borders_color =
  props.element.colors?.borders != undefined
    ? getCssColor(props.element.colors.borders)
    : undefined;
const css_placeholder_color =
  props.element.colors?.placeholder != undefined
    ? getCssColor(props.element.colors.placeholder, false)
    : undefined;
const default_low_opacity = 0.8;
const css_placeholder_opacity =
  props.element.colors?.placeholder?.alpha ?? default_low_opacity;
const css_checkmark_color =
  props.element.colors?.checkmark != undefined
    ? getCssColor(props.element.colors.checkmark)
    : undefined;
const css_background_checked_color =
  props.element.colors?.background_checked != undefined
    ? getCssColor(props.element.colors.background_checked)
    : undefined;
const css_borders_checked_color =
  props.element.colors?.borders_checked != undefined
    ? getCssColor(props.element.colors.borders_checked)
    : undefined;

const border_radius = props.element.params?.border_radius ?? "0px";

const breakpoint = ref(getBreakpoint(window.innerWidth));

// <!-- TODO (7): vedere se aggiungere stili (bold, italic, ...) su parti parziali del testo o lasciare che si faccia con html
const actual_classes: Classes<SubElements, boolean> = reactive({
  label: {
    textColor: props.element.colors?.text != undefined,
    backgroundColor: css_background_color != undefined,
    borders: css_borders_color != undefined,
  },
  html: {
    textColor: props.element.colors?.text != undefined,
    backgroundColor: css_background_color != undefined,
    borders: css_borders_color != undefined,
  },
  icon: {
    textColor:
      props.element.colors?.text != undefined &&
      props.element.params?.type != "password",
    backgroundColor:
      css_background_color != undefined &&
      props.element.params?.type != "password",
    borders:
      css_borders_color != undefined &&
      props.element.linkType == undefined &&
      props.element.params?.type != "password",
    backgroundIcon: props.element.params?.type == "password",
  },
  button: {
    customText: props.element.colors?.text != undefined,
    customBackground: css_background_color != undefined,
    customBorders: css_borders_color != undefined || border_radius != "0px",
  },
  item: {
    backgroundColor: css_background_color != undefined,
    borders: css_borders_color != undefined,
    "ion-no-padding": props.element.params?.type == "password",
  },
  input: {
    customText: props.element.colors?.text != undefined,
    customBackground: css_background_color != undefined,
    customBorders: css_borders_color != undefined || border_radius != "0px",
    placeholderColor:
      css_placeholder_color != undefined ||
      css_placeholder_opacity != default_low_opacity,
  },
  checkbox: {
    customBorders: css_borders_color != undefined || border_radius != "0px",
  },
});

const actual_label =
  typeof props.element.params?.label == "string"
    ? props.element.params.label
    : "";
const actual_input_placeholder =
  typeof props.element.params?.placeholder == "string"
    ? props.element.params.placeholder
    : "";
const actual_max_date: string =
  props.element.params?.max_date != undefined
    ? props.element.params.max_date
    : undefined;

const element_ref = ref(props.element);
const show_password = ref(0);
const eye_icons: {
  [key: number]: IconAlternatives;
} = {
  0: getIcon("eye"),
  1: getIcon("eyeOff"),
};

let date_ref: ComputedRef<string | undefined> | undefined = undefined;
if (props.element.type === "input_date") {
  date_ref = computed(() =>
    element_ref.value.content == ""
      ? undefined
      : dateStringToISODate(element_ref.value.content as string)
  );
}

updateElementClasses();
if (
  actual_classes.label != undefined ||
  actual_classes.html != undefined ||
  actual_classes.icon != undefined ||
  actual_classes.button != undefined ||
  actual_classes.item != undefined ||
  actual_classes.input != undefined ||
  actual_classes.checkbox != undefined
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

watch(
  () => props.element,
  (newValue) => {
    element_ref.value = newValue;
  }
);
watch(
  () => element_ref.value,
  (value) => emit("update:element", value)
);
</script>

<style scoped>
.textColor {
  color: v-bind("css_text_color");
}
.backgroundColor {
  background-color: v-bind("css_background_color");
}
.borders {
  border: 1px solid v-bind("css_borders_color");
}
.customBackground {
  --background: v-bind("css_background_color");
}
.customText {
  --color: v-bind("css_text_color");
}
.customBorders {
  --border-radius: v-bind("border_radius");
  --border-color: v-bind("css_borders_color");
  --border-style: solid;
  --border-width: 1px;
}
.clickable:hover {
  cursor: pointer;
}
.placeholderColor {
  --placeholder-color: v-bind("css_placeholder_color");
  --placeholder-opacity: v-bind("css_placeholder_opacity");
}
.backgroundIcon {
  color: v-bind("css_background_color");
}
/*.paddingButton {
  --padding-top: 10px;
  --padding-bottom: 10px;
}*/
</style>
