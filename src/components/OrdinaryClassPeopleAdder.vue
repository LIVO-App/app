<template>
  <ion-modal
    id="teachers"
    :is-open="teachers_open"
    @didDismiss="closeModal('teachers')"
  >
    <simple-adder
      :key="trigger"
      :emptiness_message="
        getCustomMessage(
          'no_teachers',
          getCurrentElement('no_teachers'),
          'string',
          undefined,
          {
            label: {
              align_text_middle: true,
              'ion-padding-bottom': true,
            },
          }
        )
      "
      :title="getCurrentElement('add_teachers')"
      :data="teachers_data"
      @add="addRow('teachers')"
      @remove="removeRow('teachers')"
      @confirm="sendData('teachers')"
      @close="closeModal('teachers')"
    >
      <template v-slot:parameters>
        <ion-searchbar
          show-clear-button="focus"
          :value="teacher_filter"
          @ion-input="
            (ev) =>
              changeFilter(
                ev.detail.value ?? '',
                available_teachers,
                all_teachers
              )
          "
        ></ion-searchbar>
        <list-card
          :key="'teacher_choice_' + select_trigger"
          :emptiness_message="
            getCustomMessage(
              'emptiness_message',
              getCurrentElement('no_teachers')
            )
          "
          :cards_list="available_teachers"
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
          :classes="{
            card: {
              limited_list: true,
            },
          }"
          @signal_event="selectTeacher()"
        />
        <div
          class="ion-padding-top ion-padding-start ion-align-items-center"
          style="display: flex"
        >
          <ionic-element
            :element="
              getCustomMessage(
                'is_coordinator_label',
                getCurrentElement('coordinator') + ':',
                'string',
                undefined,
                { label: { 'ion-padding-end': true } }
              )
            "
          />
          <ionic-element v-model:element="elements[0]" />
        </div>
        <div style="padding-left: 5px">
          <custom-select
            key="teaching_choice"
            v-model:selected_option="selected_teaching"
            :list="teachings"
            :label="getCurrentElement('teaching') + ':'"
            :aria_label="getCurrentElement('teaching')"
            :placeholder="getCurrentElement('teaching_choice')"
            :getCompleteName="(e: Teaching) => teachingToString(e)"
            :no_padding="true"
          />
        </div>
        <list-card
          :key="teaching_trigger"
          :emptiness_message="
            getCustomMessage('no_teachings', getCurrentElement('no_teachings'))
          "
          :cards_list="teaching_data"
          @signal_event="removeTeaching()"
        />
      </template>
    </simple-adder>
  </ion-modal>
  <ion-modal
    id="students"
    :is-open="students_open"
    @didDismiss="closeModal('students')"
  >
    <simple-adder
      :key="trigger"
      :emptiness_message="
        getCustomMessage(
          'no_students',
          getCurrentElement('no_students'),
          'string',
          undefined,
          {
            label: {
              align_text_middle: true,
              'ion-padding-bottom': true,
            },
          }
        )
      "
      :title="getCurrentElement('add_students')"
      :data="students_data"
      :show_confirm="false"
      @add="addRow('students')"
      @remove="removeRow('students')"
      @confirm="sendData('students')"
      @close="closeModal('students')"
    >
      <template v-slot:parameters>
        <ion-searchbar
          show-clear-button="focus"
          :value="student_filter"
          @ion-input="
            (ev) =>
              changeFilter(
                ev.detail.value ?? '',
                available_students,
                all_students
              )
          "
        ></ion-searchbar>
        <list-card
          :key="'student_choice_' + select_trigger"
          :emptiness_message="
            getCustomMessage(
              'emptiness_message',
              getCurrentElement('no_students')
            )
          "
          :cards_list="available_students"
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
          :classes="{
            card: {
              limited_list: true,
            },
          }"
          @signal_event="addRow('students')"
        />
      </template>
    </simple-adder>
  </ion-modal>
  <ionic-element
    :element="
      getCustomMessage(
        'add',
        getCurrentElement('add') + ':',
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
  <ionic-element :element="buttons[0]" @signal_event="setupModalAndOpen()" />
  <ionic-element :element="buttons[1]" @signal_event="setupModalAndOpen()" />
</template>

<script setup lang="ts">
import {
  CustomElement,
  GeneralCardElements,
  OrderedCardsList,
  StudentInformation,
  Teacher,
  Teaching,
} from "@/types";
import {
  executeLink,
  getCurrentElement,
  getCurrentLanguage,
  getCustomMessage,
  getIcon,
  toDateString,
} from "@/utils";
import { IonModal, IonSearchbar } from "@ionic/vue";
import { ref, watch } from "vue";
import { useStore } from "vuex";

type availableModal = "teachers" | "students";

const setupModalAndOpen = async () => {
  const window: availableModal = store.state.event.event;

  switch (window) {
    case "teachers":
      teachers_open.value = true;
      break;
    case "students":
      students_open.value = true;
      break;
  }
};
const closeModal = (window: availableModal) => {
  resetLists();
  switch (window) {
    case "teachers":
      teachers_open.value = false;
      break;
    case "students":
      students_open.value = false;
      break;
  }
};
const addRow = (window: availableModal | "teachings") => {
  let teacher: Teacher;

  if (window === "teachers") {
    if (selected_teacher_indexes.value == -1) {
      store.state.event = {
        event: "error",
        data: { message: getCurrentElement("select_teacher") },
      };
      emit("signal_event");
      return;
    }
    if (teaching_data.cards[""].length === 0) {
      store.state.event = {
        event: "error",
        data: { message: getCurrentElement("no_teachings") },
      };
      emit("signal_event");
      return;
    }
    teacher = teachers.find(
      (t) =>
        "" + t.id ===
        available_teachers.cards[""][selected_teacher_indexes.value].id
    )!;
    if (
      teachers_data.cards[""].find(
        (card) => card.id === teacher.id.toString()
      ) !== undefined
    ) {
      store.state.event = {
        event: "error",
        data: { message: getCurrentElement("teacher_already_added") },
      };
      emit("signal_event");
      return;
    }
    teachers_data.cards[""].push({
      id: teacher.id.toString(),
      group: "",
      content: [
        getCustomMessage(
          "name",
          getCurrentElement("name") + ": " + teacher.name
        ),
        getCustomMessage(
          "surname",
          getCurrentElement("surname") + ": " + teacher.surname
        ),
        getCustomMessage(
          "email",
          getCurrentElement("email") + ": " + teacher.email
        ),
        getCustomMessage(
          "coordinator",
          getCurrentElement("coordinator") +
            ": " +
            ((elements[0].content as boolean)
              ? getCurrentElement("yes")
              : getCurrentElement("no"))
        ),
        getCustomMessage(
          "teachings",
          getCurrentElement("teachings") +
            ": " +
            teaching_data.cards[""]
              .map(
                (card) =>
                  teachings.find(
                    (teaching) =>
                      teaching[`${language}_title`] === card.content![0].content
                  )!.id
              )
              .join(", ")
        ),
      ],
      side_element: {
        id: "remove",
        type: "icon",
        linkType: "event",
        content: {
          event: "remove",
          data: {
            id: teacher.id.toString(),
          },
          icon: getIcon("close"),
        },
      },
    });
    selectedChange(available_teachers);
    selected_teacher_indexes.value = -1;
    elements[0].content = false;
    teaching_data.cards[""] = [];
    teaching_trigger.value++;
    trigger.value++;
  } else if (window === "students") {
    if (
      students_data.cards[""].find(
        (card) => card.id === store.state.event.data.id.toString()
      ) !== undefined
    ) {
      store.state.event = {
        event: "error",
        data: { message: getCurrentElement("student_already_added") },
      };
      emit("signal_event");
      return;
    }

    const student = students.find(
      (s) => s.id.toString() === store.state.event.data.id.toString()
    );

    students_data.cards[""].push({
      id: store.state.event.data.id.toString(),
      group: "",
      content: [
        getCustomMessage(
          "name",
          getCurrentElement("name") + ": " + (student?.name ?? "")
        ),
        getCustomMessage(
          "surname",
          getCurrentElement("surname") + ": " + (student?.surname ?? "-")
        ),
        getCustomMessage(
          "email",
          getCurrentElement("email") + ": " + (student?.email ?? "-")
        ),
        getCustomMessage(
          "cf",
          getCurrentElement("birth_date") +
            ": " +
            (student?.birth_date != undefined
              ? toDateString(student.birth_date)
              : "-")
        ),
      ],
      side_element: {
        id: "remove",
        type: "icon",
        linkType: "event",
        content: {
          event: "remove",
          data: {
            id: store.state.event.data.id.toString(),
          },
          icon: getIcon("close"),
        },
      },
    });
    trigger.value++;
  } else if (window === "teachings") {
    if (
      teaching_data.cards[""].find(
        (card) => card.id === selected_teaching.value
      ) !== undefined
    ) {
      store.state.event = {
        event: "error",
        data: { message: getCurrentElement("teaching_already_added") },
      };
      emit("signal_event");
      return;
    }

    const teaching = teachings.find((t) => t.id === selected_teaching.value);
    if (teaching === undefined) {
      return;
    }
    teaching_data.cards[""].push({
      id: selected_teaching.value,
      group: "",
      content: [getCustomMessage("teaching", teachingToString(teaching))],
      side_element: {
        id: "remove",
        type: "icon",
        linkType: "event",
        content: {
          event: "remove",
          data: {
            id: selected_teaching.value,
          },
          icon: getIcon("close"),
        },
      },
    });
    teaching_trigger.value++;
  }
};
const removeRow = (window: availableModal | "teachings") => {
  let data: OrderedCardsList<GeneralCardElements>, id_key: string;

  if (window === "teachers") {
    data = teachers_data;
    id_key = "id";
  } else if (window === "students") {
    data = students_data;
    id_key = "id";
  } else {
    data = teaching_data;
    id_key = "id";
  }
  data.cards[""] = data.cards[""].filter(
    (card) => card.id !== store.state.event.data[id_key]
  );
  trigger.value++;
};
const sendData = (window: availableModal) => {
  let data: OrderedCardsList<GeneralCardElements>,
    available_data: OrderedCardsList<GeneralCardElements>,
    all_data: GeneralCardElements[];

  if (window === "teachers") {
    data = teachers_data;
    available_data = available_teachers;
    all_data = all_teachers;
  } else {
    data = students_data;
    available_data = available_students;
    all_data = all_students;
  }

  if (data.cards[""].length === 0) {
    store.state.event = {
      event: "error",
      data: {
        message: getCurrentElement(`no_${window}_to_add`),
      },
    };
    emit("signal_event");
    return;
  }

  return executeLink(
    "/v1/ordinary_classes/" +
      props.study_year +
      "/" +
      props.study_address +
      (window === "teachers" ? "/teachers" : "/components") +
      "?school_year=" +
      props.school_year +
      "&section=" +
      props.section,
    (response) => {
      const errors: {
        existing: string | null;
        wrong: string | null;
      } = {
        existing: null,
        wrong: null,
      };
      const ids_to_remove = teachers_data.cards[""].map((card) => card.id);

      store.state.event = {
        event: "success",
        data: {
          message: getCurrentElement(`${window}_added`),
        },
      };

      if (response.data.existing_class) {
        errors.existing = getCurrentElement(`existing_${window}`);
      }
      if (response.data.wrong_class) {
        errors.wrong = getCurrentElement(`wrong_${window}`);
      }
      if (errors.existing !== null || errors.wrong !== null) {
        store.state.event = {
          event: "error",
          data: {
            message: getCurrentElement(`${window}_partially_added`),
          },
        };
        for (const error of Object.values(errors)) {
          if (error !== null) {
            store.state.event.data.message += `. ${error}`;
          }
        }
      }
      data.cards[""] = [];
      all_data = all_data.filter(
        (c) => ids_to_remove.findIndex((id) => id === c.id) === -1
      );
      changeFilter("", available_data, all_data);
      trigger.value++;
      emit("signal_event");
      closeModal(window);
    },
    (error) => {
      const error_code = error.response.status;

      store.state.event = {
        event: "error",
        data: {
          message: getCurrentElement(`${window}_not_assigned`),
        },
      };

      if (error_code == 409) {
        store.state.event.data.message = getCurrentElement(
          `all_${window}_already_assigned`
        );
      } else if (error_code == 400) {
        store.state.event.data.message = getCurrentElement(
          `${window}_not_valid`
        );
      } else if (error_code == 401) {
        store.state.event.data.message = getCurrentElement(
          "unauthorized_operation"
        );
      } else if (error_code == 404) {
        store.state.event.data.message = getCurrentElement(
          "study_year_address_not_found"
        );
      }
      emit("signal_event");
    },
    "post",
    window === "teachers"
      ? {
          teacher_list: teachers_data.cards[""].map((card) => ({
            id: parseInt(card.id),
            coordinator: (card.content![3].content as string).includes(
              getCurrentElement("yes")
            )
              ? 1
              : 0,
            teaching_list: (card.content![4].content as string)
              .split(":")[1]
              .split(",")
              .map((id) => id.trim()),
          })),
        }
      : {
          student_list: students_data.cards[""].map((card) =>
            parseInt(card.id)
          ),
        }
  );
};
const changeFilter = (
  new_filter: string,
  data: OrderedCardsList<GeneralCardElements>,
  all_data: GeneralCardElements[]
) => {
  const lower_filter = new_filter.toLowerCase();
  const selected_id =
    selected_teacher_indexes.value != -1
      ? all_data[selected_teacher_indexes.value].id
      : null;
  data.cards[""].splice(0, data.cards[""].length);
  for (const element of all_data) {
    if (
      new_filter === "" ||
      (element.content![0].content as string)
        .toLowerCase()
        .includes(lower_filter)
    ) {
      data.cards[""].push(element);
      if (element.id === selected_id) {
        data.cards[""][data.cards[""].length - 1].selected = true;
        selected_teacher_indexes.value = data.cards[""].length - 1;
      }
    }
  }
  select_trigger.value++;
};
const find_element = (
  list: OrderedCardsList<GeneralCardElements>,
  id?: string
): number => {
  let count = 0;
  let index: number;

  index = list.cards[""].findIndex((a: GeneralCardElements) => {
    if (id != undefined) {
      return a.id == id;
    } else {
      return a.selected;
    }
  });

  return index;
};
const selectTeacher = () => {
  if (selected_teacher_indexes.value != -1) {
    selectedChange(available_teachers);
  }

  const tmp_selected = find_element(
    available_teachers,
    store.state.event.data.id
  );

  if (selected_teacher_indexes.value == tmp_selected) {
    selected_teacher_indexes.value = -1;
  } else {
    selected_teacher_indexes.value = tmp_selected;
    selectedChange(available_teachers);
  }
};
const selectedChange = (
  list: OrderedCardsList<GeneralCardElements>,
  index = selected_teacher_indexes.value,
  value = !available_teachers.cards[""][index].selected
) => {
  list.cards[""][index].selected = value;
  trigger.value++;
};
const teachingToString = (teaching: Teaching) => teaching[`${language}_title`];
const resetLists = () => {
  teachers_data.cards[""] = [];
  teaching_data.cards[""] = [];
  students_data.cards[""] = [];
};
const removeTeaching = () => {
  teaching_data.cards[""] = teaching_data.cards[""].filter(
    (card) => card.id !== store.state.event.data.id
  );
  teaching_trigger.value++;
};

const store = useStore();
const language = getCurrentLanguage();
const emit = defineEmits(["signal_event"]);
const props = defineProps({
  school_year: {
    type: Number,
    required: true,
  },
  study_address: {
    type: String,
    required: true,
  },
  study_year: {
    type: Number,
    required: true,
  },
  section: {
    type: String,
    required: true,
  },
});

const buttons: CustomElement[] = [
  {
    id: "add_teachers",
    type: "string_icon",
    linkType: "event",
    content: {
      text: getCurrentElement("teachers"),
      icon: getIcon("school"),
      event: "teachers",
      whole_link: true,
    },
    ...store.state.button_css,
  },
  {
    id: "add_students",
    type: "string_icon",
    linkType: "event",
    content: {
      text: getCurrentElement("students"),
      icon: getIcon("person"),
      event: "students",
      whole_link: true,
    },
    ...store.state.button_css,
  },
];
const elements: CustomElement[] = [
  {
    id: "coordinator",
    type: "checkbox",
    content: false,
  },
];
const teachers_open = ref(false);
const students_open = ref(false);
const selected_teacher_indexes = ref(-1);
const selected_teaching = ref("");
const teacher_filter = ref("");
const student_filter = ref("");
const teachers: Teacher[] = [];
const available_teachers: OrderedCardsList<GeneralCardElements> = {
  order: [],
  cards: {
    "": [],
  },
};
const all_teachers: GeneralCardElements[] = [];
const students: StudentInformation[] = [];
const available_students: OrderedCardsList<GeneralCardElements> = {
  order: [],
  cards: {
    "": [],
  },
};
const all_students: GeneralCardElements[] = [];
const teachings: Teaching[] = [];

const teachers_data: OrderedCardsList<GeneralCardElements> = {
  order: [],
  cards: {
    "": [],
  },
};
const students_data: OrderedCardsList<GeneralCardElements> = {
  order: [],
  cards: {
    "": [],
  },
};
const teaching_data: OrderedCardsList<GeneralCardElements> = {
  order: [],
  cards: {
    "": [],
  },
};

const trigger = ref(0);
const select_trigger = ref(0);
const teaching_trigger = ref(0);

await executeLink(
  "/v1/teachers",
  (response) => {
    let tmp_teacher: Teacher, tmp_teacher_card: GeneralCardElements;

    for (const teacher of response.data.data) {
      tmp_teacher = new Teacher(teacher);
      tmp_teacher_card = {
        id: tmp_teacher.id.toString(),
        group: "",
        content: [
          getCustomMessage(
            "teacher",
            tmp_teacher.surname +
              " " +
              tmp_teacher.name +
              (tmp_teacher.email ? " (" + tmp_teacher.email + ")" : "")
          ),
        ],
        selected: false,
        link: {
          event: "change_selected_teacher",
          data: {
            id: tmp_teacher.id,
          },
        },
      };
      available_teachers.cards[""].push(tmp_teacher_card);
      all_teachers.push(tmp_teacher_card);
      teachers.push(tmp_teacher);
    }
  },
  () => []
);
await executeLink(
  "/v1/students?no_attend_ordinary_classes=true&from_school_year=" +
    (new Date().getFullYear() - 7),
  (response) => {
    let tmp_student: StudentInformation, tmp_student_card: GeneralCardElements;

    for (const student of response.data.data) {
      tmp_student = new StudentInformation({
        ...student,
        ordinary_class_ref: {
          data: {
            study_address: props.study_address,
            study_year: props.study_year,
            section: props.section,
          },
        },
        class_section: props.section,
      });

      tmp_student_card = {
        id: tmp_student.id.toString(),
        group: "",
        link: {
          event: "add_row",
          data: {
            id: tmp_student.id.toString(),
          },
        },
        content: [
          getCustomMessage(
            "student",
            tmp_student.surname +
              " " +
              tmp_student.name +
              (tmp_student.email ? " (" + tmp_student.email + ")" : "")
          ),
        ],
      };
      all_students.push(tmp_student_card);
      available_students.cards[""].push(tmp_student_card);
      students.push(tmp_student);
    }
  },
  () => []
);

await executeLink(
  "/v1/teachings",
  (response) => {
    let tmp_teaching: Teaching;
    for (const teaching of response.data.data) {
      tmp_teaching = new Teaching(teaching);
      teachings.push(tmp_teaching);
    }
  },
  () => []
);

watch(selected_teaching, (new_teaching) => {
  if (new_teaching !== "") {
    addRow("teachings");
    selected_teaching.value = "";
  }
  trigger.value++;
});
</script>

<style>
.content-input {
  box-sizing: content-box;
}

.limited_list {
  max-height: 145px !important;
  overflow-y: auto;
}
</style>
