import { Commit } from 'vuex';
import {State, Hatirlatma} from "@interfaces/index";
import {uidolustur} from "@kutuphane/index";

const alarmDeposu ={
    namespaced: true,
    state: {
        veriler: []
    },
    mutations: {
        ADD_VERI(state: State, veri: Hatirlatma) {
            const bul = state.veriler.find((x: Hatirlatma) => x.id == veri.id);
            if(bul) return;
            veri.uid = uidolustur("alarm");
            state.veriler.push(veri);
        },
        DEL_VERI(state: State, uid: string) {
            state.veriler = state.veriler.filter((x: Hatirlatma) => x.uid != uid);
        },
        TEMIZLE(state: State) {
            state.veriler = [];
        }
    },
    actions: {
        ekle({ commit }: { commit: Commit }, veri: Hatirlatma) {
            commit('ADD_VERI', veri);
        },
        sil({ commit }: { commit: Commit }, uid: string) {
            commit('DEL_VERI', uid);
        },
        temizle({ commit }: { commit: Commit }) {
            commit('TEMIZLE');
        }
    },
    getters: {
        alarmlar: (state: State) => state.veriler
    }
};

export default alarmDeposu;
