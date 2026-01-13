/**
 * LIVOApp entry point.
 *
 * Bootstraps Vue 3 + IonicVue + Vue Router + Vuex and registers reusable
 * components as global components so they can be used across `views/` and
 * feature components without repetitive imports.
 */

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { $axios } from "./plugins/axios";
import { store } from "./store";
import { quillEditor } from "vue3-quill";

import { IonicVue } from "@ionic/vue";

import OuterHeader from "./components/layout/OuterHeader.vue";
import InnerHeader from "./components/layout/InnerHeader.vue";
import LearningSessionsCards from "./components/learning_sessions/LearningSessionsCards.vue";
import ListCard from "./components/cards/ListCard.vue";
import GeneralCard from "./components/cards/GeneralCard.vue";
import LoadingComponent from "./components/layout/LoadingComponent.vue";
import SessionDescription from "./components/learning_sessions/SessionDescription.vue";
import CoursesSelectionList from "./components/courses/CoursesSelectionList.vue";
import CustomSelect from "./components/elements/CustomSelect.vue";
import CourseCard from "./components/cards/CourseCard.vue";
import CurriculumList from "./components/courses/CurriculumList.vue";
import IonicElement from "./components/elements/IonicElement.vue";
import IonicTable from "./components/cards/IonicTable.vue";
import GradesManager from "./components/grades/GradesManager.vue";
import CourseDescription from "./components/courses/CourseDescription.vue";
import LearningSessionsSelection from "./components/learning_sessions/LearningSessionsSelection.vue";
import ProjectClass from "./components/classes/project/ProjectClass.vue";
import AnnouncementsComponent from "./components/announcements/AnnouncementsComponent.vue";
import AnnouncementViewer from "./components/announcements/AnnouncementViewer.vue";
import AnnouncementsPublisher from "./components/announcements/AnnouncementsPublisher.vue";
import ProjectClassesList from "./components/classes/project/ProjectClassesList.vue";
import ProjectClassSelectList from "./components/classes/project/ProjectClassSelectList.vue";
import UserDescription from "./components/users/UserDescription.vue";
import OverallStudentDescription from "./components/users/OverallStudentDescription.vue";
import AuthPanel from "./components/users/AuthPanel.vue";
import CourseProposition from "./components/courses/CourseProposition.vue";
import CardItem from "./components/cards/CardItem.vue";
import GroupList from "./components/cards/GroupList.vue";
import CardsGrid from "./components/cards/CardsGrid.vue";
import EditorWrapper from "./components/elements/EditorWrapper.vue";
import ProjectClassSelector from "./components/classes/project/ProjectClassSelector.vue";
import OrdinaryClass from "./components/classes/ordinary/OrdinaryClass.vue";
import MultipleGradesManager from "./components/grades/MultipleGradesManager.vue";
import ImageUploader from "./components/elements/ImageUploader.vue";
import ImageCarousel from "./components/elements/ImageCarousel.vue";
import SimpleAdder from "./components/elements/SimpleAdder.vue";
import OrdinaryClassesManager from "./components/classes/ordinary/OrdinaryClassesManager.vue";
import OrdinaryClassPeopleAdder from "./components/classes/ordinary/OrdinaryClassPeopleAdder.vue";
import LearningSessionsManager from "./components/learning_sessions/LearningSessionsManager.vue";

/* Core CSS required for Ionic components to work properly */
import "@ionic/vue/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/vue/css/normalize.css";
import "@ionic/vue/css/structure.css";
import "@ionic/vue/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/vue/css/padding.css";
import "@ionic/vue/css/float-elements.css";
import "@ionic/vue/css/text-alignment.css";
import "@ionic/vue/css/text-transformation.css";
import "@ionic/vue/css/flex-utils.css";
import "@ionic/vue/css/display.css";

/* Theme variables */
import "./theme/variables.css";

/* Global styles */
import "./theme/global.css";

const app = createApp(App)
  .use(store)
  .use(IonicVue)
  .use(router)
  .use(quillEditor)
  /*.use(axios, {
      baseUrl: 'https://cataas.com/',
  })*/
  .provide("$axios", $axios)
  .component("OuterHeader", OuterHeader)
  .component("InnerHeader", InnerHeader)
  .component("LearningSessionsCards", LearningSessionsCards)
  .component("ListCard", ListCard)
  .component("GeneralCard", GeneralCard)
  .component("LoadingComponent", LoadingComponent)
  .component("SessionDescription", SessionDescription)
  .component("CoursesSelectionList", CoursesSelectionList)
  .component("CustomSelect", CustomSelect)
  .component("CourseCard", CourseCard)
  .component("CurriculumList", CurriculumList)
  .component("IonicElement", IonicElement)
  .component("IonicTable", IonicTable)
  .component("GradesManager", GradesManager)
  .component("CourseDescription", CourseDescription)
  .component("LearningSessionsSelection", LearningSessionsSelection)
  .component("ProjectClass", ProjectClass)
  .component("AnnouncementsComponent", AnnouncementsComponent)
  .component("AnnouncementViewer", AnnouncementViewer)
  .component("AnnouncementsPublisher", AnnouncementsPublisher)
  .component("ProjectClassesList", ProjectClassesList)
  .component("ProjectClassSelectList", ProjectClassSelectList)
  .component("UserDescription", UserDescription)
  .component("OverallStudentDescription", OverallStudentDescription)
  .component("AuthPanel", AuthPanel)
  .component("CourseProposition", CourseProposition)
  .component("CardItem", CardItem)
  .component("GroupList", GroupList)
  .component("CardsGrid", CardsGrid)
  .component("EditorWrapper", EditorWrapper)
  .component("ProjectClassSelector", ProjectClassSelector)
  .component("OrdinaryClass", OrdinaryClass)
  .component("MultipleGradesManager", MultipleGradesManager)
  .component("ImageUploader", ImageUploader)
  .component("ImageCarousel", ImageCarousel)
  .component("SimpleAdder", SimpleAdder)
  .component("OrdinaryClassesManager", OrdinaryClassesManager)
  .component("OrdinaryClassPeopleAdder", OrdinaryClassPeopleAdder)
  .component("LearningSessionsManager", LearningSessionsManager);

router.isReady().then(() => {
  app.mount("#app");
});
