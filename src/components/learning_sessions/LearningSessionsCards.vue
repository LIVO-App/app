<template>
  <!-- Two-column grid (responsive): each ListCard shows a learning-session group by status. -->
  <ion-grid
    ><!-- v-if="learning_sessions.loaded">-->
    <ion-row>
      <ion-col size="12" size-md="6">
        <!-- Current sessions (active right now). -->
        <list-card
          :title="
            getCustomMessage('title', getCurrentElement('current'), 'string', {
              text: {
                name: 'white',
                type: 'var',
              },
            })
          "
          :emptiness_message="no_session"
          :cards_list="learning_sessions.current"
          :colors="{
            list_borders: {
              name: 'white',
              type: 'var',
            },
            background: {
              name: 'current',
              type: 'var',
            },
            hover: {
              name: 'current',
              alpha: 0.54,
              type: 'var',
            },
            text: {
              name: 'white',
              type: 'var',
            },
            dividers: {
              name: 'white',
              type: 'var',
            },
          }"
        />

        <!-- Future sessions (planned / open enrollment split happens in the script logic). -->
        <list-card
          :title="
            getCustomMessage('title', getCurrentElement('future'), 'string', {
              text: {
                name: 'white',
                type: 'var',
              },
            })
          "
          :emptiness_message="no_session"
          :cards_list="learning_sessions.future"
          :colors="{
            background: {
              name: 'warning',
              type: 'var',
            },
            hover: {
              name: 'warning',
              alpha: 0.54,
              type: 'var',
            },
            dividers_text: {
              name: 'black',
              type: 'var',
            },
            list_borders: {
              name: 'white',
              type: 'var',
            },
            dividers: {
              name: 'white',
              type: 'var',
            },
          }"
        />
      </ion-col>
      <ion-col size="12" size-md="6">
        <!-- Upcoming sessions (next in timeline, but not started yet). -->
        <list-card
          :title="
            getCustomMessage('title', getCurrentElement('upcoming'), 'string', {
              text: {
                name: 'white',
                type: 'var',
              },
            })
          "
          :colors="{
            list_borders: {
              name: 'white',
              type: 'var',
            },
            background: {
              name: 'danger',
              type: 'var',
            },
            hover: {
              name: 'danger',
              alpha: 0.54,
              type: 'var',
            },
            text: {
              name: 'white',
              type: 'var',
            },
            dividers: {
              name: 'white',
              type: 'var',
            },
          }"
          :emptiness_message="no_session"
          :cards_list="learning_sessions.upcoming"
        />

        <!-- Completed sessions grouped by school year. -->
        <list-card
          :title="
            getCustomMessage(
              'title',
              getCurrentElement('completed'),
              'string',
              {
                text: {
                  name: 'white',
                  type: 'var',
                },
              }
            )
          "
          :colors="{
            list_borders: {
              name: 'white',
              type: 'var',
            },
            background: {
              name: 'completed',
              type: 'var',
            },
            hover: {
              name: 'completed',
              alpha: 0.54,
              type: 'var',
            },
            text: {
              name: 'white',
              type: 'var',
            },
            dividers: {
              name: 'white',
              type: 'var',
            },
          }"
          :emptiness_message="no_session"
          :cards_list="learning_sessions.completed"
        />
      </ion-col>
    </ion-row>
  </ion-grid>
</template>

<script setup lang="ts">
/**
 * @displayName LearningSessionsCards
 * @description
 * Shows learning sessions grouped by status (current/future/upcoming/completed).
 * Sessions are loaded from the backend and rendered through `ListCard` groups.
 */

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
const no_session: CustomElement = getCustomMessage(
  "emptiness_message",
  getCurrentElement("no_sessions")
);
const ordinary_classes: OrdinaryClassProps[] = await executeLink(
  "/v1/ordinary_classes?student_id=" + user.id + "&descending=true",
  (response) => response.data.data
);
const current_class = ordinary_classes.shift();
const current_school_year =
  current_class != undefined
    ? current_class.school_year
    : getCurrentSchoolYear();

let tmp_element: GeneralCardElements | undefined,
  learning_session: LearningSession;
let open_enrollment = false,
  first = true;

if (current_class != undefined) {
  // Fetch sessions for past school years (rendered under the "completed" group).
  for (const oc of ordinary_classes) {
    promises.push(
      executeLink(
        "/v1/learning_sessions?school_year=" + oc.school_year,
        async (response) => {
          // For each past year: create a section and convert all sessions into cards.
          learning_sessions.completed.order.push({
            key: oc.school_year,
            title: getCustomMessage("title", oc.school_year, "title"),
          });
          learning_sessions.completed.cards[oc.school_year] = [];
          for (const session of response.data.data) {
            learning_session = new LearningSession(session);
            learning_sessions.completed.cards[oc.school_year].push(
              await learning_session.toCard(undefined)
            );
          }
        }
      )
    );
  }

  // Fetch sessions for the current school year and split them by status.
  promises.push(
    executeLink(
      "/v1/learning_sessions?school_year=" + current_school_year,
      async (response) => {
        // Ensure the current year exists under completed (some sessions may already be completed).
        learning_sessions.completed.order.push({
          key: current_school_year,
          title: getCustomMessage("title", current_school_year, "title"),
        });

        // Future sessions are shown in two sub-groups:
        // - open_enrollment: the first "planned" session whose open day is in the past
        // - planned: all other future sessions
        learning_sessions.future.order = learning_sessions.future.order.concat(
          {
            key: "open_enrollment",
            title: getCustomMessage(
              "title",
              getCurrentElement("open_enrollment"),
              "title"
            ),
          },
          {
            key: "planned",
            title: getCustomMessage(
              "title",
              getCurrentElement("planned"),
              "title"
            ),
          }
        );
        learning_sessions.future.cards["open_enrollment"] = [];
        learning_sessions.future.cards["planned"] = [];

        for (const session of response.data.data) {
          learning_session = new LearningSession(session);

          // Build the visual card once, then place it into the appropriate group.
          tmp_element = await learning_session.toCard(
            undefined,
            undefined,
            undefined,
            undefined,
            true
          );

          // Grouping rules: one bucket for CURRENT and UPCOMING (single-card lists),
          // FUTURE into planned/open-enrollment, COMPLETED by school year.
          switch (learning_session.getStatus()) {
            case LearningSessionStatus.FUTURE:
              if (learning_sessions.future.cards["planned"] == null) {
                learning_sessions.future.cards["planned"] = [];
              }

              // Detect whether the first planned session has already opened enrollment.
              if (first) {
                first = false;
                if (
                  !open_enrollment &&
                  learning_session.open_day <= new Date()
                ) {
                  open_enrollment = true;
                }
              }
              learning_sessions.future.cards["planned"].push(tmp_element);
              break;
            case LearningSessionStatus.UPCOMING:
              // Only the nearest upcoming session is shown.
              learning_sessions.upcoming.cards[""] = [tmp_element];
              break;
            case LearningSessionStatus.CURRENT:
              // Only the current active session is shown.
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

        // If enrollment is open, move the first planned session into the dedicated bucket.
        if (
          open_enrollment &&
          (tmp_element = learning_sessions.future.cards["planned"].shift()) !=
            undefined
        ) {
          learning_sessions.future.cards["open_enrollment"].push(tmp_element);
        }
      }
    )
  );

  // Wait for all backend calls to complete before finalizing order.
  await Promise.all(promises); /*.then(() => {
      learning_sessions.loaded = true;
    });*/

  // Display past school years in descending order.
  learning_sessions.completed.order.reverse();
  if (learning_sessions.completed.cards[current_school_year] == undefined) {
    learning_sessions.completed.cards[current_school_year] = [];
  }
}
</script>

<style></style>
