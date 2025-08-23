<template>
  <div class="w-100" style="user-select: none;">
    <div class="mb-2">
      <div class="marka" >
        <span class="metin">Rovave Satış Uygulaması</span>
        <span class="versiyon">{{versiyon}}</span>
      </div>
    </div>
    <div class="d-flex flex-column  h-100 text-center">
      <div class="saat bg-secondary"><div id="saat"></div></div>
      <div class="tarih">
        <span class="text-success float-start" id="tarih"></span>
        <span class="text-danger float-end" id="gun"></span>
      </div>
      <div class="d-flex justify-content-center align-items-center w-100 gap-2 mt-4">
        <button data-bs-toggle="tooltip" title="Ayarlar" class="btn btn-warning" @click="modalAc"><i class="bi bi-gear"></i></button>
        <button data-bs-toggle="tooltip" title="Hesap Makinası" class="btn btn-danger" @click="()=>{ipcRenderer.send('hesapmakinasi')}"><i class="bi bi-calculator"></i> </button>
        <button data-bs-toggle="tooltip" title="Planlama" class="btn btn-danger" @click="()=>{router.push('/planlama')}"><i class="bi bi-calendar4-week"></i></button>
        <button data-bs-toggle="tooltip" title="Not Defteri" class="btn btn-danger" @click="()=>{router.push('/notdefteri')}"><i class="bi bi-pencil-square"></i></button>
      </div>
      <div class="d-flex align-items-center w-100 btn-label bg-gradient bg-success mt-4"
           @click="()=>{router.push('/odeme')}"
           style="height: 100px"
      >
              <span class="ikon d-flex justify-content-center align-items-center">
                <i class="h4 m-0 bi bi-upc-scan"></i>
              </span>
        <div class="text-center d-flex justify-content-center pt-2 pb-2 flex-column" >
          <span class="isim">SEPET</span>
          <span>Ödeme Girişi</span>
        </div>
      </div>
    </div>
  </div>
  <kayit v-if="modalAcik"></kayit>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, computed, ref, watch, defineProps} from "vue";
import {trSaat, trTarih} from "@kutuphane/index";
import { useStore } from 'vuex';
import kayit from "../views/Ayarlar.vue";
import {useRouter} from "vue-router";
import {Modal} from "bootstrap";
const router = useRouter();
const props = defineProps<{
  versiyon: string;
}>();

const ipcRenderer = window.ipcRenderer;
const store = useStore();
const iletisim = computed(() => store.getters["iletisimDeposu/iletisim"]);
const modalAcik = ref(false);
let zamanlayici: any = null;

function ayarla() {
  const saat:HTMLDivElement|HTMLElement|null = document.getElementById('saat')
  const tarih:HTMLSpanElement|HTMLElement|null = document.getElementById('tarih');
  const gun:HTMLSpanElement|HTMLElement|null = document.getElementById('gun');
  if(saat && tarih && gun) {
    saat.innerHTML = trSaat(new Date(), true);
    tarih.innerHTML = trTarih();
    const gunler = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    gun.innerHTML = gunler[(new Date()).getDay()]
  }
}
function olustur() {
  ayarla()
  return setInterval(() => {
    ayarla()
  }, 1000);
}

function modalAc(){
  store.dispatch("iletisimDeposu/veriKaydet", { degisken: "ayarModalAcik", deger: true });
}

onMounted(() => {
  zamanlayici = olustur();
});

onUnmounted(() => {
  clearInterval(zamanlayici);
});
watch(
    () => iletisim,
    () => {
      if(typeof iletisim.value.ayarModalAcik !== "undefined") {
        if(modalAcik.value !== iletisim.value.ayarModalAcik) {
          modalAcik.value = iletisim.value.ayarModalAcik;
        }
      }
    },
    { deep: true }
)
</script>
