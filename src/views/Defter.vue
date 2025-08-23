<template>
  <div class="page-content p-2 bg-light" style="height: 100%; width: 100%">
    <div class="alert alert-secondary d-flex justify-content-between align-items-center p-2">
      <h4 class="d-flex my-auto flex-column align-content-center justify-content-center h-100">Notlar</h4>
      <button class="btn btn-sm btn-primary my-auto" @click="yeniNot">Yeni Not Ekle</button>
    </div>
    <div class="notlar " style="overflow-y: auto; height: 90%;max-height: 90%;">
      <div class="w-100 h-100 d-flex flex-column align-content-center justify-content-center" v-if="islemvar && notlar.length == 0">
        <h3 class="text-center">Notlar yükleniyor...</h3>
      </div>
      <div class="w-100 h-100 d-flex flex-column align-content-center justify-content-center" v-else-if="notlar.length == 0">
        <h3 class="text-center">Hiç not eklenmemiş.</h3>
      </div>
      <div v-else class="container">
        <div class="row">
          <div class="col-md-4 col-sm-6" v-for="not in notlar">
            <div class="card  " >
              <div class="card-header p-0">
                <div class="d-flex justify-content-between ps-2">
                  <div class="d-flex align-items-center">
                    <span :style="'color:'+not.renk"><i class="bi bi-circle-fill"></i> </span>
                    <span contenteditable class="baslik m-2" @blur="(e:FocusEvent)=> {notuKaydet(not,e.target)}" @keydown="enterYasak" > {{not.baslik}} </span>
                  </div>
                  <button class="btn btn-sm bg-light text-danger" @click="()=>{notuSil(not.id?not.id:-1)}"><i class="bi bi-trash"></i> </button>
                </div>
              </div>
              <div class="card-body p-0" style="height: 100px;">
                <textarea @keyup="()=>{notuKaydet(not,null)}" class="form-control h-100" v-model="not.mesaj" style="resize: none; "></textarea>
              </div>
              <div class="card-footer">
                <span class="tarih text-muted">{{formatTarih(not.tarih)}} değiştirildi.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {Cevap, Note} from '@interfaces/index';
import {formatTarih} from '@kutuphane/index';

import {onMounted, onUnmounted, ref, watch} from "vue";
import {sqlTarih, renkuydur, objele} from "@kutuphane/index";
import {useStore} from "vuex";

const store = useStore();
const notlar = ref<Note[]>([]);
const islemvar = ref(true);
const ipcRenderer = window.ipcRenderer;

const enterYasak = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
  }
}

function yeniNot(){
  islemvar.value = true;
  const not:Note = {
    id: null,
    baslik: "Başlıksız",
    mesaj: "Yeni Not",
    renk: renkuydur(),
    tarih: sqlTarih(),
    sil: false
  };
  ipcRenderer.send('not-ekle', not);
}
function notuSil(id:string|number){
  if(Number(id) > -1){
    islemvar.value = true;
    ipcRenderer.send("not-sil",id.toString());
  }
}
function notuKaydet(not:Note, element:EventTarget|null){
  if(element)
    not.baslik = (element as HTMLSpanElement).innerText;
  not.tarih = sqlTarih();
  ipcRenderer.send('not-guncelle', objele(not));
}
function sonuc(response:Cevap) {
  if(response.durum)
    ipcRenderer.send('not-liste');
  else store.dispatch("bildirimDeposu/ekle", { tip: "warning", mesaj: response.mesaj });
  islemvar.value = false;
}
onMounted(() => {
  ipcRenderer.on('not-liste-response', (event,response) => {
    if(response.durum)
      notlar.value = response.veri;
    else store.dispatch("bildirimDeposu/ekle", { tip: "warning", mesaj: response.mesaj });
    islemvar.value = false;
  });
  ipcRenderer.on('not-ekle-response', (event,response) => {
    sonuc(response)
  });
  ipcRenderer.on('not-sil-response', (event,response) => {
    sonuc(response)
  });
  ipcRenderer.send('not-liste');
})
onUnmounted(() => {
  ipcRenderer.removeAllListeners("not-liste-response");
  ipcRenderer.removeAllListeners("not-ekle-response");
  ipcRenderer.removeAllListeners("not-sil-response");
})
watch(islemvar, (eski,yeni) => {
  if(eski == yeni) return;
  store.dispatch('iletisimDeposu/veriKaydet', { degisken: 'beklet', deger: !yeni });
})
</script>

<style scoped>
button.btn-secondary {
  border-radius: 0 5px 0 0;
}
.card {
  box-shadow: 0 2px 2px rgba(204, 197, 185, 0.5);
  background-color: #FFFFFF;
  color: #252422;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
}
.tarih {
  font-size: 12px;
}
textarea, textarea:focus {
  outline:none;
  box-shadow: none;
}
</style>