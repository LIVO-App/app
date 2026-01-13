import { ComponentCustomProperties } from "vue";
import { Store } from "vuex";
import {
  ElementsList,
  IconAlternatives,
  IconsList,
  Language,
  LearningContextSummary,
  Menu,
  UserProps,
  UserType,
} from "./types";
import { Method } from "axios";

/**
 * Vuex typing extensions for the app.
 * Defines the `State` shape and enables `$store` typing in components.
 */

declare module "@vue/runtime-core" {
  interface State {
    menu: Menu;
    icons: IconsList;
    language: Language;
    elements: ElementsList;
    user: User | undefined;
    request: {
      url: string;
      method: Method;
      body?: Object;
    };
    event: {
      event: string;
      data: {
        [key: string]: any;
      };
    };
    hours_per_credit: number;
    grades_scale: {
      min: number;
      max: number;
    };
    excluded_learning_contexts_id: number[];
    main_learning_context: LearningContextSummary;
    courses_per_group: number;
  }

  interface ComponentCustomProperties {
    $store: Store<State>;
  }
}
