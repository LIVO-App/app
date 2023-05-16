<template>
    <div class="ion-padding-horizontal">
        <suspense>
            <template #default>
                <block-description :id="$route.params.id" />
            </template>
            <template #fallback>
                <loading-component />
            </template>
        </suspense>
        <custom-select v-model="selected_area" :learning_areas="learning_areas" />
        <list-card :key="trigger" :emptiness_message="elements[language].noCourses" v-model:cards="courses" />
    </div>
</template>

<script setup lang="ts">
import { CardsList, CourseCardElements, CourseSummary, CourseSummaryProps, ElementsList, Language, LearningArea, LearningBlock } from '@/types';
import { AxiosInstance } from 'axios';
import { inject, Ref, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

const store = useStore();
const $axios : AxiosInstance | undefined = inject("$axios");
const $route = useRoute();
const language : Language = store.state.language
const elements : ElementsList = store.state.elements;
const user_id : string = store.state.user.id;
const learning_block_id = $route.params.id;

let learning_areas : LearningArea[] = [];
const all_courses : {
    [key : string]: CourseCardElements[]
} = {};
const promises = [];
const courses : CardsList = {};
let selected_area : Ref<string>;
let trigger = ref(0);
let learning_block : LearningBlock | undefined;

if ($axios != undefined) {
    learning_block = await $axios.get("/v1/learning_blocks/" + learning_block_id)
        .then(response => new LearningBlock(response.data.data))
        .catch(() => undefined);
    if (learning_block != undefined) {
        learning_areas = await $axios.get("/v1/learning_areas?all_data=true&block_id=" + learning_block_id)
            .then(response => response.data.data)
            .catch(() => []);
        selected_area = ref(learning_areas[1].id);
        for (const learning_area of learning_areas) {
            promises.push($axios.get("/v1/courses?student_id=" + user_id + "&block_id=" + learning_block_id + "&area_id=" + learning_area.id)
                .then(response => all_courses[learning_area.id] = (response.data.data as CourseSummaryProps[])
                    .map(x => (new CourseSummary(x))
                        .toCard(store,(learning_block as LearningBlock),new Date(),"courses/" + x.id + "/" + (x.pending === "true" ? "unscribe" : "inscribe"))))
                .catch(() => all_courses[learning_area.id] = []));
        }
        await Promise.all(promises);
        courses[""] = all_courses[selected_area.value];
        watch(selected_area,(n,o) => {
            courses[""] = all_courses[n];
            trigger.value++;
        })
    }
} else {
    console.error("Connection failed");
}
</script>

<style>
ion-select {
    width: fit-content
}
</style>