import { defineCustomElement } from 'vue';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import ExternalInterfaces from './ExternalInterfaces.vue';
import { WRAPPER_ELEMENT_NAME } from '../federation.constants';

export const ExternalInterfacesElement = defineCustomElement(ExternalInterfaces, {
  shadowRoot: false, // Inherit the navbar's Vuetify theme CSS variables.
  configureApp(application) {
    const vuetify = createVuetify({ theme: false });
    application.use(vuetify);
    application.onUnmount(() => { vuetify.unmount(); });
  },
});
export type ExternalInterfacesElement = InstanceType<typeof ExternalInterfacesElement>;
export function registerExternalInterfaces() {
  const existingElement = customElements.get(WRAPPER_ELEMENT_NAME);
  const needsRegistration = existingElement === undefined;
  if (needsRegistration) {
    customElements.define(WRAPPER_ELEMENT_NAME, ExternalInterfacesElement);
  }
  const registeredElement = customElements.get(WRAPPER_ELEMENT_NAME)!;
  return registeredElement;
}
registerExternalInterfaces();
export default ExternalInterfacesElement;
