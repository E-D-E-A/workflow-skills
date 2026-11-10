import { defineCustomElement } from 'vue';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import ExternalInterfaces from './ExternalInterfaces.vue';
import { WRAPPER_ELEMENT_NAME } from '../federation.constants';

export const ExternalInterfacesElement = defineCustomElement(ExternalInterfaces, {
  shadowRoot: false, // Inherit the navbar's Vuetify theme CSS variables.
  configureApp(app) {
    const vuetify = createVuetify({ theme: false });
    app.use(vuetify);
    app.onUnmount(() => vuetify.unmount());
  },
});
export type ExternalInterfacesElement = InstanceType<typeof ExternalInterfacesElement>;
export function registerExternalInterfaces() {
  if (!customElements.get(WRAPPER_ELEMENT_NAME)) {
    customElements.define(WRAPPER_ELEMENT_NAME, ExternalInterfacesElement);
  }
  return customElements.get(WRAPPER_ELEMENT_NAME)!;
}
registerExternalInterfaces();
export default ExternalInterfacesElement;
