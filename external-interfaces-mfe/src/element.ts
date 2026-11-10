import { createApp, type App } from 'vue';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import ExternalInterfaces from './ExternalInterfaces.vue';
import { parseInputs } from './contracts';

/** Light DOM keeps the host navbar's theme CSS variables and typography. */
export class ExternalInterfacesElement extends HTMLElement {
  static observedAttributes = ['config'];
  private inputs: [unknown, unknown, unknown] = [undefined, undefined, undefined];
  private previous: [unknown, unknown, unknown] | undefined;
  private app?: App;
  private vuetify?: ReturnType<typeof createVuetify>;
  private queued = false;

  get config(): unknown { return this.inputs[0]; }
  set config(value: unknown) { this.inputs[0] = value; this.schedule(); }
  get websocket(): unknown { return this.inputs[1]; }
  set websocket(value: unknown) { this.inputs[1] = value; this.schedule(); }
  get normalizeMessage(): unknown { return this.inputs[2]; }
  set normalizeMessage(value: unknown) { this.inputs[2] = value; this.schedule(); }

  connectedCallback() {
    // Support properties assigned before the exposed module defines the tag.
    for (const key of ['config', 'websocket', 'normalizeMessage'] as const) {
      if (Object.prototype.hasOwnProperty.call(this, key)) {
        const value = this[key];
        delete (this as unknown as Record<string, unknown>)[key];
        this[key] = value;
      }
    }
    if (this.config === undefined && this.hasAttribute('config')) this.config = this.getAttribute('config');
    this.schedule();
  }

  disconnectedCallback() {
    // Moving the same element within the document must not churn subscriptions.
    queueMicrotask(() => { if (!this.isConnected) this.dispose(); });
  }
  attributeChangedCallback(name: string, _old: string | null, value: string | null) {
    if (name === 'config') this.config = value;
  }
  reload = () => { this.previous = undefined; this.schedule(); };

  private schedule() {
    if (this.queued) return;
    this.queued = true;
    queueMicrotask(() => { this.queued = false; if (this.isConnected) this.render(); });
  }
  private notify = (name: string, detail: unknown) => {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  };
  private dispose() {
    this.app?.unmount();
    this.app = undefined;
    this.vuetify?.unmount();
    this.vuetify = undefined;
    this.previous = undefined;
    this.replaceChildren();
  }
  private render() {
    if (this.previous?.every((value, index) => value === this.inputs[index])) return;
    this.dispose();
    this.previous = [...this.inputs];
    let validated: ReturnType<typeof parseInputs>;
    try { validated = parseInputs(...this.inputs); }
    catch {
      const alert = document.createElement('span');
      alert.setAttribute('role', 'alert');
      alert.textContent = 'External interfaces configuration is invalid.';
      this.replaceChildren(alert);
      this.notify('mfe-event', { type: 'external-interfaces:diagnostic', code: 'INVALID_PROPS',
        message: 'Expected JSON config, a live websocket with subscribe/unsubscribe, and normalizeMessage.' });
      return;
    }
    const mountPoint = document.createElement('div');
    mountPoint.style.display = 'contents';
    this.replaceChildren(mountPoint);
    // Own plugin instance, shared package. Disable generation of competing global
    // theme CSS: inherit the host navbar's active Vuetify theme through light DOM.
    this.vuetify = createVuetify({ theme: false });
    this.app = createApp(ExternalInterfaces, { ...validated, notify: this.notify, retry: this.reload });
    this.app.use(this.vuetify);
    this.app.mount(mountPoint);
  }
}
