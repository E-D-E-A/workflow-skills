import { WRAPPER_ELEMENT_NAME } from '../federation.constants';
import { ExternalInterfacesElement } from './element';

export function registerExternalInterfaces() {
  if (!customElements.get(WRAPPER_ELEMENT_NAME)) {
    customElements.define(WRAPPER_ELEMENT_NAME, ExternalInterfacesElement);
  }
  return customElements.get(WRAPPER_ELEMENT_NAME)!;
}

// Contract: the host imports this exposed module, then creates wrapperElementName.
// Named registration is available for loaders that explicitly invoke a function.
registerExternalInterfaces();
export { ExternalInterfacesElement };
export default ExternalInterfacesElement;
