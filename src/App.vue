<template>
  <ion-app>
    <ion-split-pane content-id="main-content">
      <ion-menu content-id="main-content" type="overlay">
        <ion-content>
          <ion-list id="menu-list">
            <ion-list-header class="ion-padding-bottom">
              <router-link
                v-if="user != undefined"
                :to="{ name: getDefautlLink(user.type).name }"
              >
                <ion-img
                  :src="image"
                  alt="LIVO Campus Logo"
                  style="height: 90px"
                />
              </router-link>
              <ion-img
                v-else
                :src="image"
                alt="LIVO Campus Logo"
                style="height: 90px"
              />
            </ion-list-header>

            <ion-menu-toggle :auto-hide="false" :key="trigger">
              <template v-if="user != undefined">
                <ion-item
                  v-for="(p, i) in getMenu()"
                  :key="i"
                  @click="selectTitle(i)"
                  router-direction="root"
                  :router-link="{ name: p.url_names[user.type][0] }"
                  lines="none"
                  :detail="false"
                  class="hydrated"
                  :class="{ selected: menu.index === i }"
                >
                  <ion-icon
                    aria-hidden="true"
                    class="ion-padding-end"
                    :ios="getIcon(p.icon_ref).ios"
                    :md="getIcon(p.icon_ref).md"
                  ></ion-icon>
                  <ion-label text-wrap>{{
                    getCurrentElement(order[i])
                  }}</ion-label>
                </ion-item>
              </template>
            </ion-menu-toggle>
          </ion-list>
        </ion-content>
      </ion-menu>
      <!-- TODO (5): creare gestore delle finestre di alert unico e raccogliere tutti gli elementi ion-alert con AlertInformation e simili -->
      <ion-router-outlet id="main-content"></ion-router-outlet>
    </ion-split-pane>
  </ion-app>
</template>

<script setup lang="ts">
import {
  IonApp,
  IonContent,
  IonIcon,
  IonImg,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenu,
  IonMenuToggle,
  IonRouterOutlet,
  IonSplitPane,
} from "@ionic/vue";
import { computed, ComputedRef, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";

import { Menu, MenuItem, User } from "./types";
import {
  executeAdditionalControl,
  getCurrentElement,
  getDefautlLink,
  getIcon,
} from "./utils";

const getMenu = () => {
  const complete_menu: MenuItem[] = [];

  for (const item_title of order.value) {
    complete_menu.push(menu.items[item_title]);
  }

  return complete_menu;
};
const selectTitle = (index: number) => {
  store.state.menu.index = index;
  sessionStorage.setItem("selected_item", order.value[index]);
};
const changeTitle = () => {
  const items_titles = Object.keys(menu.items);
  const selected_item = sessionStorage.getItem("selected_item");

  let urls: string[] | undefined;
  let tmp_index = -1;
  let count = 0;

  if (
    $route.name !== undefined &&
    user.value != undefined &&
    $route.name != "auth" &&
    $route.name != "logout"
  ) {
    if (
      selected_item != null &&
      (tmp_index = menu.items[selected_item].url_names[
        user.value.type
      ].findIndex((a) => a == ($route.name as string))) != -1
    ) {
      tmp_index = order.value.findIndex((a) => a == selected_item);
    } else {
      while (tmp_index == -1 && count < items_titles.length) {
        urls = menu.items[items_titles[count]].url_names[user.value.type];
        if (urls != undefined) {
          tmp_index = urls.findIndex((a) => a == $route.name);
        }
        count++;
      }
      if (tmp_index != -1) {
        tmp_index = order.value.findIndex((a) => a == items_titles[count - 1]);
      }
    }
    menu.index =
      tmp_index != -1
        ? tmp_index
        : order.value.findIndex(
            (a) => a == menu.default_item[(user.value as User).type]
          );
    sessionStorage.setItem("selected_item", order.value[tmp_index]);
    trigger.value++;
  }
};

const store = useStore();
const $route = useRoute();
const menu: Menu = store.state.menu;

const image = computed(() => require("./assets/Logo_LIVO_Path.png"));
const trigger = ref(0);
const user: ComputedRef<User | undefined> = computed(
  () => store.state.user ?? User.getLoggedUser()
);
const order = computed(() =>
  user.value != undefined
    ? menu.order[user.value.type].filter((a) =>
        user.value != undefined
          ? executeAdditionalControl(user.value, menu.items[a]) != false
          : false
      )
    : []
); // getMenuOrder function. Not used the proper function to avoid the loss of reactivity

changeTitle();
watch($route, changeTitle);
</script>

<style scoped>
ion-menu ion-content {
  --background: var(--ion-item-background, var(--ion-color-background));
}

ion-menu.md ion-content {
  --padding-start: 8px;
  --padding-end: 8px;
  --padding-top: 20px;
  --padding-bottom: 20px;
}

ion-menu.md ion-list {
  padding: 20px 0;
}

ion-menu.md ion-note {
  margin-bottom: 30px;
}

ion-menu.md ion-list-header,
ion-menu.md ion-note {
  padding-left: 10px;
}

ion-menu.md ion-list#menu-list {
  border-bottom: 1px solid var(--ion-color-step-150, #d7d8da);
}

ion-menu.md ion-list#menu-list ion-list-header {
  font-size: 22px;
  font-weight: 600;

  min-height: 20px;
}

ion-menu.md ion-item {
  --padding-start: 10px;
  --padding-end: 10px;
}

ion-menu.md ion-item.selected {
  --background: rgba(var(--ion-color-primary-rgb), 0.14);
}

ion-menu.md ion-item.selected ion-icon {
  color: var(--ion-color-primary);
}

ion-menu.md ion-item ion-icon {
  color: var(--ion-color-primary);
}

ion-menu.md ion-item ion-label {
  font-weight: 500;
}

ion-menu.ios ion-content {
  --padding-bottom: 20px;
}

ion-menu.ios ion-list {
  padding: 20px 0 0 0;
}

ion-menu.ios ion-note {
  line-height: 24px;
  margin-bottom: 20px;
}

ion-menu.ios ion-item {
  --padding-start: 16px;
  --padding-end: 16px;
  --min-height: 50px;
}

ion-menu.ios ion-item.selected ion-icon {
  color: var(--ion-color-primary);
}

ion-menu.ios ion-item ion-icon {
  font-size: 24px;
  color: var(--ion-color-primary);
}

ion-menu.ios ion-list-header,
ion-menu.ios ion-note {
  padding-left: 16px;
  padding-right: 16px;
}

ion-menu.ios ion-note {
  margin-bottom: 8px;
}

ion-note {
  display: inline-block;
  font-size: 16px;

  color: var(--ion-color-medium-shade);
}

ion-item.selected {
  --color: var(--ion-color-primary);
}

ion-item:hover {
  cursor: pointer;
  --background: rgba(var(--ion-color-primary-rgb), 0.14);
}
</style>
