<template>
  <ion-alert
    :is-open="alert_open"
    :header="alert_information.title"
    :message="alert_information.message"
    :buttons="alert_information.buttons"
    @didDismiss="closeModal('success')"
  />
  <ion-grid
    ><!-- v-if="learning_sessions.loaded">-->
    <ion-row v-if="user.type == 'admin'">
      <ionic-element
        :element="
          getCustomMessage(
            'export_description',
            getCurrentElement('students_export') + ':',
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
        @execute_link="exportSubscriptions"
      />
    </ion-row>
    <ion-row>
      <ion-col size="12" size-md="6">
        <list-card
          :title="
            getCustomMessage(
              'title',
              getCurrentElement(
                $route.name == 'ordinary_classes'
                  ? 'school_years'
                  : 'learning_sessions'
              )
            )
          "
          :emptiness_message="
            getCustomMessage(
              'emptiness_message',
              getCurrentElement(
                $route.name == 'ordinary_classes' ? 'no_years' : 'no_sessions'
              )
            )
          "
          :cards_list="
            $route.name == 'ordinary_classes'
              ? school_year_cards
              : learning_sessions
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
          @signal_event="changeSelection()"
        />
      </ion-col>
      <ion-col size="12" size-md="6">
        <list-card
          :key="trigger"
          :title="
            getCustomMessage(
              'title',
              getCurrentElement(
                $route.name == 'ordinary_classes'
                  ? 'ordinary_classes'
                  : 'courses'
              )
            )
          "
          :emptiness_message="
            getCustomMessage(
              'emptiness_message',
              getCurrentElement(
                is_nothing_selected()
                  ? $route.name == 'ordinary_classes'
                    ? 'school_years_selection_message'
                    : 'student_learning_session_selection_message'
                  : $route.name == 'ordinary_classes'
                  ? 'no_classes'
                  : 'no_courses'
              )
            )
          "
          :columns="$route.name == 'ordinary_classes' ? 5 : undefined"
          :cards_list="
            $route.name == 'ordinary_classes' ? ordinary_classes : courses
          "
          :colors="
            $route.name != 'ordinary_classes'
              ? {
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
                }
              : undefined
          "
        />
        <!-- TODO (5): capire perchè con 5 si crea uno spazio inutilizzabile in fondo -->
      </ion-col>
    </ion-row>
  </ion-grid>
</template>

<script setup lang="ts">
import {
  GeneralCardElements,
  LearningSession,
  OrderedCardsList,
  MinimumCourseProps,
  MinimizedCourse,
  User,
  AdminProjectClassProps,
  AdminProjectClass,
  OrdinaryClass,
  TmpList,
  IconAlternatives,
  ColorObject,
  AlertInformation,
} from "@/types";
import { IonGrid, IonRow, IonCol, IonAlert } from "@ionic/vue";
import { reactive, ref } from "vue";
import { useStore } from "vuex";
import {
  downloadCsv,
  executeLink,
  getCurrentElement,
  getCustomMessage,
  getIcon,
  getStudyAddressVisualization,
  setupError,
} from "@/utils";
import { useRoute } from "vue-router";

type Indexes = {
  group: string;
  index: number;
};
type AvailableModal = "success" | "error";

const is_nothing_selected = () =>
  selected_element_indexes.group == "-1" &&
  selected_element_indexes.index == -1;
const find_element = (
  list: OrderedCardsList<GeneralCardElements>,
  id?: string
): Indexes => {
  const years = Object.keys(list.cards);

  let count = 0;
  let year: string;
  let index: number;

  do {
    year = years[count];
    index = list.cards[year].findIndex((a: GeneralCardElements) => {
      if (id != undefined) {
        return a.id == id;
      } else {
        return a.selected;
      }
    });
    count++;
  } while (index == -1 && count < years.length);

  return {
    group: year,
    index: index,
  };
};
const changeSelection = async () => {
  if (
    selected_element_indexes.group != "-1" &&
    selected_element_indexes.index != -1
  ) {
    selectedChange(
      $route.name == "ordinary_classes" ? school_year_cards : learning_sessions
    );
  }

  const tmp_selected = find_element(
    $route.name == "ordinary_classes" ? school_year_cards : learning_sessions,
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
    if ($route.name == "ordinary_classes") {
      ordinary_classes.cards[""] = [];
    } else {
      courses.cards[""] = [];
    }
  } else {
    selected_element_indexes = tmp_selected;
    if ($route.name == "ordinary_classes") {
      ordinary_classes = getClasses();
      selectedChange(school_year_cards);
    } else {
      courses.cards[""] = await getCourses();
      selectedChange(learning_sessions);
    }
  }
};
const selectedChange = (
  list: OrderedCardsList<GeneralCardElements>,
  year = selected_element_indexes.group,
  index = selected_element_indexes.index,
  value = !(
    $route.name == "ordinary_classes" ? school_year_cards : learning_sessions
  ).cards[year][index].selected
) => {
  list.cards[year][index].selected = value;
  trigger.value++;
};
const getCourses = async () =>
  executeLink(
    $route.name == "announcements"
      ? "/v1/students/" +
          user.id +
          "/project_classes?session_id=" +
          learning_sessions.cards[selected_element_indexes.group][
            selected_element_indexes.index
          ].id
      : "/v1/project_classes?session_id=" +
          learning_sessions.cards[selected_element_indexes.group][
            selected_element_indexes.index
          ].id,
    async (response: any) =>
      Promise.all(
        response.data.data.map(
          async (a: MinimumCourseProps | AdminProjectClassProps) => {
            let tmp_project_class: AdminProjectClass;
            let tmp_card: GeneralCardElements;
            if ($route.name == "announcements") {
              tmp_card = new MinimizedCourse(a as MinimumCourseProps).toCard(
                //<!-- TODO (5): finire
                "/announcements/" +
                  (a as MinimumCourseProps).id +
                  "/" +
                  learning_sessions.cards[selected_element_indexes.group][
                    selected_element_indexes.index
                  ].id
              );
            } else {
              tmp_project_class = new AdminProjectClass(
                a as AdminProjectClassProps
              );
              await tmp_project_class.loadParms();
              tmp_card = tmp_project_class.toCard(
                "project_courses/" +
                  (a as AdminProjectClassProps).course_id +
                  "/" +
                  (a as AdminProjectClassProps).learning_session
              );
            }

            return tmp_card;
          }
        )
      )
  );
const getClasses = () => {
  const tmp_classes: OrderedCardsList<GeneralCardElements> = {
    order: [],
    cards: {},
  };

  let study_address_visualization:
    | {
        icon: IconAlternatives;
        background: ColorObject;
      }
    | undefined;
  for (const tmp_class of all_ordinary_classes[
    school_year_cards.cards[selected_element_indexes.group][
      selected_element_indexes.index
    ].id
  ]) {
    if (tmp_classes.cards[tmp_class.address] == undefined) {
      tmp_classes.cards[tmp_class.address] = [];
      study_address_visualization = getStudyAddressVisualization(
        tmp_class.address
      );
      tmp_classes.order.push({
        key: tmp_class.address,
        title: getCustomMessage(
          tmp_class.address,
          study_address_visualization != undefined
            ? {
                text: "" + tmp_class.address,
                icon: study_address_visualization.icon,
                order: true,
              }
            : "",
          study_address_visualization != undefined ? "string_icon" : "string",
          {
            text: {
              name: "white",
              type: "var",
            },
            background: {
              name: "light",
              type: "var",
            },
          },
          {
            item: {
              "ion-no-padding": true,
            },
          }
        ),
      });
    }
    tmp_classes.cards[tmp_class.address].push(
      tmp_class.toCard(
        false,
        false,
        false,
        "/ordinary_classes/" +
          tmp_class.study_year +
          "/" +
          tmp_class.address +
          "/" +
          tmp_class.school_year
      )
    );
  }
  return tmp_classes;
};
const setupModalAndOpen = (window?: AvailableModal, message?: string) => {
  const actual_window: AvailableModal = window ?? store.state.event.event;
  const actual_message: string = message ?? store.state.event.data?.message;

  switch (actual_window) {
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
const closeModal = (window: AvailableModal) => {
  switch (window) {
    case "success":
    case "error":
      alert_open.value = false;
      break;
  }
};
const exportSubscriptions = async () => {
  executeLink(
    undefined,
    (response) =>
      downloadCsv(response.data, "subscriptions.csv").then(
        (outcome_code) => {
          if (outcome_code == 1) {
            setupModalAndOpen(
              "success",
              getCurrentElement("subscriptions_exported")
            );
          } else if (outcome_code == 0) {
            setupModalAndOpen(
              "error",
              getCurrentElement("no_students") +
                ". " +
                getCurrentElement("no_file_exported")
            );
          } else {
            setupModalAndOpen("error", getCurrentElement("error"));
          }
        },
        () => setupModalAndOpen("error")
      ),
    (error) =>
      setupModalAndOpen(
        "error",
        error.response.status == 404
          ? getCurrentElement("learning_session_error")
          : error.response.status == 400
          ? getCurrentElement("last_session_error")
          : undefined
      ),
    undefined,
    undefined,
    {
      responseType: "blob",
    }
  );
};

const store = useStore();
const user = User.getLoggedUser() as User;
const $route = useRoute();
const alert_information: AlertInformation = store.state.alert_information;

const buttons = [
  {
    id: "export",
    type: "string_icon",
    linkType: "request",
    content: {
      text: getCurrentElement("export"),
      icon: getIcon("download"),
      url: "/v1/subscriptions/export",
      method: "get",
      whole_link: true,
    },
    ...store.state.button_css,
  },
];
const promises: Promise<any>[] = [];
const learning_sessions: OrderedCardsList<GeneralCardElements> = reactive({
  order: [],
  cards: {},
});
const courses: OrderedCardsList<GeneralCardElements> = reactive({
  order: [],
  cards: {},
});
const all_ordinary_classes: TmpList<OrdinaryClass[]> = {};
const school_year_cards: OrderedCardsList<GeneralCardElements> = reactive({
  order: [],
  cards: {
    "": [],
  },
});
const school_years =
  $route.name == "announcements"
    ? await executeLink(
        "/v1/ordinary_classes?student_id=" + user.id,
        (response: any) => response.data.data.map((a: any) => a.school_year),
        () => []
      )
    : $route.name == "ordinary_classes"
    ? await executeLink(
        "/v1/ordinary_classes",
        (response: any) => {
          const tmp_years = new Set();

          let years_size = 0;

          for (const tmp_class of response.data.data) {
            if (tmp_years.add(tmp_class.school_year).size > years_size) {
              years_size++;
              school_year_cards.cards[""].push({
                id: "" + tmp_class.school_year,
                group: "",
                title: getCustomMessage(
                  "title",
                  tmp_class.school_year,
                  "title"
                ),
                selected: false,
                link: {
                  event: "change_selection",
                  data: {
                    id: tmp_class.school_year,
                  },
                },
              });
              all_ordinary_classes[tmp_class.school_year] = [];
            }
            all_ordinary_classes[tmp_class.school_year].push(
              new OrdinaryClass(tmp_class)
            );
          }

          return tmp_years;
        },
        () => []
      )
    : await executeLink(
        "/v1/ordinary_classes",
        (response: any) => [
          ...new Set(response.data.data.map((a: any) => a.school_year)),
        ],
        () => []
      ); //<!-- ? chiedere se c'è api apposta per anni scolastici passati
const trigger = ref(0);
const alert_open = ref(false);

let selected_element_indexes: Indexes = reactive({
  group: "-1",
  index: -1,
});
let ordinary_classes: OrderedCardsList<GeneralCardElements> = reactive({
  order: [],
  cards: {},
});

if ($route.name != "ordinary_classes") {
  for (const year of school_years) {
    promises.push(
      executeLink(
        "/v1/learning_sessions?school_year=" + year,
        async (response) => {
          learning_sessions.order.push({
            key: year,
            title: getCustomMessage("title", year, "title"),
          });
          learning_sessions.cards[year] = [];
          for (const learning_session of response.data.data) {
            learning_sessions.cards[year].push(
              await new LearningSession(learning_session).toCard(false)
            );
          }
        }
      )
    );
  }
  await Promise.all(promises);
}
</script>

<style></style>
