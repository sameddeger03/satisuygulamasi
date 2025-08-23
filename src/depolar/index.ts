import { createStore } from 'vuex';
import iletisimDeposu from './iletisimDeposu';
import grafikDeposu from './grafikDeposu';
import bildirimDeposu from './bildirimDeposu';
import alarmDeposu from "./alarmDeposu";

const store = createStore({
    modules: {
        iletisimDeposu,
        grafikDeposu,
        bildirimDeposu,
        alarmDeposu
    }
});

export default store;
