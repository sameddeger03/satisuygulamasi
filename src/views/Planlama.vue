<script setup lang="ts">
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from 'vue'
import Yukleniyor from "../components/yukleniyor.vue";
import tik from "../components/tik.vue";
import {tariheSaatEkle, trTarih, trSaat, tarihKiyasla} from "@kutuphane/index";
import {Hatirlatma, Plan} from "@interfaces/index";
import {useStore} from "vuex";

const store = useStore();
const yuklendi = ref<Record<string, boolean>>({plan:false,alarm:false,notdefteri:false});
const tarih = ref<Date>(new Date());
const ipcRenderer = window.ipcRenderer;
const alarmlar = ref<Hatirlatma[]>([]);
const planlar = ref<Plan[]>([]);
const siraliAlarmlar = computed(() => {
  return alarmlar.value.sort(tarihKiyasla);
})
const siraliPlanlar = computed(() => {
  return planlar.value.sort(tarihKiyasla);
})

const islemvar = ref<boolean>(false);
const notdefteriDegisti = ref<boolean>(false);

//yeni alarm verileri
const yeniAlarm = ref<boolean>(false);
const yeniAlarmBaslik = ref<HTMLInputElement>();
const yeniAlarmSaat = ref<HTMLInputElement>();
const yeniAlarmDakika = ref<HTMLInputElement>();
const yeniAlarmMesaj = ref<HTMLInputElement>();

//yeni not(plan) verileri
const yeniPlan = ref<boolean>(false);
const yeniPlanMesaj = ref<HTMLInputElement>();
const yeniPlanTip = ref<string>("danger");
const tipKarsiliklari:any = {danger: "Kritik", warning: "Dikkat", success: "Önemli", info: "Önemsiz"}

function alarmEkle() {
  if(!yeniAlarmBaslik.value || !yeniAlarmSaat.value || !yeniAlarmDakika.value || !yeniAlarmMesaj.value) return;
  islemvar.value = true;
  yuklendi.value.alarm = false;
  const alarm:Hatirlatma = {baslik:"", tarih:"", mesaj:""} as Hatirlatma;
  alarm.baslik = yeniAlarmBaslik.value.value;
  alarm.tarih = tariheSaatEkle(
      tarih.value,
      yeniAlarmSaat.value.value,
      yeniAlarmDakika.value.value
  ).toString();
  alarm.mesaj =  yeniAlarmMesaj.value.value;
  ipcRenderer.send('alarm-ekle',alarm);
}
function alarmSil(id:string|number) {
  ipcRenderer.send('alarm-sil',id.toString());
}

function planEkle() {
  if(!yeniPlanMesaj.value || !yeniPlanTip.value) return;
  islemvar.value = true;
  yuklendi.value.plan = false;
  const plan:Plan = {mesaj:"", tip:""} as Plan;
  plan.mesaj = yeniPlanMesaj.value.value;
  plan.tip = yeniPlanTip.value;
  plan.tarih = tariheSaatEkle(
      tarih.value,
      "00",
      "00"
  ).toString();
  ipcRenderer.send('plan-ekle',plan);
}

function planSil(id:string|number) {
  ipcRenderer.send('plan-sil',id.toString());
}
function planYapildi(id:string|number,durum:boolean) {
  ipcRenderer.send('plan-yapildi',id.toString(),durum);
}

onMounted(() => {
  ipcRenderer.on('planlamalar-response', (event,response) => {
    islemvar.value = false;
    yuklendi.value.alarm = true;
    yuklendi.value.plan = true;
    if(response.durum){
      alarmlar.value = response.veri.alarmlar;
      planlar.value = response.veri.planlar;
    }else store.dispatch("bildirimDeposu/ekle", { tip: "warning", mesaj: response.mesaj });
  });
  ipcRenderer.on("alarm-ekle-response", (event, response) => {
    islemvar.value = false;
    yuklendi.value.alarm = true;
    if (response.durum){
      store.dispatch("bildirimDeposu/ekle", { tip: "success", mesaj: response.mesaj });
      yeniAlarm.value = false;
      ipcRenderer.send('planlamalar', tarih.value);
    }
    else
      store.dispatch("bildirimDeposu/ekle", { tip: "warning", mesaj: response.mesaj });
  })
  ipcRenderer.on("plan-ekle-response", (event, response) => {
    islemvar.value = false;
    yuklendi.value.plan = true;
    if (response.durum){
      store.dispatch("bildirimDeposu/ekle", { tip: "success", mesaj: response.mesaj });
      yeniPlan.value = false;
      ipcRenderer.send('planlamalar', tarih.value);
    }
    else
      store.dispatch("bildirimDeposu/ekle", { tip: "warning", mesaj: response.mesaj });
  })
  ipcRenderer.on("alarm-sil-response", (event, response) => {
    islemvar.value = false;
    yuklendi.value.alarm = true;
    if (response.durum){
      store.dispatch("bildirimDeposu/ekle", { tip: "success", mesaj: response.mesaj });
      ipcRenderer.send('planlamalar', tarih.value);
    }
    else
      store.dispatch("bildirimDeposu/ekle", { tip: "warning", mesaj: response.mesaj });
  })
  ipcRenderer.on("plan-sil-response", (event, response) => {
    islemvar.value = false;
    yuklendi.value.plan = true;
    if (response.durum){
      store.dispatch("bildirimDeposu/ekle", { tip: "success", mesaj: response.mesaj });
      ipcRenderer.send('planlamalar', tarih.value);
    }
    else
      store.dispatch("bildirimDeposu/ekle", { tip: "warning", mesaj: response.mesaj });
  })
  ipcRenderer.send('planlamalar', tarih.value);
});
onUnmounted(() => {
  ipcRenderer.removeAllListeners("planlamalar-response");
  ipcRenderer.removeAllListeners("alarm-ekle-response");
  ipcRenderer.removeAllListeners("alarm-sil-response");
  ipcRenderer.removeAllListeners("plan-ekle-response");
  ipcRenderer.removeAllListeners("plan-sil-response");
});

watch(tarih,
    (yeniTarih) => {
      ipcRenderer.send('planlamalar', yeniTarih);
    })
watch(islemvar, (eski,yeni) => {
  store.dispatch('iletisimDeposu/veriKaydet', { degisken: 'beklet', deger: !yeni });
})
watch(yeniPlan, (eski,yeni) => {
  nextTick(() => {
    store.dispatch("iletisimDeposu/veriKaydet", {  degisken: "elemanlariayarla", deger: true  });
  });
})
</script>

<template>
  <div class="d-flex flex-column h-50">
    <div class="text-center section">
      <h2 class="h2">Planlayıcı</h2>
      <div class="text-lg font-medium text-gray-600 mb-6">
        <div v-if="tarih" :class="tarih?'.text-success':'.text-danger'">Seçilen Tarih: {{ trTarih(tarih) }}</div>
        <div v-else>Takvimden tarih ve saat seçebilirsiniz.</div>
      </div>
    </div>
    <div class="row p-4 gy-4 h-100">
      <div class="col-4">
        <VDatePicker
            v-model='tarih'
            mode="date"
            class="w-100"
            is-expanded
        >
        </VDatePicker>
      </div>

      <div class="col-8" v-if="!yeniAlarm">
        <div class="card h-100">
          <div class="card-header">
            Alarmlar
            <button class="btn btn-sm btn-success float-end" @click="yeniAlarm=true">Yeni Alarm</button>
          </div>
          <div class="card-body">
            <yukleniyor v-if="!yuklendi.alarm" v-bind:durum="yuklendi.alarm"></yukleniyor>
            <div v-else-if="!siraliAlarmlar.length"  class="d-flex flex-column align-items-center justify-content-center w-100 h-100">
              Bu tarih için hiç alarm eklenmedi.
            </div>
            <div v-else class="list-group">
              <div class="alert alert-info w-100 p-1" v-for="alarm in siraliAlarmlar" :key="alarm.id">
                <div class="d-flex align-items-center  gap-3 ">
                  <span class="d-flex flex-column ">
                    <span class="fw-bold text-center w-100"><i class="bi bi-alarm"></i></span>
                    <span>{{ trSaat(new Date(alarm.tarih)) }}</span>
                  </span>
                  <div class="d-flex w-100 justify-content-between">
                  <span class="d-flex flex-column ">
                    <span class="fw-bold">{{ alarm.baslik }}</span>
                    <span>{{ alarm.mesaj }}</span>
                  </span>
                    <div class="align-self-center me-1" >
                      <span style="cursor: pointer" class="link link-danger" @click="()=>{alarmSil(alarm.id)}"><i class="bi bi-x-circle h3"></i></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="col-8">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between">
            Yeni Alarm
            <button class="btn btn-sm btn-danger float-end" @click="yeniAlarm=false">Vazgeç</button>
          </div>
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div class="me-2 w-100">
                <input ref="yeniAlarmBaslik" :disabled="islemvar" type="text" class="form-control " width="height: 10px" placeholder="Başlık" />
              </div>
              <span class="d-flex align-items-center alert alert-primary p-0 h-100 mb-2">
                <span class="px-2"><i class="bi bi-clock h5"></i></span>
                <select ref="yeniAlarmSaat" :disabled="islemvar" class="form-control" style="width: 50px">
                  <option v-for="i in 24" :key="i" :value="(i-1)">{{ String(i-1).padStart(2, '0') }}</option>
                </select>
                <span class="px-1"> : </span>
                <select ref="yeniAlarmDakika" :disabled="islemvar" class="form-control" style="width: 50px">
                  <option v-for="i in 12" :key="i" :value="(i-1) * 5">{{ String((i-1) * 5).padStart(2, '0') }}</option>
                </select>
              </span>
            </div>
            <div class="d-flex flex-column gap-2 w-100 ">
              <textarea ref="yeniAlarmMesaj" :disabled="islemvar"  class="form-control" style="resize: none; height: 90px" placeholder="Mesaj" />
              <button :disabled="islemvar" class="btn btn-primary "  @click="alarmEkle">Kaydet</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!yeniPlan" class="col-12 h-100">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between">
            Planlar
            <button class="btn btn-sm btn-success float-end" @click="yeniPlan=true">Yeni Plan</button>
          </div>
          <div class="card-body">
            <yukleniyor v-if="!yuklendi.plan" v-bind:durum="yuklendi.plan"></yukleniyor>
            <div v-else-if="!planlar.length" class="d-flex flex-column align-items-center justify-content-center w-100 h-100">
              Bu tarih için hiç plan eklenmedi.
            </div>
            <ul v-else class="list-group">
              <li class="list-group-item p-1" v-for="plan in siraliPlanlar" :key="plan.id">
                <div class=" d-flex align-items-center">
                  <tik :tikli="plan.yapildi" @guncelle="(durum)=>{plan.yapildi = durum; planYapildi(plan.id,durum)}" class="me-2"></tik>
                  <div class="m-0 alert w-100 p-0 px-1 me-2" :class="'alert-'+plan.tip">
                    <span :class="plan.yapildi?'text-decoration-line-through':''">
                      {{ plan.mesaj }}
                    </span>
                  </div>
                  <button class="btn btn-sm btn-danger float-end" @click="planSil(plan.id)">Sil</button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div v-else class="col-12">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between">
            Planlar
            <button class="btn btn-sm btn-danger float-end" @click="yeniPlan=false">Vazgeç</button>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-8">
                <input ref="yeniPlanMesaj" :disabled="islemvar" type="text" class="form-control" placeholder="Plan notu" />
              </div>
              <div class="col-2">
                <div class="dropdown" data-bind="0">
                  <button type="button" class="btn w-100" :class="'btn-'+yeniPlanTip">
                    {{tipKarsiliklari[yeniPlanTip]}}
                  </button>
                  <div class="dropdown-menu show">
                    <div class="px-2 py-1"><button data-kapat="1" class="btn btn-danger w-100" @click="yeniPlanTip = 'danger'">Kritik</button></div>
                    <div class="px-2 py-1"><button data-kapat="1" class="btn btn-warning w-100" @click="yeniPlanTip = 'warning'">Dikkat</button></div>
                    <div class="px-2 py-1"><button data-kapat="1" class="btn btn-success w-100" @click="yeniPlanTip = 'success'">Önemli</button></div>
                    <div class="px-2 py-1"><button data-kapat="1" class="btn btn-info w-100" @click="yeniPlanTip = 'info'">Önemsiz</button></div>
                  </div>
                </div>
              </div>
              <div class="col-2">
                <button :disabled="islemvar" class="btn btn-primary w-100" @click="planEkle">Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
