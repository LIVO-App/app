<template>
  <ion-modal :keep-contents-mounted="true">
    <ion-datetime
      :key="trigger"
      id="date"
      @ion-change="changeData"
      presentation="date"
      :first-day-of-week="1"
      :max="today.toISOString()"
      :locale="getLocale()"
      :show-clear-button="true"
      :clear-text="getCurrentElement('clear')"
      :value="null"
    />
  </ion-modal>
  <ion-modal
    id="ordinary_classes"
    :is-open="ordinary_classes_open"
    @didDismiss="closeModal('ordinary_classes')"
  >
    <simple-adder
      :key="trigger"
      :emptiness_message="
        getCustomMessage(
          'no_classes',
          getCurrentElement('no_classes'),
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
      :title="getCurrentElement('add_ordinary_classes')"
      :first_row="ordinary_classes_first_row"
      :sizes="ordinary_classes_sizes"
      :data="ordinary_classes_data"
      @add="addRow('ordinary_classes')"
      @remove="removeRow('ordinary_classes')"
      @confirm="sendData('ordinary_classes')"
      @close="closeModal('ordinary_classes')"
    >
      <template v-slot:parameters>
        <ionic-element v-model:element="elements.school_year" />
        <custom-select
          key="study_address"
          v-model:selected_option="selected_study_address"
          :list="study_addresses"
          :label="getCurrentElement('study_address') + ':'"
          :aria_label="getCurrentElement('study_address')"
          :placeholder="getCurrentElement('study_address_choice')"
          :getCompleteName="studyAddressToString"
          :no_padding="true"
        />
        <custom-select
          key="study_year"
          v-model:selected_option="selected_study_year"
          :list="study_years[selected_study_address] || []"
          :label="getCurrentElement('study_year') + ':'"
          :aria_label="getCurrentElement('study_year')"
          :placeholder="
            getCurrentElement(
              selected_study_address != undefined &&
                selected_study_address != ''
                ? 'study_year_choice'
                : 'study_address_needed'
            )
          "
          :no_padding="true"
        />
      </template>
    </simple-adder>
  </ion-modal>
  <ion-modal
    id="teachers_students"
    :is-open="teachers_open || students_open"
    @didDismiss="closeModal(teachers_open ? 'teachers' : 'students')"
  >
    <simple-adder
      :key="trigger"
      :emptiness_message="
        getCustomMessage(
          teachers_open ? 'no_teachers' : 'no_students',
          getCurrentElement(teachers_open ? 'no_teachers' : 'no_students'),
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
      :title="
        getCurrentElement(teachers_open ? 'add_teachers' : 'add_students')
      "
      :data="teachers_open ? teachers_data : students_data"
      @add="addRow(teachers_open ? 'teachers' : 'students')"
      @remove="removeRow(teachers_open ? 'teachers' : 'students')"
      @confirm="sendData(teachers_open ? 'teachers' : 'students')"
      @close="closeModal(teachers_open ? 'teachers' : 'students')"
    >
      <template v-slot:parameters>
        <ionic-element v-model:element="elements.name" />
        <ionic-element v-model:element="elements.surname" />
        <ionic-element v-model:element="elements.email" />
        <ionic-element v-model:element="elements.cf" />
        <ionic-element v-model:element="elements.address" />
        <ion-grid>
          <ion-row class="ion-align-items-center">
            <ion-col size="6">
              <custom-select
                key="gender"
                v-model:selected_option="selected_gender"
                :list="genders"
                :label="getCurrentElement('gender') + ':'"
                :aria_label="getCurrentElement('gender')"
                :placeholder="getCurrentElement('gender_choice')"
                :getCompleteName="(e: {id: Gender}) => getGender(e.id)"
                :no_padding="true"
              />
            </ion-col>
            <ion-col size="6">
              <ion-item lines="none">
                <ion-label
                  :aria-label="getCurrentElement('birth_date')"
                  color="primary"
                  style="color: var(--ion-color-primary); width: fit-content"
                  >{{ getCurrentElement("birth_date") }}</ion-label
                >
                <ion-datetime-button
                  datetime="date"
                  style="width: fit-content"
                  class="ion-padding-start"
                />
              </ion-item>
            </ion-col>
          </ion-row>
        </ion-grid>
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
  <ionic-element :element="buttons[2]" @signal_event="setupModalAndOpen()" />
</template>

<script setup lang="ts">
import {
  CustomElement,
  Gender,
  GenderKeys,
  GeneralCardElements,
  OrderedCardsList,
  StudyAddress,
} from "@/types";
import {
  executeLink,
  getCurrentElement,
  getCurrentLanguage,
  getCustomMessage,
  getGender,
  getIcon,
  getLocale,
  toDateString,
} from "@/utils";
import {
  DatetimeCustomEvent,
  IonModal,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonDatetime,
  IonDatetimeButton,
} from "@ionic/vue";
import { Ref, ref, watch } from "vue";
import { useStore } from "vuex";

type availableModal = "ordinary_classes" | "teachers" | "students";
type paramElement = {
  name: string;
  map_fn?: (v: string) => any;
};

const setupModalAndOpen = async () => {
  const window: availableModal = store.state.event.event;

  switch (window) {
    case "ordinary_classes":
      ordinary_classes_open.value = true;
      break;
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
    case "ordinary_classes":
      ordinary_classes_open.value = false;
      resetClassParams();
      break;
    case "teachers":
      teachers_open.value = false;
      resetPeopleParams();
      break;
    case "students":
      students_open.value = false;
      resetPeopleParams();
      break;
  }
};
const addRow = (window: availableModal) => {
  let data: OrderedCardsList<GeneralCardElements>;

  if (window === "ordinary_classes") {
    if (selected_study_year.value === 0) {
      store.state.event = {
        event: "error",
        data: {
          message: getCurrentElement("no_study_year_selected"),
        },
      };
      emit("signal_event");
      return;
    }
    if (selected_study_address.value === "") {
      store.state.event = {
        event: "error",
        data: {
          message: getCurrentElement("no_study_address_selected"),
        },
      };
      emit("signal_event");
      return;
    }
    if (elements.school_year.content < new Date().getFullYear()) {
      store.state.event = {
        event: "error",
        data: {
          message: getCurrentElement("wrong_school_year"),
        },
      };
      emit("signal_event");
      return;
    }

    const id =
      selected_study_year.value +
      "-" +
      selected_study_address.value +
      "-" +
      elements.school_year.content;

    if (
      ordinary_classes_data.cards[""].find((card) => card.id === id) !==
      undefined
    ) {
      store.state.event = {
        event: "error",
        data: { message: getCurrentElement("class_already_added") },
      };

      emit("signal_event");
      return;
    }

    ordinary_classes_data.cards[""].push({
      id: id,
      group: "",
      content: [
        getCustomMessage("study_year", selected_study_year.value),
        getCustomMessage(
          "study_address_" + selected_study_address.value,
          studyAddressToString(
            study_addresses.find(
              (address) => address.id === selected_study_address.value
            )!
          )
        ),
        getCustomMessage("school_year", elements.school_year.content),
        {
          id: "remove",
          type: "icon",
          linkType: "event",
          content: {
            event: "remove",
            data: {
              id: id,
            },
            icon: getIcon("close"),
          },
        },
      ],
    });
  } else {
    if (window === "teachers") {
      data = teachers_data;
    } else {
      data = students_data;
    }

    if (elements.name.content === "") {
      store.state.event = {
        event: "error",
        data: { message: getCurrentElement("empty_name") },
      };
      emit("signal_event");
      return;
    }
    if (elements.surname.content === "") {
      store.state.event = {
        event: "error",
        data: { message: getCurrentElement("empty_surname") },
      };
      emit("signal_event");
      return;
    }
    elements.email.content = (elements.email.content as string)
      .toLowerCase()
      .trim();
    if (
      elements.email.content === "" ||
      !/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
        elements.email.content as string
      )
    ) {
      store.state.event = {
        event: "error",
        data: { message: getCurrentElement("not_valid_email") },
      };
      emit("signal_event");
      return;
    }
    if (birth_date != undefined && birth_date > today) {
      store.state.event = {
        event: "error",
        data: { message: getCurrentElement("no_future_date") },
      };
      emit("signal_event");
      return;
    }

    if (
      data.cards[""].find((card) => card.id === elements.email.content) !==
      undefined
    ) {
      store.state.event = {
        event: "error",
        data: { message: getCurrentElement("teacher_already_added") },
      };
      emit("signal_event");
      return;
    }

    data.cards[""].push({
      id: elements.email.content,
      group: "",
      content: [
        getCustomMessage(
          "name",
          getCurrentElement("name") + ": " + elements.name.content
        ),
        getCustomMessage(
          "surname",
          getCurrentElement("surname") + ": " + elements.surname.content
        ),
        getCustomMessage(
          "email",
          getCurrentElement("email") + ": " + elements.email.content
        ),
        getCustomMessage(
          "cf",
          getCurrentElement("cf") +
            ": " +
            (elements.cf.content != "" ? elements.cf.content : "-")
        ),
        getCustomMessage(
          "address",
          getCurrentElement("address") +
            ": " +
            (elements.address.content != "" ? elements.address.content : "-")
        ),
        getCustomMessage(
          "gender",
          getCurrentElement("gender") +
            ": " +
            (selected_gender.value != ""
              ? getGender(selected_gender.value)
              : "-")
        ),
        getCustomMessage(
          "birth_date",
          getCurrentElement("birth_date") +
            ": " +
            (birth_date != undefined ? toDateString(birth_date) : "-")
        ),
      ],
      side_element: {
        id: "remove",
        type: "icon",
        linkType: "event",
        content: {
          event: "remove",
          data: {
            email: elements.email.content,
          },
          icon: getIcon("close"),
        },
      },
    });
    resetPeopleParams();
  }
  trigger.value++;
};
const removeRow = (window: availableModal) => {
  let data: OrderedCardsList<GeneralCardElements>, id_key: string;
  if (window === "ordinary_classes") {
    data = ordinary_classes_data;
    id_key = "id";
  } else {
    if (window === "teachers") {
      data = teachers_data;
    } else {
      data = students_data;
    }
    id_key = "email";
  }
  data.cards[""] = data.cards[""].filter(
    (card) => card.id !== store.state.event.data[id_key]
  );
  trigger.value++;
};
const sendData = (window: availableModal) => {
  let data: OrderedCardsList<GeneralCardElements>;

  if (window === "ordinary_classes") {
    data = ordinary_classes_data;
  } else if (window === "teachers") {
    data = teachers_data;
  } else {
    data = students_data;
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
    "/v1/" + window,
    (response) => {
      const errors: {
        existing: string | null;
        wrong: string | null;
      } = {
        existing: null,
        wrong: null,
      };

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
      data.order = [];
      data.cards[""] = [];
      emit("signal_event");
      closeModal("ordinary_classes");
    },
    (error) => {
      const error_code = error.response.status;

      store.state.event = {
        event: "error",
        data: {
          message: getCurrentElement(`${window}_not_inserted`),
        },
      };

      if (error_code == 409) {
        store.state.event.data.message = getCurrentElement(
          `all_${window}_already_added`
        );
      } else if (error_code == 400) {
        store.state.event.data.message = getCurrentElement(
          `${window}_not_valid`
        );
      } else if (error_code == 401) {
        store.state.event.data.message = getCurrentElement(
          "unauthorized_operation"
        );
      }
      emit("signal_event");
    },
    "post",
    {
      [`${to_send[window].list_name}_list`]: data.cards[""].map((card) => {
        const post_data: {
          [key: string]: any;
        } = {};

        let element: paramElement;

        for (let i = 0; i < to_send[window].params.length; i++) {
          element = to_send[window].params[i];
          post_data[element.name] = element.map_fn
            ? element.map_fn(card.content![i].content as string)
            : card.content![i].content;
        }

        return post_data;
      }),
    }
  );
};
const studyAddressToString = (study_address: StudyAddress) =>
  study_address[`${language}_title`];
const getStringInput: (key: string) => CustomElement = (key: string) => ({
  id: key,
  type: "input",
  content: "",
  params: {
    label: getCurrentElement(key),
  },
  classes: {
    input: {
      "ion-margin-top": true,
    },
  },
});
const getValueNoTitle = (content: string) => {
  const value = content.split(": ")[1];
  return value != "-" ? value : undefined;
};
const changeData = (event: DatetimeCustomEvent) => {
  const tmp_str_date = event.target.value;

  let tmp_date: Date;

  if (typeof tmp_str_date == "string") {
    tmp_date = new Date(tmp_str_date);
    if (tmp_date <= today) {
      birth_date = tmp_date;
    } else {
      birth_date = undefined;
    }
  } else {
    birth_date = undefined;
  }
};
const resetPeopleParams = () => {
  elements.name.content = "";
  elements.surname.content = "";
  elements.email.content = "";
  elements.cf.content = "";
  selected_gender.value = "";
  birth_date = undefined;
  elements.address.content = "";
};
const resetClassParams = () => {
  elements.school_year.content = new Date().getFullYear();
  selected_study_address.value = "";
  selected_study_year.value = 0;
};
const resetLists = () => {
  ordinary_classes_data.cards[""] = [];
  teachers_data.cards[""] = [];
  students_data.cards[""] = [];
};

const store = useStore();
const language = getCurrentLanguage();
const emit = defineEmits(["signal_event"]);

const buttons: CustomElement[] = [
  {
    id: "add_ordinary_classes",
    type: "string_icon",
    linkType: "event",
    content: {
      text: getCurrentElement("ordinary_classes"),
      icon: getIcon("people"),
      event: "ordinary_classes",
      whole_link: true,
    },
    ...store.state.button_css,
  },
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
const elements = {
  school_year: {
    id: "school_year",
    type: "input",
    content: new Date().getFullYear(),
    params: {
      type: "number",
      label: getCurrentElement("school_year"),
    },
  },
  name: getStringInput("name"),
  surname: getStringInput("surname"),
  email: getStringInput("email"),
  cf: getStringInput("cf"),
  address: getStringInput("address"),
};
const ordinary_classes_open = ref(false);
const teachers_open = ref(false);
const students_open = ref(false);
const selected_study_address = ref("");
const selected_study_year = ref(0);
const study_addresses: StudyAddress[] = [];
const study_years: { [key: string]: { id: number }[] } = {};
const teacher_student_params: paramElement[] = [
  {
    name: "name",
    map_fn: getValueNoTitle,
  },
  {
    name: "surname",
    map_fn: getValueNoTitle,
  },
  {
    name: "email",
    map_fn: getValueNoTitle,
  },
  {
    name: "cf",
    map_fn: getValueNoTitle,
  },
  {
    name: "address",
    map_fn: getValueNoTitle,
  },
  {
    name: "gender",
    map_fn: (v) => {
      const value = getValueNoTitle(v);
      if (value) {
        return genders.find(
          (gender) => getCurrentElement(GenderKeys[gender.id]) === value
        )!.id;
      } else {
        return undefined;
      }
    },
  },
  {
    name: "birth_date",
    map_fn: getValueNoTitle,
  },
];
const selected_gender: Ref<Gender | ""> = ref("");
const genders: { id: Gender }[] = Object.keys(GenderKeys).map((key) => ({
  id: key as Gender,
}));

const to_send: {
  [key in keyof string as availableModal]: {
    list_name: string;
    params: paramElement[];
  };
} = {
  ordinary_classes: {
    list_name: "classes",
    params: [
      {
        name: "study_year",
        map_fn: (v) => parseInt(v),
      },
      {
        name: "study_address",
        map_fn: (v) =>
          study_addresses.find((address) => address[`${language}_title`] === v)!
            .id,
      },
      {
        name: "school_year",
        map_fn: (v) => parseInt(v),
      },
    ],
  },
  teachers: {
    list_name: "teacher",
    params: teacher_student_params,
  },
  students: {
    list_name: "student",
    params: teacher_student_params,
  },
};
const ordinary_classes_first_row = to_send.ordinary_classes.params
  .map((param) => getCustomMessage(param.name, getCurrentElement(param.name)))
  .concat([
    {
      id: "remove",
      type: "string",
      content: "",
    },
  ]);
const ordinary_classes_sizes = [3, 4, 3, 2];
const ordinary_classes_data: OrderedCardsList<GeneralCardElements> = {
  order: [],
  cards: {
    "": [],
  },
};
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
const trigger = ref(0);
const today = new Date();

let birth_date: Date | undefined = undefined;

await executeLink(
  "/v1/study_addresses",
  (response) => {
    for (const address of response.data.data) {
      study_addresses.push(address);
      study_years[address.id] = Array.from(
        { length: address.max_classes },
        (value, index) => {
          return {
            id: index + 1,
          };
        }
      );
    }
  },
  () => []
);

watch(selected_study_address, (new_study_address) => {
  let tmp_study_address;

  if (
    new_study_address != "" &&
    (tmp_study_address = study_addresses.find(
      (a) => a.id == new_study_address
    )) != undefined &&
    selected_study_year.value > tmp_study_address.max_classes
  ) {
    selected_study_year.value = 0;
  }
  trigger.value++;
});
</script>

<style>
.content-input {
  box-sizing: content-box;
}
</style>
