<template>
  <div @click="odaklan" class="w-100 h-100 d-flex flex-column gap-1">
    <input
        type="text"
        ref="barkodgiris"
        value=""
        :placeholder="$t('payment.barcodePlaceholder')"
        @keyup.enter="()=>{urunekle()}"
        @paste="()=>{urunekle()}"
        class="form-control mb-3 form-control-lg"
        :disabled="islemvar"
    />
    <div class="h-100 w-100" :class="favUrunler.length?'row':''">
      <div class="urunler" :class="favUrunler.length?'col-9':'w-100 h-100'" >
        <div v-if="sepetbos" class="alert alert-info">
          {{ $t('payment.emptyCart') }}
        </div>
        <h5 v-else class="text text-primary">{{ $t('payment.addedProducts') }}</h5>
        <div v-if="!sepetbos" class="overflow-auto mt-3" style="max-height: calc(100% - 160px);">
          <table class="table table-striped table-bordered table-primary table-sm mt-1">
            <thead>
            <tr>
              <th scope="col" style="width: 20%">{{ $t('payment.quantity') }}</th>
              <th scope="col" style="width: 25%">{{ $t('payment.productName') }}</th>
              <th scope="col" style="width: 25%">{{ $t('payment.amount') }}</th>
              <th scope="col" style="width: 25%">{{ $t('payment.unitPrice') }}</th>
              <th scope="col" style="width: 5%">{{ $t('categories.action') }}</th>
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
                  {{urun.adet}} {{$t('payment.' + urun.birim)}}
                </span>
                <span v-else>
                  <input class="odakiptal" @keyup.enter="odaklan" v-model="urun.adet" @change="urun.dfiyat = kutuphane.turklirasi(urun.adet * urun.fiyat, kurusDuzelt, true)" type="number" min="0" step="0.001" style="width: 60%"> {{$t('payment.' + urun.birim)}}
                </span>
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
        <h5 class="text text-primary">{{ $t('payment.quickAccess') }} </h5>
        <div class="row">
          <div class="col-6 p-2 hizlislem align-items-center d-flex flex-column" v-for="urun in favUrunler" @click="urunekle(urun.barkod)"
               data-bs-toggle="tooltip" data-bs-placement="top" :title="urun.isim"
          >
            <div class="image-container" v-if="imajGoster">
              <img :src="(urun.imaj && urun.imaj!='')?urun.imaj:'data:image/jpeg;base64,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AAAAAAAAAAAAAAAAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAALgAAAAAAAAAAAAAAAAAAAAAAXAAAAAAAAAAAAAAAAAAAAAAAuAAAAAAAAAAAAAAAAAAAAAABcAAAAAAAAAAAAAAAAAAAAAAC4AAAAAAAAAAAAAAAAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAALgAAAAAAAAAAAAAAAAAAAAAAXAAAAAAAAAAAAAAAAAAAAAAAuAAAAAAAAAAAAAAAAAAAAAABcAAAAAAAAAAAAAAAAAAAAAAC4AAAAAAAAAAAAAAAAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAALgAAAAAAAAAAAAAAAAAAAAAAXAAAAAAAAAAAAAAAAAAAAAAAuAAAAAAAAAAAAAAAAAAAAAABcAAAAAAAAAAAAAAAAAAAAAAC4AAAAAAAAAAAAAAAAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAALgAAAAAAAAAAAAAAAAAAAAAAXAAAAAAAAAAAAAAAAAAAAAAAuAAAAAAAAAAAAAAAAAAAAAABcAAAAAAAAAAAAAAAAAAAAAAC//8QARhAAAQICBQQNCgUDBQEAAAAAAQIEAAMFBhFBklBVYXAXITEyNVNxc5GxEjAw' />
            </div>
            <div class="bg-primary text-white w-100">
              <div class="text-truncate w-100 p-1" >{{urun.isim}}</div>
              <div class="text-truncate w-100 p-1 bg-success" >{{kutuphane.turklirasi(urun.fiyat, kurusDuzelt)}} - {{$t('payment.' + urun.birim)}}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="row bg-dark bg-gradient p-1" style="position: fixed;width: 83%;bottom: 10px; height: 60px">
    <div class="col-md-3 ">
      <div class="h-100 fs-5 p-1 alert alert-light position-relative ">
        <span class="position-absolute top-0 start-50 translate-middle badge rounded-pill bg-success">{{ $t('payment.totalAmount') }}</span>
        <span class="fs-3 position-absolute top-50 start-50 translate-middle pt-3">{{kutuphane.turklirasi(toplam,kurusDuzelt)}}</span>
      </div>
    </div>
    <div class="col-md">
      <div class="d-flex justify-content-end h-100">
        <button :disabled="sepetbos" class="btn btn-success bg-gradient me-2 h-100 fs-4" @click="()=>{ode(true)}">{{ $t('payment.cashPayment') }}</button>
        <button :disabled="sepetbos" class="btn btn-danger bg-gradient h-100 fs-4" @click="()=>{ode(false)}">{{ $t('payment.cardPayment') }}</button>
      </div>
    </div>
  </div>
</template>

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
