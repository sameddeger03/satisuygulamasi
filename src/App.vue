<script setup lang="ts">
import "./assets/takipcihazi";
import {useRouter, useRoute, RouteRecordRaw} from 'vue-router';
import {computed, onMounted, onUnmounted, ref, watch } from "vue";
import DijitalSaat from "./components/dijitalSaat.vue";
import {RouteProps} from "@interfaces/index";
import { useStore } from 'vuex';
import OnayModali from "./components/onayModali.vue";
import Alarmci from "./components/alarmci.vue";
import Bildirimler from "./components/bildirimler.vue";
import { Tooltip } from 'bootstrap'
import BekleAnim from "./components/bekleAnim.vue";
import Ry from "@src/components/ikon/ry.vue";
import Ly from "@src/components/ikon/ly.vue";
import RemoteYDK from "@src/components/pencere/remoteYDK.vue";

const versiyon = ref("");
const router = useRouter()
const route = useRoute();
const onaymodalim = ref<typeof OnayModali>();
const store = useStore();
const iletisim = computed(() => store.getters["iletisimDeposu/iletisim"]);
const ipcRenderer = window.ipcRenderer;
const tamEkran = ref<boolean>(false);
const kontrolbitti = ref<boolean>(false);
const rutiler = ref<RouteRecordRaw[]>([])
const sirketIsmi = ref('');
const internetDurum = ref<Record<string, number>>({"internet": -1, "sunucu": -1});
const pinger = ref<ReturnType<typeof setTimeout>>();

const filitrelenmisrutiler = computed(() => {
  for(let i = 0; i < router.options.routes.length; i++){
    rutiler.value.push(router.options.routes[i])
  }
  return rutiler.value.filter((route: any) => {
    let gizle_:boolean = false;
    if(route.params) gizle_ = (route.params as RouteProps).gizle||false;
    return !gizle_;
  });
});
const simdikiRuti:any = computed(() => router.options.routes.find((route:RouteRecordRaw) => route.name === router.currentRoute.value.name));

function islemGonder(islem: string) {
  switch (islem){
    case "kapat":
      if(iletisim.value.kapatilabilir || !kontrolbitti.value){
        ipcRenderer.send('kapat')
      }else {
        if(onaymodalim.value)
          onaymodalim.value.onayAl('Uygulama Kapatılıyor', 'Sepete ürün eklediniz. Devam ederseniz sıfırlanacak. Devam etmek istiyor musunuz?', () => {
            ipcRenderer.send('kapat');
          });
        else ipcRenderer.send('kapat')
      }
      break;
    case "yenile":
      document.location.reload();
      break;
    case "kucult":
      ipcRenderer.send('kucult')
      break;
    case "kilitle":
      ipcRenderer.send('kilitle')
      break;
    case "tamekran":
      tamEkran.value = true;
      ipcRenderer.send('tamekran')
      break;
    case "tamekran-cik":
      tamEkran.value = false;
      ipcRenderer.send('tamekran-cik')
      break;
  }
}

function konsol(){
  ipcRenderer.send('konsol')
}
const outsite_set = ref(false);
function elemanlariayarla(){

  if(!outsite_set.value)
    document.addEventListener("click", function(event) {
      const outside = document.getElementById("titlebar");
      if (outside && !outside.contains(event.target as Node)) {
        const dropdowns = Array.from(document.getElementsByClassName("dropdown")) as HTMLElement[];
        dropdowns.forEach((element:HTMLElement) => {
          const btns:HTMLButtonElement[] = Array.from(element.querySelectorAll("button"));
          for(let btn of btns)
            if(btn && btn.dataset.kapat != "1" && btn.contains(event.target as HTMLButtonElement)) return;
          const content = element.querySelector(".dropdown-menu");
          if(content)
            content.classList.remove("show");
        });
      }
    });
  outsite_set.value = true;
  const dropdowns = Array.from(document.getElementsByClassName("dropdown")) as HTMLElement[];
  dropdowns.forEach((element:HTMLElement) => {
    const btn = element.querySelector("button");
    const content = element.querySelector(".dropdown-menu");
    if (!btn || !content) return;
    if(typeof element.dataset.bind == "undefined") element.dataset.bind = "0";
    if(element.dataset.bind == "1") {
      content.classList.remove("show");
      return;
    }
    element.dataset.bind = "1";
    btn.addEventListener("click", () => {
      if (content.classList.contains("show"))
        content.classList.remove("show");
      else {
        content.classList.add("show");
      }
    });
  });

  const tooltips = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]')) as HTMLElement[];
  tooltips.forEach((element:HTMLElement) => {
    if(typeof element.dataset.bind == "undefined") element.dataset.bind = "0";
    if(element.dataset.zorla == "1") new Tooltip(element);
    else if(element.dataset.bind == "1") return;
    element.dataset.bind = "1";
    new Tooltip(element)
  });

  const removeTooltipDiv = Array.from(document.querySelectorAll('.tooltip')) as HTMLElement[];
  removeTooltipDiv.forEach((element:HTMLElement) => {
    element.remove();
  });
}
let timeoutId:any = null;
function fokus() {
  if(timeoutId != null)
    window.clearTimeout(timeoutId);
  if(!iletisim.value.ayarlar) return;
  if(!iletisim.value.ayarlar.kilit) return;
  timeoutId = setTimeout(() => {
    ipcRenderer.send("kilitle")
  }, 1000*60*10);
}
async function ver(){
  versiyon.value = await ipcRenderer.invoke("versiyon");
}
onMounted(() => {
  ver();
  store.dispatch('iletisimDeposu/veriKaydet', { degisken: 'onaymodali', deger: onaymodalim?.value||null });
  store.dispatch('iletisimDeposu/veriKaydet', { degisken: 'beklet', deger: false });
  if(!pinger.value)
  pinger.value = setInterval(() => {
    (async() => {
      const cevap = await ipcRenderer.invoke("internet");
      if(internetDurum.value.internet == cevap[0] && internetDurum.value.sunucu == cevap[1]) return;
      store.dispatch('iletisimDeposu/veriKaydet', { degisken: "internet", deger: cevap[0] });
      store.dispatch('iletisimDeposu/veriKaydet', { degisken: "sunucu", deger: cevap[1] });
      internetDurum.value = {"internet": cevap[0], "sunucu": cevap[1]};
      setTimeout(() => elemanlariayarla(),100);
    })();
  }, 1000);
  ipcRenderer.on('internet-response', (_event,cevap) => {
    console.log("internet sok")

  });
  elemanlariayarla();
  fokus();
  window.addEventListener('mousemove', fokus);
});

onUnmounted(() => {
  if(pinger.value)
    clearTimeout(pinger.value);
  window.removeEventListener('mousemove', fokus);
})
const lokalyedek = ref<number>(-1);
const remoteyedek = ref<number>(-1);
const token = ref<string>("");
const remoteyedek_modal = ref<boolean>(false);
watch(
    () => iletisim,
    () => {
      if(typeof iletisim.value.ayarlar !== "undefined") {
        if(typeof iletisim.value.ayarlar.sirket !== "undefined" && iletisim.value.ayarlar.sirket.length > 0)
          sirketIsmi.value = iletisim.value.ayarlar.sirket;
      }
      if(typeof iletisim.value.kontrolbitti !== "undefined" && kontrolbitti.value !== iletisim.value.kontrolbitti && iletisim.value.kontrolbitti){
        kontrolbitti.value = iletisim.value.kontrolbitti;
        ipcRenderer.send("stdout", JSON.stringify(iletisim.value));
        setTimeout(() => {router.push("/odeme");
          store.dispatch('iletisimDeposu/veriKaydet', { degisken: "kontrolbitti", deger: false  });
          }, 100)
      }
      if(typeof iletisim.value.elemanlariayarla !== "undefined" && iletisim.value.elemanlariayarla) {
        iletisim.value.elemanlariayarla = false;
        elemanlariayarla();
      }
      if(typeof iletisim.value.ayarlar !== "undefined" && typeof iletisim.value.ayarlar.localyedek !== "undefined") {
        if(lokalyedek.value != iletisim.value.ayarlar.localyedek) {
          lokalyedek.value = iletisim.value.ayarlar.localyedek;
          ipcRenderer.send("oto-yedekleme-lokal", iletisim.value.ayarlar.localyedek);
        }
      }
      if(typeof iletisim.value.ayarlar !== "undefined" && typeof iletisim.value.ayarlar.remoteyedek !== "undefined") {
        if(remoteyedek.value != iletisim.value.ayarlar.remoteyedek) {
          remoteyedek.value = iletisim.value.ayarlar.remoteyedek;
          ipcRenderer.send("oto-yedekleme-remote", {durum:iletisim.value.ayarlar.remoteyedek, token});
        }
      }
      if(typeof iletisim.value.ayarlar !== "undefined" && typeof iletisim.value.ayarlar.token !== "undefined") {
        if(token.value != iletisim.value.ayarlar.token) {
          token.value = iletisim.value.ayarlar.token;
        }
      }
    },
    { deep: true }
)

watch(route, () => {
  elemanlariayarla();
});


</script>
<template>
  <div id="titlebar" class="bg-light unselectable mb-2 p-1  ">
    <div v-if="kontrolbitti" class="d-flex align-items-center position-fixed start-50 m-auto">
      <alarmci ></alarmci>
      <button class="btn btn-xs btn-warning bg-gradient ms-2 " @click="()=>islemGonder('kilitle')"
              data-bs-toggle="tooltip" data-bs-placement="bottom" title="Uygulamayı Kilitle"
      ><i class="bi bi-lock"></i></button>
    </div>
    <div class="d-flex justify-content-between align-items-center ms-2">
      <div class="border-2 rounded border-secondary border marka bg-secondary text-white">
        <span class="ikon"><img src="/favicon.png" alt="Logo" style="width:28px; height:24px" class="d-inline-block align-text-top"></span>
        <span class="metin" v-html="sirketIsmi?(sirketIsmi==''?'Rovave Satış Uygulaması':sirketIsmi):'Rovave Satış Uygulaması'"></span>
      </div>
      <div class="float-end btn-group" role="group">
        <button class="btn btn-xs btn-secondary bg-gradient  " @click="()=>islemGonder('kucult')"><i class="bi bi-dash-lg"></i></button>
        <button v-if="tamEkran" class="btn btn-xs btn-secondary bg-gradient  " @click="()=>islemGonder('tamekran-cik')"><i class="bi bi-fullscreen-exit"></i></button>
        <button v-else class="btn btn-xs btn-secondary bg-gradient  " @click="()=>islemGonder('tamekran')"><i class="bi bi-arrows-fullscreen"></i></button>
        <button class="btn btn-xs btn-danger bg-gradient  " @click="()=>islemGonder('kapat')"><i class="bi bi-x-lg"></i></button>
      </div>
    </div>
  </div>
  <div v-if="kontrolbitti" id="app" class="container-fluid ps-0">
    <div class="row" >
      <div class="col-md-10 icerik p-3 ps-4">
        <router-view />
      </div>
      <div class="col-md-2 bg-light">
        <div class="menu d-flex flex-column align-items-center p-2 gap-1 h-100 ">
          <dijital-saat :versiyon="versiyon" />
          <div class="d-flex flex-column align-items-center gap-3 w-100 m-auto " >

            <router-link
                :class = "
                (route.name === router.currentRoute.value.name ||
                (simdikiRuti && simdikiRuti.params && simdikiRuti.params.ek && simdikiRuti.params.ek.includes(route.path)))?'bg-primary':'bg-secondary'
                "
                class="d-flex align-items-center w-100 btn-label" v-for="route in filitrelenmisrutiler" :key="route.path" :to="route.path">
              <span class="ikon d-flex justify-content-center align-items-center"><i class="bi" :class="route.params.ikon"></i></span> <div class="text-center d-flex justify-content-center"><span >{{route.name}}</span></div>
            </router-link>
            <button v-if="iletisim.admin" class="btn btn-success w-100" @click="router.push('/copkutusu')">Çöp Kutusu</button>
            <button v-if="iletisim.admin" class="btn btn-warning w-100" @click="router.push('/verikontrol')">Veri Kontrol</button>
            <button v-if="iletisim.admin" class="btn btn-danger w-100 mt-auto" @click="konsol" >Geliştirici</button>
          </div>
          <div>
            <ry
                :hazir="internetDurum.internet != -1 && internetDurum.sunucu != -1"
                :acik="remoteyedek"
                :durum1="internetDurum.internet==-1?false:internetDurum.internet==1"
                :durum2="internetDurum.sunucu==-1?false:internetDurum.sunucu==1"
                :token="token"
                @click="remoteyedek_modal=!remoteyedek_modal"
            ></ry>
            <ly
                :hazir="lokalyedek != -1"
                :acik= "lokalyedek"
                ></ly>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="container-fluid ps-0">
    <router-view  />
  </div>
  <onay-modali style="z-index: 1107" ref="onaymodalim" />
  <div id="kararti" style="display: none; z-index: 1054" class="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-50" tabindex="-1" ></div>
  <bildirimler style="z-index: 1109"></bildirimler>
  <div v-if="iletisim.beklet" class="position-fixed top-0 start-0 w-100 h-100 bg-opacity-50 bg-black" style="z-index: 1110">
    <div class="d-flex h-100 w-100 flex-column justify-content-center align-items-center">
      <bekle-anim></bekle-anim>
      <span class="fs-6 text-light">Lütfen bekleyiniz, işlem yapılıyor...</span>
    </div>
  </div>
  <remote-y-d-k :durum="remoteyedek_modal" :internet="internetDurum.internet!=-1?internetDurum.internet==1:false" :sunucu="internetDurum.sunucu!=-1?internetDurum.sunucu==1:false"></remote-y-d-k>
</template>

<style scoped>

#titlebar {
  height: 50px;
}
#app {
  font-family: Roboto, Helvetica, Arial, sans-serif;
}
#app .row:first-child {
  height: calc(100vh - 60px);
}
.menu, .icerik {
  height: 100%;
}


</style>