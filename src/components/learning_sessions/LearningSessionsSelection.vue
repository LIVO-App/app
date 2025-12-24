<template>
  <ion-grid
    ><!-- v-if="learning_sessions.loaded">-->
    <ion-row>
      <ion-col size="12" size-md="6">
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
          :cards_list="learning_sessions"
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
          :title="getCustomMessage('title', getCurrentElement('courses'))"
          :emptiness_message="
            getCustomMessage(
              'emptiness_message',
              getCurrentElement(
                is_nothing_selected()
                  ? 'teacher_learning_session_selection_message'
                  : 'no_courses'
              )
            )
          "
          :cards_list="is_nothing_selected() ? empty_courses : courses"
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
        />
      </ion-col>
    </ion-row>
  </ion-grid>
</template>

<script setup lang="ts">
import {
  GeneralCardElements,
  LearningSession,
  OrderedCardsList,
  CourseSectionsTeachings,
  User,
} from "@/types";
import { IonGrid, IonRow, IonCol } from "@ionic/vue";
import { reactive, ref } from "vue";
import { useStore } from "vuex";
import { executeLink, getCurrentElement, getCustomMessage } from "@/utils";

type Indexes = {
  year: string;
  index: number;
};

const is_nothing_selected = () =>
  selected_session_indexes.year == "-1" && selected_session_indexes.index == -1;
const find_session = (
  learning_sessions: OrderedCardsList<GeneralCardElements>,
  id?: string
): Indexes => {
  const years = Object.keys(learning_sessions.cards);

  let count = 0;
  let year: string;
  let index: number;

  do {
    year = years[count];
    index = learning_sessions.cards[year].findIndex(
      (a: GeneralCardElements) => {
        if (id != undefined) {
          return a.id == id;
        } else {
          return a.selected;
        }
      }
    );
    count++;
  } while (index == -1 && count < years.length);

  return {
    year: year,
    index: index,
  };
};
const changeSelection = async () => {
  const tmp_classes: {
    teacher: {
      [key: number]: CourseSectionsTeachings;
    };
    associated: {
      [key: number]: CourseSectionsTeachings;
    };
  } = {
    teacher: {},
    associated: {},
  };

  if (
    selected_session_indexes.year != "-1" &&
    selected_session_indexes.index != -1
  ) {
    selectedChange();
  }

  const tmp_selected = find_session(
    learning_sessions,
    store.state.event.data.id
  );
  if (
    selected_session_indexes.year == tmp_selected.year &&
    selected_session_indexes.index == tmp_selected.index
  ) {
    selected_session_indexes = {
      year: "-1",
      index: -1,
    };
    courses.cards = {
      teacher: [],
      associated: [],
    };
  } else {
    selected_session_indexes = tmp_selected;
    await executeLink(
      "/v1/teachers/" +
        user.id +
        "/my_project_classes?session_id=" +
        learning_sessions.cards[selected_session_indexes.year][
          selected_session_indexes.index
        ].id,
      (response: any) => {
        for (const class_teaching of response.data.data) {
          if (tmp_classes.teacher[class_teaching.id] == undefined) {
            tmp_classes.teacher[class_teaching.id] =
              new CourseSectionsTeachings(class_teaching);
          } else {
            tmp_classes.teacher[class_teaching.id].sections.add(
              class_teaching.section
            );
            if (class_teaching.my_teaching) {
              tmp_classes.teacher[class_teaching.id].my_teaching_refs.add(
                class_teaching.teaching_ref.data.id
              );
            }
          }
        }
      }
    );
    courses.cards.teacher = Object.values(tmp_classes.teacher).map(
      (a: CourseSectionsTeachings) =>
        a.toCard(
          "teacher",
          learning_sessions.cards[selected_session_indexes.year][
            selected_session_indexes.index
          ].id
        )
    );
    await executeLink(
      "/v1/teachers/" +
        user.id +
        "/associated_project_classes?session_id=" +
        learning_sessions.cards[selected_session_indexes.year][
          selected_session_indexes.index
        ].id,
      (response: any) => {
        const teaching_classes = new Set(Object.keys(tmp_classes.teacher));
        for (const class_teaching of response.data.data) {
          if (!teaching_classes.has("" + class_teaching.id)) {
            if (tmp_classes.associated[class_teaching.id] == undefined) {
              tmp_classes.associated[class_teaching.id] =
                new CourseSectionsTeachings(class_teaching);
            } else {
              tmp_classes.associated[class_teaching.id].sections.add(
                class_teaching.section
              );
              tmp_classes.associated[class_teaching.id].my_teaching_refs.add(
                class_teaching.teaching_ref.data.id
              );
            }
          }
        }
      }
    );
    courses.cards.associated = Object.values(tmp_classes.associated).map(
      (a: CourseSectionsTeachings) =>
        a.toCard(
          "my_associated_teachings",
          learning_sessions.cards[selected_session_indexes.year][
            selected_session_indexes.index
          ].id
        )
    );
    selectedChange();
  }
};
const selectedChange = (
  year = selected_session_indexes.year,
  index = selected_session_indexes.index,
  value = !learning_sessions.cards[year][index].selected
) => {
  learning_sessions.cards[year][index].selected = value;
  trigger.value++;
};

const store = useStore();
const user = User.getLoggedUser() as User;

const promises: Promise<any>[] = [];
const learning_sessions: OrderedCardsList<GeneralCardElements> = reactive({
  order: [],
  cards: {},
});
const empty_courses: OrderedCardsList<GeneralCardElements> = reactive({
  order: [],
  cards: {},
});
const courses: OrderedCardsList<GeneralCardElements> = reactive({
  order: [
    {
      key: "teacher",
      title: getCustomMessage("title", getCurrentElement("teacher"), "title"),
    },
    {
      key: "associated",
      title: getCustomMessage(
        "title",
        getCurrentElement("my_associated_teachings")
      ),
    },
  ],
  cards: {
    teacher: [],
    associated: [],
  },
});
const teaching_years: number[] = (await executeLink(
  "/v1/teachers/" + user.id + "/active_years",
  (response: any) => response.data.data.map((a: any) => a.year),
  () => []
)).reverse();
const trigger = ref(0);

let selected_session_indexes: Indexes = reactive({
  year: "-1",
  index: -1,
});

for (const year of teaching_years) {
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
</script>

<style></style>
