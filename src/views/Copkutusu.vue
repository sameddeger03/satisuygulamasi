<script setup lang="ts">
import {ref, onMounted, onUnmounted, watch, computed} from 'vue';
import {IpcRendererEvent} from "electron"
import {useStore} from "vuex";
import {ckListe} from "@interfaces/ck";
import {Cevap} from "@interfaces/kisisel";
const ipcRenderer = window.ipcRenderer;
const silinenler = ref<ckListe>({urunler:[], kategoriler:[], odemeler:[]});
const islemvar = ref<boolean>(false);
const store = useStore();
const iletisim = computed(() => store.getters["iletisimDeposu/iletisim"]);

function listele(cevap: Cevap) {
  if(cevap.durum) {
    silinenler.value = cevap.veri;
  }else {
    store.dispatch('bildirimDeposu/ekle', { tip: "warning", mesaj: cevap.mesaj });
  }
  islemvar.value = false;
}

function kurtar(id:number|string,tablo:string){
  islemvar.value = true;
  ipcRenderer.send('ck-kurtar', {id:id, tablo:tablo});
}

function sil(id:number|string,tablo:string){
  islemvar.value = true;
  ipcRenderer.send('ck-sil', {id:id, tablo:tablo});
}

function sonuc(cevap:Cevap){
  islemvar.value = false;
  if(cevap.durum) {
    store.dispatch('bildirimDeposu/ekle', { tip: "success", mesaj: cevap.mesaj });
    let index = -1;
    switch (cevap.veri[0]) {
      case "urunler":
        index = silinenler.value.urunler.findIndex(urun => urun.id === cevap.veri[1]);
        break;
      case "kategoriler":
        index = silinenler.value.kategoriler.findIndex(urun => urun.id === cevap.veri[1]);
        break;
      case "odemeler":
        index = silinenler.value.odemeler.findIndex(urun => urun.id === cevap.veri[1]);
        break;
    }
    if (index !== -1) {
      silinenler.value.urunler.splice(index, 1);
    }
  } else {
    store.dispatch('bildirimDeposu/ekle', { tip: "warning", mesaj: cevap.mesaj });
  }
}

function silindi(cevap:Cevap){
  islemvar.value = false;
}

onMounted(() => {
  islemvar.value = true;
  ipcRenderer.on("ck-liste-response", (event: IpcRendererEvent, response) => {listele(response)});
  ipcRenderer.on("ck-kurtar-response", (event: IpcRendererEvent, response) => {sonuc(response)});
  ipcRenderer.on("ck-sil-response", (event: IpcRendererEvent, response) => {sonuc(response)});
  ipcRenderer.send('ck-liste');
});
onUnmounted(() => {
  ipcRenderer.removeAllListeners('ck-liste-response')
  ipcRenderer.removeAllListeners('ck-kurtar-response')
  ipcRenderer.removeAllListeners('ck-sil-response')
})
const karatiIhtiyacTimer = ref<any>(null);
watch(islemvar, (eski,yeni) => {
  if(eski == yeni) return;
  if(false == yeni && eski == true) {
    clearTimeout(karatiIhtiyacTimer.value);
    store.dispatch('iletisimDeposu/veriKaydet', { degisken: 'beklet', deger: false });
    return;
  }
  karatiIhtiyacTimer.value = setTimeout(() => {
    store.dispatch('iletisimDeposu/veriKaydet', { degisken: 'beklet', deger: !yeni });
  },600);

})
</script>

<template>
  <h1>Çöp Kutusu</h1>
  <div class="alert alert-warning m-3">Dikkat! Eğer yetkili ve bilgili değilseniz bu ekranı kullanmayınız.</div>
  <div style="max-height: 95%; height: 95%">
    <div v-if="islemvar" class="alert alert-warning mt-2">
      Tablolar güncelleniyor...
    </div>
    <div v-else style="max-height: 95%; height: 95%">
      <ul class="nav nav-tabs" id="myTab" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" id="urun-tab" data-bs-toggle="tab" data-bs-target="#urunler" type="button" role="tab" aria-controls="urun" aria-selected="true">Ürünler</button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="kategori-tab" data-bs-toggle="tab" data-bs-target="#kategoriler" type="button" role="tab" aria-controls="kategori" aria-selected="false">Kategoriler</button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="odeme-tab" data-bs-toggle="tab" data-bs-target="#odemeler" type="button" role="tab" aria-controls="odeme" aria-selected="false">Ödemeler</button>
        </li>
      </ul>
      <div class="overflow-auto" style="max-height: calc(100% - 140px);">
      <div class="tab-content" id="myTabContent">
        <div class="tab-pane fade show active" id="urunler" role="tabpanel" aria-labelledby="urun-tab">
          <table  class="table table-striped table-bordered table-sm">
            <thead>
            <tr>
              <th >#</th>
              <th scope="col" class="col-1">Kategori </th>
              <th scope="col" class="col-4">Ürün Adı</th>
              <th scope="col" class="col-3">Barkod</th>
              <th scope="col" class="col-2">Birim</th>
              <th scope="col" class="col-2">Fiyat</th>
              <th scope="col" class="col-1">İşlem</th>
            </tr>
            </thead>
            <tbody >
            <tr v-for="urun in silinenler.urunler">
              <td><button class="svg-btn mx-1 btn btn-success" @click="()=>kurtar(urun.id, 'urunler')">
                <i class="bi bi-recycle"></i>
              </button>
              </td>
              <td>{{urun.kategori_isim}}</td>
              <td>{{urun.isim}}</td>
              <td>{{urun.barkod}}</td>
              <td>{{urun.birim}}</td>
              <td>{{urun.fiyat}} ₺</td>
              <td class="">
                <div class="d-flex justify-content-center align-items-center">
                  <button class="svg-btn mx-1 btn col-md-6 btn-danger" @click="()=>sil(urun.id, 'urunler')">
                    <i class="bi bi-x-octagon-fill"></i>
                  </button>
                </div>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        <div class="tab-pane fade" id="kategoriler" role="tabpanel" aria-labelledby="kategori-tab">
          <table  class="table table-striped table-bordered table-sm">
            <thead>
            <tr>
              <th >#</th>
              <th scope="col" class="col-12">İsim</th>
              <th scope="col">İşlem</th>
            </tr>
            </thead>
            <tbody >
            <tr v-for="kategori in silinenler.kategoriler">
              <td><button class="svg-btn mx-1 btn btn-success" @click="()=>kurtar(kategori.id, 'kategoriler')">
                <i class="bi bi-recycle"></i>
              </button>
              </td>
              <td>{{kategori.isim}}</td>
              <td class="">
                <div class="d-flex justify-content-center align-items-center">
                  <button class="svg-btn mx-1 btn col-md-6 btn-danger" @click="()=>sil(kategori.id, 'kategoriler')">
                    <i class="bi bi-x-octagon-fill"></i>
                  </button>
                </div>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        <div class="tab-pane fade" id="odemeler" role="tabpanel" aria-labelledby="odeme-tab">
          <table  class="table table-striped table-bordered table-sm">
            <thead>
            <tr>
              <th >#</th>
              <th scope="col" class="col-12">Bilgi</th>
              <th scope="col">İşlem</th>
            </tr>
            </thead>
            <tbody >
            <tr v-for="odeme in silinenler.odemeler">
              <td><button class="svg-btn mx-1 btn btn-success" @click="()=>kurtar(odeme.id, 'odemeler')">
                <i class="bi bi-recycle"></i>
              </button>
              </td>
              <td>{{odeme.odeme?"Nakit":"POS"}} ödemesi ile {{odeme.tarih}} tarihinde yapılan ödeme. Satılan ürünler: {{odeme.icerik}}</td>
              <td class="">
                <div class="d-flex justify-content-center align-items-center">
                  <button class="svg-btn mx-1 btn col-md-6 btn-danger" @click="()=>sil(odeme.id, 'odemeler')">
                    <i class="bi bi-x-octagon-fill"></i>
                  </button>
                </div>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>