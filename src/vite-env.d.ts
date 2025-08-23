declare module 'bootstrap';
import { DefineComponent, ComponentCustomProperties } from 'vue';
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare global {
  interface Window {
    ipcRenderer: Electron.IpcRenderer;
    modalList: Record<string,any>;
    openModal: (modal: string) => void;
    closeModal: (modal: string) => void;
  }
}
