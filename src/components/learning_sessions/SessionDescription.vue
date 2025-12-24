<template>
  <ion-grid>
    <ion-row>
      <!-- ? Valutare se mettere freccetta o meno -->
      <!--<ion-col size="auto">
        <ion-icon
          @click="$router.go(-1)"
          aria-hidden="true"
          class="ion-padding-end"
          :ios="getIcon('arrow_back').ios"
          :md="getIcon('arrow_back').md"
        />
      </ion-col>-->
      <template v-if="head_content != undefined">
        <ion-col size="auto">
          <ionic-element :element="head_content.title" />
        </ion-col>
        <ion-col size="auto">
          <ionic-element :element="head_content.subtitle" />
        </ion-col>
      </template>
      <ion-col v-else>
        <ionic-element
          :element="
            getCustomMessage(
              'emptiness_message',
              getCurrentElement('non_existing_session')
            )
          "
        />
      </ion-col>
    </ion-row>
    <ion-row v-if="head_content != undefined">
      <div class="ion-padding">
        <ionic-element
          v-for="element in head_content.content"
          :key="element.id"
          :element="element"
        />
      </div>
    </ion-row>
  </ion-grid>
</template>

<script setup lang="ts">
import {
  GeneralCardElements,
  LearningSession,
  LearningContextSummary,
} from "@/types";
import {
  executeLink,
  getCurrentElement,
  getCustomMessage /*, getIcon*/,
} from "@/utils";
import { IonGrid, IonRow, IonCol /*, IonIcon*/ } from "@ionic/vue";
import { PropType } from "vue";
//import { useRouter } from "vue-router";

//const $router = useRouter();
const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  learning_context: Object as PropType<LearningContextSummary>,
});
let head_content: GeneralCardElements | undefined;

if (props.learning_context != undefined) {
  await executeLink(
    "/v1/learning_sessions/" + props.id,
    async (response) => {
      head_content = await new LearningSession(response.data.data).toCard(
        undefined,
        props.learning_context,
        true,
        false
      );
    },
    () => undefined
  );
}
</script>

<style></style>
