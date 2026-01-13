/* eslint-disable */
/**
 * TypeScript shim to import `.vue` Single File Components.
 */
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
