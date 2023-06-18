<template>
    <ion-header>
        <ion-toolbar>
            <ion-grid>
                <ion-row class="ion-text-center ion-align-items-center">
                    <ion-col>
                        <ionic-element :element="elements.title"></ionic-element>
                    </ion-col>
                    <ion-col size="auto">
                        <ionic-element :element="elements.close" @signal_event="$emit('close')"></ionic-element>
                    </ion-col>
                </ion-row>
            </ion-grid>
        </ion-toolbar>
    </ion-header>
    <template v-if="tableData.length > 0">
        <ionic-table :data="tableData" :first_row="first_row" :column_sizes="column_sizes"></ionic-table>
        <div class="ion-text-center ion-padding-bottom">
            <ion-text color="primary">{{ getCurrentElement(store,"arithmetic_mean") }}: {{ mean }}</ion-text>
        </div>
    </template>
    <template v-else>
        <div class="ion-text-center ion-padding">
            <ion-text color="primary">{{ getCurrentElement(store,"no_grades") }}</ion-text>
        </div>
    </template>
    <div v-if="parameters.teacher_id != undefined && final === false" class="ion-padding">
        <div class="ion-padding-bottom">
            <ion-title color="primary">{{ getCurrentElement(store,"grade_insertion") }}</ion-title>
            <ion-input type="text" v-model="description" :label="getCurrentElement(store,'description')" :aria-label="getCurrentElement(store,'description')" color="primary" style="color: var(--ion-color-primary);" fill="outline" class="ion-margin-vertical"></ion-input><!--Da sistemare: mettere italiano e inglese-->
            <ion-input type="number" v-model="grade" :label="getCurrentElement(store,'grade')" :aria-label="getCurrentElement(store,'grade')" color="primary" style="color: var(--ion-color-primary);" fill="outline" class="ion-margin-bottom"></ion-input>
            <ion-label position="floating" :aria-label="getCurrentElement(store,'final_grade')" color="primary" style="color: var(--ion-color-primary);">{{ getCurrentElement(store,"final_grade") }}</ion-label>
            <ion-checkbox v-model="final_grade" :aria-label="getCurrentElement(store,'final_grade')" class="ion-padding-start"></ion-checkbox>
        </div>
        <div class="ion-text-center">
            <ion-button @click="() => {
                store.state.request = {
                    url: '/v1/students/' + parameters.student_id + '/grades?teacher_id=' + parameters.teacher_id + '&course_id=' + parameters.course_id + '&block_id=' + parameters.block_id + '&ita_description=' + description + '&eng_description=' + description + '&grade=' + grade + '&final=' + final_grade + '&token=' + user.token,
                    method: 'post',
                };
                $emit('execute_link');
                $emit('close');
            }">
                {{ getCurrentElement(store,"insert_grade") }}
            </ion-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { CustomElement, Grade, GradeProps, GradesParameters } from "@/types";
import { executeLink, getCurrentElement, getIcon } from "@/utils";
import { IonHeader, IonToolbar, IonGrid, IonRow, IonCol, IonText, IonTitle, IonItem, IonLabel, IonInput, IonCheckbox, IonButton } from "@ionic/vue";
import { AxiosInstance } from "axios";
import { inject, PropType, Ref, ref } from "vue";
import { useStore } from "vuex";

const store = useStore();
const $axios : AxiosInstance | undefined = inject("$axios");
const user = store.state.user;

const props = defineProps({
    "title": {
        type: String,
        required: true
    },
    "parameters": {
        type: Object as PropType<GradesParameters>,
        required: true
    }
});
defineEmits(["execute_link","close"]);

const elements : {
    [key: string]: CustomElement
} = {
    "close": {
        id: "close",
        type: "icon",
        linkType: "event",
        content: {
            event: "close",
            icon: getIcon(store,"close")
        }
    },
    "title": {
        id: "title",
        type: "title",
        content: props.title
    }
};
const first_row : CustomElement[] = [{
    id: "description",
    type: "string",
    content: getCurrentElement(store,"description")
},{
    id: "date",
    type: "string",
    content: getCurrentElement(store,"date")
},{
    id: "evaluation",
    type: "string",
    content: getCurrentElement(store,"evaluation")
}];
const column_sizes = [6,3,3];
const tableData : CustomElement[][] = [];
const final = ref(false);
const grades : Grade[] = await executeLink($axios,"/v1/students/" + props.parameters.student_id + "/grades?course_id=" + props.parameters.course_id + "&block_id=" + props.parameters.block_id + (props.parameters.teacher_id != undefined ? "&teacher_id=" + props.parameters.teacher_id : ""),
    response => response.data.data.map((a : GradeProps) => {
        const tmp_grade = new Grade(a);
        if (tmp_grade.final) {
            final.value = true;
        }
        tableData.push(tmp_grade.toTableRow(store));
        return tmp_grade;
    }),
    () => []);

const description : Ref<string> = ref("");
const grade : Ref<number> = ref(0);
const final_grade : Ref<boolean> = ref(false);

let tmp_mean = 0;
let mean = ""; //(grades.reduce((p,c) => p + c.grade,0) / grades.length).toFixed(2);

for (const grade of grades) {
    if (!grade.final) {
        tmp_mean += grade.grade;
    }
}
mean = tmp_mean.toFixed(2);
</script>

<style>

</style>