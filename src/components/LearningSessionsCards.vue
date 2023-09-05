<template>
  <ion-grid
    ><!-- v-if="learning_sessions.loaded">-->
    <ion-row>
      <ion-col size="12" size-md="6">
        <list-card
          :title="
            getCustomMessage('title', getCurrentElement('current'), 'string', {
              name: 'white',
              type: 'text',
            })
          "
          :emptiness_message="no_session"
          :cards_list="learning_sessions.current"
          :colors="{
            list_borders: 'white',
            background: 'current',
            text: 'white',
            dividers: 'white',
          }"
        />
        <list-card
          :title="
            getCustomMessage('title', getCurrentElement('future'), 'string', {
              name: 'white',
              type: 'text',
            })
          "
          :emptiness_message="no_session"
          :cards_list="learning_sessions.future"
          :colors="{
            background: 'warning',
            dividers_text: 'black',
            list_borders: 'white',
            dividers: 'white',
          }"
        />
      </ion-col>
      <ion-col size="12" size-md="6">
        <list-card
          :title="
            getCustomMessage('title', getCurrentElement('upcoming'), 'string', {
              name: 'white',
              type: 'text',
            })
          "
          :colors="{
            list_borders: 'white',
            background: 'danger',
            text: 'white',
            dividers: 'white',
          }"
          :emptiness_message="no_session"
          :cards_list="learning_sessions.upcoming"
        />
        <list-card
          :title="
            getCustomMessage(
              'title',
              getCurrentElement('completed'),
              'string',
              {
                name: 'white',
                type: 'text',
              }
            )
          "
          :colors="{
            list_borders: 'white',
            background: 'completed',
            text: 'white',
            dividers: 'white',
          }"
          :emptiness_message="no_session"
          :cards_list="learning_sessions.completed"
        />
      </ion-col>
    </ion-row>
  </ion-grid>
</template>

<script setup lang="ts">
import {
  GeneralCardElements,
  LearningSessionStatus,
  OrdinaryClassProps,
  LearningSession,
  OrderedCardsList,
  User,
  CustomElement,
} from "@/types";
import { IonGrid, IonRow, IonCol } from "@ionic/vue";
import { reactive } from "vue";
import {
  executeLink,
  getCurrentElement,
  getCurrentSchoolYear,
  getCustomMessage,
} from "@/utils";

const user = User.getLoggedUser() as User;

const learning_sessions: {
  current: OrderedCardsList<GeneralCardElements>;
  future: OrderedCardsList<GeneralCardElements>;
  upcoming: OrderedCardsList<GeneralCardElements>;
  completed: OrderedCardsList<GeneralCardElements>;
} = reactive({
  current: {
    order: [],
    cards: {},
  },
  future: {
    order: [],
    cards: {},
  },
  upcoming: {
    order: [],
    cards: {},
  },
  completed: {
    order: [],
    cards: {},
  },
});
const promises: Promise<any>[] = [];
const no_session: CustomElement = getCustomMessage("emptiness_message",getCurrentElement("no_sessions"));
const ordinary_classes: OrdinaryClassProps[] = await executeLink(
  "/v1/ordinary_classes?student_id=" + user.id,
  (response) => response.data.data
);
const current_class = ordinary_classes.shift();
const current_school_year =
  current_class != undefined
    ? current_class.school_year
    : getCurrentSchoolYear();

let tmp_element: GeneralCardElements | undefined,
  learning_session: LearningSession;

if (current_class != undefined) {
  for (const oc of ordinary_classes) {
    promises.push(
      executeLink(
        "/v1/learning_sessions?school_year=" + oc.school_year,
        async (response) => {
          learning_sessions.completed.order.push({
            key: oc.school_year,
            title: getCustomMessage("title", oc.school_year),
          });
          learning_sessions.completed.cards[oc.school_year] = [];
          for (const session of response.data.data) {
            learning_session = new LearningSession(session);
            learning_sessions.completed.cards[oc.school_year].push(
              await learning_session.toCard(undefined)
            );
          }
        },
        () => console.error("Learning sessions not retrieved")
      )
    );
  }
  promises.push(
    executeLink(
      "/v1/learning_sessions?school_year=" + current_school_year,
      async (response) => {
        for (const session of response.data.data) {
          learning_session = new LearningSession(session);
          tmp_element = await learning_session.toCard(undefined);

          switch (learning_session.getStatus()) {
            case LearningSessionStatus.FUTURE:
              if (learning_sessions.future.cards["planned"] == null) {
                learning_sessions.future.cards["planned"] = [tmp_element];
              } else {
                learning_sessions.future.cards["planned"].push(tmp_element);
              }
              break;
            case LearningSessionStatus.UPCOMING:
              learning_sessions.upcoming.cards[""] = [tmp_element];
              break;
            case LearningSessionStatus.CURRENT:
              learning_sessions.current.cards[""] = [tmp_element];
              break;
            case LearningSessionStatus.COMPLETED:
              if (
                learning_sessions.completed.cards[session.school_year] ==
                undefined
              ) {
                learning_sessions.completed.cards[session.school_year] = [
                  tmp_element,
                ];
              } else {
                learning_sessions.completed.cards[session.school_year].push(
                  tmp_element
                );
              }
              break;
          }
        }
        learning_sessions.completed.order.push({
          key: current_school_year,
          title: getCustomMessage("title", current_school_year),
        });
        learning_sessions.future.order = learning_sessions.future.order.concat(
          {
            key: "open_enrollment",
            title: getCustomMessage(
              "title",
              getCurrentElement("open_enrollment")
            ),
          },
          {
            key: "planned",
            title: getCustomMessage("title", getCurrentElement("planned")),
          }
        );
        tmp_element = learning_sessions.future.cards["planned"].shift();
        learning_sessions.future.cards["open_enrollment"] =
          tmp_element != undefined ? [tmp_element] : [];
      }
    )
  );
  await Promise.all(promises); /*.then(() => {
      learning_sessions.loaded = true;
    });*/
} else {
  console.error("Connection failed");
}
</script>

<style>
</style>