<script setup lang="ts">
import {onMounted, onUnmounted, ref, computed, watch, nextTick } from "vue";
import {trTarih, buay, bugun, buyil, sqlTarih, noktaliTarih, sqlTarihSaatsiz} from '@kutuphane/index';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import YontemGrafik from "../components/yontemGrafik.vue";
import UrunGrafik from "../components/urunGrafik.vue";
import YillikGrafik from "../components/yillikGrafik.vue";
import AylikGrafik from "../components/aylikGrafik.vue";
import GunlukGrafik from "../components/gunlukGrafik.vue";
import Kazanc from "../components/kazanc.vue";
import {Odeme, Urun, Cevap,Iade} from '@interfaces/index';
import IadeGrafik from "../components/iadeGrafik.vue";

const store = useStore();
const grafikler = computed(() => store.getters["grafikDeposu/grafikler"]);
const satiscizelgesi = ref<typeof YillikGrafik | typeof AylikGrafik | typeof GunlukGrafik | null>(null)
const ipcRenderer = window.ipcRenderer;
const islemvar = ref(false);
const secilenTStr = ref("");
const maxTarih = ref("");
const ilkAcilim = ref(true);
const forBack = ref("yillik")
const canGoDiv = ref(true);
const router = useRouter();

function tarihChanged(event: Event) {
  const target = event.target as HTMLInputElement | null;
  if(target === null) return;
  forBack.value = grafikler.value.grafikTipi;
  canGoDiv.value = false;
  store.dispatch('grafikDeposu/updateGrafikTipi', 'yukleniyor');
  secilenTStr.value = target.value;
  store.dispatch('grafikDeposu/updateTarih', new Date(secilenTStr.value));
  maxTarih.value = sqlTarihSaatsiz();
  ipcRenderer.send('rapor-liste');
}

function handleResponse(response: Cevap) {
  islemvar.value = false;
  store.dispatch('grafikDeposu/updateGrafikTipi', forBack.value);
  if (response.durum && response.veri) {
    verileriAyikla(response.veri.odemeler, response.veri.iadeler);
  }else
    console.log("veri alma hatası", response);
}
function verileriAyikla(odemeler: Array<Odeme>, iadeler: Array<Iade> = []) {
  islemvar.value = true;
  let yontemsay = {Nakit:0, Kart:0}
  let adeturunsay: { [key: string]: number } = {};
  let kilourunsay: { [key: string]: number } = {};
  let iadesay: { [key: string]: number } = {};
  let yilBazli: { [key: string]: number } = {};
  let ayBazli: { [key: string]: number } = {};
  let gunBazli: { [key: string]: number } = {};
  let kazanc = 0;
  odemeler.forEach(odeme => {
    let tarih = noktaliTarih(odeme.tarih);
    let urunparse = JSON.parse(odeme["icerik"]);
    let urunler: Array<Urun> = [];
    if (typeof urunparse === 'object') {
      urunparse.forEach((urun:Urun) => {
        urunler.push(urun)
      })
    }
    //Bu yıl ise bu yılın aylarına bakıyoruz
    if (buyil(odeme.tarih, grafikler.value.tarih)) {
      if (!yilBazli[tarih])
        yilBazli[tarih] = 1;
      else yilBazli[tarih] += 1;
    }

    //Bu ay ise bu ayın günlerine bakıyoruz
    if (buay(odeme.tarih, grafikler.value.tarih)) {
      if (!ayBazli[tarih])
        ayBazli[tarih] = 1;
      else ayBazli[tarih] += 1;
    }

    //Bu gün ise bu günlerin ürünlerine bakıyoruz
    if (buay(odeme.tarih, grafikler.value.tarih)) {
      if (!gunBazli[tarih])
        gunBazli[tarih] = 1;
      else gunBazli[tarih] += 1;
    }

    if (odeme.odeme) yontemsay.Nakit += 1;
    else yontemsay.Kart += 1;

    urunler.forEach(urun => {
      kazanc += urun.fiyat * urun.adet;
      if(urun.birim == "adet") {
        if (adeturunsay[urun.isim])
          adeturunsay[urun.isim] += urun.adet;
        else
          adeturunsay[urun.isim] = urun.adet;
      }
      if(urun.birim == "kilo") {
        if (kilourunsay[urun.isim])
          kilourunsay[urun.isim] += urun.adet;
        else
          kilourunsay[urun.isim] = urun.adet;
      }
    });
  });
  iadeler.forEach(iade => {
    let tarih = noktaliTarih(iade.tarih);
    let urunparse = JSON.parse(iade["icerik"]);
    let iadeUrunler: Array<Urun> = [];
    if (typeof urunparse === 'object') {
      urunparse.forEach((urun: Urun) => {
        iadeUrunler.push(urun)
      })
    }
    iadeUrunler.forEach(urun => {
      if (iadesay[urun.isim])
        iadesay[urun.isim] += 1;
      else
        iadesay[urun.isim] = 1;
    });
  });
  store.dispatch('grafikDeposu/updateUrun', {tip:"adetlik", urunler:adeturunsay});
  store.dispatch('grafikDeposu/updateUrun', {tip:"kiloluk", urunler:kilourunsay});
  store.dispatch('grafikDeposu/updateIade', iadesay);
  store.dispatch('grafikDeposu/updateYontem', yontemsay);
  store.dispatch('grafikDeposu/updateYillik', yilBazli);
  store.dispatch('grafikDeposu/updateAylik', ayBazli);
  store.dispatch('grafikDeposu/updateGunluk', gunBazli);
  store.dispatch('grafikDeposu/updateKazanc', kazanc);
  islemvar.value = false;
}

function rTipSec(secim: string) {
  store.dispatch('grafikDeposu/updateGrafikTipi', secim);
  forBack.value = grafikler.value.grafikTipi;
}
const onHazir = (value: boolean) => {
  if(!canGoDiv.value){
    canGoDiv.value = true;
    return;
  }
  nextTick();
  if(ilkAcilim.value) {
    ilkAcilim.value = false;
    return;
  }
  if(value) {
    let element = document.body;
    if(satiscizelgesi.value != null)
      element = satiscizelgesi.value.$el;
    if (element && typeof element.scrollIntoView === 'function') {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      console.error('scrollIntoView fonksiyonu bulunamadı:',element);
    }
  }
};
function rapor(){
  router.push({ path: '/gunsonu' });
}
onMounted(() => {
  islemvar.value = true;
  store.dispatch('grafikDeposu/updateGrafikTipi', 'yukleniyor');
  ipcRenderer.on('rapor-liste-response', (event, response) => {
    islemvar.value = false;
    handleResponse(response);
  });
  secilenTStr.value = sqlTarihSaatsiz(grafikler.value.tarih);
  maxTarih.value = sqlTarihSaatsiz();
  ipcRenderer.send('rapor-liste');
});

onUnmounted(() => {
  ipcRenderer.removeAllListeners('odeme-liste-response');
});
watch(islemvar, (eski,yeni) => {
  store.dispatch('iletisimDeposu/veriKaydet', { degisken: 'beklet', deger: !yeni });
})
</script>
<template>
  <div class="p-2" style="max-height: 100%; overflow-y: auto; overflow-x: hidden">
    <div class="row">
      <div class="col-12">
        <div class="alert alert-white w-100">
          <div class="d-flex align-content-center justify-content-center ">
            <div class="input-group" style="width: 30%">
              <input @change="tarihChanged" :value="secilenTStr" :max="maxTarih" type="date" class="form-control" aria-describedby="button-addon2">
              <button class="btn btn-success" type="button" id="button-addon2" @click="rapor">Gün Sonu Raporu Al</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row mt-3" v-if="grafikler.grafikTipi != 'yukleniyor'">
      <div class="col-12 d-flex ">
        <kazanc class="w-100"></kazanc>
      </div>
    </div>
    <div class="row my-3" v-if="grafikler.grafikTipi != 'yukleniyor'">

      <div class="col-md-3 col-sm-6 col-xs-12 d-flex ">
        <yontem-grafik class="w-100"></yontem-grafik>
      </div>
      <div class="col-md-3 col-sm-6 col-xs-12 d-flex ">
        <iade-grafik class="w-100"></iade-grafik>
      </div>
      <div class="col-md-3 col-sm-6 col-xs-12 d-flex ">
        <urun-grafik class="w-100" tip="adetlik"></urun-grafik>
      </div>
      <div class="col-md-3 col-sm-6 col-xs-12 d-flex ">
        <urun-grafik class="w-100" tip="kiloluk"></urun-grafik>
      </div>
    </div>


    <div class="row my-3 position-relative">

      <div v-if="grafikler.grafikTipi == 'yillik'" class="col-12 d-flex ">
        <yillik-grafik class="w-100" ref="satiscizelgesi" @update:hazir="onHazir"></yillik-grafik>
      </div>
      <div v-if="grafikler.grafikTipi == 'aylik'" class="col-12 d-flex ">
        <aylik-grafik class="w-100" ref="satiscizelgesi" @update:hazir="onHazir"></aylik-grafik>
      </div>
      <div v-if="grafikler.grafikTipi == 'gunluk'" class="col-12 d-flex ">
        <gunluk-grafik class="w-100" ref="satiscizelgesi" @update:hazir="onHazir" :tarih="secilenTStr"></gunluk-grafik>
      </div>
      <div v-if="grafikler.grafikTipi == 'yukleniyor'" class="col-12 d-flex ">
        <div class="alert alert-info">Çizelge oluşturuluyor...</div>
      </div>
      <div class="position-absolute d-flex justify-content-end pt-3 pe-5 w-100">
        <div class="btn-group btn-group-sm" role="group">
          <button :class="grafikler.grafikTipi == 'yillik' ? 'btn btn-primary' : 'btn btn-outline-secondary'" class="btn" @click="()=>{rTipSec('yillik')}">YILLIK</button>
          <button :class="grafikler.grafikTipi == 'aylik' ? 'btn btn-primary' : 'btn btn-outline-secondary'" class="btn" @click="()=>{rTipSec('aylik')}">AYLIK</button>
          <button :class="grafikler.grafikTipi == 'gunluk' ? 'btn btn-primary' : 'btn btn-outline-secondary'" class="btn" @click="()=>{rTipSec('gunluk')}">GÜNLÜK</button>
        </div>
      </div>
    </div>
  </div>
</template>
