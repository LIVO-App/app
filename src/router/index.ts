import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
import { store } from "../store";
import { Menu, User } from "@/types";
import {
  getBaseUrl,
  getDefautlLink,
  getUserFromTokens,
  isTokenExpired,
  logout,
  setUser,
  tryAutoLogin,
} from "@/utils";

const routes: Array<RouteRecordRaw> = [
  {
    path: "",
    redirect: "/auth",
  },
  {
    path: "/",
    redirect: "/auth",
  },
  {
    path: "/learning_sessions",
    name: "learning_sessions",
    component: () => import("../views/LearningSessions.vue"),
  },
  {
    path: "/auth",
    name: "auth",
    component: () => import("../views/UserAuthentication.vue"),
  },
  {
    path: "/profile",
    name: "profile",
    component: () => import("../views/UserDescription.vue"),
  },
  {
    path: "/logout",
    name: "logout",
    component: () => import("../views/TmpLogout.vue"),
  },
  {
    path: "/learning_sessions/:id",
    name: "learning_session",
    component: () => import("../views/StudentCourses.vue"),
  },
  {
    path: "/curriculum",
    name: "curriculum",
    component: () => import("../views/StudentCurriculum.vue"),
  },
  {
    path: "/openbadges",
    name: "openbadges",
    component: () => import("../views/NotImplemented.vue"),
  },
  {
    path: "/citizenship_report",
    name: "citizenship_report",
    component: () => import("../views/NotImplemented.vue"),
  },
  {
    path: "/settings",
    name: "settings",
    component: () => import("../views/NotImplemented.vue"),
  },
  {
    path: "/info",
    name: "info",
    component: () => import("../views/NotImplemented.vue"),
  },
  {
    path: "/project_courses",
    name: "project_courses",
    component: () => import("../views/ProjectCourses.vue"),
  },
  {
    path: "/project_courses/:course/:session",
    name: "project_course",
    component: () => import("../views/ProjectClass.vue"),
  },
  {
    path: "/course_proposal",
    name: "course_proposal",
    component: () => import("../views/CourseProposition.vue") /*,
    beforeEnter: (to, from) => {
      if (to.query.edit != undefined || to.query.view != undefined) {
        sessionStorage.setItem("proposition",JSON.stringify({
          "id": to.query.edit ?? to.query.view,
          "action": to.query.edit != undefined ? "edit" : to.query.view != undefined ? "view" : ""
        }));
        return {
          name: 'course_proposition',
          query: {}
        };
      } else {
        //sessionStorage.removeItem("proposition");
        return true;
      }
    }*/,
  },
  {
    path: "/announcements/:course/:session",
    name: "announcement",
    component: () => import("../views/AnnouncementsPage.vue"),
  },
  {
    path: "/announcements",
    name: "announcements",
    component: () => import("../views/ProjectCoursesHub.vue"),
  },
  {
    path: "/ordinary_classes",
    name: "ordinary_classes",
    component: () => import("../views/OrdinaryClasses.vue"),
  },
  {
    path: "/ordinary_classes/:study_year/:address/:school_year",
    name: "ordinary_class",
    component: () => import("../views/OrdinaryClass.vue"),
  },
  {
    path: "/students/:id",
    name: "student",
    component: () => import("../views/StudentDescription.vue"),
  },
  {
    path: "/propositions_history",
    name: "propositions_history",
    component: () => import("../views/PropositionsHistory.vue"),
  },
  {
    path: "/project_courses_hub", // TODO (6): unire a /project_courses
    name: "project_courses_hub",
    component: () => import("../views/ProjectCoursesHub.vue"),
  },
  {
    path: "/learning_sessions_management",
    name: "learning_sessions_management",
    component: () => import("../views/LearningSessionsManagement.vue"),
  },
  {
    path: "/constraints_management",
    name: "constraints_management",
    component: () => import("../views/NotImplemented.vue"),
  },
  {
    path: "/open_day_courses",
    name: "open_day_courses",
    component: () => import("../views/OpenDayCourses.vue"),
  },
  {
    path: "/auth/google",
    name: "google_auth",
    component: () => import("../components/LoadingComponent.vue"),
  },
  {
    path: "/google-redirect",
    name: "google_redirect",
    component: () => import("../components/LoadingComponent.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  const menu: Menu = store.state.menu;
  const menu_items = Object.keys(menu.items);

  let user = User.getLoggedUser();
  let selected_item: string, tmp_user: User;
  let default_link = {
    name: "/",
    index: 0,
  };

  if (to.name != undefined) {
    if (isTokenExpired()) {
      // TODO (7): quando si avrà lo store sicuro mettere che si può ritornare alla pagina precedente se è lo stesso utente
      await logout(false);
      return { name: "auth" };
    } else if (user == undefined) {
      if (to.name == "google_auth") {
        location.href = getBaseUrl() + "/v1/auth/google";
      } else if (to.name == "google_redirect") {
        if (to.query.token != undefined) {
          tmp_user = getUserFromTokens(
            to.query.token as string,
            to.query.refresh_token as string
          );
          default_link = getDefautlLink(tmp_user.type);
          /*await*/ setUser(tmp_user, default_link);

          return { name: default_link.name };
        } else {
          return { name: "auth" };
        }
      } else if (to.name !== "logout") {
        const autoLoginResult = await tryAutoLogin();

        if (autoLoginResult) {
          // Auto-login successful, set user
          await setUser(autoLoginResult.user, autoLoginResult.defaultLink);
          user = autoLoginResult.user;
          default_link = autoLoginResult.defaultLink;

          return { name: default_link.name };
        } else if (to.name !== "auth") {
          return { name: "auth" };
        }
      }
    } else if (user != undefined) {
      if (
        (to.name !== "auth" &&
          to.name !== "logout" &&
          (((selected_item =
            sessionStorage.getItem("selected_item") ??
            menu.order[user.type][menu.index]) == undefined && // No menu item selected
            find_item_index(user, menu, menu_items, to.name.toString()) ==
              -1) || // Link not found in any menu item
            (menu.items[selected_item]?.url_names[user.type]?.findIndex(
              (a) => a == to.name
            ) == -1 && // Link not found in the selected menu item
              find_item_index(user, menu, menu_items, to.name.toString()) ==
                -1))) || // Link not found in any menu item
        to.name === "auth"
      ) {
        return false;
      } else if (to.name === "logout") {
        await logout();
        return { name: "auth" };
      }
    }
  } else {
    return false;
  }
});

const find_item_index = (
  user: User,
  menu: Menu,
  menu_items: string[],
  item: string
) => {
  let count = 0;
  let tmp_index = -1;

  do {
    if (menu.items[menu_items[count]].url_names[user.type] != undefined) {
      tmp_index = menu.items[menu_items[count]].url_names[user.type].findIndex(
        (a) => a == item
      );
    }
  } while (tmp_index == -1 && ++count < menu_items.length);

  return tmp_index;
};

export default router;
