<script setup lang="ts">
//içe aktarımlar
import {onMounted, onUnmounted, ref, computed} from 'vue';
import { useStore } from 'vuex';
import {Cevap} from "@interfaces/index";
import BekleAnim from "../components/bekleAnim.vue";

interface LoadMesajEvent extends CustomEvent {
  detail: {
    mesaj: string;
  };
}

//tanımalamalar
const evt = new CustomEvent("kontrolbitti");
const store = useStore();
const iletisim = computed(() => store.getters["iletisimDeposu/iletisim"]);
const islemvar = ref(false);
const kotrolIndex = ref(0);
const kontrollist = [
  {
    islem:"paket",
    mesaj:"Paketler kontrol ediliyor",
    hata: "Paketler kontrol edilirken"
  },
  {
    islem:"veritabani.dosyasi",
    mesaj:"Veritabanı dosyaları inceleniyor",
    hata: "Veritabanı dosyaları incelenirken"
  },
  {
    islem:"veritabani.tablosu",
    mesaj:"Tablolar kontrol ediliyor",
    hata: "Tablolar kontrol edilirken"
  },
  {
    islem:"veritabani.tanimlama",
    mesaj:"Tablolar tanımlanıyor",
    hata: "Tablolar tanımlanırken"
  },
  {
    islem:"ayarlar",
    mesaj:"Ayarlar kaydediliyor",
    hata: "Ayarlar kaydedilirken"
  }
]
const ipcRenderer = window.ipcRenderer;

//fonksiyonlar
function islem(ne:string) {
  islemvar.value = true;
  const ctmEvt: LoadMesajEvent = new CustomEvent("loadmesaj", { detail: { mesaj: kontrollist[kotrolIndex.value].mesaj } });
  window.dispatchEvent(ctmEvt);
  store.dispatch('iletisimDeposu/veriKaydet', {degisken: 'islemmesaji', deger: kontrollist[kotrolIndex.value].mesaj});
  if (ne == "paket") {
    ipcRenderer.send("paket-kontrol");
  } else {
    ipcRenderer.send("kontrol." + ne);
  }
}
function sonuc(cevap: Cevap){
  islemvar.value = false;
  kotrolIndex.value++;
  if(cevap.durum){
    store.dispatch('iletisimDeposu/veriKaydet', { degisken: cevap.veri.islem, deger: cevap.mesaj });
    if(((typeof cevap.mesaj == "string" && cevap.mesaj == "false") ||
        (typeof cevap.mesaj == "boolean" && !cevap.mesaj)) &&
        typeof kontrollist[kotrolIndex.value-1].hata !== "undefined"
    ){
      bitir(true);
      store.dispatch('iletisimDeposu/veriKaydet', { degisken: 'hata', deger: kontrollist[kotrolIndex.value-1].hata+" teknik bir hata oluştu.<br>Uygulamayı yeniden başlatmayı deneyin.<br>Tekrarlarsa bizimle iletişime geçin." });
    }else
      if(kotrolIndex.value >= kontrollist.length)
        bitir();
      else
        islem(kontrollist[kotrolIndex.value].islem);
  }else bitir();
}
function bitir(sadecePre:boolean = false){
  window.dispatchEvent(evt);
  if(!sadecePre)
    store.dispatch('iletisimDeposu/veriKaydet', { degisken: 'kontrolbitti', deger: true });
}
onMounted(() => {

  setTimeout(() => {
    store.dispatch('iletisimDeposu/veriKaydet', { degisken: 'kontrolbitti', deger: false });
    kontrollist.forEach((kontrol) => {
      ipcRenderer.on("kontrol."+kontrol.islem+"-response", (event, response) => {sonuc(response)});
    })
    islem(kontrollist[kotrolIndex.value].islem);

  }, 1500);

});
onUnmounted(() => {
  kontrollist.forEach((kontrol) => {
    ipcRenderer.removeAllListeners("kontrol."+kontrol+"-response");
  })
})
</script>

<template>
  <div class="w-100 h-100">
    <div class="outbox position-absolute border-primary w-100 h-100"></div>
    <div class="box bg-primary-ozel position-absolute border-primary m-2">
      <div class="h-100 d-flex flex-column justify-content-center align-items-center ">
        <bekle-anim v-if="!iletisim.hata"></bekle-anim>
        <div v-if="!iletisim.hata" class="alert text-center text-light w-50">{{iletisim.islemmesaji?iletisim.islemmesaji+"...":"Uygulama başlatılıyor"}}</div>
        <div v-if="iletisim.hata" v-html="iletisim.hata" class="alert text-center alert-danger w-50"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-primary-ozel{
  background-color: #0d6efd !important;
  box-shadow: 0 0 10px #0d6efd ;
}

.outbox {
  z-index: -1;
  top: 50px;
  left: 0;
  overflow:hidden;
  aspect-ratio: 1 / 1;
  border: solid black 1px;
  clip-path: border-box;
}
.box {
  z-index: 1;
  top: 55px;
  left: 5px;
  height: calc(100% - 75px);
  width: calc(100% - 25px);
  overflow:hidden;
  aspect-ratio: 1 / 1;
  border: solid black 1px;
  clip-path: border-box;
}
.outbox::before {
  z-index:-1;
  content:'';
  position:absolute;
  inset: -25%;
  margin: auto;
  height: 300%;
  width: 150%;
  background-image: conic-gradient(
      #FFFFFF 0deg, #0d6efd 180deg
  );
  animation: 3s linear infinite rot;
}
@keyframes rot {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>