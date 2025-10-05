import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { $axios } from "./plugins/axios";
import { store } from "./store";
import { quillEditor } from "vue3-quill";

import { IonicVue } from "@ionic/vue";

import OuterHeader from "./components/OuterHeader.vue";
import InnerHeader from "./components/InnerHeader.vue";
import LearningSessionsCards from "./components/LearningSessionsCards.vue";
import ListCard from "./components/ListCard.vue";
import GeneralCard from "./components/GeneralCard.vue";
import LoadingComponent from "./components/LoadingComponent.vue";
import SessionDescription from "./components/SessionDescription.vue";
import CoursesSelectionList from "./components/CoursesSelectionList.vue";
import CustomSelect from "./components/CustomSelect.vue";
import CourseCard from "./components/CourseCard.vue";
import CurriculumList from "./components/CurriculumList.vue";
import IonicElement from "./components/IonicElement.vue";
import IonicTable from "./components/IonicTable.vue";
import GradesManager from "./components/GradesManager.vue";
import CourseDescription from "./components/CourseDescription.vue";
import LearningSessionsSelection from "./components/LearningSessionsSelection.vue";
import ProjectClass from "./components/ProjectClass.vue";
import AnnouncementsComponent from "./components/AnnouncementsComponent.vue";
import AnnouncementViewer from "./components/AnnouncementViewer.vue";
import AnnouncementsPublisher from "./components/AnnouncementsPublisher.vue";
import ProjectClassesList from "./components/ProjectClassesList.vue";
import ProjectClassSelectList from "./components/ProjectClassSelectList.vue";
import StudentDescription from "./components/StudentDescription.vue";
import OverallStudentDescription from "./components/OverallStudentDescription.vue";
import AuthPanel from "./components/AuthPanel.vue";
import CourseProposition from "./components/CourseProposition.vue";
import PropositionsHistory from "./components/PropositionsHistory.vue";
import CardItem from "./components/CardItem.vue";
import GroupList from "./components/GroupList.vue";
import CardsGrid from "./components/CardsGrid.vue";
import EditorWrapper from "./components/EditorWrapper.vue";
import ProjectClassSelector from "./components/ProjectClassSelector.vue";
import OrdinaryClass from "./components/OrdinaryClass.vue";
import MultipleGradesManager from "./components/MultipleGradesManager.vue";
import ImageUploader from "./components/ImageUploader.vue";
import ImageCarousel from "./components/ImageCarousel.vue";
import SimpleAdder from "./components/SimpleAdder.vue";
import OrdinaryClassesManager from "./components/OrdinaryClassesManager.vue";
import OrdinaryClassPeopleAdder from "./components/OrdinaryClassPeopleAdder.vue";
import LearningSessionsManager from "./components/LearningSessionsManager.vue";

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
  .component("StudentDescription", StudentDescription)
  .component("OverallStudentDescription", OverallStudentDescription)
  .component("AuthPanel", AuthPanel)
  .component("CourseProposition", CourseProposition)
  .component("PropositionsHistory", PropositionsHistory)
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
