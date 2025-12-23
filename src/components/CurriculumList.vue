<template>
  <!-- TODO (5): sistemare questione bocciature sul singolo corso utilizzando il sistema dei collegamenti ad albero/id_corso tra corsi: associare ad ogni corso un corso collegato (automatio tramite modello o manuale), o definire come originale, per poter raggruppare varie versioni di uno stesso corso e considerarle come lo stesso, in modo tale che si possa implementare un sistema per capire se uno studente ha partecipato a quel determinato corso (o ad una delle sue varianti) -->
  <div class="ion-padding-horizontal">
    <ion-modal
      id="grades_manager"
      :is-open="grades_open"
      @didDismiss="closeModal('grades')"
    >
      <suspense>
        <template #default>
          <grades-manager
            :title="grades_title"
            :parameters="grades_parameters"
            @close="closeModal('grades')"
          />
        </template>
        <template #fallback>
          <loading-component />
        </template>
      </suspense>
    </ion-modal>
    <ion-modal
      :is-open="description_open"
      @didDismiss="closeModal('course_details')"
    >
      <suspense>
        <template #default>
          <course-description
            :title="description_title"
            :course_id="description_course_id"
            :learning_session_id="'' + description_learning_session_id"
            :section="description_section"
            @close="closeModal('course_details')"
          />
        </template>
        <template #fallback>
          <loading-component />
        </template>
      </suspense>
    </ion-modal>
    <div class="ion-padding-horizontal">
      <ionic-element
        :element="
          getCustomMessage(
            'progression',
            getCurrentElement('progression'),
            'title'
          )
        "
      />
      <div class="ion-padding-top">
        <template v-if="Array.isArray(credits_progression[selected_context])">
          <ion-list>
            <ion-item>
              <ion-label class="ion-padding-horizontal"
                >{{ getCurrentElement("context_credits") }}:</ion-label
              >
              <ion-label>{{
                castToStringArray(credits_progression[selected_context]).join(
                  "/"
                )
              }}</ion-label>
            </ion-item>
          </ion-list>
        </template>
        <template v-else>
          <ionic-element
            :element="
              getCustomMessage(
                'area_credits',
                getCurrentElement('area_credits'),
                'title'
              )
            "
          />
          <ion-list class="ion-margin-top">
            <ion-item
              v-for="area_progression in Object.keys(
                castToTmpList(credits_progression[selected_context])
              )"
              :key="area_progression"
            >
              <ion-label>{{ getAreaTitle(area_progression) }}:</ion-label>
              <ion-label>{{
                castToTmpList(credits_progression[selected_context])[
                  area_progression
                ].join("/")
              }}</ion-label>
            </ion-item>
          </ion-list>
        </template>
      </div>
    </div>
    <ion-grid>
      <ion-row>
        <ion-col size="auto">
          <custom-select
            v-model:selected_option="selected_year"
            :list="school_years"
            :label="getCurrentElement('school_year') + ':'"
            :aria_label="getCurrentElement('school_year')"
            :placeholder="getCurrentElement('school_year_choice')"
          />
        </ion-col>
        <ion-col size="auto">
          <custom-select
            v-model:selected_option="selected_context"
            :list="learning_contexts"
            :label="getCurrentElement('learning_context') + ':'"
            :aria_label="getCurrentElement('learning_context')"
            :placeholder="getCurrentElement('learning_context_choice')"
            :getCompleteName="getContextAcronym"
          />
        </ion-col>
      </ion-row>
    </ion-grid>
    <suspense>
      <template #default>
        <ionic-table
          :key="trigger"
          :emptiness_message="
            getCustomMessage(
              'emptiness_message',
              getCurrentElement('no_subscriptions'),
              'string',
              undefined,
              {
                label: {
                  align_text_middle: true,
                },
              }
            )
          "
          :data="table_data"
          :first_row="first_row"
          :sizes="column_sizes"
          @signal_event="SetupModalAndOpen()"
        />
      </template>
      <template #fallback>
        <loading-component />
      </template>
    </suspense>
  </div>
</template>

<script setup lang="ts">
import {
  CurriculumCourse,
  CustomElement,
  SingleGradesParameters,
  LearningArea,
  LearningContext,
  Progression,
  AlternateList,
  TmpList,
  User,
  OrderedCardsList,
  GeneralTableCardElements,
} from "@/types";
import {
  executeLink,
  getCurrentElement,
  getCurrentLanguage,
  getCustomMessage,
  getLearningContexts,
} from "@/utils";
import {
  IonModal,
  IonGrid,
  IonRow,
  IonCol,
  IonLabel,
  IonList,
  IonItem,
} from "@ionic/vue";
import { ref, watch } from "vue";
import { useStore } from "vuex";

type availableModal = "grades" | "course_details";

const SetupModalAndOpen = () => {
  const window: availableModal = store.state.event.event;
  switch (window) {
    case "grades":
      grades_title = store.state.event.data.title;
      grades_parameters = store.state.event.data.parameters;
      grades_parameters.show_editable = false;
      grades_open.value = true;
      break;
    case "course_details":
      description_title = store.state.event.data.title;
      description_course_id = store.state.event.data.course_id;
      description_learning_session_id =
        store.state.event.data.learning_session_id;
      description_section = store.state.event.data.section;
      description_open.value = true;
      break;
  }
};
const closeModal = (window: availableModal) => {
  switch (window) {
    case "grades":
      grades_open.value = false;
      break;
    case "course_details":
      description_open.value = false;
  }
};
const getContextAcronym = (option: LearningContext) =>
  option[`${language}_title`];
const getYearCourses = async () => {
  year_courses = {};

  await executeLink(
    "/v2/students/" +
      reference_id +
      "/curriculum?school_year=" +
      selected_year.value, // context_id=" + selected_context.value + "&
    (response) => {
      let tmp_course: CurriculumCourse;

      for (const course of response.data.data) {
        tmp_course = new CurriculumCourse(course);
        if (year_courses[tmp_course.learning_context_id] == undefined) {
          year_courses[tmp_course.learning_context_id] = [];
        }
        year_courses[tmp_course.learning_context_id].push(tmp_course);
      }
    },
    () => []
  );

  courses = year_courses[selected_context.value] ?? [];
};
const updateCorrespondences = async () => {
  await getYearCourses();

  for (const context_courses of Object.values(year_courses)) {
    courses_list = courses_list.concat(context_courses);
  }

  await executeLink(
    "/v1/learning_sessions/correspondence?student_id=" + reference_id,
    (response) => {
      for (const correspondence of response.data.data) {
        if (year_correspondences[selected_year.value] == undefined) {
          year_correspondences[selected_year.value] = {};
        }
        if (
          year_correspondences[selected_year.value][correspondence.course_id] ==
          undefined
        ) {
          year_correspondences[selected_year.value][correspondence.course_id] =
            [];
        }
        year_correspondences[selected_year.value][
          correspondence.course_id
        ].push(correspondence.session_id);
      }
    },
    () => [],
    "post",
    {
      courses: courses_list.map((a: any) => a.id),
    }
  );
};
const updateTable = (
  year_correspondences: any,
  courses: CurriculumCourse[]
) => {
  for (const course of courses) {
    if (year_correspondences[selected_year.value][course.id].length > 0) {
      table_data.cards[""].push(
        course.toTableCard(
          year_correspondences[selected_year.value][course.id][
            year_correspondences[selected_year.value][course.id].length - 1
          ],
          user.id
        )
      );
    }
  }
};
const getAreaTitle = (key: string) => {
  const tmp_area = learning_areas.find((a) => a.id == key);
  return tmp_area != undefined ? tmp_area[`${language}_title`] : "";
};
const castToStringArray = (obj: TmpList<string[]> | string[]) =>
  obj as string[];
const castToTmpList = (obj: TmpList<string[]> | string[]) =>
  obj as TmpList<string[]>;

const store = useStore();
const user = User.getLoggedUser() as User;
const language = getCurrentLanguage();
const props = defineProps({
  student_id: String,
});
const sections_use: boolean = store.state.sections_use;

const year_correspondences: {
  [key: number]: {
    [key: number]: number[];
  };
} = {};
const first_row: CustomElement[] = [
  {
    id: "title",
    type: "string",
    content: getCurrentElement("course"),
  },
  {
    id: "credits",
    type: "string",
    content: getCurrentElement("credits"),
  },
  {
    id: "learning_area",
    type: "string",
    content: getCurrentElement("learning_area"),
  },
  {
    id: "gardes",
    type: "string",
    content: getCurrentElement("grades"),
  },
  {
    id: "final_grade",
    type: "string",
    content: getCurrentElement("final_grade"),
  },
];
const column_sizes = sections_use
  ? ["4", "1", "1", "2", "2", "2"]
  : ["5", "1", "2", "2", "2"];
const grades_open = ref(false);
const description_open = ref(false);
const trigger = ref(0);
const reference_id: string =
  props.student_id != undefined && user.type != "student"
    ? props.student_id
    : "" + user.id;
const credits_progression: AlternateList<string[]> = {};
const selected_year = ref(0);
const selected_context = ref("");
const table_data: OrderedCardsList<GeneralTableCardElements> = {
  order: [],
  cards: {
    "": [],
  },
};

let school_years: any[] = [];
let year_courses: {
  [key: string]: CurriculumCourse[];
} = {};
let courses: CurriculumCourse[] = [];
let grades_title: string;
let grades_parameters: SingleGradesParameters;
let description_title: string;
let description_course_id: number;
let description_learning_session_id: number;
let description_section: string;
let learning_contexts: LearningContext[] = [];
let learning_areas: LearningArea[] = [];
let courses_list: CurriculumCourse[] = [];

if (sections_use) {
  first_row.splice(1, 0, {
    id: "section",
    type: "string",
    content: getCurrentElement("section"),
  });
}

school_years = await executeLink(
  "/v1/ordinary_classes?descending=true&student_id=" + user.id,
  (response) => {
    return response.data.data.map((a: any) => {
      return {
        id: a.school_year,
      };
    });
  },
  () => []
);
learning_contexts = await getLearningContexts(user);
learning_areas = await executeLink(
  "/v1/learning_areas?all_data=true",
  (response) => response.data.data,
  () => []
);

selected_year.value = school_years[0].id;
selected_context.value = learning_contexts[0].id;

await executeLink(
  "/v1/students/" +
    reference_id +
    "/annual_credits?school_year=" +
    selected_year.value,
  (response) => {
    let tmp_context: string, tmp_area: string | null, tmp_status: string[];

    for (const progression of response.data.data as Progression[]) {
      tmp_context = (progression.learning_context_ref.data as { id: string })
        .id;
      tmp_area = (progression.learning_area_ref.data as { id: string | null })
        .id;
      tmp_status = [progression.credits, "" + progression.max_credits];
      if (tmp_area == null) {
        credits_progression[tmp_context] = tmp_status;
      } else {
        if (credits_progression[tmp_context] == undefined) {
          credits_progression[tmp_context] = {};
        }
        (credits_progression[tmp_context] as TmpList<string[]>)[tmp_area] =
          tmp_status;
      }
    }
  }
);

await updateCorrespondences();
updateTable(year_correspondences, courses);
watch(selected_year, async () => {
  await updateCorrespondences();
  table_data.cards[""] = [];
  updateTable(year_correspondences, courses);
  trigger.value++;
});
watch(selected_context, (n) => {
  courses = year_courses[n] ?? [];
  table_data.cards[""] = [];
  updateTable(year_correspondences, courses);
  trigger.value++;
});
</script>

<style scoped>
ion-modal#grades_manager {
  --width: fit-content;
  --height: fit-content;
}
</style>
