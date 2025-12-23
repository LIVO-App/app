<template>
  <ion-grid>
    <ion-row class="ion-align-items-center">
      <ion-col size="auto">
        <ionic-element
          :element="
            getCustomMessage('select_label', label ?? '', 'string', {
              text: {
                name: 'primary',
                type: 'var',
              },
            })
          "
        />
      </ion-col>
      <ion-col sizr="auto">
        <ion-select
          :value="selected_option"
          :aria-label="label"
          @ionChange="($event) => (selected_option_ref = $event.target.value)"
          justify="start"
          :placeholder="placeholder"
          :disabled="disabled"
          interface="popover"
          :toggle-icon="chevronDownOutline"
          shape="round"
          :class="{
            ...getBreakpointClasses(classes?.select, breakpoint),
            'ion-padding': !no_padding,
          }"
        >
          <!-- interface="popover" è più carino, ma da warnings-->
          <ion-select-option
            v-for="option in props.list"
            :value="option.id"
            :key="option.id"
            :aria-label="getCompleteName(option)"
            :class="getBreakpointClasses(classes?.option, breakpoint)"
          >
            {{ getCompleteName(option) }}
          </ion-select-option>
        </ion-select>
      </ion-col>
    </ion-row>
  </ion-grid>
</template>

<script setup lang="ts">
import {
  Classes,
  /*Colors, GeneralSubElements,*/ SelectSubElements,
} from "@/types";
import { getBreakpoint, getBreakpointClasses, getCustomMessage } from "@/utils";
import {
  IonCol,
  IonGrid,
  IonRow,
  IonSelect,
  IonSelectOption,
} from "@ionic/vue";
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  PropType,
  ref,
  watch,
} from "vue";
import { chevronDownOutline } from "ionicons/icons";

const updateBreakpoint = () => {
  breakpoint.value = getBreakpoint(window.innerWidth);
};

const props = defineProps({
  selected_option: [String, Number],
  list: {
    type: Object as PropType<
      {
        id: any;
      }[]
    >,
    required: true,
  },
  label: String,
  aria_label: String,
  placeholder: String,
  getCompleteName: {
    type: Function,
    default: (option: any) => option.id,
  },
  disabled: Boolean,
  no_padding: Boolean,
  //colors: Object as PropType<Colors<GeneralSubElements>>, //<!-- TODO (7): implementare colori
  classes: Object as PropType<Classes<SelectSubElements>>,
});
const emit = defineEmits(["update:selected_option"]);

const breakpoint = ref(getBreakpoint(window.innerWidth));
const selected_option_ref = ref(props.selected_option);

watch(
  () => props.selected_option,
  (value) => {
    selected_option_ref.value = value;
  }
);
watch(
  () => selected_option_ref.value,
  (value) => {
    emit("update:selected_option", value);
  }
);

if (props.classes?.select != undefined || props.classes?.option != undefined) {
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
.alert-wrapper {
  max-width: unset !important;
  width: 350px !important; /*<!-- TODO (6): trovare un metodo dinamico */
}
ion-select {
  --background: var(--ion-color-white);
  --border-radius: 5px;
}
.item.sc-ion-label-md-h,
.item .sc-ion-label-md-h {
  white-space: normal !important;
}

.item.sc-ion-label-ios-h,
.item .sc-ion-label-ios-h {
  white-space: normal !important;
}
/*.alert-radio-label.sc-ion-alert-md {
  white-space: pre-line !important;
}

.alert-radio-label.sc-ion-alert-ios {
  white-space: pre-line !important;
}*/
</style>
