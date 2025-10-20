<template>
  <ion-alert
    :is-open="alert_open"
    :header="alert_information.title"
    :message="alert_information.message"
    :buttons="alert_information.buttons"
    @didDismiss="closeModal()"
    :inputs="alert_information.inputs"
  />
  <div class="ion-padding-horizontal">
    <ion-grid>
      <ion-row class="ion-align-items-center ion-text-start ion-text-sm-end">
        <ion-col size="auto">
          <ionic-element :element="user_card.title" />
        </ion-col>
        <ion-col size="auto">
          <ionic-element
            v-if="is_edit"
            :element="buttons['view']"
            @signal_event="setupModalAndOpen('confirm')"
          />
          <ionic-element
            v-else
            :element="buttons['edit']"
            @signal_event="changeModality(true)"
          />
          <ionic-element
            v-if="is_edit"
            :element="buttons['cancel']"
            @signal_event="resetChanges"
          />
        </ion-col>
        <ion-col>
          <ionic-element
            :element="buttons['logout']"
            @signal_event="$router.push({ name: 'logout' })"
          />
        </ion-col>
      </ion-row>
      <ion-row>
        <ion-col size="12" size-md="auto" class="ion-text-center">
          <ionic-element
            v-if="is_edit"
            :element="
              getCustomMessage(
                'profile_image_title',
                getCurrentElement('profile_image'),
                'title'
              )
            "
          />
          <div
            v-if="!is_edit || images_list.length > 0"
            class="ion-margin-top ion-margin-vertical"
          >
            <image-carousel
              v-if="!is_edit || images_list.length > 0"
              :key="'image_' + image_trigger"
              :images="
                images_list.length > 0 ? images_list : [default_profile_picture]
              "
              height="200px"
            />
            <ionic-element
              v-if="is_edit"
              :element="buttons['remove']"
              @signal_event="removeImage()"
            />
          </div>
          <div
            v-if="is_edit && images_list.length == 0"
            class="ion-margin-top ion-margin-vertical"
          >
            <image-uploader
              v-model:images_list="images_list"
              v-model:progress_infos="progress_infos"
              @signal_event="setupModalAndOpen('error')"
            />
            <ionic-element
              v-if="images_list.length > 0 && isFile(images_list[0])"
              :element="getCustomMessage('profile_image', images_list[0].name)"
            />
          </div>
        </ion-col>
        <ion-col v-if="is_edit" size="12" size-md="6">
          <ionic-element
            :element="user_card.content![user_card.content!.length-1]"
          />
          <ionic-element
            :key="'password_' + password_trigger"
            :element="user_edit_elements['password']"
          />
        </ion-col>
        <ion-col v-else size="12" size-md="6">
          <ion-list :key="'user_' + user_trigger">
            <ion-item v-for="element in user_card.content" :key="element.id">
              <ionic-element :element="element" />
            </ion-item>
          </ion-list>
        </ion-col>
      </ion-row>
      <ion-row :key="'user_edit_' + user_trigger" v-if="is_edit">
        <ion-col size="12" size-md="6">
          <ionic-element :element="user_edit_elements['name']" />
        </ion-col>
        <ion-col size="12" size-md="6">
          <ionic-element :element="user_edit_elements['surname']" />
        </ion-col>
      </ion-row>
      <ion-row v-if="is_edit">
        <ion-col>
          <ionic-element :element="user_edit_elements['address']" />
        </ion-col>
      </ion-row>
      <ion-row class="ion-align-items-center" v-if="is_edit">
        <ion-col size="12" size-md="6">
          <ionic-element :element="user_edit_elements['birth_date']" />
        </ion-col>
        <ion-col size="12" size-md="6">
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
      </ion-row>
    </ion-grid>
  </div>
</template>

<script lang="ts" setup>
import {
  Admin,
  AlertInformation,
  CustomElement,
  Gender,
  GenderKeys,
  GeneralCardElements,
  ImageDescriptor,
  StudentInformation,
  Teacher,
  User,
} from "@/types";
import {
  dateStringToDate,
  executeLink,
  getCurrentElement,
  getCustomMessage,
  getDateStringToSend,
  getGender,
  getIcon,
  isFile,
  toDateString,
  uploadMultipleImages,
} from "@/utils";
import {
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonAlert,
} from "@ionic/vue";
import { Method } from "axios";
import { nextTick, Ref, ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";

type availableModal = "confirm" | "success" | "error";

const closeModal = () => {
  alert_open.value = false;
};
const setupModalAndOpen = async (window?: availableModal) => {
  const actual_window: availableModal = window || store.state.event.event;

  switch (actual_window) {
    case "confirm":
      alert_information.title = "";
      alert_information.message = getCurrentElement("profile_edits_confirm");
      alert_information.buttons = [
        {
          text: getCurrentElement("yes"),
          role: "yes",
          handler: () => checkAndSendEdits(),
        },
        getCurrentElement("no"),
      ];
      break;
    case "success":
      break;
    case "error":
      break;
  }
  alert_open.value = true;
};
const getContentValue = (idx: number) => {
  const element = (
    (user_card.content as CustomElement[])[idx].content as string
  ).split(": ")[1];

  return element == "-" ? "" : element;
};
const setAlertError = (message: string | undefined, is_warning = false) => {
  alert_information.title = getCurrentElement(is_warning ? "warning" : "error");
  alert_information.message = message ?? getCurrentElement("general_error");
  alert_information.buttons = [getCurrentElement("ok")];
};
const checkAndSendEdits = async () => {
  const edits_correspondences: {
    [key: string]: string[];
  } = {
    name: [
      user_edit_elements["name"].content as string,
      getContentValue(0),
      user_edit_elements["name"].content as string,
    ],
    surname: [
      user_edit_elements["surname"].content as string,
      getContentValue(1),
      user_edit_elements["surname"].content as string,
    ],
    gender: [
      selected_gender.value == ""
        ? selected_gender.value
        : getGender(selected_gender.value),
      getContentValue(2),
      selected_gender.value,
    ],
    birth_date: [
      user_edit_elements["birth_date"].content as string,
      getContentValue(3),
      user_edit_elements["birth_date"].content != ""
        ? getDateStringToSend(
            user_edit_elements["birth_date"].content as string
          )
        : "",
    ],
    address: [
      user_edit_elements["address"].content as string,
      getContentValue(4),
      user_edit_elements["address"].content as string,
    ],
  };

  if (dateStringToDate(edits_correspondences["birth_date"][0]) > new Date()) {
    setTimeout(() => {
      setAlertError(getCurrentElement("date_in_future_error"));
      alert_open.value = true;
    }, 300);
    return;
  }

  const requests: {
    [key: string]: any | undefined;
  } = {};
  const url_correspondences: {
    [key: string]: string;
  } = {
    user_info: "/v1/" + user.type + "s/" + user.id,
  };
  const user_url = "put:" + url_correspondences["user_info"];

  for (const [key, correspondence] of Object.entries(edits_correspondences)) {
    if (correspondence[0] != correspondence[1]) {
      if (correspondence[0] == "") {
        setTimeout(() => {
          setAlertError(getCurrentElement("empty_field_error"));
          alert_open.value = true;
        }, 300);
        return;
      }
      if (requests[user_url] == undefined) {
        requests[user_url] = {};
        requests[user_url][user.type + "_info"] = {};
      }
      (requests[user_url] as { [key: string]: any })[user.type + "_info"][key] =
        correspondence[2];
    }
  }

  url_correspondences["password"] =
    url_correspondences["user_info"] + "/password";
  if (user_edit_elements["password"].content != "") {
    requests["put:" + url_correspondences["password"]] = {
      psw: user_edit_elements["password"].content as string,
    };
  }

  url_correspondences["image"] = "/v1/images/" + user.type + "/" + user.id;
  const image_delete_url =
    url_correspondences["image"] + "?name=" + original_image_name;
  const new_image =
    images_list.value.length > 0 && isFile(images_list.value[0]);
  if (original_image_name && (images_list.value.length == 0 || new_image)) {
    requests["delete:" + image_delete_url] = undefined;
  }
  if (new_image) {
    requests["post:" + url_correspondences["image"]] = [
      images_list.value[0] as File,
    ];
  }

  if (Object.keys(requests).length == 0) {
    changeModality(false);
    setTimeout(() => {
      setAlertError(getCurrentElement("no_changes_detected"));
      alert_open.value = true;
    }, 300);
    return;
  }

  const successful_changes: {
    [key: string]: boolean;
  } = {};
  const error_messages: {
    [key: string]: string;
  } = {};
  let method: Method, url: string, key_url: string, status: number;
  for (const [m_url, body] of Object.entries(requests)) {
    [method, url] = m_url.split(":") as [Method, string];
    key_url = url;
    if (m_url == "delete:" + image_delete_url) {
      key_url = url.split("?")[0];
    } else if (m_url == "post:" + url_correspondences["image"]) {
      if (
        successful_changes[url_correspondences["image"]] != undefined &&
        !successful_changes[url_correspondences["image"]]
      ) {
        continue;
      }

      status = await uploadMultipleImages(url, body);
      successful_changes[key_url] = status == 201;
      continue;
    }

    successful_changes[key_url] = await executeLink(
      url,
      () => true,
      (error) => {
        const error_code = error.response.status;

        if (error_code == 401) {
          error_messages[url] = getCurrentElement("unauthorized_operation");
        } else if (error_code == 404) {
          error_messages[url] = getCurrentElement("user_not_found");
        } else if (url.includes("images/")) {
          if (error_code == 400) {
            if (method == "post") {
              error_messages[url] = getCurrentElement("image_not_valid");
            } else {
              error_messages[url] = getCurrentElement("iamge_delete_error");
            }
          }
        }
        return false;
      },
      method,
      body
    );
  }

  const errors = Object.values(successful_changes);
  const error_presence = errors.some((o) => !o);
  const is_total_error = errors.every((o) => !o);
  let message = getCurrentElement("successful_profile_edit");
  if (error_presence) {
    if (is_total_error) {
      message = getCurrentElement("profile_no_edited");
    } else {
      message = getCurrentElement("profile_partially_edited");
    }
    for (const e of Object.values(error_messages)) {
      message += ". " + e;
    }
    await applyChanges(successful_changes, url_correspondences);
  } else {
    await applyChanges(successful_changes, url_correspondences);
    changeModality(false);
  }

  setTimeout(() => {
    if (error_presence) {
      setAlertError(message, is_total_error);
    } else {
      alert_information.title = getCurrentElement("success");
      alert_information.message = message;
      alert_information.buttons = [getCurrentElement("ok")];
    }
    alert_open.value = true;
  }, 300);
};
const applyChanges = async (
  successful_changes: {
    [key: string]: boolean;
  },
  url_correspondences: {
    [key: string]: string;
  }
) => {
  user_edit_elements["password"].content = "";
  password_trigger.value++;
  for (const [key, url] of Object.entries(url_correspondences)) {
    if (successful_changes[url]) {
      if (key == "user_info") {
        user_data.name = user_edit_elements["name"].content as string;
        user_data.surname = user_edit_elements["surname"].content as string;
        user_data.gender =
          selected_gender.value == "" ? undefined : selected_gender.value;
        user_data.birth_date =
          user_edit_elements["birth_date"].content != ""
            ? dateStringToDate(
                user_edit_elements["birth_date"].content as string
              )
            : undefined;
        user_data.address = user_edit_elements["address"].content as string;
        user_card = user_data.toCard();
        user_trigger.value++;
      } else if (key == "image") {
        nextTick(async () => setTimeout(() => loadProfilePicture(), 300));
      }
    }
  }
};
const resetChanges = async (change_to_view = true) => {
  user_edit_elements["name"].content = user_data.name;
  user_edit_elements["surname"].content = user_data.surname;
  selected_gender.value = user_data.gender ?? "";
  user_edit_elements["birth_date"].content = user_data.birth_date
    ? toDateString(user_data.birth_date)
    : "";
  user_edit_elements["address"].content = user_data.address ?? "";
  user_edit_elements["password"].content = "";
  password_trigger.value++;
  user_trigger.value++;
  await loadProfilePicture();
  changeModality(!change_to_view);
};
const changeModality = (change_to_edit: boolean) => {
  is_edit.value = change_to_edit;
};
const loadProfilePicture = async () => {
  profile_picture = await executeLink(
    "/v1/images/" + user.type + "/" + user.id,
    (response) => {
      return response.data.data.length > 0 ? response.data.data[0] : undefined;
    },
    () => undefined
  );
  original_image_name = profile_picture ? profile_picture.name : undefined;
  images_list = ref(profile_picture ? [profile_picture] : []);
  default_profile_picture =
    profile_picture == undefined ? require("../assets/person.png") : undefined;
  image_trigger.value++;
};
const removeImage = () => {
  images_list.value = [];
};

const $router = useRouter();
const user = User.getLoggedUser() as User;
const store = useStore();

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});

const alert_information: AlertInformation = store.state.alert_information;
const buttons: {
  [key: string]: CustomElement;
} = {
  edit: {
    id: "edit",
    type: "icon",
    linkType: "event",
    content: {
      icon: getIcon("pencil"),
      event: "edit",
    },
  },
  view: {
    id: "view",
    type: "icon",
    linkType: "event",
    content: {
      icon: getIcon("eye"),
      event: "view",
    },
  },
  cancel: {
    id: "cancel",
    type: "icon",
    linkType: "event",
    content: {
      icon: getIcon("close"),
      event: "cancel",
    },
  },
  logout: {
    id: "logout",
    type: "string_icon",
    linkType: "event",
    content: {
      text: getCurrentElement("logout"),
      icon: getIcon("logout"),
      event: "logout",
      whole_link: true,
    },
    ...store.state.button_css,
  },
  remove: {
    id: "remove",
    type: "string_icon",
    linkType: "event",
    content: {
      text: getCurrentElement("remove"),
      icon: getIcon("close"),
      event: "remove",
      whole_link: true,
    },
    ...store.state.button_css,
  },
};

const user_path =
  user.type == "admin"
    ? "admins"
    : user.type == "teacher"
    ? "teachers"
    : "students";

const user_data: StudentInformation | Teacher | Admin = await executeLink(
  "/v1/" + user_path + "/" + props.id,
  (response) =>
    user.type == "admin"
      ? new Admin(response.data.data)
      : user.type == "teacher"
      ? new Teacher(response.data.data)
      : new StudentInformation(response.data.data)
);
const user_edit_elements: {
  [key: string]: CustomElement;
} = {
  name: {
    id: "name",
    type: "input",
    content: user_data.name,
    params: {
      label: getCurrentElement("name"),
    },
  },
  surname: {
    id: "surname",
    type: "input",
    content: user_data.surname,
    params: {
      label: getCurrentElement("surname"),
    },
  },
  birth_date: {
    id: "birth_date",
    type: "input_date",
    content:
      user_data.birth_date && !isNaN(user_data.birth_date.getTime())
        ? toDateString(user_data.birth_date)
        : "",
    params: {
      label: getCurrentElement("birth_date"),
      show_clear_button: false,
      presentation: "date",
      max_date: new Date().toISOString(),
    },
  },
  address: {
    id: "address",
    type: "input",
    content: user_data.address ?? "",
    params: {
      label: getCurrentElement("address"),
    },
  },
  password: {
    id: "password",
    type: "input",
    content: "",
    params: {
      label: getCurrentElement("new_password"),
      type: "password",
    },
    colors: {
      background: {
        name: "background",
        type: "var",
      },
    },
    classes: {
      item: {
        "ion-margin-top": true,
      },
      button: {
        primary_bg_button: true,
        password_button: true,
      },
    },
  },
};
const alert_open = ref(false);
const progress_infos: Ref<
  {
    percentage: number;
  }[]
> = ref([]);
const is_edit = ref(false);
const selected_gender: Ref<Gender | ""> = ref(user_data.gender ?? "");
const user_trigger = ref(0);
const password_trigger = ref(0);
const image_trigger = ref(0);
const genders: { id: Gender }[] = Object.keys(GenderKeys).map((key) => ({
  id: key as Gender,
}));

let user_card: GeneralCardElements = user_data.toCard();
let profile_picture: ImageDescriptor | undefined,
  original_image_name: string | undefined,
  images_list: Ref<(ImageDescriptor | File)[]>,
  default_profile_picture: string | undefined;

await loadProfilePicture();
</script>

<style>
.thumbnail {
  height: 200px;
}
.password_button {
  height: 100%;
  margin-left: 10px;
}
</style>
