import { Commit } from 'vuex';
import { State } from '@interfaces/index';

const grafikDeposu ={
    namespaced: true,
    state: {
        veriler: {
            tarih: new Date(),
            grafikTipi: "yillik",
            urun: {adetlik:{},kiloluk:{}},
            iade: {},
            yontem: {},
            yillik: {},
            aylik: {},
            gunluk: {},
            kazanc: 0
        }
    },
    mutations: {
        SET_GRAFIKTIPI(state: State, gtip:any) {

            state.veriler.grafikTipi = gtip ;
        },
        SET_URUN(state: State, payload:any) {
            if(payload.tip == "adetlik")
                state.veriler.urun.adetlik = { ...state.veriler.urun.adetlik, ...payload.urunler };
            if(payload.tip == "kiloluk")
                state.veriler.urun.kiloluk = { ...state.veriler.urun.kiloluk, ...payload.urunler };
        },
        SET_IADE(state: State, iadeler:any) {
            state.veriler.iade = { ...state.veriler.iade, ...iadeler };
        },
        SET_YONTEM(state: State, yontem:any) {
            state.veriler.yontem = { ...state.veriler.yontem, ...yontem };
        },
        SET_YILLIK(state: State, yillik:any) {

            state.veriler.yillik = { ...state.veriler.yillik, ...yillik };
        },
        SET_AYLIK(state: State, aylik:any) {

            state.veriler.aylik = { ...state.veriler.aylik, ...aylik };
        },
        SET_GUNLUK(state: State, gunluk:any) {

            state.veriler.gunluk = { ...state.veriler.gunluk, ...gunluk };
        },
        SET_KAZANC(state: State, kazanc:any) {

            state.veriler.kazanc = kazanc ;
        },
        SET_TARIH(state: State, tarih:any) {

            state.veriler.tarih = tarih ;
        }
    },
    actions: {
        updateGrafikTipi({ commit }: { commit: Commit }, grafikTipi:any) {
            commit('SET_GRAFIKTIPI', grafikTipi );
        },
        updateUrun({ commit }: { commit: Commit }, payload:any) {
            commit('SET_URUN', payload);
        },
        updateIade({ commit }: { commit: Commit }, iadeler:any) {
            commit('SET_IADE', iadeler);
        },
        updateYontem({ commit }: { commit: Commit }, yontem:any) {
            commit('SET_YONTEM', yontem);
        },
        updateYillik({ commit }: { commit: Commit }, yillik:any) {
            commit('SET_YILLIK', yillik);
        },
        updateAylik({ commit }: { commit: Commit }, aylik:any) {
            commit('SET_AYLIK', aylik);
        },
        updateGunluk({ commit }: { commit: Commit }, gunluk:any) {
            commit('SET_GUNLUK', gunluk);
        },
        updateKazanc({ commit }: { commit: Commit }, kazanc:any) {
            commit('SET_KAZANC', kazanc );
        },
        updateTarih({ commit }: { commit: Commit }, tarih:any) {
            commit('SET_TARIH', tarih );
        }
    },
    getters: {
        grafikler: (state:State) => state.veriler
    }
};

export default grafikDeposu;
