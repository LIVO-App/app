<template>
  <!-- Modal header: title + close button -->
  <ion-header>
    <ion-toolbar>
      <ion-grid>
        <ion-row class="ion-text-center ion-align-items-center">
          <ion-col>
            <ionic-element
              :element="getCustomMessage('title', title, 'title')"
            />
          </ion-col>
          <ion-col size="auto">
            <!-- Close action is delegated to the parent component -->
            <ionic-element
              :element="elements.close"
              @signal_event="$emit('close')"
            />
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-toolbar>
  </ion-header>
  <ion-content>
    <ion-grid>
      <ion-row>
        <ion-col>
          <!-- Current project class summary (only available when an origin class exists) -->
          <template v-if="project_class_card != undefined">
            <ionic-element
              :element="
                getCustomMessage(
                  'actual_course',
                  getCurrentElement('actual_course') + ':',
                  'title',
                  colors
                )
              "
            />
            <div>
              <!-- Learning context + learning area of the origin class -->
              <ionic-element
                :element="
                  getCustomMessage(
                    'learning_context_area_title',
                    getCurrentElement('learning_context') +
                      ' - ' +
                      getCurrentElement('learning_area'),
                    'title',
                    colors
                  )
                "
              />
              <ionic-element
                :element="
                  getCustomMessage(
                    'learning_context_area',
                    ': ' +
                      (origin.learning_context != undefined
                        ? origin.learning_context[`${language}_title`]
                        : '') +
                      ' - ' +
                      (origin.learning_area != undefined
                        ? origin.learning_area[`${language}_title`]
                        : ''),
                    'string',
                    colors
                  )
                "
              />
            </div>
            <!-- Project class details rendered from the card content -->
            <div
              :key="element.id"
              v-for="element in project_class_card.content"
            >
              <ionic-element :element="element" />
            </div>
            <div>
              <!-- Credits of the origin course (if available) -->
              <ionic-element
                :element="
                  getCustomMessage(
                    'credits',
                    getCurrentElement('credits'),
                    'title',
                    colors
                  )
                "
              />
              <ionic-element
                :element="
                  getCustomMessage(
                    'credits',
                    ': ' +
                      (origin.course != undefined ? origin.course.credits : ''),
                    'string',
                    colors
                  )
                "
              />
            </div>
          </template>
        </ion-col>
      </ion-row>
      <ion-row class="">
        <ion-col>
          <hr style="border-top: 1px solid var(--ion-color-black)" />
          <!-- Constraints overview (remaining credits + group constraints) -->
          <ionic-element
            :element="
              getCustomMessage(
                'constraints',
                getCurrentElement('constraints').toUpperCase(),
                'title',
                colors
              )
            "
          />
        </ion-col>
      </ion-row>
      <ion-row>
        <ion-col>
          <!-- Remaining credits breakdown (rendered as HTML list) -->
          <ionic-element
            :element="
              getCustomMessage(
                'student_credits',
                getCurrentElement('credits'),
                'title',
                colors
              )
            "
          />
          <div v-html="credits_list"></div>
        </ion-col>
        <ion-col>
            <!-- Remaining group slots breakdown (rendered as HTML list) -->
          <ionic-element
            :element="
              getCustomMessage(
                'student_groups',
                getCurrentElement('groups_courses'),
                'title',
                colors
              )
            "
          />
          <div v-html="groups_list"></div>
        </ion-col>
      </ion-row>
      <ion-row>
        <ion-col>
          <hr style="border-top: 1px solid var(--ion-color-black)" />
          <!-- Destination selection (learning context + learning area) -->
          <ionic-element
            :element="
              getCustomMessage(
                'choice',
                getCurrentElement('project_class_movement_choice'),
                'title',
                colors,
                {
                  label: {
                    'ion-padding-top': true,
                    'ion-padding-start': true,
                  },
                }
              )
            "
          />
        </ion-col>
      </ion-row>
      <ion-row>
        <ion-col size="auto">
          <!-- First selector: learning context -->
          <custom-select
            v-model:selected_option="selected_context"
            :list="learning_contexts"
            :label="getCurrentElement('learning_context') + ':'"
            :aria_label="getCurrentElement('learning_context')"
            :placeholder="getCurrentElement('learning_context_choice')"
            :getCompleteName="getContextAcronym"
          />
        </ion-col>
        <ion-col size="auto">
          <!-- Second selector: learning area (depends on the selected context) -->
          <custom-select
            v-model:selected_option="selected_area"
            :list="learning_areas_structures.distribution[selected_context]"
            :label="learning_area_sentence + ':'"
            :aria_label="learning_area_sentence"
            :placeholder="placeholder"
            :getCompleteName="getCorrectName"
          />
        </ion-col>
      </ion-row>
      <ion-row>
        <ion-col :key="trigger">
          <div>
            <!-- TODO (4): aggiungere visualizzazione personalizzata per tutor -->
            <!-- Courses table: subscriptions manager filtered by selected context/area -->
            <ionic-table
              :key="trigger"
              :emptiness_message="
                getCustomMessage(
                  'emptiness_message',
                  getCurrentElement('no_courses'),
                  'string',
                  colors,
                  {
                    label: {
                      align_text_middle: true,
                    },
                  }
                )
              "
              :data="props.subscriptions_manager.courses"
              :first_row="first_row"
              :sizes="column_sizes"
              @signal_event="
                // When moving a student, store the origin class so the parent can submit a move payload.
                if (
                  subscriptions_manager.mode == SubscriptionsManagerMode.MOVE &&
                  project_class != undefined
                ) {
                  store.state.event.data.from = {
                    course_id: project_class.course_id,
                    session_id: project_class.learning_session.id,
                  };
                }
                $emit('signal_event');
              "
            />
          </div>
        </ion-col>
      </ion-row>
    </ion-grid>
  </ion-content>
</template>

<script setup lang="ts">
/**
 * @displayName ProjectClassSelector
 * @description
 * Modal-like selector used to choose a destination **project class** (and related
 * enrollment choices) for a student.
 *
 * It visualizes the selected class, learning contexts/areas, remaining credits and
 * course groups using `SubscriptionsManager`, and emits events to drive the parent
 * workflow (e.g. confirmation, close, errors).
 */
import {
  ProjectClassSummary,
  Colors,
  EnrollmentCardElements,
  CourseReferences,
  EnrollmentCourse,
  EnrollmentCourseProps,
  CustomElement,
  SubscriptionsManager,
  LearningContext,
  LearningSession,
  LearningArea,
  LearningAreasStructures,
  OrdinaryClassSummary,
  TmpList,
  UserSummary,
  SubscriptionsManagerMode,
  CustomSubElements,
  GeneralSubElements,
} from "@/types";
import {
  executeLink,
  getContextAcronym,
  getCurrentElement,
  getCurrentLanguage,
  getCustomMessage,
  getCssColor,
  getIcon,
  getLearningAreasStructures,
  getLearningContexts,
} from "@/utils";
import {
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonRow,
  IonToolbar,
} from "@ionic/vue";
import { PropType, Ref, ref, watch } from "vue";
import { useStore } from "vuex";

/**
 * Returns the localized title for a learning area option.
 *
 * The option can come from a distribution list, so we resolve it against the
 * canonical `learning_areas_structures.list` when possible.
 */
const getCorrectName = (option: LearningArea) => {
  const language = getCurrentLanguage();

  const tmp_learning_area = learning_areas_structures.list.find(
    (a) => a.id == option.id
  );

  return tmp_learning_area != undefined
    ? tmp_learning_area[`${language}_title`]
    : "";
};

/**
 * Builds an HTML string describing remaining credits.
 *
 * Rendering is done via `v-html`, so this returns markup rather than a Vue tree.
 * The output uses inline color styling to match the current `colors` palette.
 */
const getCreditsList = () => {
  //<!-- TODO (7): Vedere se unire con getSessionList
  let list = "";
  let credits_per_context: TmpList<number>;

  for (const context of learning_contexts) {
    list +=
      "<div><label" +
      (colors.text != undefined
        ? " style='color: " + getCssColor(colors.text) + "'"
        : "") +
      "><b>" +
      context[`${language}_title`] +
      ":</b>";
    if (context.credits != undefined) {
      list +=
        " " +
        (context.credits -
          (props.subscriptions_manager.remaing_credits[context.id] as number)) +
        "/" +
        context.credits +
        "</label>";
    } else {
      list +=
        "</label><ul class='ion-no-margin'" +
        (colors.text != undefined
          ? " style='color: " + getCssColor(colors.text) + "'"
          : "") +
        ">";
      for (const area of learning_areas_structures.list) {
        if (area.credits != undefined) {
          credits_per_context =
            (props.subscriptions_manager.remaing_credits[
              context.id
            ] as TmpList<number>) ?? {};
          list +=
            "<li>" +
            area[`${language}_title`] +
            ": " +
            (area.credits - credits_per_context[area.id]) +
            "/" +
            area.credits +
            "</li>";
        }
      }
      list += "</ul>";
    }
    list += "</div>";
  }

  return list;
};

/**
 * Builds an HTML string describing remaining group constraints.
 *
 * Depending on whether the context has global credits or per-area credits,
 * the list is either flat (by group) or nested (area -> group).
 */
const getGroupsList = () => {
  let list = "";
  let group_remaining_courses: TmpList<number>;
  let groups: string[];

  for (const context of learning_contexts) {
    list +=
      "<div><label" +
      (colors.text != undefined
        ? " style='color: " + getCssColor(colors.text) + "'"
        : "") +
      "><b>" +
      context[`${language}_title`] +
      ":</b></label><ul class='ion-no-margin'" +
      (colors.text != undefined
        ? " style='color: " + getCssColor(colors.text) + "'"
        : "") +
      ">";
    if (context.credits != undefined) {
      group_remaining_courses =
        props.subscriptions_manager.getGroupRemainingCourses(context.id);
      groups = Object.keys(group_remaining_courses);
      for (const group of groups) {
        list +=
          "<li>" +
          group +
          ": " +
          (store.state.courses_per_group - group_remaining_courses[group]) +
          "/" +
          store.state.courses_per_group +
          "";
      }
    } else {
      for (const area of learning_areas_structures.list) {
        group_remaining_courses =
          props.subscriptions_manager.getGroupRemainingCourses(
            context.id,
            area.id
          );
        groups = Object.keys(group_remaining_courses);
        list +=
          "<li><label>" +
          area[`${language}_title`] +
          ":</label>" +
          "<ul class='ion-no-margin'>";
        for (const group of groups) {
          list +=
            "<li>" +
            group +
            ": " +
            (store.state.courses_per_group - group_remaining_courses[group]) +
            "/" +
            store.state.courses_per_group +
            "";
        }
        list += "</ul></li>";
      }
    }
    list += "</ul></div>";
  }

  return list;
};

/**
 * Updates the learning-area select placeholder based on the selected context.
 *
 * If the context has no areas available, the placeholder becomes an explicit
 * "no learning areas" message.
 */
const updateLearningAreaPlaceholder = (context_id: string) => {
  placeholder =
    learning_areas_structures.distribution[context_id].length > 0
      ? getCurrentElement("select") +
        (language == "italian" ? " l'" : " the ") +
        learning_area_sentence
      : getCurrentElement("no_learning_areas"); //<!-- TODO (4): sistemare (qui e nelle altre funzioni updateLearningAreaPlaceholder) quando verrà messa la lista parametri a getCurrentElement
};

const store = useStore();
const language = getCurrentLanguage();

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  student_id: {
    type: Number,
    required: true,
  },
  ordinary_class: {
    type: Object as PropType<OrdinaryClassSummary>,
    required: true,
  },
  learning_sessions: Array<LearningSession>,
  project_class: Object as PropType<ProjectClassSummary>,
  learning_session: Object as PropType<LearningSession>,
  section: {
    type: String,
    required: true,
  },
  subscriptions_manager: {
    type: Object as PropType<SubscriptionsManager>,
    required: true,
  },
});
const emit = defineEmits(["signal_event", "close", "error", "no_courses"]);

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
};
const first_row: CustomElement[] = [
  {
    id: "group",
    type: "string",
    content: getCurrentElement("group"),
  },
  {
    id: "credits",
    type: "string",
    content: getCurrentElement("credits"),
  },
  {
    id: "course",
    type: "string",
    content: getCurrentElement("course"),
  },
];
const colors: Colors<GeneralSubElements> = {
  text: {
    name: "primary",
    type: "var",
  },
};
const column_sizes = store.state.sections_use
  ? ["2", "2", "5", "2", "1"]
  : ["2", "2", "6", "2"];
const project_class_card =
  props.project_class != undefined
    ? props.project_class.toCard(undefined, props.section, false, true)
    : undefined;
const learning_sessions: LearningSession[] =
  props.learning_sessions ??
  (props.project_class != undefined
    ? await executeLink(
        "/v1/learning_sessions?year_of=" +
          props.project_class.learning_session.id,
        (response) =>
          response.data.data.map((a: any) => new LearningSession(a)),
        () => []
      )
    : []);
const origin: {
  references: CourseReferences | undefined;
  course: EnrollmentCardElements | undefined;
  learning_context: LearningContext | undefined;
  learning_area: LearningArea | undefined;
} = {
  references: undefined,
  course: undefined,
  learning_context: undefined,
  learning_area: undefined,
};
const student = new UserSummary({
  id: props.student_id,
  user: "student",
});
const learning_area_sentence = getCurrentElement("learning_area");
const trigger = ref(0);
const tmp_courses: EnrollmentCourse[] = [];

let actual_learning_session: LearningSession,
  learning_contexts: LearningContext[],
  learning_areas_structures: LearningAreasStructures,
  selected_context: Ref<string>,
  selected_area: Ref<string>;
let credits_list = "";
let groups_list = "";
let confirmed_courses = false;
let placeholder = getCurrentElement("no_learning_areas");

if (props.project_class != undefined || props.learning_session != undefined) {
  // Resolve the active learning session (either from project_class or direct prop).
  actual_learning_session =
    props.project_class != undefined
      ? props.project_class.learning_session
      : (props.learning_session as LearningSession);
  learning_contexts = await getLearningContexts(
    student,
    "" + actual_learning_session.id
  ); //<!-- TODO (6): rendere id tutti dello stesso tipo (es. tutti stringa)
  learning_areas_structures = await getLearningAreasStructures(
    learning_contexts,
    "" + actual_learning_session.id
  );
  selected_context = ref(
    learning_contexts.length > 0 ? learning_contexts[0].id : ""
  );
  selected_area = ref(
    learning_areas_structures.distribution[selected_context.value].length > 0
      ? learning_areas_structures.distribution[selected_context.value][0].id
      : ""
  );

  if (project_class_card != undefined) {
    project_class_card.colors = colors as Colors<CustomSubElements>;
    for (const element of project_class_card.content as CustomElement[]) {
      element.colors = colors as Colors<CustomSubElements>;
    }
  }
  if (
    learning_contexts.length > 0 &&
    learning_areas_structures.list.length > 0
  ) {
    // Configure table columns: optional section column + action column.
    if (store.state.sections_use) {
      first_row.push({
        id: "section",
        type: "string",
        content: getCurrentElement("section"),
      });
    }
    first_row.push({
      id: "move_student",
      type: "string",
      content: "",
    });

    await executeLink(
      "/v2/courses?student_id=" +
        props.student_id +
        "&session_id=" +
        actual_learning_session.id,
      (response) => {
        let tmp_course: EnrollmentCourse;
        for (const course_props of response.data
          .data as EnrollmentCourseProps[]) {
          course_props.section = "A"; //<!-- TODO (4): gestione sezioni dinamica
          tmp_course = new EnrollmentCourse(course_props);
          if (tmp_course.final_confirmation == null) {
            tmp_courses.push(tmp_course);
          } else {
            confirmed_courses = true;
          }
        }
      },
      () => []
    );

    if (tmp_courses.length > 0) {
      // Load all subscription constraints and render the initial filtered courses list.
      await props.subscriptions_manager.loadParameters(
        student,
        props.ordinary_class,
        learning_contexts,
        learning_areas_structures.list,
        learning_sessions,
        tmp_courses,
        "" + actual_learning_session.id
      );
      props.subscriptions_manager.showCourses(
        selected_context.value,
        selected_area.value,
        props.project_class != undefined
          ? ["" + props.project_class.course_id]
          : undefined
      );
      if (props.project_class != undefined) {
        origin.references = props.subscriptions_manager.getCourseReferences(
          "" + props.project_class.course_id
        );
        origin.course =
          origin.references != undefined &&
          typeof origin.references.indexes.index == "number"
            ? props.subscriptions_manager.all_courses[
                origin.references.learning_context_id
              ][origin.references.learning_area_id][
                origin.references.indexes.index
              ]
            : undefined;
        origin.learning_context = learning_contexts.find(
          (a) => a.id == origin.references?.learning_context_id
        );
        origin.learning_area = learning_areas_structures.list.find(
          (a) => a.id == origin.references?.learning_area_id
        );
      }

      credits_list = getCreditsList();
      groups_list = getGroupsList();

      updateLearningAreaPlaceholder(selected_context.value);
      watch(selected_area, async (new_area) => {
        // Area change only updates the visible courses list.
        props.subscriptions_manager.showCourses(
          selected_context.value,
          new_area,
          props.project_class != undefined
            ? ["" + props.project_class.course_id]
            : undefined
        );
        trigger.value++;
      });
    } else {
      store.state.event = {
        event: "no_courses",
        data: {
          message: confirmed_courses
            ? getCurrentElement("all_project_classes_confirmed")
            : getCurrentElement("no_courses"),
        },
      };
      emit("signal_event");
    }
  }
  watch(selected_context, async (new_context) => {
    // Context change updates placeholder, resets area, then refreshes visible courses.
    updateLearningAreaPlaceholder(new_context);
    selected_area.value =
      learning_areas_structures.distribution[new_context].length > 0
        ? learning_areas_structures.distribution[new_context][0].id
        : "";
    if (tmp_courses.length > 0) {
      props.subscriptions_manager.showCourses(
        new_context,
        selected_area.value,
        props.project_class != undefined
          ? ["" + props.project_class.course_id]
          : undefined
      );
    }
    trigger.value++;
  });
} else {
  store.state.event = {
    event: "error",
  };
  emit("signal_event");
}
</script>

<style></style>
