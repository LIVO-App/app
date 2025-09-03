<template>
  <div
    v-if="element.type == 'html'"
    v-html="element.content"
    :class="actual_classes.html"
  ></div>
  <ion-input
    v-else-if="element.type == 'input'"
    :type="element.params?.type ?? 'text'"
    :value="castInputValue(element_ref.content)"
    :disabled="element.params?.disabled"
    :label="acutal_input_label"
    :aria-label="acutal_input_label"
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
  <ion-checkbox
    v-else-if="element.type == 'checkbox'"
    :disabled="element.params?.disabled"
    :checked="castCheckboxValue(element_ref.content)"
    :aria-label="acutal_input_label"
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
  <template v-else-if="element.linkType == undefined">
    <ion-label
      v-if="element.type == 'string' || element.type == 'title'"
      :color="getIonicColor(element.colors?.text)"
      :class="actual_classes.label"
    >
      <template v-if="element.type == 'string'">
        {{ element.content }}
      </template>
      <template v-else>
        <!--<h2>-->
        <!-- TODO (5): ingrandire titolo (magari mettendo un parametro per i gradi) -->
        <b>{{ element.content }}</b>
        <!--</h2>-->
      </template></ion-label
    >
    <ion-icon
      v-else-if="element.type == 'icon'"
      :ios="castIconAlternatives(element.content).ios"
      :md="castIconAlternatives(element.content).md"
      :color="getIonicColor(element.colors?.text)"
      :class="actual_classes.icon"
    />
    <!-- TODO (6): mettere il colore alle icone -->
    <ion-item
      v-else-if="element.type == 'string_icon'"
      :lines="element.colors?.borders != undefined ? 'inset' : 'none'"
      :color="getIonicColor(element.colors?.background)"
      :class="actual_classes.item"
    >
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
  </template>
  <template v-else>
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
      <template v-else>
        <b>{{ castEventString(element.content).text }}</b>
      </template>
    </ion-label>
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
    <ion-item
      v-else-if="element.type == 'string_icon'"
      :lines="element.colors?.borders != undefined ? 'inset' : 'none'"
      :color="getIonicColor(element.colors?.background)"
      :class="actual_classes.item"
    >
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
} from "@/utils";
import {
  IonCheckbox,
  IonButton,
  IonLabel,
  IonIcon,
  IonItem,
  IonInput,
} from "@ionic/vue";
import {
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
const updateBreakpoint = () => {
  breakpoint.value = getBreakpoint(window.innerWidth);

  updateElementClasses();
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
    : undefined; // label per input
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
    textColor: props.element.colors?.text != undefined,
    backgroundColor: css_background_color != undefined,
    borders:
      css_borders_color != undefined && props.element.linkType == undefined,
  },
  button: {
    customText: props.element.colors?.text != undefined,
    customBackground: css_background_color != undefined,
    customBorders: css_borders_color != undefined || border_radius != "0px",
  },
  item: {
    backgroundColor: css_background_color != undefined,
    borders: css_borders_color != undefined,
  },
  input: {
    // <!-- TODO (5): mette le classi in props.element.classes?.input, ma non funzionano (anche checkbox)
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

const acutal_input_label =
  typeof props.element.params?.label == "string"
    ? props.element.params.label
    : "";

const element_ref = ref(props.element);

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
/*.paddingButton {
  --padding-top: 10px;
  --padding-bottom: 10px;
}*/
</style>
