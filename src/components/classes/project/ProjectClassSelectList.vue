<template>
  <!-- Global alert used for success/error feedback (export and generic actions) -->
  <ion-alert
    :is-open="alert_open"
    :header="alert_information.title"
    :message="alert_information.message"
    :buttons="alert_information.buttons"
    @didDismiss="closeModal('success')"
  />

  <!-- Modal: course details (opened from a proposition/course card event) -->
  <ion-modal
    :is-open="description_open"
    @didDismiss="closeModal('course_details')"
  >
    <suspense>
      <template #default>
        <course-description
          :title="description_title"
          :course_id="description_course_id"
          :learning_session_id="learning_session_id"
          @close="closeModal('course_details')"
        />
      </template>
      <template #fallback>
        <loading-component />
      </template>
    </suspense>
  </ion-modal>

  <!-- Two-column picker: left chooses a learning session, right shows courses/propositions for that selection -->
  <ion-grid
    ><!-- v-if="learning_sessions.loaded">-->
    <ion-row v-if="$route.name != 'open_day_courses'">
      <ion-col>
        <!-- Export button: downloads a CSV of non-confirmed propositions (not shown in open-day flow) -->
        <ionic-element
          :element="
            getCustomMessage(
              'export_description',
              getCurrentElement('non_confirmed_export') + ':',
              'string',
              undefined,
              {
                label: {
                  'ion-padding': true,
                },
              }
            )
          "
        />
        <ionic-element
          :element="buttons[0]"
          @execute_link="exportPropositions"
        />
      </ion-col>
    </ion-row>
    <ion-row>
      <ion-col size="12" size-md="6">
        <!-- Left list: available learning sessions grouped by school year -->
        <list-card
          :title="
            getCustomMessage('title', getCurrentElement('learning_sessions'))
          "
          :emptiness_message="
            getCustomMessage(
              'emptiness_message',
              getCurrentElement('no_sessions')
            )
          "
          :cards_list="learning_sessions_cards"
          :colors="{
            hover: {
              name: 'light',
              alpha: 0.14,
              type: 'var',
            },
            list_borders: {
              name: 'black',
              type: 'var',
              alpha: 0.25,
            },
          }"
          @signal_event="changeSelection()"
        />
      </ion-col>
      <ion-col size="12" size-md="6">
        <!-- Right selector: proposition type (or learning context in open-day courses flow) -->
        <custom-select
          v-model:selected_option="selected_option"
          :list="options"
          :label="
            getCurrentElement(
              $route.name == 'open_day_courses'
                ? 'learning_contexts'
                : 'propositions'
            ) + ':'
          "
          :aria_label="
            getCurrentElement(
              $route.name == 'open_day_courses' ? 'courses' : 'propositions'
            )
          "
          :placeholder="
            getCurrentElement(
              is_nothing_selected()
                ? $route.name == 'open_day_courses'
                  ? 'learning_context_choice'
                  : 'propositions_type_choice'
                : $route.name == 'open_day_courses'
                ? 'no_learning_contexts'
                : 'no_types_propositions'
            )
          "
          :getCompleteName="(option: any) => option.title"
        />

        <!-- Right list: propositions/courses for the selected learning session and option -->
        <list-card
          :key="trigger"
          :emptiness_message="
            getCustomMessage(
              'emptiness_message',
              getCurrentElement(
                is_nothing_selected()
                  ? selected_option == 'project_classes'
                    ? 'project_classes_propositions_selection_message'
                    : $route.name == 'open_day_courses'
                    ? 'courses_selection_message'
                    : 'courses_propositions_selection_message'
                  : $route.name == 'open_day_courses'
                  ? 'no_courses'
                  : 'no_propositions'
              )
            )
          "
          :cards_list="
            $route.name == 'open_day_courses' ? courses : propositions
          "
          :colors="{
            hover: {
              name: 'light',
              alpha: 0.14,
              type: 'var',
            },
            list_borders: {
              name: 'black',
              type: 'var',
              alpha: 0.25,
            },
          }"
          @signal_event="setupModalAndOpen()"
        />
      </ion-col>
    </ion-row>
  </ion-grid>
</template>

<script setup lang="ts">
/**
 * @displayName ProjectClassSelectList
 * @description
 * Selection screen for choosing a **learning session** and then browsing related
 * propositions/classes.
 *
 * It supports:
 * - navigating the available learning sessions,
 * - listing propositions grouped by status,
 * - optionally showing course details in a modal,
 * - exporting non-confirmed data for reporting.
 */
import {
  GeneralCardElements,
  OrderedCardsList,
  User,
  LearningArea,
  LearningSession,
  CourseModel,
  CourseModelProps,
  CourseBase,
  CardsList,
  AlertInformation,
} from "@/types";
import { IonGrid, IonRow, IonCol, IonAlert, IonModal } from "@ionic/vue";
import { reactive, Ref, ref, watch } from "vue";
import { useStore } from "vuex";
import {
  executeLink,
  getCurrentElement,
  getCurrentLanguage,
  getCustomMessage,
  getLearningContexts,
  getIcon,
  setupError,
  downloadCsv,
} from "@/utils";
import { useRoute } from "vue-router";

type Indexes = {
  group: string;
  index: number;
};

type AvailableModal = "course_details" | "success" | "error";

/**
 * Returns true when no learning session is currently selected.
 *
 * This drives the empty-state message of the right list.
 */
const is_nothing_selected = () =>
  selected_element_indexes.group == "-1" &&
  selected_element_indexes.index == -1;

/**
 * Finds the indexes for an element inside an `OrderedCardsList`.
 *
 * If `id` is provided, it searches by id; otherwise it searches for the element
 * marked as `selected`.
 */
const find_element = (
  list: OrderedCardsList<GeneralCardElements>,
  id?: string
): Indexes => {
  const groups = Object.keys(list.cards);

  let count = 0;
  let year: string;
  let index: number;

  do {
    year = groups[count];
    index = list.cards[year].findIndex((a: GeneralCardElements) => {
      if (id != undefined) {
        return a.id == id;
      } else {
        return a.selected;
      }
    });
    count++;
  } while (index == -1 && count < groups.length);

  return {
    group: year,
    index: index,
  };
};

/**
 * Handles selection changes on the left learning sessions list.
 *
 * - Clicking the already selected session unselects it and resets the right side.
 * - Selecting a different session loads the appropriate right-side data:
 *   - open-day flow: learning contexts + tutor courses
 *   - propositions flow: propositions grouped by status
 */
const changeSelection = async () => {
  let group_changed: boolean;

  if (
    selected_element_indexes.group != "-1" &&
    selected_element_indexes.index != -1
  ) {
    selectedChange(learning_sessions_cards);
  }

  const tmp_selected = find_element(
    learning_sessions_cards,
    store.state.event.data.id
  );
  if (
    selected_element_indexes.group == tmp_selected.group &&
    selected_element_indexes.index == tmp_selected.index
  ) {
    selected_element_indexes = {
      group: "-1",
      index: -1,
    };
    if (selected_option.value == "open_day_courses") {
      courses.order = [];
      courses.cards = {};
      options = [];
      selected_option.value = "";
    } else {
      propositions.order = [
        {
          key: "to_approve",
          title: getCustomMessage(
            "to_approve",
            getCurrentElement("to_approve"),
            "title"
          ),
        },
        {
          key: "approved",
          title: getCustomMessage(
            "approved",
            getCurrentElement("approved"),
            "title"
          ),
        },
      ];
      propositions.cards = {
        to_approve: [],
        approved: [],
      };
      selected_option.value = "project_classes";
    }
  } else {
    group_changed = selected_element_indexes.group != tmp_selected.group;
    selected_element_indexes = tmp_selected;
    learning_session_id =
      learning_sessions_cards.cards[selected_element_indexes.group][
        selected_element_indexes.index
      ].id;
    if ($route.name == "open_day_courses") {
      options = (await getLearningContexts(user, learning_session_id)).map(
        (a) => {
          return {
            id: a.id,
            title: a[`${language}_title`],
          };
        }
      );
      selected_option.value = options.length > 0 ? options[0].id : "";
      tmp_card_list = await getCourses();
      courses.cards = tmp_card_list.cards;
      courses.order = tmp_card_list.order;
      selectedChange(learning_sessions_cards);
    } else {
      if (selected_option.value != "courses" || group_changed) {
        propositions.order = [
          {
            key: "to_approve",
            title: getCustomMessage(
              "to_approve",
              getCurrentElement("to_approve"),
              "title"
            ),
          },
          {
            key: "approved",
            title: getCustomMessage(
              "approved",
              getCurrentElement("approved"),
              "title"
            ),
          },
        ];
        propositions.cards = await getPropositions();
        selectedChange(learning_sessions_cards);
      }
    }
  }
};

/**
 * Toggles the `selected` state for the active learning session card.
 */
const selectedChange = (
  list: OrderedCardsList<GeneralCardElements>,
  group = selected_element_indexes.group,
  index = selected_element_indexes.index,
  value = !learning_sessions_cards.cards[group][index].selected
) => {
  list.cards[group][index].selected = value;
  trigger.value++;
};

/**
 * Loads propositions for the currently selected learning session and option.
 *
 * Result is grouped into `approved` and `to_approve`.
 */
const getPropositions = async () => {
  const session_propositions: CourseModel[] = await (selected_option.value ==
  "project_classes"
    ? executeLink(
        "/v1/propositions?recent_models=false&session_id=" +
          learning_session_id,
        async (response: any) =>
          Promise.all(
            response.data.data.map(async (a: CourseModelProps) => {
              const tmp_proposition = new CourseModel(
                a,
                learning_sessions.find((b) => b.id == a.learning_session_id)
              );
              //await tmp_proposition.loadParms()
              return tmp_proposition;
            })
          ),
        () => []
      )
    : executeLink(
        "/v1/propositions?recent_models=false&session_id=" +
          learning_session_id +
          "&school_year=" +
          selected_element_indexes.group,
        (response: any) =>
          response.data.data.map((a: CourseModelProps) => new CourseModel(a)),
        () => []
      ));

  const cards: CardsList<GeneralCardElements> = {
    approved: [],
    to_approve: [],
  };

  for (const proposition of session_propositions) {
    if (selected_option.value == "project_classes") {
      if (
        proposition.creation_school_year ==
          parseInt(selected_element_indexes.group) &&
        "" + proposition.learning_session?.id == learning_session_id
      ) {
        cards[proposition.isApproved() ? "approved" : "to_approve"].push(
          proposition.toCard(user, true)
        );
      }
    } else {
      if (
        proposition.creation_school_year ==
        parseInt(selected_element_indexes.group)
      ) {
        cards[proposition.isApproved() ? "approved" : "to_approve"].push(
          proposition.toCard(user, true)
        );
      }
    }
  }

  return cards;
};

/**
 * Loads tutor courses for the selected learning session and learning context.
 *
 * Result is grouped by learning area.
 */
const getCourses = async () => {
  const tutor_courses: CourseBase[] = await executeLink(
    "/v1/teachers/" +
      user.id +
      "/tutor_courses?session_id=" +
      learning_session_id +
      "&context_id=" +
      selected_option.value,
    (response: any) => response.data.data.map((a: any) => new CourseBase(a)),
    () => []
  );

  const ordered_cards: OrderedCardsList<GeneralCardElements> = {
    order: [],
    cards: {},
  };

  let tmp_area: LearningArea | undefined;

  for (const course of tutor_courses) {
    if (ordered_cards.cards[course.learning_area_id] == undefined) {
      tmp_area = learning_areas.find((a) => a.id == course.learning_area_id);
      ordered_cards.cards[course.learning_area_id] = [];
      ordered_cards.order.push({
        key: course.learning_area_id,
        title: getCustomMessage(
          "title",
          tmp_area != undefined
            ? tmp_area[`${language}_title`]
            : course.learning_area_id,
          "title"
        ),
      });
    }
    ordered_cards.cards[course.learning_area_id].push(course.toCard());
  }

  return ordered_cards;
};

/**
 * Opens the requested modal/alert.
 *
 * - `course_details` opens the course description modal.
 * - `success` / `error` open the global alert.
 */
const setupModalAndOpen = (window?: AvailableModal, message?: string) => {
  const actual_window: AvailableModal = window ?? store.state.event.event;
  const actual_message: string = message ?? store.state.event.data?.message;

  switch (actual_window) {
    case "course_details":
      description_title = store.state.event.data.title;
      description_course_id = store.state.event.data.course_id;
      description_open.value = true;
      break;
    case "success":
      alert_information.title = "";
      alert_information.message =
        message ?? getCurrentElement(getCurrentElement("successful_operation"));
      alert_information.buttons = [getCurrentElement("ok")];
      alert_open.value = true;
      break;
    case "error":
      setupError(actual_message);
      alert_open.value = true;
      break;
  }
};

/**
 * Closes the requested modal/alert.
 */
const closeModal = (window: AvailableModal) => {
  switch (window) {
    case "course_details":
      description_open.value = false;
      break;
    case "success":
    case "error":
      alert_open.value = false;
      break;
  }
};

/**
 * Exports non-confirmed propositions into a CSV file.
 *
 * Uses `downloadCsv` and shows a feedback alert based on the export outcome.
 */
const exportPropositions = () => {
  executeLink(
    undefined,
    (response) =>
      downloadCsv(response.data, "propositions.csv").then((outcom_code) => {
        if (outcom_code == 1) {
          setupModalAndOpen(
            "success",
            getCurrentElement("propositions_exported")
          );
        } else if (outcom_code == 0) {
          setupModalAndOpen(
            "success",
            getCurrentElement("no_propositions") +
              ". " +
              getCurrentElement("no_file_exported")
          );
        } else {
          setupModalAndOpen("error");
        }
      }),
    () => setupModalAndOpen("error")
  );
};

const store = useStore();
const user = User.getLoggedUser() as User;
const $route = useRoute();
const alert_information: AlertInformation = store.state.alert_information;
const language = getCurrentLanguage();

const promises: Promise<any>[] = [];
const learning_sessions_cards: OrderedCardsList<GeneralCardElements> = reactive(
  {
    order: [],
    cards: {},
  }
);
const propositions: OrderedCardsList<GeneralCardElements> = reactive({
  order: [],
  cards: {},
});
const courses: OrderedCardsList<GeneralCardElements> = reactive({
  order: [],
  cards: {},
});
const school_years: number[] =
  $route.name == "open_day_courses"
    ? (
        await executeLink(
          "/v1/teachers/" + user.id + "/tutor_years",
          (response: any) => response.data.data.map((a: any) => a.school_year),
          () => []
        )
      ).reverse()
    : user.type == "teacher"
    ? (
        await executeLink(
          "/v1/teachers/" + user.id + "/active_years",
          (response: any) => response.data.data.map((a: any) => a.year),
          () => []
        )
      ).reverse()
    : await executeLink(
        "/v1/ordinary_classes?descending=true",
        (response: any) => [
          ...new Set(response.data.data.map((a: any) => a.school_year)),
        ],
        () => []
      );

const learning_areas: LearningArea[] = await executeLink(
  "/v1/learning_areas",
  (response: any) => response.data.data,
  () => []
);
const learning_sessions: LearningSession[] = []; /* await executeLink(
      "/v1/learning_sessions?school_year=" + year,
      async (response) => {
        learning_sessions_cards.order.push({
          key: year,
          title: getCustomMessage("title", year, "title"),
        });
        learning_sessions_cards.cards[year] = [];
        for (const learning_session of response.data.data) {
          learning_sessions_cards.cards[year].push(
            await new LearningSession(learning_session).toCard(false)
          );
        }
      }
    )*/
const trigger = ref(0);
const selected_option: Ref<string> = ref(
  $route.name == "open_day_courses" ? "" : "project_classes"
);
const alert_open = ref(false);
const description_open = ref(false);
const buttons = [
  {
    id: "export",
    type: "string_icon",
    linkType: "request",
    content: {
      text: getCurrentElement("export"),
      icon: getIcon("download"),
      url: "/v1/propositions/export",
      method: "get",
      whole_link: true,
    },
    ...store.state.button_css,
  },
];

let tmp_card_list: OrderedCardsList<GeneralCardElements>,
  description_title: string,
  description_course_id: number;
let options: {
  id: string;
  title?: string;
}[] =
  $route.name == "open_day_courses"
    ? []
    : [
        {
          id: "project_classes",
          title: getCurrentElement("project_classes_propositions"),
        },
        {
          id: "courses",
          title: getCurrentElement("courses_propositions_per_year"),
        },
      ];
let selected_element_indexes: Indexes = reactive({
  group: "-1",
  index: -1,
});
let learning_session_id = "-1";

for (const year of school_years) {
  promises.push(
    executeLink(
      "/v1/learning_sessions?school_year=" + year,
      async (response) => {
        learning_sessions_cards.order.push({
          key: year,
          title: getCustomMessage("title", year, "title"),
        });
        learning_sessions_cards.cards[year] = [];
        for (const learning_session of response.data.data) {
          learning_sessions.push(new LearningSession(learning_session));
          learning_sessions_cards.cards[year].push(
            await new LearningSession(learning_session).toCard(false)
          );
        }
      }
    )
  );
}
await Promise.all(promises);

watch(selected_option, async (new_option) => {
  // When the right selector changes, refresh right-side data for the active session.
  if (new_option != undefined && new_option != "") {
    if (
      selected_element_indexes.group != "-1" &&
      selected_element_indexes.index != -1
    ) {
      if ($route.name == "open_day_courses") {
        tmp_card_list = await getCourses();
        courses.cards = tmp_card_list.cards;
        courses.order = tmp_card_list.order;
      } else {
        propositions.cards = await getPropositions();
      }
    }
  }
  trigger.value++;
});
</script>

<style></style>
