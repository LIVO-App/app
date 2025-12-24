<template>
  <quill-editor
    :disabled="disabled"
    :options="options"
    :value="value"
    :class="getBreakpointClasses(classes?.editor, breakpoint)"
    @change="($event: any) => $emit('update:value', $event.html)"
  />
</template>

<script setup lang="ts">
import { Classes, EditorSubElements } from "@/types";
import { getBreakpoint, getBreakpointClasses } from "@/utils";
import { nextTick, onBeforeUnmount, onMounted, PropType, ref } from "vue";

const updateBreakpoint = () => {
  breakpoint.value = getBreakpoint(window.innerWidth);
};

const props = defineProps({
  value: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  options: {
    type: Object,
    default: () => ({
      modules: {
        toolbar: [
          ["bold", "italic", "underline", "strike"],
          //["blockquote", "code-block"],
          [{ header: 1 }, { header: 2 }],
          [{ list: "ordered" }, { list: "bullet" }],
          /*[{ script: "sub" }, { script: "super" }],
          [{ indent: "-1" }, { indent: "+1" }],
          [{ direction: "rtl" }],
          [{ size: ["small", false, "large", "huge"] }],
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          [{ color: [] }, { background: [] }],
          [{ font: [] }],
          [{ align: [] }],*/
          ["clean"],
        ],
      },
      placeholder: false,
      theme: "snow",
    }),
  },
  classes: Object as PropType<Classes<EditorSubElements>>,
});
defineEmits(["update:value"]);

const breakpoint = ref(getBreakpoint(window.innerWidth));

if (props.classes?.editor != undefined) {
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
