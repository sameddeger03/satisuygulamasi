import { Commit } from 'vuex';
import {State, BildirimFace} from "@interfaces/index";
import {uidolustur} from "@kutuphane/index";

const bildirimDeposu ={
    namespaced: true,
    state: {
        veriler: []
    },
    mutations: {
        ADD_VERI(state: State, veri: BildirimFace) {
            veri.id = uidolustur("bildirim");
            veri.gosterildi = false;
            if(!veri.sure || veri.sure < 900) veri.sure = 4000;
            switch(veri.tip) {
                case "success": case "basarili": case "positive": veri.tip = "success"; break;
                case "error": case "hata": case "negative": veri.tip = "danger"; break;
                case "warning": case "uyari": case "notr": veri.tip = "warning"; break;
                case "info": case "bilgi": veri.tip = "info"; break;
                default: veri.tip = "primary";
            }

            state.veriler.push(veri);
        },
        SET_GOSTERILDI(state: State, id: string) {
            state.veriler.find((x: BildirimFace) => x.id == id).gosterildi = true;
        },
        DEL_VERI(state: State, id: string) {
            state.veriler = state.veriler.filter((x: BildirimFace) => x.id != id);
        },
        TEMIZLE(state: State) {
            state.veriler = [];
        }
    },
    actions: {
        ekle({ commit }: { commit: Commit }, veri: BildirimFace) {
            commit('ADD_VERI', veri);
        },
        sil({ commit }: { commit: Commit }, id: string) {
            commit('DEL_VERI', id);
        },
        gosterildi({ commit }: { commit: Commit }, id: Number) {
            commit('SET_GOSTERILDI', id);
        },
        temizle({ commit }: { commit: Commit }) {
            commit('TEMIZLE');
        }
    },
    getters: {
        bildirim: (state: State) => state.veriler
    }
};

export default bildirimDeposu;
