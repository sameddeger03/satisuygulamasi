<script setup lang="ts">
//İçe Aktarımlar
import {ref, onMounted, onUnmounted, computed, nextTick, reactive, watch} from 'vue';
import {Kategori, Cevap, UrunFiltre, KategoriFiltre} from '@interfaces/index';
import {IpcRendererEvent} from "electron";
import { useStore } from 'vuex';
import {Modal} from "bootstrap";
import {mpen, ToLowerCaseTR} from "@kutuphane/index";

//Tanımlamalar
const store = useStore();
const iletisim = computed(() => store.getters["iletisimDeposu/iletisim"]);
const kategoriModalTip = ref<string>("");
const islemvar = ref<boolean>(false);
const kategoriler = ref<Kategori[]>([]);
const listeFilitre = reactive<KategoriFiltre>({
  isim: ""
});
const duzenlenenKategori = ref<Kategori>({
  id: -1,
  isim: "",
  sil: false,
  gizle: false
});

const filteredItems = computed(() => {
  return kategoriler.value
      .filter(kategori => !kategori.gizle)
      .sort((a, b) => a.isim.localeCompare(b.isim));
});

const ipcRenderer = window.ipcRenderer;

//Fonksiyonlar
function listele(response: Cevap) {
  if (response.durum) {
    response.veri?.forEach((kategori:Kategori,index:number) => {
      kategori.gizle = kategori.id == 1; //kategorisiz kategorisi
      kategoriler.value[index] = kategori;
    })
  } else
    store.dispatch('bildirimDeposu/ekle', { tip: "warning", mesaj: response.mesaj });
  kategoriFiltrele();
  islemvar.value = false;
}

function kategoriEklendi(response: Cevap) {
  if (response.durum) {
    nextTick(() => {
      duzenlenenKategori.value = {
        id: -1,
        isim: "",
        sil: false,
        gizle: false
      };
    });
    store.dispatch("bildirimDeposu/ekle", { tip: "success", mesaj: response.mesaj });
    mpen.kapat('kategoriModal');
    ipcRenderer.send('kategori-liste');
  } else {
    store.dispatch("bildirimDeposu/ekle", { tip: "warning", mesaj: response.mesaj });
  }
  islemvar.value = false;
}
function kategoriDuzenlendi(response: Cevap) {
  if (response.durum) {
    store.dispatch("bildirimDeposu/ekle", { tip: "success", mesaj: response.mesaj });
    mpen.kapat('kategoriModal');
    ipcRenderer.send('kategori-liste');
  } else
    store.dispatch("bildirimDeposu/ekle", { tip: "warning", mesaj: response.mesaj });
}

function kategoriEklenebilir(yeni:boolean) {
  let sonuc = [];
  const uyarilar = [
    "Bu kategori zaten mevcut.",
    "Kategori adı 3 karakterden fazla olmalı."
  ];

  if(yeni)
    sonuc.push( kategoriler.value.findIndex(kategori => kategori.isim === duzenlenenKategori.value.isim) == -1);
  else
    sonuc.push(true);

  //isim kontrol
  sonuc.push(duzenlenenKategori.value.isim.toString().length >= 3);

  sonuc.forEach((element, index) => {
    if (!element)
      store.dispatch("bildirimDeposu/ekle", { tip: "warning", mesaj: uyarilar[index] });
  })

  return sonuc.every(element => element === true);
}
function kategoriEkleGuncelle(yeni: boolean) {
  islemvar.value = true;
  if(!kategoriEklenebilir(yeni)) return islemvar.value = false;
  ipcRenderer.send(yeni?'kategori-ekle':'kategori-duzenle', {id:duzenlenenKategori.value.id, isim:duzenlenenKategori.value.isim});
}
function kategoriEkle(){
  if(duzenlenenKategori.value)
    kategoriEkleGuncelle(true);
}
function kategoriDuzenle() {
  if(duzenlenenKategori.value)
    kategoriEkleGuncelle(false);
}
function kategoriEkleFormDoldur() {
  kategoriModalTip.value = "ekle";
  mpen.ac('kategoriModal')
  nextTick(() => {
    duzenlenenKategori.value ={
      id: -1,
      isim: "",
      sil: false,
      gizle: false
    };
  });
}
function kategoriDuzenleFormDoldur(kategori: Kategori) {
  kategoriModalTip.value = "duzenle";
  mpen.ac('kategoriModal')
  nextTick(() => {
    duzenlenenKategori.value = kategori;
  });
}
function kategoriSilOnay(id: string|number) {
  iletisim.value.onaymodali.onayAl('Kategori Silinecek', 'Kategoriyi silmek istediğinizden emin misiniz?<br><b>' + kategoriler.value.find(kategori => kategori.id == id)?.isim + '</b>', () => {
    kategoriSil(id);
  });
}
function kategoriSil(id: string|number) {
  islemvar.value = true;
  if(id == 0) return;
  const index = kategoriler.value.findIndex(kategori => kategori.id === id);
  if (index !== -1)
    kategoriler.value.splice(index, 1);
  ipcRenderer.send('kategori-sil', id);
}
function kategoriSilindi(response: Cevap) {
  if (response.durum)
    store.dispatch("bildirimDeposu/ekle", { tip: "success", mesaj: response.mesaj });
  else
    store.dispatch("bildirimDeposu/ekle", { tip: "warning", mesaj: response.mesaj });
  islemvar.value = false;
  ipcRenderer.send('kategori-liste');
}
function kategoriFiltrele() {
  kategoriler.value.forEach((kategori, index) => {
    kategoriler.value[index].gizle = kategoriler.value[index].id == 1;
    if(listeFilitre.isim != "")
      if(ToLowerCaseTR(kategori.isim).indexOf(ToLowerCaseTR(listeFilitre.isim)) == -1)
        kategoriler.value[index].gizle = true;
    if(kategori.sil)
      kategoriler.value[index].gizle = true;
  })
}
function filtreTemizle() {
  listeFilitre.isim = "";
  kategoriFiltrele();
}
onMounted(() => {
  ipcRenderer.on('kategori-liste-response', (event: IpcRendererEvent, response) => {listele(response)});
  ipcRenderer.on('kategori-duzenle-response', (event: IpcRendererEvent, response) => {kategoriDuzenlendi(response)});
  ipcRenderer.on('kategori-ekle-response', (event: IpcRendererEvent,response) => {kategoriEklendi(response)});
  ipcRenderer.on('kategori-sil-response', (event: IpcRendererEvent, response) => {kategoriSilindi(response)});
  islemvar.value = true;
  ipcRenderer.send('kategori-liste');
});
onUnmounted(() => {
  ipcRenderer.removeAllListeners('kategori-liste-response')
  ipcRenderer.removeAllListeners('kategori-duzenle-response')
  ipcRenderer.removeAllListeners('kategori-ekle-response')
  ipcRenderer.removeAllListeners('kategori-sil-response')
})
watch(islemvar, (eski,yeni) => {
  store.dispatch('iletisimDeposu/veriKaydet', { degisken: 'beklet', deger: !yeni });
})
</script>
<template>
  <div class="d-flex justify-content-between align-items-center">
    <h2>{{ $t('categories.title') }} </h2>
    <button
        class="btn btn-primary"
        aria-controls="yeniKategoriEkle"
        @click="kategoriEkleFormDoldur"
    >
      {{ $t('categories.addNew') }}
    </button>
  </div>
  <div class="border p-2" >
    <div class="d-flex justify-content-between align-items-center">
      <input @keyup="kategoriFiltrele" v-model="listeFilitre.isim" :disabled="islemvar" type="text" class="form-control me-2" :placeholder="$t('categories.name')" />
      <button :disabled="islemvar" class="btn btn-primary" @click="filtreTemizle">{{ $t('common.clear') }}</button>
    </div>
  </div>

  <div v-if="filteredItems.length == 0" class="alert alert-danger mt-2">
    {{ $t('categories.noCategories') }}
  </div>
  <div v-else class="overflow-auto mt-3" style="max-height: 85%;">
  <table  class="table table-striped table-bordered table-sm">
    <thead>
    <tr>
      <th scope="col" class="col-11">{{ $t('categories.name') }}</th>
      <th scope="col" class="col-1">{{ $t('categories.action') }}</th>
    </tr>
    </thead>
    <tbody >
    <tr v-for="kategori in filteredItems">
      <td>{{kategori.isim}}</td>
      <td class="">
        <div class="d-flex justify-content-center align-items-center">
          <button class="svg-btn mx-1 btn col-md-6 btn-success" @click="() => kategoriDuzenleFormDoldur(kategori)">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="svg-btn mx-1 btn col-md-6  btn-danger" @click="() => kategoriSilOnay(kategori.id)">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
    </tbody>
  </table>
  </div>
  <div class="modal" tabindex="-1" id="kategoriModal" >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 v-if="kategoriModalTip=='ekle'" class="modal-title" id="kategoriEkleModalLabel">{{ $t('categories.addTitle') }}</h5>
          <h5 v-if="kategoriModalTip=='duzenle'" class="modal-title" id="kategoriDuzenleModalLabel"> <span class="w-100">{{ $t('categories.editTitle') }}</span> <span class="text-primary fs-6">{{ duzenlenenKategori.isim }}</span></h5>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">{{ $t('categories.name') }}</label>
            <input v-model="duzenlenenKategori.isim"  :disabled="islemvar" type="text" class="form-control me-2" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-bs-dismiss="modal" @click="()=>{mpen.kapat('kategoriModal'); kategoriModalTip = ''}">{{ $t('common.cancel') }}</button>
          <button v-if="kategoriModalTip=='ekle'" class="btn btn-primary" :disabled="islemvar" @click="kategoriEkle" >{{ $t('categories.create') }}</button>
          <button v-if="kategoriModalTip=='duzenle'" class="btn btn-primary" :disabled="islemvar" @click="kategoriDuzenle" data-bs-dismiss="modal" >{{ $t('common.save') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
