<template>
  <div class="ion-padding-horizontal">
    <ion-alert
      :is-open="openAlert"
      :header="alert_information.title"
      :message="alert_information.message"
      :buttons="alert_information.buttons"
      @didDismiss="closeModal('max_credits')"
    />
    <ion-modal
      :is-open="description_open"
      @didDismiss="closeModal('course_details')"
    >
      <suspense>
        <template #default>
          <course-description
            :title="description.title"
            :course_id="description.course_id"
            :learning_session_id="learning_session_id"
            :section="description.section"
            @close="closeModal('course_details')"
          />
        </template>
        <template #fallback>
          <loading-component />
        </template>
      </suspense>
    </ion-modal>
    <ion-modal
      :is-open="confirmation_open"
      :can-dismiss="() => !confirmation_open"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title class="ion-text-center">
            <ionic-element
              :element="
                getCustomMessage(
                  'confirmation_title',
                  confirmation_data.title,
                  'title',
                  {
                    text: {
                      name: 'primary',
                      type: 'var',
                    },
                  }
                )
              "
            />
          </ion-title>
          <ion-progress-bar v-model:value="timer_bar" :color="getBarColor" />
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-grid class="ion-text-center">
          <ion-row>
            <ion-col>
              <ionic-element
                :element="
                  getCustomMessage(
                    'confirmation_message',
                    confirmation_data.message
                  )
                "
              />
            </ion-col>
          </ion-row>
          <ion-row>
            <ion-col>
              <ionic-element
                :element="
                  getCustomMessage(
                    'confirmation_warning',
                    getCurrentElement('confrimation_warning'),
                    'string',
                    {
                      text: {
                        name: 'warning',
                        type: 'var',
                      },
                    }
                  )
                "
              />
            </ion-col>
          </ion-row>
          <ion-row>
            <ion-col v-for="i in getNumberSequence(2)" :key="buttons[i].id">
              <ionic-element
                :element="buttons[i]"
                @signal_event="sendConfirmation()"
              />
            </ion-col>
          </ion-row>
        </ion-grid>
      </ion-content>
    </ion-modal>
    <suspense v-if="$route.params.id != undefined">
      <template #default>
        <session-description
          :key="trigger"
          :id="$route.params.id"
          :learning_context="
            toSummary(learning_contexts.find((a) => a.id == selected_context))
          "
        />
      </template>
      <template #fallback>
        <loading-component />
      </template>
    </suspense>
    <ion-grid class="ion-no-padding">
      <ion-row class="ion-no-padding">
        <ion-col size="auto" class="ion-no-padding">
          <custom-select
            v-model:selected_option="selected_context"
            :list="learning_contexts"
            :label="getCurrentElement('learning_context') + ':'"
            :aria_label="getCurrentElement('learning_context')"
            :placeholder="getCurrentElement('learning_context_choice')"
            :getCompleteName="getContextAcronym"
          />
        </ion-col>
        <ion-col size="auto" class="ion-no-padding">
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
    </ion-grid>
    <list-card
      :key="trigger"
      @execute_link="changeEnrollment()"
      @signal_event="openDescription()"
      :emptiness_message="
        getCustomMessage(
          'emptiness_message',
          getCurrentElement('no_proposed_courses')
        )
      "
      v-model:cards_list="subscriptions_manager.courses"
      :colors="{
        list_borders: {
          name: 'black',
          type: 'var',
          alpha: 0.25,
        },
        text: {
          name: 'primary',
          type: 'var',
        },
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { OrdinaryClass } from "@/types";
import {
  EnrollmentCardElements,
  EnrollmentCourseProps,
  LearningArea,
  LearningSession,
  LearningContext,
  User,
  CustomElement,
  EventString,
  OrdinaryClassSummary,
  SubscriptionsManager,
  TmpList,
  AlertInformation,
  EnrollmentCourse,
} from "@/types";
import {
  executeLink,
  getCurrentElement,
  getCurrentLanguage,
  getCustomMessage,
  getLearningContexts,
  getNumberSequence,
  toSummary,
  getLearningAreasStructures,
  getContextAcronym,
  setupError,
} from "@/utils";
import {
  IonAlert,
  IonModal,
  IonGrid,
  IonRow,
  IonCol,
  IonHeader,
  IonToolbar,
  IonProgressBar,
  IonContent,
  IonTitle,
} from "@ionic/vue";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Store, useStore } from "vuex";

type AvailableModal =
  | "course_details"
  | "max_credits"
  | "max_courses"
  | "confirmation"
  | "wrong_subscription"
  | "unauthorized_operation"
  | "error";
//| "general_error"; //<!-- TODO (4): put general error with refresh button

const changeEnrollment = async () => {
  const requestArray = store.state.request.url.split("?"); //<!-- TODO (9): usare classe URL
  const pathArray = requestArray[0].split("/");
  const queryArray = requestArray[1].split("&");
  const course_id = queryArray[0].split("=")[1];
  const action = pathArray[pathArray.length - 1];
  const unscribe = action == "unsubscribe";
  const enrollment_availability =
    subscriptions_manager.checkEnrollmentAvailability(
      selected_context.value,
      selected_area.value,
      course_id
    );

  //let count;
  let tmp_card: EnrollmentCardElements;

  if (enrollment_availability.course != undefined) {
    /*count = 0;
    while ((available_courses = remaining_courses[learning_contexts[count].id][selected_area.value][tmp_course.group] - 1 >= 0) == true
      && ++count < learning_contexts.length);*/
    if (
      unscribe ||
      (enrollment_availability.available_courses &&
        enrollment_availability.available_credits)
    ) {
      await executeLink(
        undefined,
        (response: any) => {
          const pendingDate = new Date(response.data.data ?? "no date");
          const isPending = !isNaN(pendingDate.getTime());
          const enrollment_value = isPending ? pendingDate : !unscribe;

          let wasPending: boolean;

          if (enrollment_availability.course != undefined) {
            tmp_card = enrollment_availability.course as EnrollmentCardElements;
            wasPending = tmp_card.enrollment.isPending();
            if (!wasPending && !isPending) {
              if (store.state.static_subscription && !unscribe) {
                confirmation_data.title = (
                  tmp_card.content[1].content as EventString
                ).text;
                confirmation_data.message = getCurrentElement(
                  "course_confirmation"
                );
                confirmation_data.course = tmp_card;
                confirmation_data.unscribe = unscribe;
                confirmation_data.enrollment_value = enrollment_value;
                confirmation_data.update_credits = true;
                openConfirmation();
              } else {
                subscriptions_manager.updateCourseAndLinked(enrollment_value);
                subscriptions_manager.updateCredits(unscribe);
                trigger.value++;
              }
            } else if (store.state.static_subscription && isPending) {
              confirmation_data.title = (
                tmp_card.content[1].content as EventString
              ).text;
              confirmation_data.message = getCurrentElement("course_pending");
              confirmation_data.course = tmp_card;
              confirmation_data.enrollment_value = enrollment_value;
              confirmation_data.unscribe = unscribe;
              openConfirmation();
            } else {
              subscriptions_manager.updateCourseAndLinked(enrollment_value);
              trigger.value++;
            }
          } else {
            setAlertAndOpen("error");
          }
        },
        (error) => {
          if (error.response.status == 401) {
            setAlertAndOpen("unauthorized_operation");
          } else if (error.response.status == 409) {
            let message = "";
            if (error.response.data.specified_session) {
              message = getCurrentElement("student_already_subscribed");
            } else {
              message = getCurrentElement("student_course_already_attended");
            }
            setAlertAndOpen("error", message);
          } else {
            setAlertAndOpen("wrong_subscription");
          }
        }
      );
    } else {
      if (!enrollment_availability.available_courses) {
        return new Promise(() => setAlertAndOpen("max_courses"));
      } else if (!enrollment_availability.available_credits) {
        return new Promise(() => setAlertAndOpen("max_credits"));
      }
    }
  } else {
    setAlertAndOpen("error");
  }
};
const getCorrectName = (option: LearningArea) => {
  const language = getCurrentLanguage();

  const tmp_learning_area = learning_areas_structures.list.find(
    (a) => a.id == option.id
  );

  return tmp_learning_area != undefined
    ? tmp_learning_area[`${language}_title`]
    : "";
};
const setAlertAndOpen = (
  window: AvailableModal = store.state.event.event,
  message: string = store.state.event.data?.message
) => {
  switch (window) {
    case "max_credits":
      alert_information.title = getCurrentElement("error");
      alert_information.message = getCurrentElement("maximum_credits_error");
      break;
    case "max_courses":
      alert_information.title = getCurrentElement("error");
      alert_information.message = getCurrentElement("maximum_courses_error");
      break;
    case "wrong_subscription":
      alert_information.title = getCurrentElement("error");
      alert_information.message = getCurrentElement("wrong_subscription");
      break;
    case "unauthorized_operation":
      alert_information.title = getCurrentElement("error");
      alert_information.message = getCurrentElement("unauthorized_operation");
      break;
    case "error":
      setupError(message);
      break;
  }
  openAlert.value = true;
};
const closeModal = (window: AvailableModal) => {
  switch (window) {
    case "course_details":
      description_open.value = false;
      break;
    case "confirmation":
      confirmation_open.value = false;
      break;
    case "max_credits":
    case "max_courses":
      openAlert.value = false;
      break;
  }
};
const openDescription = () => {
  description.title = store.state.event.data.title;
  description.course_id = store.state.event.data.course_id;
  description.section = store.state.event.data.section;
  description_open.value = true;
};
const openConfirmation = () => {
  confirmation_open.value = true;
  timer_bar.value = 1;
  timer = setInterval(async () => {
    timer_bar.value -= 0.01;
    if (timer_bar.value <= 0) {
      await confirm(false, true);
    }
  }, 300);
};
const sendConfirmation = async () => {
  await confirm(store.state.event.data.outcome);
};
const confirm = async (outcome: boolean, time_expired = false) => {
  clearInterval(timer);
  try {
    await executeLink(
      "/v1/students/" +
        confirmation_data.student_id +
        "/confirmation?course_id=" +
        confirmation_data.course.id +
        "&session_id=" +
        confirmation_data.session_id +
        "&outcome=" +
        outcome,
      () => {
        if (!time_expired && outcome) {
          subscriptions_manager.updateCourseAndLinked(
            confirmation_data.enrollment_value
          );
          if (confirmation_data.update_credits) {
            subscriptions_manager.updateCredits(confirmation_data.unscribe);
          }
          trigger.value++;
        }
      },
      (error) => {
        if (error.response.status == 401) {
          setAlertAndOpen("unauthorized_operation");
        } else {
          setAlertAndOpen("wrong_subscription");
        }
      },
      "patch"
    );
  } catch (error) {
    setAlertAndOpen();
  }
  closeModal("confirmation");
};
const getBarColor = computed(() => {
  if (timer_bar.value > 0.5) {
    return "success";
  } else if (timer_bar.value > 0.25) {
    return "warning";
  } else {
    return "danger";
  }
});
const updateLearningAreaPlaceholder = (context_id: string) => {
  placeholder =
    learning_areas_structures.distribution[context_id].length > 0
      ? getCurrentElement("select") +
        (language == "italian" ? " l'" : " the ") +
        learning_area_sentence
      : getCurrentElement("no_learning_areas");
};

const store: Store<any> = useStore();
const $route = useRoute();
const $router = useRouter();
const language = getCurrentLanguage();
const user = User.getLoggedUser() as User;
const learning_session_id: string = $route.params.id as string;
const alert_information: AlertInformation = store.state.alert_information;
alert_information.buttons = [getCurrentElement("ok")];

const trigger = ref(0);
const learning_area_sentence = getCurrentElement("learning_area");
const openAlert = ref(false);
const selected_context = ref("");
const selected_area = ref("");
const description_open = ref(false);
const confirmation_open = ref(false);
const learning_sessions: LearningSession[] = await executeLink(
  "/v1/learning_sessions?year_of=" + learning_session_id,
  (response) => response.data.data.map((a: any) => new LearningSession(a)),
  () => []
);
const learning_session_position = learning_sessions.findIndex(
  (a) => a.id == parseInt(learning_session_id)
);
const learning_session =
  learning_session_position != -1
    ? learning_sessions[learning_session_position]
    : undefined;
const ordinary_class: OrdinaryClassSummary =
  learning_session != undefined
    ? await executeLink(
        "/v1/ordinary_classes?student_id=" +
          user.id +
          "&school_year=" +
          learning_session?.school_year,
        (response) =>
          response.data.data.map((a: any) =>
            new OrdinaryClass(a).toOrdinaryClassSummary()
          )[0]
      )
    : undefined;

const description = {
  title: "",
  course_id: -1,
  section: "",
};
const confirmation_data: {
  title: string;
  message: string;
  student_id: number;
  course: EnrollmentCardElements;
  session_id: number | undefined;
  unscribe: boolean;
  enrollment_value: boolean | Date;
  update_credits: boolean;
} = {
  title: "",
  message: "",
  student_id: user.id,
  course: {} as EnrollmentCardElements,
  session_id: learning_session?.id,
  unscribe: false,
  enrollment_value: false,
  update_credits: false,
};
const buttons: CustomElement[] = [
  {
    id: "yes",
    type: "string",
    linkType: "event",
    content: {
      text: getCurrentElement("yes"),
      event: "yes",
      data: {
        outcome: true,
      },
    },
    colors: {
      background: {
        name: "success",
        type: "var",
      },
      text: {
        name: "white",
        type: "var",
      },
    },
    classes: {
      label: {
        "ion-padding": true,
        radius: true,
      },
    },
  },
  {
    id: "no",
    type: "string",
    linkType: "event",
    content: {
      text: getCurrentElement("no"),
      event: "no",
      data: {
        outcome: false,
      },
    },
    colors: {
      background: {
        name: "danger",
        type: "var",
      },
      text: {
        name: "white",
        type: "var",
      },
    },
    classes: {
      label: {
        "ion-padding": true,
        radius: true,
      },
    },
  },
];
const timer_bar = ref(1);
const subscriptions_manager = new SubscriptionsManager(); // Not ready, later there will be a loadParameters

let learning_areas_structures: {
  list: LearningArea[];
  distribution: TmpList<{ id: string }[]>;
};
let learning_contexts: LearningContext[] = [];
let tmp_courses: EnrollmentCourse[];
let timer: number;
let placeholder = getCurrentElement("no_learning_areas");

if (learning_session != undefined && ordinary_class != undefined) {
  learning_contexts = await getLearningContexts(user, learning_session_id);
  selected_context.value = learning_contexts[0].id;

  learning_areas_structures = await getLearningAreasStructures(
    learning_contexts,
    learning_session_id
  );

  selected_area.value =
    learning_areas_structures.distribution[selected_context.value][0].id;

  if (
    learning_contexts.length > 0 &&
    learning_areas_structures.list.length > 0
  ) {
    tmp_courses = await executeLink(
      "/v2/courses?student_id=" +
        user.id +
        "&session_id=" +
        learning_session_id,
      (response) =>
        response.data.data.map(
          (a: EnrollmentCourseProps) => new EnrollmentCourse(a)
        ),
      () => []
    );

    if (tmp_courses.length > 0) {
      await subscriptions_manager.loadParameters(
        user,
        ordinary_class,
        learning_contexts,
        learning_areas_structures.list,
        learning_sessions,
        tmp_courses,
        learning_session_id
      );
      subscriptions_manager.showCourses(
        selected_context.value,
        selected_area.value
      );

      updateLearningAreaPlaceholder(selected_context.value);
      watch(selected_area, (new_area) => {
        subscriptions_manager.showCourses(selected_context.value, new_area);
        trigger.value++;
      });
    }
  }
  watch(selected_context, (new_context) => {
    updateLearningAreaPlaceholder(new_context);
    selected_area.value =
      learning_areas_structures.distribution[new_context].length > 0
        ? learning_areas_structures.distribution[new_context][0].id
        : "";
    if (tmp_courses.length > 0) {
      subscriptions_manager.showCourses(new_context, selected_area.value);
    }
    trigger.value++;
  });
} else {
  $router.push({ name: "learning_sessions" });
}
</script>

<style scoped>
ion-select {
  width: fit-content;
}

.modal {
  --height: auto;
}
</style>
