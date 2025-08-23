<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from "vue";
import {Hatirlatma} from "@interfaces/index";
import {useStore} from "vuex";
import {noktaliTarih, tarihKiyasla, trSaat, objele} from "@kutuphane/index";

const zamanlayici = ref<Record<string, any>>({});
const alarmkutusu = ref<HTMLDivElement>()
const store = useStore();
const ipcRenderer = window.ipcRenderer;

const bugunicinalarmlar = ref<Hatirlatma[]>([]);
const gosterilecekAlarmlar = computed(() => store.getters["alarmDeposu/alarmlar"]);
const gosterilenAlarm = ref<Hatirlatma|null>(); //gösterilen
const alarmliste = ref<Hatirlatma[]>([]);
const listereset = ref<boolean>(false)

const kapat = () => {
  if(!alarmkutusu.value || !gosterilenAlarm.value) return;
  store.dispatch('alarmDeposu/sil', gosterilenAlarm.value.uid);
  ipcRenderer.send("alarmUyar", gosterilenAlarm.value.id, true);
  gosterilenAlarm.value = null;
  listereset.value = true;
}

onMounted(() => {
  ipcRenderer.on("alarmlar-response", (event, response) => {
    store.dispatch("alarmDeposu/temizle");
    bugunicinalarmlar.value = response.veri;
  });
  zamanlayici.value["main"] = setInterval(() => {
    ipcRenderer.send("alarmlar",new Date());
  },1000*60);
  zamanlayici.value["kontrolcu"] = setInterval(() => {
    if(gosterilenAlarm.value != null) return;
    gosterilecekAlarmlar.value.forEach((alarm:Hatirlatma, i:Number) => {
      if(new Date(alarm.tarih).getTime() <= new Date().getTime()) {
        gosterilenAlarm.value = alarm;
        ipcRenderer.send("onegetir");
        return;
      }
    })
  },1000);
  ipcRenderer.send("alarmlar",new Date());
});

onUnmounted(() => {
  ipcRenderer.removeAllListeners("alarmlar-response");
  Object.entries(zamanlayici.value).forEach(([zn, zf]) => {
    if(typeof zf === typeof setInterval)
      clearInterval(zf);
    if (typeof zf === typeof setTimeout)
      clearTimeout(zf);
  })
});


watch(bugunicinalarmlar, (yeni, eskiler) => {
  listereset.value = true;
  alarmliste.value = yeni;
  for (const alarm of alarmliste.value) {
    if(!alarm.uyarildi)
      store.dispatch("alarmDeposu/ekle", alarm);
  }
  listereset.value = false;
});

</script>

<template>
  <div class="dropdown" data-bind="0">
    <button class="btn btn-secondary" data-bs-toggle="tooltip" title="Alarm Bildirimleri" data-bs-placement="bottom">
      <i class="bi bi-alarm" aria-hidden="true"></i>
    </button>
    <div class="dropdown-menu" style="width: 400px; right: -200px" role="menu">
      <div v-if="alarmliste.length==0" class="text-center alert alert-warning p-1 m-1">Çalacak alarm yok.</div>
      <div v-else-if="!listereset">
        <h6 class="text-center alert alert-info p-1 m-1">Çalacak Alarmlar</h6>
        <div  class="alert alert-primary p-1 m-1" v-for="alarm in alarmliste">
          <div class="d-flex align-items-center  gap-3 ">
                  <span class="d-flex flex-column ">
                    <span class="fw-bold text-center w-100"><i class="bi bi-bell"></i></span>
                    <span>{{ trSaat(new Date(alarm.tarih)) }}</span>
                  </span>
            <div class="d-flex w-100 justify-content-between">
                  <span class="d-flex flex-column ">
                    <span class="fw-bold">{{ alarm.baslik }}</span>
                    <span>{{ alarm.mesaj }}</span>
                  </span>
              <div class="align-self-center me-1" >
                <div class="form-check form-switch">
                  <input class="form-check-input" :checked="!alarm.uyarildi" type="checkbox" @change="(event)=>{ipcRenderer.send('alarmUyar', alarm.id, !(event.target as HTMLInputElement).checked)}">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="gosterilenAlarm != null" ref="alarmkutusu" class="z-3 d-flex fade show justify-content-center align-items-center w-100 h-100 position-fixed top-0 start-0 bg-black bg-opacity-50">
    <audio hidden ref="audio" autoplay loop>
      <source :src="'alarm.mp3'" type="audio/mpeg">
    </audio>
    <div class="w-25 shadow d-flex flex-column  bg-light px-2 rounded border border-secondary">
      <div class="d-flex justify-content-between align-items-center border-bottom w-100 border-danger">
        <span class="w-25">{{ noktaliTarih(gosterilenAlarm?.tarih||"") }}</span>
        <h2 class="text-center">Alarm!</h2>
        <span class="w-25 text-end">{{ trSaat(new Date(gosterilenAlarm?.tarih)) }}</span>
      </div>
      <div class="d-flex d-flex gap-2 justify-content-start gap-2 mb-1">
        <div class="btn" @click="()=>{kapat()}">
          <div class="px-1 rounded-circle border-danger border">
            <div class="m-2 bell text-danger">
              <i class="bi bi-bell h2"></i>
            </div>
          </div>
        </div>
        <div  class="pt-1 d-flex flex-column align-content-center-center justify-content-center">
          <b>{{ gosterilenAlarm?.baslik }}</b>
          <p>{{ gosterilenAlarm?.mesaj }}</p>
        </div>
      </div>
      <div style="font-style: italic; font-size: smaller" class="text-primary mt-0 mb-1">Alarmı kapatmak için çan simgesine tıklayın.</div>
    </div>
  </div>
</template>

<style scoped>
.bell {
  animation: bellshake .5s cubic-bezier(.36,.07,.19,.97) infinite;
}
@keyframes bellshake {
  0% { transform: rotate(0); }
  15% { transform: rotate(5deg); }
  30% { transform: rotate(-5deg); }
  45% { transform: rotate(4deg); }
  60% { transform: rotate(-4deg); }
  75% { transform: rotate(2deg); }
  85% { transform: rotate(-2deg); }
  92% { transform: rotate(1deg); }
  100% { transform: rotate(0); }
}
</style>