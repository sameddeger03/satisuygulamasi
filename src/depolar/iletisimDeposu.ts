import { Commit } from 'vuex';
import { State } from '@interfaces/index';

const iletisimDeposu = {
    namespaced: true,
    state: {
        veriler: {admin: false},
    },
    mutations: {
        SET_VERI(state: State, veri: any) {
            let { degisken, deger } = veri;
            if(degisken == "admin") return;
            if(typeof degisken === "undefined" || degisken == null) return;
            if(typeof deger === "undefined" || deger == null) deger = "";
            if (typeof degisken === "string" && state.veriler)
                state.veriler[degisken] = deger;

        },
        SET_AYAR(state: State, veri: any) {
            const yeniayarlar = state.veriler.ayarlar;
            const { degisken, deger } = veri;
            yeniayarlar[degisken] = deger;
            state.veriler.ayarlar = yeniayarlar;
        },
        SET_ADMIN(state: State, admin: boolean) {
            state.veriler.admin = admin;
        },
        TEMIZLE(state: State) {
            state.veriler = {};
        }
    },
    actions: {
        veriKaydet({ commit }: { commit: Commit }, veri:any) {
            commit('SET_VERI', veri);
        },
        ayarKaydet({ commit }: { commit: Commit }, veri:any) {
            commit('SET_AYAR', veri);
        },
        admin({ commit }: { commit: Commit }, admin:boolean) {
            commit('SET_ADMIN', admin);
        },
        temizle({ commit }: { commit: Commit }) {
            commit('TEMIZLE');
        }
    },
    getters: {
        iletisim: (state: State) => state.veriler
    }
};

export default iletisimDeposu;
