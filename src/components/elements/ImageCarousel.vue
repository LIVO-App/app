<template>
  <swiper
    v-if="images.length > 1"
    :modules="modules"
    :slides-per-view="1"
    navigation
    :autoplay="{
      delay: 4000,
      disableOnInteraction: false,
    }"
  >
    <swiper-slide v-for="(image, index) in images" :key="index">
      <div class="ion-text-center">
        <ionic-element
          v-if="show_name"
          :element="getCustomMessage(getName(index), getName(index))"
        />
        <ion-img
          :src="
            isImageDescriptor(image)
              ? image.url
              : isFile(image)
              ? require('@/assets/' + language + '_to_load.png')
              : image
          "
          :alt="getName(index)"
          :style="{
            height: height,
            width: width,
          }"
        />
      </div>
    </swiper-slide>
  </swiper>
  <div v-else-if="images.length == 1" class="ion-text-center">
    <ionic-element
      v-if="show_name"
      :element="getCustomMessage(getName(0), getName(0))"
    />
    <ion-img
      :src="
        isImageDescriptor(images[0])
          ? images[0].url
          : isFile(images[0])
          ? require('@/assets/' + language + '_to_load.png')
          : images[0]
      "
      :alt="getName(0)"
      :style="{
        height: height,
        width: width,
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { Swiper, SwiperSlide } from "swiper/vue";
import { Navigation, Autoplay } from "swiper/modules";
import { ImageDescriptor } from "@/types";
import { PropType } from "vue";
import { getCurrentLanguage, getCustomMessage, isFile } from "@/utils";
import { IonImg } from "@ionic/vue";

// Use `string` for module/imported image references instead of NodeRequire,
// because `NodeRequire` may not exist in browser runtime and causes
// "NodeRequire is not defined" on some machines when the bundle is run.
const isImageDescriptor = (
  image: ImageDescriptor | File | string
): image is ImageDescriptor =>
  image instanceof Object && "name" in image && "url" in image;
const getName = (idx: number) =>
  props.images_names && props.images_names.length > idx
    ? props.images_names[idx]
    : props.images.length > idx &&
      (isFile(props.images[idx]) || isImageDescriptor(props.images[idx]))
    ? props.images[idx].name
    : "Image";

const props = defineProps({
  images: {
    // Accept ImageDescriptor objects, File objects (from file inputs),
    // or plain strings (URL or webpack/rollup require() import result).
    type: Array as PropType<(ImageDescriptor | File | string)[]>,
    required: true,
  },
  images_names: {
    type: Array as PropType<string[]>,
  },
  show_name: {
    type: Boolean,
    default: false,
  },
  height: {
    type: String,
    default: "150px",
  },
  width: {
    type: String,
    default: "auto",
  },
});

const language = getCurrentLanguage();
const modules = [Navigation, Autoplay];
</script>
