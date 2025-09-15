<template>
  <div class="ion-padding-horizontal">
    <ion-alert
      :is-open="alert_open"
      :header="alert_information.title"
      :message="alert_information.message"
      :buttons="alert_information.buttons"
      @didDismiss="closeModal(store.state.event.event)"
    />
    <ion-modal
      id="student_mover"
      :is-open="student_mover_open"
      @didDismiss="closeModal('student_mover')"
    >
      <suspense>
        <template #default>
          <project-class-selector
            :title="student_mover_data.title"
            :student_id="student_mover_data.parameters.student_id"
            :ordinary_class="ordinary_class"
            :learning_sessions="learning_sessions"
            :project_class="project_class?.toProjectClassSummary()"
            :learning_session="learning_session"
            :section="selected_section"
            :subscriptions_manager="subscriptions_manager"
            @close="closeModal('student_mover')"
            @signal_event="manageEvent()"
          />
        </template>
        <template #fallback>
          <loading-component />
        </template>
      </suspense>
    </ion-modal>
    <div class="ion-margin-start">
      <ionic-element
        :element="
          getCustomMessage(
            'title',
            ordinary_class.study_year + ' ' + ordinary_class.address,
            'title',
            undefined,
            {
              label: {
                title_font: true,
              },
            }
          )
        "
      />
    </div>
    <custom-select
      v-if="sections_use && sections.length > 0"
      v-model:selected_option="selected_section"
      :list="sections"
      :label="getCurrentElement('section') + ':'"
      :aria_label="getCurrentElement('section')"
      :placeholder="getCurrentElement('section_choice')"
    />
    <custom-select
      v-if="user.type == 'admin' && learning_sessions.length > 0"
      v-model:selected_option="selected_session"
      :list="learning_sessions"
      :label="getCurrentElement('learning_sessions') + ':'"
      :aria_label="getCurrentElement('learning_sessions')"
      :placeholder="getCurrentElement('learning_sessions_choice')"
      :getCompleteName="LearningSession.toString"
    />
    <div
      v-if="user.type == 'admin' && learning_sessions.length > 0"
      style="display: flex"
    >
      <ordinary-class-people-adder
        :school_year="ordinary_class.school_year"
        :study_address="ordinary_class.address"
        :study_year="ordinary_class.study_year"
        :section="selected_section"
        @signal_event="
          () => {
            setupModalAndOpen();
            updateStudents(true, false, true).then(() => students_trigger++);
          }
        "
      />
    </div>
    <template
      v-if="
        non_compliant_table.cards[''].length > 0 ||
        students_table.cards[''].length > 0
      "
    >
      <template v-if="user.type == 'admin'">
        <div class="ion-padding-top">
          <ionic-element
            :element="
              getCustomMessage(
                'title',
                getCurrentElement('non_compliant_students'),
                'title',
                undefined,
                {
                  label: {
                    'ion-padding': true,
                  },
                }
              )
            "
          />
          <suspense>
            <template #default>
              <div class="ion-padding-top">
                <ionic-table
                  :key="students_trigger"
                  :data="non_compliant_table"
                  :first_row="non_compliant_first_row"
                  :sizes="non_compliant_column_sizes"
                  :emptiness_message="
                    getCustomMessage(
                      'emptiness_message',
                      getCurrentElement('all_compliant_students'),
                      'string',
                      undefined,
                      {
                        label: {
                          'ion-padding': true,
                        },
                      }
                    )
                  "
                  @signal_event="setupModalAndOpen()"
                  @execute_link="$router.push(store.state.request.url)"
                />
              </div>
            </template>
            <template #fallback>
              <loading-component />
            </template>
          </suspense>
        </div>
      </template>
      <div class="ion-padding-top">
        <ionic-element
          :element="
            getCustomMessage(
              'title',
              getCurrentElement(
                user.type == 'admin' ? 'compliant_students' : 'students'
              ),
              'title',
              undefined,
              {
                label: {
                  'ion-padding': true,
                },
              }
            )
          "
        />
        <suspense>
          <template #default>
            <div class="ion-padding-top">
              <ionic-table
                :key="students_trigger"
                :data="students_table"
                :first_row="students_first_row"
                :sizes="students_column_sizes"
                :emptiness_message="
                  getCustomMessage(
                    'emptiness_message',
                    getCurrentElement('no_compliant_students'),
                    'string',
                    undefined,
                    {
                      label: {
                        'ion-padding': true,
                      },
                    }
                  )
                "
                @signal_event="setupModalAndOpen()"
                @execute_link="$router.push(store.state.request.url)"
              />
            </div>
          </template>
          <template #fallback>
            <loading-component />
          </template>
        </suspense>
      </div>
    </template>
    <div v-else class="ion-padding-start ion-padding-top">
      <ionic-element
        :element="
          getCustomMessage('no_students', getCurrentElement('no_students'))
        "
      />
    </div>
    <!-- TODO (4): Togliere studenti andati via dalla scuola (facendo in modo che non vengano visualizzati in giro). -->
  </div>
</template>

<script setup lang="ts">
import {
  AdminProjectClass,
  AlertInformation,
  CustomElement,
  ErrorCodes,
  LearningSession,
  LearningSessionStatus,
  Outcome,
  OrdinaryClassStudent,
  OrdinaryClassStudentProps,
  OrdinaryClassSummary,
  StudentSummaryProps,
  SubscriptionsManager,
  SubscriptionsManagerMode,
  SuccessCodes,
  TmpList,
  User,
  EnrollmentAvailability,
  GeneralTableCardElements,
  OrderedCardsList,
} from "@/types";
import {
  executeLink,
  getCurrentElement,
  getCustomMessage,
  getIcon,
  removeTableIndexedElement,
  setupError,
} from "@/utils";
import { AlertButton, IonAlert, IonModal } from "@ionic/vue";
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";

type AvailableModal =
  | "student_mover"
  | "move_student"
  | "no_courses"
  | "success"
  | "error";

const setupModalAndOpen = (
  window: AvailableModal = store.state.event.event,
  message: string = store.state.event.data?.message
) => {
  switch (window) {
    case "student_mover":
      student_mover_data = {
        title: store.state.event.data.title,
        parameters: {
          ...store.state.event.data.parameters,
          ordinary_class: ordinary_class.study_year,
        },
      };
      student_mover_open.value = true;
      break;
    case "move_student":
      alert_information.title = "";
      alert_information.message = getCurrentElement(
        "move_student_confirmation"
      );
      alert_information.buttons = [handled_buttons[0], getCurrentElement("no")];
      alert_open.value = true;
      break;
    case "success":
      alert_information.title = "";
      alert_information.message =
        message ?? getCurrentElement(getCurrentElement("successful_operation"));
      alert_information.buttons = [getCurrentElement("ok")];
      alert_open.value = true;
      break;
    case "error":
      setupError(message);
      alert_open.value = true;
      break;
  }
};
const closeModal = (window: AvailableModal) => {
  switch (window) {
    case "student_mover":
      student_mover_open.value = false;
      break;
    case "move_student":
    case "no_courses":
    case "success":
    case "error":
      alert_open.value = false;
      break;
  }
};
const updateStudents = async (
  do_non_compliants = true,
  do_students = true,
  new_search = true
) => {
  /**
   * @description Update (students, students_table, non_compliant_students_index and non_compliant_table) or (students_table and/or non_compliant_table)
   * @param new_search If true, update search for new students and new non compliant students and update all
   * @param do_students If true and new_search, update students_table
   * @param do_non_compliants If true and new_search, update non_compliant_students_index and non_compliant_table
   * @returns void
   * @async
   */

  if (
    learning_session?.getStatus() == LearningSessionStatus.FUTURE ||
    learning_session?.getStatus() == LearningSessionStatus.UPCOMING
  ) {
    non_compliant_first_row = base_first_row.concat([
      {
        id: "subscribe_to",
        type: "string",
        content: getCurrentElement("subscribe_to"),
      },
    ]);
    non_compliant_column_sizes = ["1", "6", "2", "2", "1"];
  } else {
    non_compliant_first_row = base_first_row;
    non_compliant_column_sizes = ["1", "7", "2", "2"];
  }
  if (new_search) {
    students = await executeLink(
      "/v1/ordinary_classes/" +
        ordinary_class.study_year +
        "/" +
        $route.params.address +
        "/components?school_year=" +
        ordinary_class.school_year +
        "&section=" +
        selected_section.value,
      (response) =>
        response.data.data.map(
          (a: OrdinaryClassStudentProps) => new OrdinaryClassStudent(a)
        ),
      () => []
    );
    if (learning_sessions.length > 0 && students.length > 0) {
      if (new_search && user.type == "admin") {
        non_compliant_students_index = await executeLink(
          "/v1/ordinary_classes/" +
            ordinary_class.study_year +
            "/" +
            $route.params.address +
            "/non_compliant?session_id=" +
            selected_session.value +
            "&section=" +
            selected_section.value,
          (response) =>
            response.data.data.map((a: StudentSummaryProps) =>
              students.findIndex((b) => b.id == a.id)
            ),
          () => []
        ); // Temporary storage of ids to make the search faster later, since students >= non_compliant_students
      }
    }
  }
  if (new_search || do_non_compliants) {
    non_compliant_table.cards[""] = [];
    for (const index in non_compliant_students_index) {
      non_compliant_table.cards[""].push(
        students[non_compliant_students_index[index]].toTableCard(
          parseInt(index) + 1,
          learning_session?.getStatus() == LearningSessionStatus.FUTURE ||
            learning_session?.getStatus() == LearningSessionStatus.UPCOMING
        )
      );
    }
  }
  if (new_search || do_students) {
    students_table.cards[""] = [];
    count = 1;
    for (const i in students) {
      if (non_compliant_students_index.find((a) => "" + a == i) == undefined) {
        students_table.cards[""].push(students[i].toTableCard(count++));
      }
    }
  }
};
const manageEvent = () => {
  switch (store.state.event.event) {
    case "no_courses":
      closeModal("student_mover");
      setupModalAndOpen("error");
      break;
    default:
      setupModalAndOpen();
      break;
  }
};
const yes_handler = async () => {
  let outcome: Outcome, tmp_index: number, tmp_target_index: number;

  switch (store.state.event.event) {
    case "move_student":
      outcome = await subscribeStudent();
      closeModal("move_student");
      switch (outcome.code) {
        case SuccessCodes.GENERIC:
          switch (outcome.subcode) {
            case 1:
              tmp_index = removeTableIndexedElement(
                non_compliant_table,
                store.state.event.data.student_id
              );
              if (tmp_index != -1) {
                count = tmp_index;
                tmp_target_index = -1;
                while (tmp_target_index == -1 && count > 0) {
                  if (
                    non_compliant_students_index[count - 1] !=
                    non_compliant_students_index[count] - 1
                  ) {
                    tmp_target_index =
                      students_table.cards[""].findIndex(
                        (a: any) =>
                          a == students[non_compliant_students_index[count] - 1]
                      ) + 1;
                  } else {
                    count--;
                  }
                }
                if (tmp_target_index == -1) {
                  if (non_compliant_students_index[0] != 0) {
                    tmp_target_index =
                      students_table.cards[""].findIndex(
                        (a: any) =>
                          a == students[non_compliant_students_index[0] - 1]
                      ) + 1;
                  } else {
                    tmp_target_index = 0;
                  }
                }
                students_table.cards[""].splice(
                  tmp_target_index,
                  0,
                  students[non_compliant_students_index[tmp_index]].toTableCard(
                    tmp_target_index + 1
                  )
                );
                non_compliant_students_index.splice(tmp_index, 1);
              } else {
                setupModalAndOpen("error");
              }
              break;
          }
          students_trigger.value++;
          store.state.event.event = "student_mover";
          setTimeout(() => {
            store.state.event.event = "success";
            store.state.event.data = {
              message: outcome.message,
            };
            setupModalAndOpen();
          }, 500);
          break;
        case ErrorCodes.GENERIC:
        case ErrorCodes.BAD_REQUEST:
        case ErrorCodes.ALREADY_EXISTS:
          setTimeout(() => setupModalAndOpen("error", outcome.message), 300);
          break;
      }
      break;
  }
};
const subscribeStudent = async (): Promise<Outcome> => {
  const outcome: Outcome = {
    code: SuccessCodes.GENERIC,
    subcode: 0,
  };

  let enrollment_availability: EnrollmentAvailability;

  if (user.type != "admin") {
    outcome.code = ErrorCodes.UNAUTHORIZED;
    outcome.message = getCurrentElement("unauthorized_operation");
  } else if (
    subscriptions_manager.mode != SubscriptionsManagerMode.SUBSCRIPTION
  ) {
    outcome.code = ErrorCodes.BAD_REQUEST;
  } else if (store.state.event.data.to.final_confirmation != undefined) {
    outcome.code = ErrorCodes.GENERIC;
    outcome.subcode = 0;
    outcome.message = getCurrentElement("class_already_confirmed");
  } else {
    enrollment_availability = subscriptions_manager.checkEnrollmentAvailability(
      store.state.event.data.to.learning_context_id,
      store.state.event.data.to.learning_area_id,
      store.state.event.data.to.course_id
    );
    if (enrollment_availability.course != undefined) {
      if (!enrollment_availability.available_courses) {
        outcome.code = ErrorCodes.GENERIC;
        outcome.subcode = 3;
        outcome.message = getCurrentElement("cannot_move_for_group");
      } else if (!enrollment_availability.available_credits) {
        outcome.code = ErrorCodes.GENERIC;
        outcome.subcode = 4;
        outcome.message = getCurrentElement("cannot_move_for_credits");
      } else {
        await executeLink(
          "/v2/students/" +
            store.state.event.data.student_id +
            "/subscribe?course_id=" +
            store.state.event.data.to.course_id +
            "&session_id=" +
            store.state.event.data.to.session_id +
            "&context_id=" +
            store.state.event.data.to.learning_context_id,
          (response: any) => {
            const pendingDate = new Date(response.data.data ?? "no date");
            const isPending = !isNaN(pendingDate.getTime());
            const enrollment_value = isPending ? pendingDate : true;

            if (!isPending) {
              subscriptions_manager.updateCourseAndLinked(enrollment_value);
              subscriptions_manager.updateCredits(false);
              if (subscriptions_manager.isStudentCompliant()) {
                outcome.subcode = 1;
                outcome.message = getCurrentElement(
                  "student_subscribed_and_compliant"
                );
              } else {
                outcome.message = getCurrentElement("student_subscribed");
              }
            } else {
              outcome.subcode = 2;
              outcome.message = getCurrentElement("pending_student");
            }
          },
          (error) => {
            if (error.response.status == 409) {
              outcome.code = ErrorCodes.ALREADY_EXISTS;
              outcome.subcode = 0;
              if (error.response.data.specified_session) {
                outcome.message = getCurrentElement(
                  "student_already_subscribed"
                );
              } else {
                outcome.message = getCurrentElement(
                  "student_course_already_attended"
                );
              }
            } else {
              outcome.code = ErrorCodes.GENERIC;
              outcome.subcode = 2;
            }
          },
          "post"
        );
      }
    } else {
      outcome.code = ErrorCodes.GENERIC;
      outcome.subcode = 1;
    }
  }

  return outcome;
};

const store = useStore();
const user = User.getLoggedUser() as User;
const sections_use: boolean = store.state.sections_use;
const $route = useRoute();
const $router = useRouter();
const alert_information: AlertInformation = store.state.alert_information;

const students_column_sizes =
  user.type == "admin" ? ["1", "7", "2", "2"] : ["1", "11"];
const base_first_row: CustomElement[] = [
  {
    id: "index",
    type: "string",
    content: "",
  },
  {
    id: "student",
    type: "string",
    content: getCurrentElement("student"),
  },
].concat(
  user.type == "admin"
    ? [
        {
          id: "orientation_credits",
          type: "string",
          content: getCurrentElement("orientation_credits"),
        },
        {
          id: "clil_credits",
          type: "string",
          content: getCurrentElement("clil_credits"),
        },
      ]
    : []
) as CustomElement[];
const students_first_row: CustomElement[] = base_first_row;
const student_mover_open = ref(false);
const students_trigger = ref(0);
const alert_open = ref(false);
const sections: { id: string }[] = [{ id: store.state.default_section }]; //<!-- ? Chiedere a Pietro api per ottenere sezioni da classe
const selected_section = ref(sections[0].id);
const learning_sessions: LearningSession[] = [];
const selected_session = ref(-1);
const handled_buttons: AlertButton[] = [
  {
    text: getCurrentElement("yes"),
    handler: yes_handler,
  },
];
const subscriptions_manager = new SubscriptionsManager(
  SubscriptionsManagerMode.SUBSCRIPTION
); // Not ready, loadParameters will be run with project-class-selector
const ordinary_class = new OrdinaryClassSummary({
  school_year:
    typeof $route.params.school_year == "string"
      ? parseInt($route.params.school_year)
      : NaN,
  address:
    typeof $route.params.address == "string" ? $route.params.address : "",
  study_year:
    typeof $route.params.study_year == "string"
      ? parseInt($route.params.study_year)
      : NaN,
  section: selected_section.value,
});

const students_table: OrderedCardsList<GeneralTableCardElements> = {
  order: [],
  cards: {
    "": [],
  },
};
const non_compliant_table: OrderedCardsList<GeneralTableCardElements> = {
  order: [],
  cards: {
    "": [],
  },
};
let project_class: AdminProjectClass | undefined;
let students: OrdinaryClassStudent[] = [];
let non_compliant_students_index: number[] = [];
let student_mover_data: TmpList;
let non_compliant_first_row: CustomElement[];
let non_compliant_column_sizes: string[];
let learning_session: LearningSession | undefined;
let found = false;
let count: number;
let tmp_learning_session: LearningSession;

if (
  !isNaN(ordinary_class.school_year) &&
  typeof $route.params.address == "string" &&
  !isNaN(ordinary_class.study_year)
) {
  await executeLink(
    "/v1/learning_sessions?school_year=" + ordinary_class.school_year,
    (response) => {
      count = 0;
      while (!found && count < response.data.data.length) {
        tmp_learning_session = new LearningSession(response.data.data[count]);
        learning_sessions.push(tmp_learning_session);
        if (
          tmp_learning_session.getStatus() == LearningSessionStatus.UPCOMING ||
          tmp_learning_session.getStatus() == LearningSessionStatus.FUTURE
        ) {
          found = true;
        }
        count++;
      }
    },
    () => []
  );
  if (learning_sessions.length > 0) {
    selected_session.value = learning_sessions[learning_sessions.length - 1].id;
    learning_session = learning_sessions.find(
      (a) => a.id == selected_session.value
    );

    await updateStudents(user.type == "admin");
    watch(selected_session, async () => {
      learning_session = learning_sessions.find(
        (a) => a.id == selected_session.value
      );
      await updateStudents(user.type == "admin");
      students_trigger.value++;
    });
    watch(selected_section, async () => {
      ordinary_class.section = selected_section.value;
      await updateStudents(user.type == "admin");
      students_trigger.value++;
    });
  }
} else {
  $router.push({ name: "ordinary_classes" }); //<!-- TODO (6): valutare se va bene o mettere solo popup e fare dappertutto
}
</script>

<style scoped></style>
