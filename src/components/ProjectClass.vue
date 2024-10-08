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
      id="grades_manager"
      :is-open="grades_open"
      @didDismiss="closeModal('grades')"
    >
      <suspense>
        <template #default>
          <grades-manager
            :title="grades_title"
            :parameters="grades_parameters"
            :grades="student_grades"
            @close="closeModal('grades')"
            @signal_event="manageEvent()"
          />
        </template>
        <template #fallback>
          <loading-component />
        </template>
      </suspense>
    </ion-modal>
    <ion-modal
      id="multiple_grades_manager"
      :is-open="multiple_grades_open"
      @didDismiss="closeModal('multiple_grades')"
    >
      <suspense>
        <template #default>
          <multiple-grades-manager
            :parameters="multiple_grades_parameters"
            :final_grades_indexes="final_grades_indexes"
            @close="closeModal('multiple_grades')"
            @signal_event="manageEvent()"
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
            :learning_session_id="session_id"
            :section="selected_section"
            @close="closeModal('course_details')"
          />
        </template>
        <template #fallback>
          <loading-component />
        </template>
      </suspense>
    </ion-modal>
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
            :ordinary_class="student_mover_data.parameters.ordinary_class"
            :learning_sessions="learning_sessions"
            :project_class="project_class?.toProjectClassSummary()"
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
    <div>
      <ionic-element
        v-for="button in buttons.slice(0, 2)"
        :key="button.id"
        :element="button"
        @signal_event="setupModalAndOpen()"
        @execute_link="$router.push(store.state.request.url)"
      />
    </div>
    <ionic-element
      v-if="
        user.type == 'teacher' &&
        !associated_teacher &&
        (learning_session_status == LearningSessionStatus.CURRENT ||
          learning_session_status == LearningSessionStatus.COMPLETED) &&
        !areAllFinals()
      "
      :element="buttons[2]"
      @signal_event="manageEvent()"
    />
    <template
      v-if="
        user.type == 'admin' &&
        learning_session != undefined &&
        project_class != undefined &&
        (learning_session_status == LearningSessionStatus.UPCOMING ||
          learning_session_status == LearningSessionStatus.FUTURE)
      "
    >
      <template v-if="project_class.final_confirmation == undefined">
        <ionic-element
          :element="
            getCustomMessage(
              'project_class_status',
              getCurrentElement('project_class_status') +
                ':' +
                (learning_session_status != LearningSessionStatus.UPCOMING
                  ? ' ' + getCurrentElement('not_confirmed')
                  : ''),
              'string',
              undefined,
              {
                label: {
                  'ion-padding-end': true,
                },
              }
            )
          "
        />
        <ion-button
          v-if="learning_session_status == LearningSessionStatus.UPCOMING"
          @click="
            () => {
              store.state.event.event = 'confirmation';
              setupModalAndOpen();
            }
          "
        >
          {{ getCurrentElement("confirm") }}
        </ion-button>
      </template>
      <template v-else>
        <ionic-element
          :element="
            getCustomMessage(
              'project_class_confirmation_date',
              getCurrentElement('project_class_confirmation_date') +
                ': ' +
                toDateString(project_class.final_confirmation)
            )
          "
        />
      </template>
    </template>
    <custom-select
      v-if="sections_use"
      v-model:selected_option="selected_section"
      :list="sections"
      :label="getCurrentElement('section') + ':'"
      :aria_label="getCurrentElement('section')"
      :placeholder="getCurrentElement('section_choice')"
    />
    <suspense>
      <template #default>
        <div class="ion-padding-top">
          <ionic-table
            :key="students_trigger"
            :emptiness_message="
              getCustomMessage(
                'emptiness_message',
                getCurrentElement('no_students')
              )
            "
            :data="table_data"
            :first_row="first_row"
            :sizes="column_sizes"
            @signal_event="setupModalAndOpen()"
            @execute_link="$router.push(store.state.request.url)"
          />
        </div>
      </template>
      <template #fallback>
        <loading-component />
      </template>
    </suspense>
    <!-- TODO (5): Aggiungere tabella pending -->
  </div>
</template>

<script setup lang="ts">
import {
  AlertInformation,
  CustomElement,
  EditableState,
  Grade,
  GradeProps,
  ProjectClassStudent,
  User,
  LearningSession,
  LearningSessionStatus,
  Course,
  AdminProjectClass,
  TmpList,
  SubscriptionsManagerMode,
  SubscriptionsManager,
  Outcome,
  SuccessCodes,
  ErrorCodes,
  EnrollmentAvailability,
  GeneralTableCardElements,
  OrderedCardsList,
  SingleGradesParameters,
  MultipleGradesParameters,
  StudentGrade,
} from "@/types";
import {
  executeLink,
  getAviableLanguages,
  getCurrentElement,
  getCustomMessage,
  getIcon,
  removeTableIndexedElement,
  setupError,
  toDateString,
} from "@/utils";
import { IonModal, IonAlert, AlertButton, IonButton } from "@ionic/vue";
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";

type AvailableModal =
  | "grades"
  | "multiple_grades"
  | "course_details"
  | "empty_descriptions"
  | "edit_grade"
  | "remove_grade"
  | "student_mover"
  | "move_student"
  | "remove_student"
  | "confirmation"
  | "success"
  | "error";

const setupModalAndOpen = (window?: AvailableModal, message?: string) => {
  //<!-- ! (3): una volta che si sposta qualcuno il bottone check per spostare qualcun'altro non funziona
  const actual_window: AvailableModal = window ?? store.state.event.event;
  const actual_message: string = message ?? store.state.event.data?.message;

  let tmp_grade: Grade, new_grade: Grade, tmp_description: string;

  switch (actual_window) {
    case "grades":
      grades_title = store.state.event.data.title;
      grades_parameters = {
        ...store.state.event.data.parameters,
        associated_teacher: associated_teacher,
        final_grade_index:
          final_grades_indexes[store.state.event.data.parameters.student_id],
      };
      student_grades = grades[grades_parameters.student_id];
      grades_open.value = true;
      break;
    case "remove_grade":
    case "edit_grade":
      findGrade();
      if (grade_index.student_id != -1 && grade_index.index != -1) {
        tmp_grade = grades[grade_index.student_id][grade_index.index];
        alert_information.title = "";
        alert_information.message = getCurrentElement(
          (actual_window == "edit_grade" ? "edit" : "remove") +
            "_grade_confirmation"
        );
        /*+ (grade_index != undefined
          ? "<br />" + getCurrentElement("description") + ": " + tmp_grade[`${language}_description`] + "<br />"
          + getCurrentElement("grade") + ": " + tmp_grade.grade + " [" + getCurrentElement("final") + "]"
          : "");*/ //<!-- TODO (5): abilita innerHTMLTemplatesEnabled nelle config per farlo funzionare
        if (actual_window == "edit_grade") {
          new_grade = store.state.event.data.new_grade;
          edits_to_send = {
            id: false,
            italian_description: false,
            english_description: false,
            publication: false,
            grade: false,
            final: false,
          };
          //alert_information.message += "\n" + getCurrentElement("with_following_edits");
          for (const tmp_language of languages) {
            tmp_description = `${tmp_language}_description`;
            if (tmp_grade[tmp_description] != new_grade[tmp_description]) {
              edits_to_send[tmp_description] = true;
              //alert_information.message += "\n" + getCurrentElement(`${language}_description`) + ": " + new_grade[`${language}_description`];
            }
          }
          if (
            tmp_grade.publication.getTime() != new_grade.publication.getTime()
          ) {
            edits_to_send.publication_date = true;
            //alert_information.message += "\n" + getCurrentElement("date") + ": " + toDateString(new_grade.publication);
          }
          if (tmp_grade.grade != new_grade.grade) {
            edits_to_send.grade = true;
            //alert_information.message += "\n" + getCurrentElement("grade") + ": " + new_grade.grade;
          }
        }
        alert_information.buttons = [
          handled_buttons[0],
          getCurrentElement("no"),
        ];
        alert_open.value = true;
      } else {
        setupError();
        alert_open.value = true;
      }
      break;
    case "remove_student":
      findStudent();
      if (student_index.student_list != -1 && student_index.table != -1) {
        alert_information.title = "";
        alert_information.message = getCurrentElement(
          "remove_student_confirmation"
        );
        alert_information.buttons = [
          handled_buttons[0],
          getCurrentElement("no"),
        ];
        alert_open.value = true;
      } else {
        setupError();
        alert_open.value = true;
      }
      break;
    case "student_mover":
      student_mover_data = {
        title: store.state.event.data.title,
        parameters: store.state.event.data.parameters,
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
    case "empty_descriptions":
      alert_information.title = getCurrentElement("error");
      alert_information.message = getCurrentElement("empty_descriptions");
      alert_information.buttons = [getCurrentElement("ok")];
      alert_open.value = true;
      break;
    case "course_details":
      description_title = store.state.event.data.title;
      description_course_id = store.state.event.data.course_id;
      description_open.value = true;
      break;
    case "confirmation":
      alert_information.title = getCurrentElement("project_class_confirmation");
      alert_information.message = getCurrentElement(
        "project_class_confirmation_question"
      );
      alert_information.buttons = [handled_buttons[0], getCurrentElement("no")];
      alert_open.value = true;
      break;
    case "multiple_grades":
      multiple_grades_parameters.section = selected_section.value;
      multiple_grades_open.value = true;
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
const closeModal = (window: AvailableModal) => {
  switch (window) {
    case "grades":
      grades_open.value = false;
      break;
    case "multiple_grades":
      multiple_grades_open.value = false;
      break;
    case "course_details":
      description_open.value = false;
      break;
    case "student_mover":
      student_mover_open.value = false;
      break;
    case "empty_descriptions":
    case "remove_grade":
    case "edit_grade":
    case "move_student":
    case "confirmation":
    case "remove_student":
    case "success":
    case "error":
      alert_open.value = false;
      break;
  }
};
const add_grade = async () => {
  const data = store.state.event.data;

  executeLink(
    "/v1/students/" +
      data.student_id +
      "/grades?course_id=" +
      data.course_id +
      "&session_id=" +
      data.session_id,
    (response) => {
      const tmp_grade = new Grade({
        id: response.data.value.id,
        publication: response.data.value.publication,
        italian_description: data.italian_description,
        english_description: data.english_description,
        grade: data.grade,
        final: data.final ? 1 : 0,
      });

      grades[data.student_id].push(tmp_grade);
      updateFinalRefs(data.student_id, tmp_grade);
    },
    () => setupModalAndOpen("error"),
    "post",
    {
      ita_description: data.italian_description,
      eng_description: data.english_description,
      publication_date: data.publication_date,
      grade: data.grade,
      final: data.final,
    }
  );
};

const add_grades = () => {
  const data = store.state.event.data;

  executeLink(
    "/v1/grades?course_id=" + data.course_id + "&session_id=" + data.session_id,
    (response) => {
      let tmp_grade: Grade;

      for (const grade_ref of response.data.grades_id) {
        tmp_grade = new Grade({
          id: grade_ref.id,
          publication: response.data.publication,
          italian_description: data.italian_description,
          english_description: data.english_description,
          grade: data.grades_list.find(
            (a: StudentGrade<number>) => a.student_id == grade_ref.student_id
          ).grade_value,
          final: data.final ? 1 : 0,
        });

        grades[grade_ref.student_id].push(tmp_grade);
        updateFinalRefs(grade_ref.student_id, tmp_grade);
      }

      if (
        response.data.students_with_errors != undefined &&
        response.data.students_with_errors.length > 0
      ) {
        setupModalAndOpen("error", getCurrentElement("grades_with_errors"));
      } else if (response.data.duplicate_entry == true) {
        setupModalAndOpen(
          "error",
          getCurrentElement("already_existing_grades")
        );
      } else if (response.data.wrong_entry == true) {
        setupModalAndOpen("error");
      }
    },
    () => setupModalAndOpen("error"),
    "post",
    {
      ita_description: data.italian_description,
      eng_description: data.english_description,
      publication_date: data.publication_date,
      grades_list: data.grades_list,
      final: data.final,
    }
  );
};

const updateStudents = async () => {
  students =
    selected_section.value != ""
      ? await executeLink(
          "/v1/project_classes/" +
            course_id +
            "/" +
            session_id +
            "/components?section=" +
            selected_section.value +
            (user.type == "teacher" ? "&teacher_id=" + user.id : ""),
          (response) => {
            const tmp_students: ProjectClassStudent[] = [];

            associated_teacher = response.data.data.associated_teacher;
            multiple_grades_parameters.associated_teacher = associated_teacher;
            column_sizes =
              //(user.type == "teacher" && associated_teacher == true) ||
              user.type == "admin" &&
              project_class?.final_confirmation != undefined
                ? [1, 6, 3, 2]
                : [1, 4, 2, 1.5, 1.5, 2];
            if (first_row.length != column_sizes.length) {
              if (project_class?.final_confirmation == undefined) {
                first_row.push(
                  {
                    id: "move",
                    type: "string",
                    content: getCurrentElement("move"),
                  },
                  {
                    id: "remove",
                    type: "string",
                    content: getCurrentElement("remove"),
                  }
                );
              } else {
                first_row.pop();
                first_row.pop();
              }
            }
            response.data.data.components.map((a: any) => {
              tmp_students.push(
                new ProjectClassStudent(a, course_id, session_id)
              );
            });

            return tmp_students;
          },
          () => []
        )
      : [];

  table_data.cards[""] = [];
  for (const student_index in students) {
    //<!-- TODO (5): controllare se ci sono più professori e fare richieste voti solamente sul pulsante (evitare problema di professore che aggiunge mentre altro è nella pagina)
    tmp_student = students[student_index];
    if (user.type == "teacher") {
      grades[tmp_student.id] = await executeLink(
        "/v1/students/" +
          tmp_student.id +
          "/grades?course_id=" +
          course_id +
          "&session_id=" +
          session_id +
          "&teacher_id=" +
          user.id,
        (response: any) =>
          response.data.data.map((a: GradeProps, i: number) => {
            const tmp_grade = new Grade(a);
            if (tmp_grade.final) {
              final_grades_indexes[tmp_student.id] = i;
            }
            return tmp_grade;
          }),
        () => []
      );
    }

    table_data.cards[""].push(
      tmp_student.toTableRow(
        user.type == "teacher" ? user.id : undefined,
        user.type == "teacher",
        user.type == "teacher"
          ? grades[tmp_student.id][final_grades_indexes[tmp_student.id]]
          : undefined,
        project_class?.final_confirmation,
        undefined,
        parseInt(student_index) + 1
      )
    );
  }
};
const manageEvent = () => {
  switch (store.state.event.event) {
    case "add_grade":
      add_grade();
      break;
    case "add_grades":
      add_grades();
      break;
    default:
      setupModalAndOpen();
      break;
  }
};
const yes_handler = async () => {
  let body: {
      [key in keyof GradeProps]?: any;
    },
    edits_props: GradeProps,
    count = 0,
    something_to_edit = false,
    edit_keys: string[],
    tmp_grade: Grade,
    outcome: Outcome,
    index: number;

  switch (store.state.event.event) {
    case "confirmation":
      if (course != undefined && project_class != undefined) {
        if (
          table_data.cards[""].length < course.min_students ||
          table_data.cards[""].length > course.max_students
        ) {
          setTimeout(
            () =>
              setupModalAndOpen(
                "error",
                getCurrentElement("students_number_error")
              ),
            300
          );
        } else if (learning_session_status != LearningSessionStatus.UPCOMING) {
          setTimeout(
            () =>
              setupModalAndOpen(
                "error",
                getCurrentElement("learning_session_not_upcoming")
              ),
            300
          );
        } else if (project_class.final_confirmation != undefined) {
          setTimeout(
            () =>
              setupModalAndOpen(
                "error",
                getCurrentElement("project_class_already_confirmed")
              ),
            300
          );
        } else {
          await executeLink(
            "/v1/project_classes/" +
              course_id +
              "/" +
              session_id +
              "/final_confirmation",
            (response) => {
              (project_class as AdminProjectClass).final_confirmation =
                response.data.confirmation_date != undefined
                  ? new Date(response.data.confirmation_date)
                  : new Date();
              setTimeout(
                () =>
                  setupModalAndOpen(
                    "success",
                    getCurrentElement("project_class_successful_confirmation")
                  ),
                300
              );
              students_update.value++;
            },
            () => setTimeout(() => setupModalAndOpen("error"), 300),
            "put"
          );
        }
      } else {
        setTimeout(() => setupModalAndOpen("error"), 300);
      }
      break;
    case "remove_grade":
      if (learning_session != undefined) {
        tmp_grade = grades[grade_index.student_id][grade_index.index];
        if (associated_teacher) {
          setTimeout(
            () =>
              setupModalAndOpen(
                "error",
                getCurrentElement("no_grade_remotion_permissions")
              ),
            300
          );
        } else if (
          tmp_grade.getEditableStatus(
            final_grades_indexes[grade_index.student_id] != undefined
              ? grades[grade_index.student_id][
                  final_grades_indexes[grade_index.student_id]
                ].publication
              : undefined
          ) != EditableState.EDITABLE
        ) {
          setTimeout(
            () =>
              setupModalAndOpen(
                "error",
                getCurrentElement("cannot_remove_grade")
              ),
            300
          );
        } else {
          await executeLink(
            "/v1/grades/" + store.state.event.data.id,
            () => {
              updateFinalRefs("" + grade_index.student_id, tmp_grade, true);
              grades[grade_index.student_id].splice(grade_index.index, 1);
              setTimeout(
                () =>
                  setupModalAndOpen(
                    "success",
                    getCurrentElement("successful_grade_remotion")
                  ),
                300
              );
              store.state.triggers.grades++;
            },
            () => setTimeout(() => setupModalAndOpen("error"), 300),
            "delete"
          );
        }
      } else {
        setTimeout(() => setupModalAndOpen("error"), 300);
      }
      break;
    case "edit_grade":
      if (learning_session != undefined) {
        edits_props = store.state.event.data.new_grade.toProps();
        body = {
          ita_description: edits_to_send.italian_description
            ? edits_props.italian_description
            : undefined,
          eng_description: edits_to_send.english_description
            ? edits_props.english_description
            : undefined,
          grade: edits_to_send.grade ? edits_props.grade : undefined,
          publication_date: edits_to_send.publication_date
            ? edits_props.publication
            : undefined,
        };
        //<!-- TODO (6): modificare quando ci sarà coerenza nei parametri
        /*for (const key in edits_to_send) {
          if (edits_to_send[key]) {
            body[key] = edits_props[key];
          }
        }*/
        edit_keys = Object.keys(body);

        while (
          !(something_to_edit = body[edit_keys[count]] != undefined) &&
          ++count < edit_keys.length
        );
        if (associated_teacher) {
          setTimeout(
            () =>
              setupModalAndOpen(
                "error",
                getCurrentElement("no_grade_edit_permissions")
              ),
            300
          );
        } else if (!something_to_edit) {
          setTimeout(
            () => setupModalAndOpen("error", getCurrentElement("no_edits")),
            300
          );
        } else if (
          grades[grade_index.student_id][grade_index.index].getEditableStatus(
            final_grades_indexes[grade_index.student_id] != undefined
              ? grades[grade_index.student_id][
                  final_grades_indexes[grade_index.student_id]
                ].publication
              : undefined
          ) != EditableState.EDITABLE
        ) {
          setTimeout(
            () =>
              setupModalAndOpen(
                "error",
                getCurrentElement("cannot_edit_grade")
              ),
            300
          );
        } else {
          await executeLink(
            "/v1/grades/" + store.state.event.data.id,
            () => {
              Object.assign(
                grades[grade_index.student_id][grade_index.index],
                store.state.event.data.new_grade
              );
              tmp_grade = grades[grade_index.student_id][grade_index.index];
              setTimeout(
                () =>
                  setupModalAndOpen(
                    "success",
                    getCurrentElement("successful_edit")
                  ),
                300
              );
              updateFinalRefs(
                "" + grade_index.student_id,
                store.state.event.data.new_grade,
                false,
                false
              );
              store.state.triggers.grades++;
              store.state.triggers.edit_grades++;
            },
            () => setTimeout(() => setupModalAndOpen("error"), 300),
            "put",
            body
          );
        }
      } else {
        setTimeout(() => setupModalAndOpen("error"), 300);
      }
      break;
    case "remove_student":
      if (course != undefined && project_class != undefined) {
        //<!-- TODO (5): mettere controllo contro rimozione numero minimo o parlare con Pietro per toglierlo (anche con move_student)
        if (project_class.final_confirmation != undefined) {
          setTimeout(
            () =>
              setupModalAndOpen(
                "error",
                getCurrentElement("class_already_confirmed")
              ),
            300
          );
        } else {
          await executeLink(
            "/v1/students/" +
              store.state.event.data.parameters.student_id +
              "/remove_class?course_id=" +
              course.id +
              "&session_id=" +
              project_class.learning_session.id,
            () => {
              table_data.cards[""].splice(student_index.table, 1);
              students.splice(student_index.student_list, 1);
              fix_indexes();
              setTimeout(
                () =>
                  setupModalAndOpen(
                    "success",
                    getCurrentElement("successful_student_remotion")
                  ),
                300
              );
              students_trigger.value++;
            },
            () => setTimeout(() => setupModalAndOpen("error"), 300),
            "delete"
          );
        }
      } else {
        setTimeout(() => setupModalAndOpen("error"), 300);
      }
      break;
    case "move_student":
      if (project_class != undefined) {
        outcome = await moveStudent(subscriptions_manager, project_class);
        closeModal("move_student");
        switch (outcome.code) {
          case SuccessCodes.GENERIC:
            index = removeTableIndexedElement(
              table_data,
              store.state.event.data.student_id
            );
            if (students[index].id == store.state.event.data.student_id) {
              students.splice(index, 1);
            } else {
              students.splice(
                students.findIndex(
                  (a) => a.id == store.state.event.data.student_id
                ),
                1
              );
            }
            students_trigger.value++;
            store.state.event.event = "student_mover";
            setTimeout(
              () => setupModalAndOpen("success", outcome.message),
              500
            );
            break;
          case ErrorCodes.GENERIC:
          case ErrorCodes.BAD_REQUEST:
            setTimeout(() => setupModalAndOpen("error", outcome.message), 300);
            break;
        }
      } else {
        setTimeout(() => setupModalAndOpen("error"), 300);
      }
      break;
  }
};
const findGrade = () => {
  let count = 0;

  while (
    (grade_index.index = grades[
      (grade_index.student_id = students[count].id)
    ].findIndex((a) => a.id == store.state.event.data.id)) == -1 &&
    ++count < Object.keys(grades).length
  );
};
const findStudent = () => {
  const tmp_student_id = store.state.event.data.parameters.student_id;

  student_index.table = table_data.cards[""].findIndex(
    (a) => a.id == tmp_student_id
  );
  student_index.student_list = students.findIndex(
    (a) => a.id == tmp_student_id
  );
};
const updateFinalRefs = (
  student_id: string,
  grade: Grade,
  deleted_grade = false,
  update_indexes = true
) => {
  let student_pos: number, final_grade_pos: number;

  if (grade.final == true) {
    student_pos = table_data.cards[""].findIndex((a) => a.id == student_id);
    if (update_indexes) {
      final_grades_indexes[student_id] = grades[student_id].length - 1;
    }
    final_grade_pos = table_data.cards[""][student_pos].content.length - 1;
    if (deleted_grade) {
      table_data.cards[""][student_pos].content[final_grade_pos].content = "-";
      grades_parameters.final_grade_index = undefined;
      delete final_grades_indexes[student_id];
      store.state.triggers.grades++;
    } else {
      table_data.cards[""][student_pos].content[final_grade_pos].content =
        grade.grade;
    }
    students_trigger.value++;
  }
};
const moveStudent = async (
  subscriptions_manager: SubscriptionsManager,
  origin_project_class: AdminProjectClass
): Promise<Outcome> => {
  const outcome: Outcome = {
    code: SuccessCodes.GENERIC,
  };

  let enrollment_availability: EnrollmentAvailability;

  if (subscriptions_manager.mode != SubscriptionsManagerMode.MOVE) {
    outcome.code = ErrorCodes.BAD_REQUEST;
  } else if (
    origin_project_class.final_confirmation != undefined &&
    store.state.event.data.to.final_confirmation != undefined
  ) {
    outcome.code = ErrorCodes.GENERIC;
    outcome.subcode = 0;
    outcome.message = getCurrentElement("class_already_confirmed");
  } else {
    enrollment_availability = subscriptions_manager.checkEnrollmentAvailability(
      store.state.event.data.to.learning_context_id,
      store.state.event.data.to.learning_area_id,
      store.state.event.data.to.course_id,
      store.state.event.data.from.course_id
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
          "/v1/students/" + store.state.event.data.student_id + "/move_class",
          () => {
            outcome.message = getCurrentElement("student_moved");
          },
          () => {
            outcome.code = ErrorCodes.GENERIC;
            outcome.subcode = 2;
          },
          "put",
          {
            from: {
              course_id: store.state.event.data.from.course_id,
              session_id: store.state.event.data.from.session_id,
            },
            to: {
              course_id: store.state.event.data.to.course_id,
              session_id: store.state.event.data.to.session_id,
              section: store.state.event.data.to.section,
            },
          }
        );
      }
    } else {
      outcome.code = ErrorCodes.GENERIC;
      outcome.subcode = 1;
    }
  }

  return outcome;
};
const fix_indexes = () => {
  for (let i = 0; i < table_data.cards[""].length; i++) {
    table_data.cards[""][i].content[0].content = i + 1;
  }
};

const areAllFinals = () => {
  return Object.keys(final_grades_indexes).length == Object.keys(grades).length;
};

const store = useStore();
const $router = useRouter();
const user = User.getLoggedUser() as User;
const sections_use: boolean = store.state.sections_use;
const languages = getAviableLanguages();
const $route = useRoute();
const alert_information: AlertInformation = store.state.alert_information;

const first_row: CustomElement[] = [
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
  {
    id: "class",
    type: "string",
    content: getCurrentElement("class"),
  },
  {
    id: "learning_context",
    type: "string",
    content: getCurrentElement("learning_context"),
  },
];
const grades_open = ref(false);
const multiple_grades_open = ref(false);
const description_open = ref(false);
const student_mover_open = ref(false);
const course_id = $route.params.course as string;
const session_id = $route.params.session as string;
const students_trigger = ref(0);
const students_update = ref(0);
const grades: {
  [student_id: string]: Grade[];
} = {};
const final_grades_indexes: {
  [student_id: string]: number;
} = {};
const alert_open = ref(false);
const sections: { id: string }[] = [];
const tmp_sections: Set<string> = new Set();
const buttons: CustomElement[] = [
  {
    id: "announcements",
    type: "icon",
    linkType: "request",
    content: {
      url: "/announcements/" + course_id + "/" + session_id, //<!-- ? vedere se anche admin può vedere e/o mandare messaggi
      method: "get",
      icon: getIcon("mail"),
    },
  },
  {
    id: "course_details",
    type: "icon",
    linkType: "event",
    content: {
      event: "course_details",
      data: {
        title: "", //<!-- TODO (4): mettere titolo quando ce l'avrà anche la pagina
        course_id: parseInt(course_id),
      },
      icon: getIcon("information_circle"),
    },
  },
  {
    id: "register_grades_series",
    type: "string_icon",
    linkType: "event",
    content: {
      text: getCurrentElement("register_grades_series"),
      icon: getIcon("add"),
      event: "multiple_grades",
      whole_link: true,
    },
    ...store.state.button_css,
  },
];
const selected_section = ref("");
const handled_buttons: AlertButton[] = [
  {
    text: getCurrentElement("yes"),
    handler: yes_handler,
  },
];
const grade_index = {
  student_id: -1,
  index: -1,
};
const student_index = {
  student_list: -1,
  table: -1,
};
const learning_sessions: LearningSession[] = await executeLink(
  "/v1/learning_sessions?year_of=" + session_id,
  (response) => response.data.data.map((a: any) => new LearningSession(a)),
  () => []
);
const learning_session_position = learning_sessions.findIndex(
  (a) => a.id == parseInt(session_id)
);
const learning_session =
  learning_session_position != -1
    ? learning_sessions[learning_session_position]
    : undefined;
const learning_session_status =
  learning_session != undefined ? learning_session.getStatus() : undefined;
const subscriptions_manager = new SubscriptionsManager(
  SubscriptionsManagerMode.MOVE
); // Not ready, loadParameters will be run with project-class-selector
const table_data: OrderedCardsList<GeneralTableCardElements> = {
  order: [],
  cards: {
    "": [],
  },
};
const multiple_grades_parameters: MultipleGradesParameters = {
  course_id: parseInt(course_id),
  session_id: parseInt(session_id),
  teacher_id: user.id,
  section: selected_section.value,
};

let grades_title: string;
let grades_parameters: SingleGradesParameters;
let student_grades: Grade[] | undefined;
let description_title: string;
let description_course_id: number;
let associated_teacher: boolean | undefined;
let course: Course | undefined;
let project_class: AdminProjectClass | undefined;
let students: ProjectClassStudent[] = [];
let tmp_student: ProjectClassStudent;
let edits_to_send: {
  [key in keyof GradeProps]: boolean;
};
let column_sizes: number[] = [];
let student_mover_data: TmpList;

if (user.type == "teacher") {
  first_row.push(
    {
      id: "grades",
      type: "string",
      content: getCurrentElement("grades"),
    },
    {
      id: "final_grade",
      type: "string",
      content: getCurrentElement("final_grade"),
    }
  );
  await executeLink(
    "/v2/teachers/" +
      user.id +
      "/my_project_classes?session_id=" +
      session_id +
      "&course_id=" +
      course_id,
    (response) =>
      response.data.data.map((a: any) => tmp_sections.add(a.section))
  );
  await executeLink(
    "/v2/teachers/" +
      user.id +
      "/associated_project_classes?session_id=" +
      session_id +
      "&course_id=" +
      course_id,
    (response) =>
      response.data.data.map((a: any) => tmp_sections.add(a.section))
  );
  for (const section of tmp_sections) {
    sections.push({
      id: section,
    });
  }
} else {
  await executeLink(
    "/v1/project_classes/" + course_id + "/" + session_id + "/sections",
    (response) =>
      response.data.data.map((a: any) =>
        sections.push({
          id: a.section,
        })
      )
  );
  course = await executeLink(
    "/v1/courses/" + course_id,
    (response) => new Course(response.data.data),
    () => undefined
  );
  project_class = await executeLink(
    "/v1/project_classes/" + course_id + "/" + session_id,
    (response) => new AdminProjectClass(response.data.data),
    () => undefined
  );
}
if (project_class != undefined) {
  project_class.loadParms();
}
if (sections.length > 0) {
  selected_section.value = sections[0].id;
}

await updateStudents();
watch(selected_section, async () => {
  await updateStudents();
  students_trigger.value++;
});
watch(students_update, async () => {
  await updateStudents();
  students_trigger.value++;
});
</script>

<style>
ion-modal#grades_manager {
  --width: 90%;
  --height: fit-content;
}

ion-modal#multiple_grades_manager {
  --width: 90%;
  --height: 80%;
}

ion-modal#student_mover {
  --width: 80%;
  --height: 80%;
}
</style>
