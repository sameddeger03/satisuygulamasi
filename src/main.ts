import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from './depolar/index';
import VCalendar from 'v-calendar';
import i18n from './i18n'

import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap"
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'v-calendar/style.css';
import "./style.css";
import 'animate.css';


function startApp() {
    const app = createApp(App).use(router).use(store).use(VCalendar).use(i18n);
    app.mount('#app');
}

function checkIpcRenderer() {
    if (window.ipcRenderer) {
        startApp();
    } else {
        setTimeout(checkIpcRenderer, 100); // 100ms sonra tekrar kontrol et
    }
}

checkIpcRenderer();
