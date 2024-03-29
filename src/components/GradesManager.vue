<template>
  <ion-modal :keep-contents-mounted="true">
    <ion-datetime :key="edit_trigger" id="datetime" @ion-change="changeData" :first-day-of-week="1"
      :max="end_of_day.toISOString()" hour-cycle="h23" :locale="getLocale()" :show-clear-button="true"
      :clear-text="getCurrentElement('clear')" :value="date_value" />
  </ion-modal>
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
  <ion-grid>
    <ion-row>
      <ion-col :key="actual_final_grade_index !== -1 ? edit_trigger + '_grades' : undefined"
        :size="(parameters.teacher_id != undefined && table_data.length != 0 && actual_final_grade_index === -1) || edit_mode ? '7' : '12'">
        <template v-if="table_data.length > 0">
          <ionic-table :key="store.state.triggers.grades" :data="table_data" :first_row="first_row"
            :column_sizes="column_sizes" @signal_event="() => {
              if (store.state.event.event == 'edit_grade') {
                setupEditMode();
              } else {
                $emit('signal_event')
              }
            }" />
          <div class="ion-text-center ion-padding-bottom">
            <ion-text color="primary">{{ getCurrentElement("intermediate_arithmetic_mean") }}{{ actual_final_grade_index
              != -1 ? " (" +
              getCurrentElement("no_final_grade").toLowerCase() + ")" : "" }}:
              {{ mean }}</ion-text>
          </div>
        </template>
        <template v-else>
          <div class="ion-text-center ion-padding">
            <ionic-element :element="getCustomMessage(
              'emptiness_message',
              getCurrentElement('no_grades'),
              'string',
              colors
            )
              " />
          </div>
        </template>
      </ion-col>
      <ion-col :key="edit_trigger + '_parameters'" :size="table_data.length == 0 ? '12' : '5'"
        v-if="(parameters.teacher_id != undefined && parameters.associated_teacher === false && actual_final_grade_index === -1) || edit_mode">
        <div class="ion-padding-bottom">
          <div class="ion-padding-bottom">
            <ionic-element :element="getCustomMessage(
              'description',
              getCurrentElement('grade_' + (edit_mode ? 'edit' : 'insertion')),
              'title',
              colors
            )
              " />
          </div>
          <div>
            <ionic-element :element="getCustomMessage(
              'description',
              getCurrentElement('description'),
              'string',
              colors
            )
              " />
            <!-- TODO (5): mettere EditorWrapper -->
            <ion-textarea v-for="language in languages" :key="language" :auto-grow="true"
              v-model="descriptions[`${language}_description`]" :label="getCurrentElement(language)"
              :aria-label="getCurrentElement(language)" fill="outline" class="ion-margin-vertical" />
          </div>
          <hr class="ion-margin-top" style="border-bottom: 1px solid var(--ion-color-medium)" />
          <div>
            <ion-item style="width: fit-content;" lines="none">
              <ion-label :aria-label="getCurrentElement('date')" color="primary"
                style="color: var(--ion-color-primary)">{{ getCurrentElement("date") }}</ion-label>
              <ion-datetime-button datetime="datetime" style="width: fit-content;" class="ion-padding-start" />
            </ion-item>
            <ion-input type="number" v-model="grade" :label="getCurrentElement('grade')"
              :aria-label="getCurrentElement('grade')" color="black" style="color: var(--ion-color-primary)"
              fill="outline" class="ion-margin-vertical" @ion-input="() => {
                if (isNaN(getGradeNumber(grade))) {
                  grade = grade.substring(0, grade.length - 1);
                }
              }" />
            <div style="width: fit-content;">
              <ion-label position="floating" :aria-label="getCurrentElement('final_grade')" color="primary"
                style="color: var(--ion-color-primary)" class="ion-padding-horizontal">{{ getCurrentElement("final_grade")
                }}</ion-label>
              <ion-checkbox :disabled="edit_mode" v-model="final" :aria-label="getCurrentElement('final_grade')" />
            </div>
          </div>
          <!-- TODO (4): controllare perchè non funziona nella tabella e mettere popup "Sei sicuro?" -->
        </div>
        <div class="ion-text-center">
          <template v-if="edit_mode">
            <ion-button @click="() => {
              let actual_grade = checkGradesParameters(descriptions, grade, date);
              let grade_props: GradeProps;

              if (actual_grade != undefined) {
                grade_props = {
                  id: store.state.event.data.id,
                  publication: date != undefined ? date.toISOString() : (date_value ?? to_edit.publication.toISOString()),
                  italian_description: '',
                  english_description: '',
                  grade: actual_grade,
                  final: final ? 1 : 0,
                };
                languages.forEach(a => grade_props[`${a}_description`] = descriptions[`${a}_description`]);
                store.state.event.data.new_grade = new Grade(grade_props);
              }
              $emit('signal_event');
            }">
              {{ getCurrentElement("edit") }}
            </ion-button>
            <ion-button @click="setupEditMode(true)">
              {{ getCurrentElement("cancel") }}
            </ion-button>
          </template>
          <ion-button v-else @click="() => {
            let actual_grade = checkGradesParameters(descriptions, grade, date);

            if (actual_grade != undefined) {
              store.state.event = {
                event: 'add_grade',
                data: {
                  ...parameters,
                  ...descriptions,
                  publication_date: date != undefined ? date.toISOString() : undefined,
                  grade: actual_grade,
                  final: final,
                },
                method: 'post',
              };
              $emit('signal_event');
              $emit('close');
            } else {
              $emit('signal_event');
            }
          }">
            {{ getCurrentElement("insert_grade") }}
          </ion-button>
        </div>
      </ion-col>
    </ion-row>
  </ion-grid>
</template>

<script setup lang="ts">
import {
  CustomElement,
  Grade,
  GradeProps,
  GradesParameters,
  Language,
  Colors,
  GeneralSubElements,
  User,
} from "@/types";
import {
  executeLink,
  getAviableLanguages,
  getCurrentElement,
  getCustomMessage,
  getIcon,
  getLocale,
  getGradeNumber,
  checkGradesParameters
} from "@/utils";
import {
  IonHeader,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonLabel,
  IonInput,
  IonCheckbox,
  IonButton,
  IonTextarea,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  DatetimeCustomEvent,
  IonItem,
} from "@ionic/vue";
import { PropType, reactive, Ref, ref, watch } from "vue";
import { useStore } from "vuex";

const changeData = (event: DatetimeCustomEvent) => {
  const tmp_str_date = event.target.value;

  let tmp_date: Date;

  if (typeof tmp_str_date == "string") {
    tmp_date = new Date(tmp_str_date);
    if (tmp_date <= end_of_day) {
      date = tmp_date;
    } else {
      date = undefined;
    }
  } else {
    date = undefined;
  }
}
const setGradesTable = async (empty = true) => {
  let tmp_mean = 0;

  actual_final_grade_index = props.parameters.final_grade_index ?? -1;
  if (empty) {
    setupEditMode(true);
  }
  table_data = [];
  if (props.grades != undefined) {
    actual_grades = props.grades;
  } else {
    actual_grades = await executeLink(
      "/v1/students/" +
      props.parameters.student_id +
      "/grades?course_id=" +
      props.parameters.course_id +
      "&session_id=" +
      props.parameters.session_id +
      (props.parameters.teacher_id != undefined
        ? "&teacher_id=" + props.parameters.teacher_id
        : ""),
      (response) =>
        response.data.data.map((a: GradeProps) => new Grade(a)),
      () => []
    );
  }

  column_sizes = props.parameters.associated_teacher === false
    && (actual_final_grade_index == -1
      || (actual_grades[actual_final_grade_index] != undefined
        && actual_grades[actual_final_grade_index].isEditable())) ? [6, 2, 2, 1, 1] : [6, 3, 3];

  for (const grade_index in actual_grades) {
    final_grade_pubblication = actual_final_grade_index != -1 && actual_grades[actual_final_grade_index] != undefined
      ? actual_grades[actual_final_grade_index].publication
      : actual_grades[grade_index].final
        ? actual_grades[grade_index].publication
        : undefined;

    table_data.push(actual_grades[grade_index].toTableRow(
      props.parameters.associated_teacher ?? false,
      user.id, props.parameters.student_id,
      final_grade_pubblication));

    if (!actual_grades[grade_index].final) {
      tmp_mean += actual_grades[grade_index].grade;
    } else {
      actual_final_grade_index = parseInt(grade_index);
    }
  }

  if (actual_grades.length > 1) {
    mean = (tmp_mean / (actual_grades.length - (actual_final_grade_index != -1 ? 1 : 0))).toFixed(2);
  } else if (actual_grades.length == 1 && actual_final_grade_index == -1) {
    mean = actual_grades[0].grade.toFixed(2);
  } else {
    mean = "-";
  }
}
const setupEditMode = (empty = false) => {
  to_edit = actual_grades[actual_grades.findIndex(a => a.id == store.state.event.data.id)];
  for (const description of Object.keys(descriptions)) {
    descriptions[description as keyof typeof descriptions] = empty ? "" : to_edit[description];
  }
  date_value = empty ? undefined : to_edit.publication.toISOString();
  grade.value = "" + (empty ? "" : to_edit.grade);
  final.value = empty ? false : to_edit.final;
  edit_trigger.value++;
  edit_mode = empty ? false : true;
}

const store = useStore();
const languages = getAviableLanguages();
const user = User.getLoggedUser() as User;

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  parameters: {
    type: Object as PropType<GradesParameters>,
    required: true,
  },
  grades: Array<Grade>,
});
defineEmits(["signal_event", "close"]);

const elements: {
  [key: string]: CustomElement;
} = {
  close: {
    id: "close",
    type: "icon",
    linkType: "event",
    content: {
      event: "close",
      icon: getIcon("close"),
    },
  },
  title: {
    id: "title",
    type: "title",
    content: props.title,
  },
};
const first_row: CustomElement[] = [
  {
    id: "description",
    type: "string",
    content: getCurrentElement("description"),
  },
  {
    id: "date",
    type: "string",
    content: getCurrentElement("date"),
  },
  {
    id: "evaluation",
    type: "string",
    content: getCurrentElement("evaluation"),
  }
];
const descriptions: {
  [key in keyof Language as `${Language}_description`]: string;
} = reactive({
  italian_description: "",
  english_description: "",
});
const grade: Ref<string> = ref("");
const final: Ref<boolean> = ref(false);
const colors: Colors<GeneralSubElements> = {
  text: {
    name: "primary",
    type: "var",
  },
};
const edit_trigger = ref(0);
const end_of_day = new Date();
end_of_day.setHours(23, 59, 59, 999);

let table_data: CustomElement[][] = [];
let mean = "";
let date: Date | undefined = undefined;
let actual_grades: Grade[] = [];
let actual_final_grade_index: number;
let column_sizes: number[];
let final_grade_pubblication: Date | undefined;
let edit_mode = false;
let date_value: string | undefined;
let to_edit: Grade;

if (props.parameters.associated_teacher === false) {
  first_row.push({
    id: "edit",
    type: "string",
    content: "",
  },
    {
      id: "remove",
      type: "string",
      content: "",
    });
}

await setGradesTable();
watch(() => store.state.triggers.grades, () => {
  setGradesTable(); //<!-- TODO (5): guardare se fa richieste per niente quando viene eliminato un voto o simile (dato che ha già la roba sistemata), valutando ache aggiornamenti da altri professori (cosa simile in project class)
});
watch(() => store.state.triggers.edit_grades, () => {
  setGradesTable(true);
});
</script>

<style scoped>
ion-textarea {
  --color: var(--ion-color-primary);
  --placeholder-color: var(--ion-color-primary);
}
</style>