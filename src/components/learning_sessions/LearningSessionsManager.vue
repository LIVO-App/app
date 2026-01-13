<template>
  <!-- Global alert modal used for confirm/cancel flows and backend outcomes. -->
  <ion-alert
    :is-open="alert_open"
    :header="alert_information.title"
    :message="alert_information.message"
    :buttons="alert_information.buttons"
    @didDismiss="closeModal()"
    :inputs="alert_information.inputs"
  />
  <div class="ion-padding-horizontal">
    <!-- Top bar: school-year selector and (in view mode) a quick-add school-year input. -->
    <ion-grid
      class="ion-padding-end"
      style="border-bottom: 1px solid var(--ion-color-medium)"
    >
      <ion-row class="ion-align-items-center">
        <ion-col size="12" size-xl="6">
          <!-- School year currently in focus (drives the table content). -->
          <custom-select
            :key="year_trigger + 'school_year_choice'"
            v-model:selected_option="selected_school_year"
            :list="school_years"
            :label="getCurrentElement('school_year') + ':'"
            :aria_label="getCurrentElement('school_year')"
            :placeholder="getCurrentElement('school_year_choice')"
            :getCompleteName="schoolYearSelector"
            :disabled="action != 'view'"
          />
        </ion-col>
        <template v-if="action == 'view'">
          <!-- New school-year proposal: input + add action (only when not editing/proposing). -->
          <ion-col size="7" size-xl="4">
            <ionic-element
              :key="year_trigger"
              :element="elements['school_year_to_add']"
            />
          </ion-col>
          <ion-col size="2">
            <ionic-element
              :element="elements['add_school_year']"
              @signal_event="addSchoolYear"
            />
          </ion-col>
        </template>
      </ion-row>
    </ion-grid>

    <div class="ion-margin">
      <ionic-element
        :element="
          getCustomMessage(
            'learning_sessions',
            getCurrentElement('learning_sessions'),
            'title'
          )
        "
      />
    </div>

    <!-- Action bar:
         - view: edit toggle (only for current/future years)
         - edit: confirm edits
         - propose: send proposal
         - edit/propose: cancel + add session
    -->
    <div class="flex ion-margin">
      <template v-if="learning_sessions_data.cards[''].length">
        <ionic-element
          v-if="action == 'propose'"
          :element="elements['send']"
          @signal_event="setupModalAndOpen('confirm')"
        />
        <ionic-element
          v-else-if="selected_school_year >= getCurrentSchoolYear()"
          :element="action == 'view' ? elements['edit'] : elements['view']"
          @signal_event="editOrConfirmEdits(action)"
        />
      </template>
      <ionic-element
        v-if="['edit', 'propose'].includes(action)"
        :element="elements['cancel']"
        @signal_event="setupModalAndOpen('cancel_confirm')"
      />
      <template v-if="action == 'propose' || action == 'edit'">
        <span
          class="flex ion-margin-horizontal ion-align-self-stretch"
          style="border-left: 1px solid var(--ion-color-medium)"
        ></span>
        <!-- Adds a new session row with suggested dates based on the last session. -->
        <ionic-element
          :element="elements['add_learning_session']"
          @signal_event="addLearningSession"
        />
      </template>
    </div>

    <!-- Main table: editable list of sessions for the selected school year. -->
    <div class="ion-margin-top ion-margin-horizontal">
      <ionic-table
        :key="trigger"
        :emptiness_message="
          getCustomMessage(
            'no_learning_sessions',
            getCurrentElement('no_learning_sessions')
          )
        "
        :first_row="first_row"
        :sizes="column_sizes"
        list_breakpoint="md"
        v-model:data="learning_sessions_data"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * @displayName LearningSessionsManager
 * @description
 * Admin tool to propose/edit learning sessions per school year.
 * Renders sessions as an editable table (via `IonicTable`) with confirm/cancel flows.
 *
 * Actions are handled through alerts and backend calls (`executeLink`) depending on the current modality
 * (`view` / `edit` / `propose`).
 */

import {
  AlertInformation,
  CustomElement,
  GeneralTableCardElements,
  LearningSession,
  LearningSessionCreateProps,
  LearningSessionUpdateProps,
  OrderedCardsList,
  PropositionActions,
} from "@/types";
import {
  dateStringToDate,
  executeLink,
  getCompleteSchoolYear,
  getCurrentElement,
  getCurrentSchoolYear,
  getCustomMessage,
  getIcon,
} from "@/utils";
import { IonAlert, IonCol, IonGrid, IonRow } from "@ionic/vue";
import { Ref, ref, watch } from "vue";
import { useStore } from "vuex";

type availableModal = "confirm" | "cancel_confirm" | "success" | "error";

/**
 * Adds a new school year to the selector and switches to "propose" mode.
 *
 * This flow is available only while in `view` mode. The new year is kept in a
 * temporary state (marked "to confirm") until the proposal is submitted.
 */
const addSchoolYear = () => {
  const newYear = parseInt(elements["school_year_to_add"].content as string);
  if (
    !isNaN(newYear) &&
    newYear >= new Date().getFullYear() &&
    !school_years.find((sy) => sy.id == newYear)
  ) {
    school_years.unshift({ id: newYear });
    selected_school_year.value = newYear;
    learning_sessions[selected_school_year.value] = [];
    new_year_to_create.value = newYear;
    changeModality("propose");
    elements["school_year_to_add"].content = "";
    year_trigger.value++;
  } else {
    setAlertError(getCurrentElement("set_valid_school_year"));
    alert_open.value = true;
  }
};

/**
 * Appends a new learning session row, using defaults derived from the last
 * existing session (either from the previous year or from the current table).
 *
 * The new session uses a temporary negative id until persisted by the backend.
 */
const addLearningSession = () => {
  let new_tmp_id = -1,
    converted_cards: LearningSessionCreateProps[],
    last_session,
    last_session_card,
    new_number,
    new_start,
    new_num_groups;

  const refer_year = learning_sessions[selected_school_year.value].length
    ? null
    : school_years[1].id;
  if (refer_year) {
    last_session =
      learning_sessions[refer_year][
        learning_sessions[refer_year].reduce(
          (maxIndex, current, currentIndex, array) => {
            if (current.id <= new_tmp_id) {
              new_tmp_id = current.id - 1;
            }
            return Math.abs(current.number) > Math.abs(array[maxIndex].number)
              ? currentIndex
              : maxIndex;
          },
          0
        )
      ];
    new_number = 1;
    new_start = new Date(last_session.end);
    new_start.setFullYear(selected_school_year.value);
    new_start.setMonth(new_start.getMonth() + 4);
    new_num_groups = last_session.num_groups;
  } else {
    converted_cards = learning_sessions_data.cards[""].map((card) =>
      LearningSession.getBackendCreateObject(card, window.innerWidth)
    );
    last_session_card =
      converted_cards[
        converted_cards.reduce((maxIndex, current, currentIndex, array) => {
          const tmp_id = parseInt(
            learning_sessions_data.cards[""][currentIndex].id
          );
          if (tmp_id <= new_tmp_id) {
            new_tmp_id = tmp_id - 1;
          }
          return Math.abs(current.number) > Math.abs(array[maxIndex].number)
            ? currentIndex
            : maxIndex;
        }, 0)
      ];
    new_number = last_session_card.number + 1;
    new_start = dateStringToDate(last_session_card.end, true);
    new_num_groups = last_session_card.num_groups;
  }

  new_start.setDate(new_start.getDate() + 1);
  const new_end = new Date(new_start);
  new_end.setMonth(new_end.getMonth() + 2);
  const new_open_day = new Date(new_start);
  new_open_day.setDate(new_open_day.getDate() - 15);
  const new_session = new LearningSession({
    id: new_tmp_id,
    number: new_number,
    school_year: selected_school_year.value,
    start: new_start.toISOString(),
    end: new_end.toISOString(),
    num_groups: new_num_groups,
    open_day: new_open_day.toISOString(),
  });

  learning_sessions[selected_school_year.value].push(new_session);
  learning_sessions_data.cards[""].push(new_session.toTableCard(action.value));

  trigger.value++;
};

/**
 * Formats school years for the select component.
 *
 * If the year is the one currently being proposed, it gets a "to confirm" tag.
 */
const schoolYearSelector = (school_year: { id: number }) => {
  return school_year.id == new_year_to_create.value
    ? getCompleteSchoolYear(school_year.id) +
        " (" +
        getCurrentElement("to_confirm") +
        ")"
    : "" + getCompleteSchoolYear(school_year.id);
};

/**
 * Prepares and opens a confirmation/cancellation alert.
 *
 * The actual handler depends on the current `action` (propose vs edit).
 */
const setupModalAndOpen = async (window?: availableModal) => {
  const actual_window: availableModal = window || store.state.event.event;

  switch (actual_window) {
    case "confirm":
      alert_information.title = "";
      alert_information.message = getCurrentElement(
        action.value == "propose"
          ? "learning_sessions_proposal_confirm"
          : "learning_sessions_edits_confirm"
      );
      alert_information.buttons = [
        {
          text: getCurrentElement("yes"),
          role: "yes",
          handler: () => checkAndSendEdits(action.value),
        },
        getCurrentElement("no"),
      ];
      break;
    case "cancel_confirm":
      alert_information.title = "";
      alert_information.message = getCurrentElement(
        action.value == "propose"
          ? "cancel_school_year_proposal_confirm"
          : "cancel_edits_confirm"
      );
      alert_information.buttons = [
        {
          text: getCurrentElement("yes"),
          role: "yes",
          handler: () => cancelEdits(action.value),
        },
        getCurrentElement("no"),
      ];
      break;
  }
  alert_open.value = true;
};

/** Closes the currently open alert. */
const closeModal = () => {
  alert_open.value = false;
};

/**
 * Configures the global alert as an error or warning.
 *
 * This component uses the same alert instance for many flows, so this helper
 * centralizes title/message/buttons.
 */
const setAlertError = (message: string | undefined, is_warning = false) => {
  alert_information.title = getCurrentElement(is_warning ? "warning" : "error");
  alert_information.message = message ?? getCurrentElement("general_error");
  alert_information.buttons = [getCurrentElement("ok")];
};

/**
 * Rebuilds the table cards for the given school year from in-memory sessions.
 *
 * This is called when switching year and when changing modality.
 */
const updateLearningSessions = (school_year: number) => {
  learning_sessions_data.cards[""] = [];
  for (const element of learning_sessions[school_year] || []) {
    learning_sessions_data.cards[""].push(element.toTableCard(action.value));
  }
};

/**
 * Switches component modality (view/edit/propose) and refreshes the table.
 */
const changeModality = async (new_action: PropositionActions) => {
  action.value = new_action;
  updateLearningSessions(selected_school_year.value);
  trigger.value++;
};

/**
 * In view mode, enters edit mode. In edit mode, asks for confirmation to save.
 */
const editOrConfirmEdits = (action: PropositionActions) => {
  if (action == "view") {
    changeModality("edit");
  } else {
    // edit
    setupModalAndOpen("confirm");
  }
};

/**
 * Sends changes to the backend.
 *
 * - propose: sends all sessions as creations
 * - edit: updates changed rows and creates newly appended rows
 *
 * Returns the outcome and (when creating) the id mapping needed to update
 * temporary ids in memory.
 */
const sendEdits = async (
  action: PropositionActions,
  changes_made: boolean[]
) => {
  const new_ids = {
    from_idx: -1,
    first_id: -1,
  };

  let sessions_to_add: LearningSessionCreateProps[] = [];
  let backend_object: LearningSessionUpdateProps,
    outcome = true;

  if (action == "propose") {
    sessions_to_add = sessions_to_add.concat(
      learning_sessions_data.cards[""].map((card) =>
        LearningSession.getBackendCreateObject(card, window.innerWidth)
      )
    );
    new_ids.from_idx = 0;
  } else {
    // edit
    for (let i = 0; i < changes_made.length; i++) {
      if (!changes_made[i]) {
        continue;
      }

      backend_object = LearningSession.getBackendUpdateObject(
        learning_sessions_data.cards[""][i],
        window.innerWidth
      );
      if (i < original_sessions.length) {
        await executeLink(
          "/v1/learning_sessions/" + learning_sessions_data.cards[""][i].id,
          undefined,
          (error) => {
            const error_code = error.response.status;

            let error_message = getCurrentElement(
              "learning_session_not_updated"
            );

            if (error_code == 400) {
              error_message = getCurrentElement("learning_session_not_valid");
            } else if (error_code == 401) {
              error_message = getCurrentElement("unauthorized_operation");
            } else if (error_code == 404) {
              error_message = getCurrentElement("learning_session_not_found");
            }
            outcome = false;

            setAlertError(error_message);
            setTimeout(() => {
              alert_open.value = true;
            }, 300);
          },
          "put",
          {
            session_info: backend_object,
          }
        );
      } else {
        if (new_ids.from_idx == -1) {
          new_ids.from_idx = i;
        }
        sessions_to_add.push(
          LearningSession.getBackendCreateObject(
            learning_sessions_data.cards[""][i],
            window.innerWidth
          )
        );
      }
    }
  }
  if (sessions_to_add.length > 0) {
    await executeLink(
      "/v1/learning_sessions",
      (response) => {
        const errors: {
          existing: string | null;
          wrong: string | null;
          overlaping: string | null;
        } = {
          existing: null,
          wrong: null,
          overlaping: null,
        };

        let message = getCurrentElement("learning_sessions_added");
        alert_information.title = getCurrentElement("success");
        alert_information.buttons = [getCurrentElement("ok")];

        if (response.data.existing_class) {
          errors.existing = getCurrentElement("existing_learning_session");
        }
        if (response.data.wrong_class) {
          errors.wrong = getCurrentElement("wrong_learning_session");
        }
        if (response.data.overlapping) {
          errors.overlaping = getCurrentElement("overlapping_learning_session");
        }
        if (errors.existing !== null || errors.wrong !== null) {
          message = getCurrentElement("learning_sessions_partially_added");
          for (const error of Object.values(errors)) {
            if (error !== null) {
              message += `. ${error}`;
            }
          }
          alert_information.title = getCurrentElement("error");
        }
        alert_information.message = message;
        if (new_ids.first_id == -1) {
          new_ids.first_id = parseInt(response.data.first_inserted_id);
        }
        setTimeout(() => {
          alert_open.value = true;
        }, 300);
      },
      (error) => {
        const error_code = error.response.status;

        let error_message = getCurrentElement("learning_session_not_created");

        if (error_code == 409) {
          error_message = getCurrentElement(
            `learning_sessions_already_existent`
          );
        } else if (error_code == 400) {
          if (error.response.overlapping) {
            error_message = getCurrentElement(
              action == "propose"
                ? "all_overlapping_learning_session"
                : "overlapping_learning_session"
            );
          } else {
            error_message = getCurrentElement("learning_session_not_valid");
          }
        } else if (error_code == 401) {
          error_message = getCurrentElement("unauthorized_operation");
        }
        outcome = false;
        setAlertError(error_message);
        setTimeout(() => {
          alert_open.value = true;
        }, 300);
      },
      "post",
      {
        sessions_list: sessions_to_add,
      }
    );
  }

  return {
    outcome: outcome,
    new_ids: new_ids,
  };
};

/**
 * Applies backend-confirmed changes locally.
 *
 * This updates the in-memory `learning_sessions` objects from the table cards,
 * assigns new ids for newly created sessions, and refreshes `original_sessions`.
 */
const applyChanges = (new_ids: { from_idx: number; first_id: number }) => {
  let ls_card: GeneralTableCardElements, new_id: number;

  original_sessions = [];
  for (let i = 0; i < learning_sessions_data.cards[""].length; i++) {
    ls_card = learning_sessions_data.cards[""][i];
    const ls_idx = learning_sessions[selected_school_year.value].findIndex(
      (ls) => "" + ls.id == ls_card.id
    );
    learning_sessions[selected_school_year.value][ls_idx].updateFromTableCard(
      ls_card,
      window.innerWidth
    );
    new_id =
      new_ids.from_idx != -1 && i >= new_ids.from_idx
        ? new_ids.first_id + (i - new_ids.from_idx)
        : -1;
    if (new_id != -1) {
      learning_sessions[selected_school_year.value][ls_idx].id = new_id;
    }
    original_sessions.push(
      LearningSession.copy(
        learning_sessions[selected_school_year.value][ls_idx]
      )
    );
  }
};

/**
 * Validates the table rows (ordering, date constraints, group count) and, if
 * needed, sends updates/creates to the backend.
 */
const checkAndSendEdits = async (action: PropositionActions) => {
  const changes_made: boolean[] = [];
  let last_end_date: Date | null = null,
    error_message: string,
    outcome: {
      outcome: boolean;
      new_ids: {
        from_idx: number;
        first_id: number;
      };
    };

  for (let i = 0; i < learning_sessions_data.cards[""].length; i++) {
    const ls = LearningSession.getBackendUpdateObject(
      learning_sessions_data.cards[""][i],
      window.innerWidth
    );
    const ls_dates = {
      open_day: dateStringToDate(ls.open_day, true),
      start: dateStringToDate(ls.start, true),
      end: dateStringToDate(ls.end, true),
    };
    const original_ls =
      original_sessions.length > 0 ? original_sessions[i] : null;
    const today = new Date();
    today.setHours(0);
    const start_12_days_before = new Date(ls_dates.start);
    start_12_days_before.setDate(start_12_days_before.getDate() - 12);
    const time_dates = [
      [ls_dates.open_day.getTime(), original_ls?.open_day.getTime()],
      [ls_dates.start.getTime(), original_ls?.start.getTime()],
      [ls_dates.end.getTime(), original_ls?.end.getTime()],
    ];
    const changed_dates = time_dates.map((dates) => dates[0] != dates[1]);
    const past_dates = time_dates.map(
      (dates) => dates[0] && dates[1] && dates[0] < dates[1]
    );
    changes_made.push(Object.values(changed_dates).indexOf(true) != -1);

    error_message = "";

    // if (
    //   [ls_dates.open_day, ls_dates.start, ls_dates.end].findIndex(
    //     (d, i) => changed_dates[i] && d < today
    //   ) != -1
    // ) {
    //   error_message = getCurrentElement("date_in_past_error");
    if (past_dates.indexOf(true) != -1) {
      error_message = getCurrentElement("anticipate_learning_session_error");
    } else if (changed_dates[1] && ls_dates.open_day > start_12_days_before) {
      error_message = getCurrentElement("open_day_too_close");
    } else if (ls_dates.start >= ls_dates.end) {
      error_message = getCurrentElement("start_after_end");
    } else if (ls.num_groups < 1) {
      error_message = getCurrentElement("at_least_one_group");
    }
    changes_made[changes_made.length - 1] =
      changes_made[changes_made.length - 1] ||
      ls.num_groups != original_ls?.num_groups;

    if (last_end_date == null) {
      last_end_date = ls_dates.end;
    } else if (last_end_date != null && ls_dates.start < last_end_date) {
      error_message = getCurrentElement("sessions_not_in_order");
    }

    if (error_message) {
      setTimeout(() => {
        setAlertError(error_message);
        alert_open.value = true;
      }, 300);
      return;
    }
  }
  if (changes_made.indexOf(true) != -1) {
    outcome = await sendEdits(action, changes_made);
    if (outcome.outcome) {
      applyChanges(outcome.new_ids);
      if (action == "propose") {
        new_year_to_create.value = -1;
        year_trigger.value++;
      }
    }
    changeModality("view");
  } else {
    setTimeout(() => {
      setAlertError(getCurrentElement("no_changes_detected"), true);
      alert_open.value = true;
      changeModality("view");
    }, 300);
  }
};

/**
 * Discards pending edits.
 *
 * - propose: removes the newly added school year and its sessions
 * - edit: restores sessions from `original_sessions`
 */
const cancelEdits = (action: PropositionActions) => {
  if (action == "propose") {
    delete learning_sessions[new_year_to_create.value];
    school_years.shift();
    selected_school_year.value = school_years[0]?.id ?? -1;
    new_year_to_create.value = -1;
    year_trigger.value++;
  } else {
    // edit
    learning_sessions[selected_school_year.value] = original_sessions;
  }
  changeModality("view");
};

const store = useStore();
defineEmits(["signal_event"]);
const button_css = store.state.button_css;
const alert_information: AlertInformation = store.state.alert_information;

const elements: {
  [key: string]: CustomElement;
} = {
  school_year_to_add: {
    id: "school_year_to_add",
    type: "input",
    content: "",
    params: {
      placeholder: getCurrentElement("new_school_year"),
    },
  },
  add_school_year: {
    id: "add_school_year",
    type: "string_icon",
    linkType: "event",
    content: {
      text: getCurrentElement("add"),
      icon: getIcon("add"),
      event: "add",
      whole_link: true,
    },
    ...button_css,
  },
  add_learning_session: {
    id: "add_learning_session",
    type: "string_icon",
    linkType: "event",
    content: {
      text: getCurrentElement("add_session"),
      icon: getIcon("add"),
      event: "add",
      whole_link: true,
    },
    ...button_css,
  },
  send: {
    id: "send",
    type: "string_icon",
    linkType: "event",
    content: {
      event: "send",
      icon: getIcon("checkmark"),
      text: getCurrentElement("confirm"),
      whole_link: true,
    },
    ...button_css,
  },
  cancel: {
    id: "cancel",
    type: "string_icon",
    linkType: "event",
    content: {
      event: "cancel",
      icon: getIcon("close"),
      text: getCurrentElement("cancel"),
      whole_link: true,
    },
    ...button_css,
  },
  edit: {
    id: "edit",
    type: "string_icon",
    linkType: "event",
    content: {
      event: "edit",
      icon: getIcon("pencil"),
      text: getCurrentElement("edit"),
      whole_link: true,
    },
    ...button_css,
  },
  view: {
    id: "view",
    type: "string_icon",
    linkType: "event",
    content: {
      event: "view",
      icon: getIcon("eye"),
      text: getCurrentElement("view"),
      whole_link: true,
    },
    ...button_css,
  },
};

const year_trigger = ref(0);
const trigger = ref(0);
const selected_school_year = ref(-1);
const action: Ref<PropositionActions> = ref("view");
const alert_open = ref(false);
const new_year_to_create = ref(-1);
const current_school_year = getCurrentSchoolYear();
const school_years: {
  id: number;
}[] = [];
const learning_sessions: {
  [key: number]: LearningSession[];
} = {};
const column_sizes: number[] = [2, 2, 2, 2, 1, 3];
const first_row: CustomElement[] = [
  getCustomMessage("number", getCurrentElement("number")),
  getCustomMessage("school_year", getCurrentElement("school_year")),
  getCustomMessage("start", getCurrentElement("start_date")),
  getCustomMessage("end", getCurrentElement("end_date")),
  getCustomMessage("groups", getCurrentElement("groups")),
  getCustomMessage("open_day", getCurrentElement("open_day")),
];
const learning_sessions_data: OrderedCardsList<GeneralTableCardElements> = {
  order: [],
  cards: {
    "": [],
  },
};

let original_sessions: LearningSession[] = [];

await executeLink("/v1/learning_sessions", (response) => {
  for (const sy of response.data.data) {
    if (!learning_sessions[sy.school_year]) {
      learning_sessions[sy.school_year] = [];
    }
    learning_sessions[sy.school_year].push(new LearningSession(sy));
  }
});
await executeLink("/v1/learning_sessions/school_years", (response) => {
  const tmp_years: { school_year: number }[] = response.data.data;
  tmp_years.sort((a, b) => b.school_year - a.school_year);
  for (const sy of tmp_years) {
    school_years.push({
      id: sy.school_year,
    });
  }
  selected_school_year.value =
    school_years.find((sy) => sy.id === current_school_year)?.id ??
    school_years[0].id;
});

watch(
  selected_school_year,
  (new_school_year, old_school_year) => {
    // When switching year: snapshot the original data (for cancel) and rebuild the table.
    if (new_school_year != -1) {
      original_sessions = learning_sessions[new_school_year].map((ls) =>
        LearningSession.copy(ls)
      );

      updateLearningSessions(new_school_year);
      trigger.value++;
    } else {
      selected_school_year.value = old_school_year ?? -1;
    }
  },
  { immediate: true }
);
</script>

<style></style>
