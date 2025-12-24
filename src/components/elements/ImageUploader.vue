<template>
  <div
    class="dropzone-container radius"
    @dragover="dragover"
    @dragleave="dragleave"
    @drop="drop"
  >
    <input
      type="file"
      multiple
      name="file"
      id="fileInput"
      class="hidden-input"
      @change="onChange"
      ref="fileInput"
      accept=".jpg,.jpeg,.png"
    />

    <label for="fileInput" class="file-label ion-text-center">
      <template v-if="isDragging"> &nbsp;<br /> </template>
      {{ getCurrentElement("release_images") }}
      <template v-if="!isDragging">
        <br />
        {{ getCurrentElement("or").toLowerCase() }}
        <br />
        {{ getCurrentElement("click_to_upload") }}
      </template>
      <template v-else> <br />&nbsp; </template>
    </label>
  </div>
</template>

<script setup lang="ts">
import { ImageDescriptor } from "@/types";
import { getCurrentElement } from "@/utils";
import { ref, watch } from "vue";
import { useStore } from "vuex";

const onChange = (event: Event) => {
  const files =
    fileInput.value?.files != undefined
      ? Array.from(fileInput.value.files)
      : [];

  let message = undefined;

  if (files.length > 0) {
    if (images_list_ref.value.length + files.length > 4) {
      message = getCurrentElement("max_images_error");
    } else if (
      files.some(
        (f) => images_list_ref.value.findIndex((a) => a.name == f.name) != -1
      )
    ) {
      message =
        files.length == 1
          ? getCurrentElement("image_already_present")
          : getCurrentElement("images_already_present");
    } else {
      images_list_ref.value = images_list_ref.value.concat(files);
    }

    if (message != undefined) {
      event.preventDefault();
      store.state.event = {
        event: "error",
        data: {
          message: message,
        },
      };
      emit("signal_event");
    }
  }
};

const dragover = (e: DragEvent) => {
  e.preventDefault();
  isDragging.value = true;
};

const dragleave = () => {
  isDragging.value = false;
};

const drop = (e: DragEvent) => {
  e.preventDefault();
  if (e.dataTransfer && fileInput.value) {
    fileInput.value.files = e.dataTransfer?.files;
  }
  onChange(e);
  isDragging.value = false;
};

const props = defineProps({
  images_list: {
    type: Array<ImageDescriptor | File>,
    required: true,
  },
  progress_infos: Array<{
    percentage: number;
  }>,
});
const emit = defineEmits([
  "update:images_list",
  "update:progress_infos",
  "signal_event",
]);
const store = useStore();

const images_list_ref = ref(props.images_list);
const progress_infos_ref = ref(props.progress_infos);
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

watch(
  () => props.images_list,
  (newVal) => {
    images_list_ref.value = newVal;
  }
);

watch(
  () => images_list_ref.value,
  (value) => {
    emit("update:images_list", value);
  }
);

watch(
  () => props.progress_infos,
  (newVal) => {
    progress_infos_ref.value = newVal;
  }
);

watch(
  () => progress_infos_ref.value,
  (value) => {
    emit("update:progress_infos", value);
  }
);
</script>

<style scoped>
.main {
  display: flex;
  flex-grow: 1;
  align-items: center;
  height: 100vh;
  justify-content: center;
  text-align: center;
}

.dropzone-container {
  padding: 4rem;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
}

.hidden-input {
  opacity: 0;
  overflow: hidden;
  position: absolute;
  width: 1px;
  height: 1px;
}

.file-label {
  font-size: 20px;
  display: block;
  cursor: pointer;
}
</style>
