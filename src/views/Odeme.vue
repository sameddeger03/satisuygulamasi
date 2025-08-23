<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch, nextTick} from 'vue';
import * as kutuphane from "@kutuphane/index"
import {useRouter} from 'vue-router';
import {Cevap, Urun} from "@interfaces/index"
import { useStore } from 'vuex';
import {ToLowerCaseTR} from "@kutuphane/index";
const store = useStore();
const ipcRenderer = window.ipcRenderer;
const router = useRouter();
const barkodgiris = ref<HTMLInputElement>()
const islemvar = ref<boolean>(false);
const sepet = ref<Urun[]>([]);
const sepetbos = computed(() => sepet.value.length <= 0);
const kurusDuzelt = ref<boolean>(false);
const imajGoster = ref<boolean>(false);
const favUrunler = ref<Urun[]>([]);
const toplam = computed(() => {
  return sepet.value.reduce((acc, urun:Urun) => {
    const fiyat = parseFloat(urun.fiyat.toString()) || 0;
    const adet = parseFloat(urun.adet.toString()) || 0;
    return acc + (fiyat * adet);
  }, 0);
});
const iletisim = computed(() => store.getters["iletisimDeposu/iletisim"]);
const admin = ref(false);
function urunekle(barkod:string="-1") {
  nextTick(() => {
    if (islemvar.value || !barkodgiris.value) return;
    if(barkod == "-1") barkod = barkodgiris.value.value;
    if (barkod) {
      if (ToLowerCaseTR(barkod) == "aleyna") {
        store.dispatch("iletisimDeposu/admin", !admin.value);
        admin.value = !admin.value;
        barkodgiris.value.value = "";
      } else {
        islemvar.value = true;
        ipcRenderer.send('urun-bul', barkod);
      }
    }
    odaklan();
  });
}
function urunEklendi(response: Cevap) {
  if(!barkodgiris.value) return;
  if(typeof barkodgiris.value.value !== 'string')
    return;
  if (response.durum) {
    const mevcutUrun = sepet.value.findIndex((urun:Urun) => urun.barkod == response.veri.barkod );
    if (mevcutUrun > -1) {
      sepet.value[mevcutUrun].adet = Number(sepet.value[mevcutUrun].adet) + Number(response.veri.adet);
      sepet.value[mevcutUrun].dfiyat = kutuphane.turklirasi(response.veri.fiyat * sepet.value[mevcutUrun].adet, kurusDuzelt.value, true);
    } else {
      response.veri.iade = 0;
      response.veri.dfiyat = kutuphane.turklirasi(response.veri.fiyat * response.veri.adet, kurusDuzelt.value, true);
      sepet.value.push(response.veri);
    }

  } else
    store.dispatch("bildirimDeposu/ekle", { tip: "warning", mesaj: response.mesaj });
  barkodgiris.value.value = "";
  islemvar.value = false;
  odaklan();
}
function urunSil(index: number) {
  sepet.value.splice(index, 1);
  odaklan();
}


function odaklan(e:any = null) {
  if(e && e.target.classList.contains("odakiptal")) {
    if((e.keyCode && e.keyCode != 13) || !e.keyCode)
      return
  }
  if(barkodgiris.value)
    barkodgiris.value.focus();
}
function ode(nakit: number|boolean) {
  if(islemvar.value) return;
  if (sepetbos.value) return;
  islemvar.value = true;
  ipcRenderer.send('odeme-ekle', {odeme:nakit, icerik:JSON.stringify(sepet.value)});
}
function odendi(response: Cevap) {
  if (response.durum) {
    sepet.value = [];
    store.dispatch("bildirimDeposu/ekle", { tip: "success", mesaj: response.mesaj });
  } else {
    store.dispatch("bildirimDeposu/ekle", { tip: "warning", mesaj: response.mesaj });
  }
  islemvar.value = false;
}

router.beforeEach((_to, _from, next) => {
  if(!iletisim.value.onaymodali) {
    next();
  }else
  if(!sepetbos.value){
    iletisim.value.onaymodali.onayAl('Ekran Değişiyor', 'Sepete ürün eklediniz. Devam ederseniz sıfırlanacak. Devam etmek istiyor musunuz?', () => {
      sepet.value = [];
      next();
    });
  } else {
    next();
  }
});
onMounted(() => {
  odaklan();
  store.dispatch('iletisimDeposu/veriKaydet', { degisken: 'kapatilabilir', deger: true });
  ipcRenderer.on('urun-bul-response', (_event,response) => {urunEklendi(response)});
  ipcRenderer.on('odeme-ekle-response', (_event,response) => {odendi(response)});
  ipcRenderer.on('urun-favs-response', (_event,response) => {
    favUrunler.value = response.veri;
    store.dispatch("iletisimDeposu/veriKaydet", {  degisken: "elemanlariayarla", deger: true  });
  });
  kurusDuzelt.value = iletisim.value.ayarlar.kurusDuzelt;
  imajGoster.value = iletisim.value.ayarlar.imajGoster;
  ipcRenderer.send("urun-favs")
});
onUnmounted(() => {
  ipcRenderer.removeAllListeners('urun-bul-response')
  ipcRenderer.removeAllListeners('odeme-ekle-response')
})
watch(sepetbos,
    (durum) => {
      store.dispatch('iletisimDeposu/veriKaydet', { degisken: 'kapatilabilir', deger: durum });
    })
watch(islemvar, (eski,yeni) => {
  if(eski == yeni) return;
  store.dispatch('iletisimDeposu/veriKaydet', { degisken: 'beklet', deger: !yeni });
  setTimeout(()=>{odaklan()},100);
})
</script>

<template>
  <div @click="odaklan" class="w-100 h-100 d-flex flex-column gap-1">
    <input
        type="text"
        ref="barkodgiris"
        value=""
        placeholder="Barkod numarası"
        @keyup.enter="()=>{urunekle()}"
        @paste="()=>{urunekle()}"
        class="form-control mb-3 form-control-lg"
        :disabled="islemvar"
    />
    <div class="h-100 w-100" :class="favUrunler.length?'row':''">
    <div class="urunler" :class="favUrunler.length?'col-9':'w-100 h-100'" >
      <div v-if="sepetbos" class="alert alert-info">
        Sepet boş.<br>Barkod tarayıcıyı kullanarak ürün ekleyin.
      </div>
      <h5  v-else class="text text-primary">Eklenen ürünler:</h5>
      <div  v-if="!sepetbos" class="overflow-auto mt-3" style="max-height: calc(100% - 160px);">
      <table class="table table-striped table-bordered table-primary table-sm mt-1">
        <thead>
        <tr>
          <th scope="col"  style="width: 20%">Miktar</th>
          <th scope="col"  style="width: 25%">Ürün Adı</th>
          <th scope="col"  style="width: 25%">Tutar</th>
          <th scope="col"  style="width: 25%">Adet/Kg Fiyatı</th>
          <th scope="col"  style="width: 5%">İşlem</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(urun, index) in sepet" :key="'urun'+index">
          <td>

            <span v-if="urun.birim=='adet'">
              <button :disabled="urun.adet<=1" class="svg-btn mx-1 btn btn-warning" @click="() => {urun.adet -= 1; urun.dfiyat = kutuphane.turklirasi( urun.fiyat * urun.adet , kurusDuzelt, true)}">
              <i class="bi bi-dash-circle"></i>
            </button>
            <button class="svg-btn mx-1 btn  btn-success" @click="() => {urun.adet += 1; urun.dfiyat = kutuphane.turklirasi(urun.fiyat * urun.adet, kurusDuzelt, true)}">
              <i class="bi bi-plus-circle"></i>
            </button>
              {{urun.adet}} {{urun.birim}}</span>
            <span v-else><input class="odakiptal" @keyup.enter="odaklan" v-model="urun.adet" @change="urun.dfiyat = kutuphane.turklirasi(urun.adet * urun.fiyat, kurusDuzelt, true)" type="number" min="0" step="0.001" style="width: 60%"> {{urun.birim}}</span>
          </td>

          <td>{{urun.isim}}</td>
          <td>{{urun.dfiyat?urun.dfiyat:0}} ₺</td>
          <td>{{urun.fiyat}} ₺</td>
          <td class="">
            <div class="d-flex justify-content-center align-items-center">
              <button class="svg-btn mx-1 btn col-md-6  btn-danger" @click="() => urunSil(index)">
                <i class="bi bi-x-circle"></i>
              </button>
            </div>
          </td>

        </tr>
        </tbody>
      </table>
      </div>
    </div>
    <div class="hizlislemler bg-light col-3 py-3 border-1 rounded shadow" v-if="favUrunler.length">
      <h5 class="text text-primary">Hızlı Erişim: </h5>
      <div class="row">
        <div class="col-6 p-2 hizlislem align-items-center d-flex flex-column" v-for="urun in favUrunler" @click="urunekle(urun.barkod)"
             data-bs-toggle="tooltip" data-bs-placement="top" :title="urun.isim"
        >
          <div class="image-container" v-if="imajGoster">
            <img :src="(urun.imaj && urun.imaj!='')?urun.imaj:'data:image/jpeg;base64,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AB3nTwAAAAAABcAAAAAAAD1/PngAAAAAAO86eAAAAAAALgAAAAAAATmvgAAAAAAOwdtAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAALgAAAAAAAAAAAAAAAAAAAAAAVIAAAAAAAAAAAAAAAAAAAAAAuAAAAAAAAAAAAAAAAAAAAAABcAAAAAAAAAAAAAAAAAAAAAAC4AAAAAAAAAAAAAAAAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAALgAAAAAAAAAAAAAAAAAAAAAAXAAAAAAAAAAAAAAAAAAAAAAAuAAAAAAAAAAAAAAAAAAAAAABcAAAAAAAAAAAAAAAAAAAAAAC4AAAAAAAAAAAAAAAAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAALgAAAAAAAAAAAAAAAAAAAAAAXAAAAAAAAAAAAAAAAAAAAAAAuAAAAAAAAAAAAAAAAAAAAAABcAAAAAAAAAAAAAAAAAAAAAAC4AAAAAAAAAAAAAAAAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAALgAAAAAAAAAAAAAAAAAAAAAAXAAAAAAAAAAAAAAAAAAAAAAAuAAAAAAAAAAAAAAAAAAAAAABcAAAAAAAAAAAAAAAAAAAAAAC4AAAAAAAAAAAAAAAAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAALgAAAAAAAAAAAAAAAAAAAAAAXAAAAAAAAAAAAAAAAAAAAAAAuAAAAAAAAAAAAAAAAAAAAAABcAAAAAAAAAAAAAAAAAAAAAAC4AAAAAAAAAAAAAAAAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAALgAAAAAAAAAAAAAAAAAAAAAAXAAAAAAAAAAAAAAAAAAAAAAAuAAAAAAAAAAAAAAAAAAAAAABcAAAAAAAAAAAAAAAAAAAAAAC4AAAAAAAAAAAAAAAAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAALgAAAAAAAAAAAAAAAAAAAAAAXAAAAAAAAAAAAAAAAAAAAAAAuAAAAAAAAAAAAAAAAAAAAAABcAAAAAAAAAAAAAAAAAAAAAAC4AAAAAAAAAAAAAAAAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAALgAAAAAAAAAAAAAAAAAAAAAAXAAAAAAAAAAAAAAAAAAAAAAAuAAAAAAAAAAAAAAAAAAAAAABcAAAAAAAAAAAAAAAAAAAAAAC//8QA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'" />
          </div>
          <div class="bg-primary text-white w-100">
            <div class="text-truncate w-100 p-1" >{{urun.isim}}</div>
            <div class="text-truncate w-100 p-1 bg-success" >{{kutuphane.turklirasi(urun.fiyat, kurusDuzelt)}} - {{urun.birim=='adet'?'Adet':'Kilo'}}</div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
  <div class="row bg-dark bg-gradient p-1" style="position: fixed;width: 83%;bottom: 10px; height: 60px">
    <div class="col-md-3 ">
      <div class="h-100 fs-5 p-1 alert alert-light position-relative ">
        <span class="position-absolute top-0 start-50 translate-middle badge rounded-pill bg-success">Ödenecek Toplam Tutar:</span>
        <span class="fs-3 position-absolute top-50 start-50 translate-middle pt-3">{{kutuphane.turklirasi(toplam,kurusDuzelt)}}</span>
      </div>
    </div>
    <div class="col-md">
      <div class="d-flex justify-content-end h-100">
        <button :disabled="sepetbos" class="btn btn-success bg-gradient me-2 h-100 fs-4" @click="()=>{ode(true)}">Nakit Ödeme</button>
        <button :disabled="sepetbos" class="btn btn-danger bg-gradient h-100 fs-4" @click="()=>{ode(false)}">Kart ile Ödeme</button>
      </div>
    </div>
  </div>
</template>
<style>

.hizlislemler::-webkit-scrollbar-track{
  -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
  background-color: #F5F5F5;
}
.hizlislemler::-webkit-scrollbar{
  width: 5px;
  background-color: #F5F5F5;
}
.hizlislemler::-webkit-scrollbar-thumb{
  background-color: var(--bs-primary);
  border: 1px solid var(--bs-primary-bg-subtle);
}

.hizlislemler {
  max-height: 80%;
  overflow-y: scroll;
  overflow-x: hidden;
}
.hizlislem {
  transition: all 0.2s;
  -webkit-transition: all 0.2s;
  -moz-transition: all 0.2s;
  cursor: pointer;
  text-align: center;
  filter: grayscale(100%);
  -webkit-filter: grayscale(100%);
  -moz-filter: grayscale(100%);
}
.hizlislem:hover {
  filter: grayscale(0%);
  -webkit-filter: grayscale(0%);
  -moz-filter: grayscale(0%);
  transform: scale(1.1);
  -webkit-transform: scale(1.1);
  -moz-transform: scale(1.1);
}
.image-container {
  width: calc(100%);
  aspect-ratio : 1 / 1;
  overflow: hidden;
  position: relative;
  border: 1px solid #ccc;
}
.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* Resmi bozulmadan kapsar */
  object-position: center; /* Resmi ortalar */
}

</style>

